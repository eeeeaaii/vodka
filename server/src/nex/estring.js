/*
This file is part of Vodka.

Vodka is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Vodka is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Vodka.  If not, see <https://www.gnu.org/licenses/>.
*/


const ESTRING_LIMIT = Infinity;
const MODE_NORMAL = 1;
const MODE_EXPANDED = 2;
const QUOTE_ESCAPE = 'QQQQ'

import { eventQueueDispatcher } from '../eventqueuedispatcher.js'
import { ValueNex } from './valuenex.js'
import { systemState } from '../systemstate.js'
import { RENDER_FLAG_RERENDER, RENDER_FLAG_SHALLOW } from '../globalconstants.js'
import { Editor } from '../editors.js'
import { experiments } from '../globalappflags.js'

/**
 * Represents a string.
 */
class EString extends ValueNex {
	constructor(val, ch, t) {
		if (typeof val === 'undefined') {
			val = '';
		}
		if (ch) {
			super(val, ch, t)
		} else {
			super(val, '$', 'string');
		}
		this.mode = MODE_NORMAL;
		this.setFullValue(val);// will call render
		this.attachedJS = null;
		this.submitbuttonisfocussed = false;
		this.submitbutton = null;
		this.inputfield = null;

	}

	/**
	 * This method is used internally as a "back door" for plumbing JS functions through
	 * the vodka parameter parsing pipeline. There is a "run-js" builtin which can be used
	 * to execute arbitrary javascript code. Vodka also has a notion of "native orgs" which
	 * are orgs with member methods that run native code. This is the mechanism by which
	 * we pass the native code into the run-js builtin.
	 */
	setAttachedJS(js) {
		this.attachedJS = js;
	}

	rootLevelPostEvaluationStep() {
		this.setMutable(false);
	}


	/**
	 * Retrieves the attached js for this estring
	 * @see {@link setAttachedJS}
	 */
	getAttachedJS() {
		return this.attachedJS;
	}

	hasAttachedJS() {
		return !!this.attachedJS;
	}

	getTypeName() {
		return '-string-';
	}

	makeCopy() {
		let r = new EString(this.getFullTypedValue(), '$', 'string');
		this.copyFieldsTo(r);
		return r;
	}

	copyFieldsTo(r) {
		super.copyFieldsTo(r);
		r.attachedJS = this.attachedJS;
	}

	toString(version) {
		if (version == 'v2') {
			return this.toStringV2();
		}
		return '$"' + this.escapeContents() + '"';
	}

	toStringV2() {
		
		return `$${this.toStringV2Literal()}${this.toStringV2TagList()}${this.toStringV2PrivateDataSection()}`;
	}

	deserializePrivateData(data) {
		this.setFullValue(data);
	}

	serializePrivateData() {
		return this.getFullTypedValue();
	}

	debugString() {
		return '$"' + this.getFullTypedValue() + '"';
	}

	escapeContents() {
		let fv = this.getFullTypedValue();
		fv = fv.replace(new RegExp('"', 'g'), QUOTE_ESCAPE);
		return fv;
	}

	debugString() {
		return '$"' + this.getFullTypedValue() + '"';
	}

	setMode(m) {
		this.mode = m;
	}

	getMode() {
		return this.mode;
	}

	toggleRendering() {
		this.mode = (this.mode == MODE_NORMAL) ? MODE_EXPANDED : MODE_NORMAL;
	}

	getTypedValue() {
		throw new Error("do not use this method, only use getFullTypedValue or getDisplayValue");
	}

	getFullTypedValue() {
		return this.fullValue;
	}

	getDisplayValue() {
		return this.displayValue;
	}

	setFullValue(fullval) {
		this.fullValue = fullval;
		// well I guess they're the same now? except for the
		// truncation but I'm getting rid of that too
		this.displayValue = this.fullValue;
		if (this.displayValue.length > ESTRING_LIMIT) {
			this.displayValue = this.displayValue.substr(0, (ESTRING_LIMIT - 3)) + '...';
		}
		this.setDirtyForRendering(true);
	}

	renderInto(renderNode, renderFlags, withEditor) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags, withEditor);
		// this one always can rerender because it's not a container
		// we only need to care about rerenders when it's a container type
		domNode.innerHTML = this.prefix;
		domNode.classList.add(this.className);
		domNode.classList.add('valuenex');
		if (this.mode == MODE_NORMAL) {
			this.drawNormal(renderNode);
		} else {
			this.drawExpanded(renderNode);
		}
	}

	drawNormal(renderNode) {
		let domNode = renderNode.getDomNode();
		if (this.displayValue !== '') {
			this.innerspan = document.createElement("div");
			this.innerspan.classList.add('innerspan');
			this.innerspan.innerHTML = this.escape(this.displayValue);
			domNode.appendChild(this.innerspan);
		}
	}

	drawExpanded(renderNode) {
		this.drawTextField(renderNode);
		this.drawButton(renderNode);
		this.inputfield.focus();
	}

	drawTextField(renderNode) {
		let domNode = renderNode.getDomNode();
		if (this.inputfield) {
			domNode.appendChild(this.inputfield);
			return;
		}
		this.inputfield = document.createElement("textarea");
		if (this.fullValue) {
			this.inputfield.value = this.fullValue;
		}
		this.inputfield.classList.add('stringta');
		this.inputfield.classList.add('stringinput');
		domNode.appendChild(this.inputfield);
	}

	drawButton(renderNode) {
		let domNode = renderNode.getDomNode();
		let t = this;
		if (this.submitbutton) {
			domNode.appendChild(this.submitbutton);
			if (t.submitbuttonisfocussed) {
				this.submitbutton.focus();
			} else {
				this.submitbutton.blur();
			}
			return;
		}
		this.submitbutton = document.createElement("button");
		this.submitbutton.textContent = 'done'
		this.submitbutton.classList.add('stringinputsubmit');			
		this.submitbutton.onmousedown = function() {
			t.doUserCloseAction(renderNode);
		}.bind(this)
		this.submitbutton.onclick = function() {
			this.doUserCloseAction(renderNode);
		}.bind(this)
		// removing these html elements from the dom and then
		// re-adding them seems to keep the selection state of
		// the text area and its content but the focus state of
		// the button is not restored
		this.submitbutton.onfocus = function() {
			this.submitbuttonisfocussed = true;
		}.bind(this)
		this.submitbutton.onblur = function() {
//			this.submitbuttonisfocussed = false;
		}.bind(this)
		domNode.appendChild(this.submitbutton);
	}

	startModalEditing() {
		this.mode = MODE_EXPANDED;
		systemState.setKeyFunnelActive(false);
		this.setDirtyForRendering(true);
	}

	doUserCloseAction(renderNode) {
		if (this.mode == MODE_NORMAL) {
			// already closed
			return;
		}
		if (experiments.BETTER_KEYBINDINGS) {
			renderNode.forceCloseEditor();

		} else {
			this.finishInput(renderNode);
		}
	}

	finishInput(renderNode) {
		let val = this.inputfield.value;
		this.inputfield = null;
		this.submitbutton = null;
		this.submitbuttonisfocussed = false;
		systemState.setKeyFunnelActive(true);
		this.mode = MODE_NORMAL;
		this.setFullValue(val);
		this.renderOnlyThisNex();
	}

	getDefaultHandler() {
		return 'estringDefault';
	}

	getEventTable(context) {
		if (experiments.BETTER_KEYBINDINGS) {
			return {
			};
		} else {
			return {
				'ShiftEnter': 'start-modal-editing',
				'Enter': 'do-line-break-always',
			};
		}
	}
}

class EStringEditor extends Editor {
	constructor(nex) {
		super(nex, 'EStringEditor');
	}

	hasContent() {
		return this.nex.getFullTypedValue() != '';
	}

	startEditing() {
		super.startEditing();
		this.nex.startModalEditing();
	}

	finish() {
		super.finish();
		this.nex.finishInput();
	}

	routeKey() {
		console.log('route key should not be called for string editor');
	}
}


export { EString, EStringEditor }

