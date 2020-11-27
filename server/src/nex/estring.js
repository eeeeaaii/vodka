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
		return '$' + this.toStringV2TagList() + this.toStringV2PrivateDataSection();
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

	unScrewUp() {
		this.setFullValue(this.getFullTypedValue().replace(new RegExp(QUOTE_ESCAPE, "g"), '"'));
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
		this.cachedRenderNodeHack = renderNode;
		this.drawTextField(renderNode);
		this.drawButton(renderNode);
		this.inputfield.focus();
	}

	drawTextField(renderNode) {
		let domNode = renderNode.getDomNode();
		this.inputfield = document.createElement("textarea");	
		this.inputfield.classList.add('stringta');	
		if (this.fullValue) {
			this.inputfield.value = this.fullValue;
		}
		domNode.appendChild(this.inputfield);
		this.inputfield.classList.add('stringinput');
	}

	drawButton(renderNode) {
		let domNode = renderNode.getDomNode();
		this.submitbutton = document.createElement("button");
		this.submitbutton.textContent = 'done'
		this.submitbutton.classList.add('stringinputsubmit');			
		let t = this;
		this.submitbutton.onclick = function() {
			if (experiments.BETTER_KEYBINDINGS) {
				renderNode.forceCloseEditor();

			} else {
				t.finishInput(renderNode);
			}
		}
		domNode.appendChild(this.submitbutton);
	}

	startModalEditing() {
		this.mode = MODE_EXPANDED;
		systemState.setKeyFunnelActive(false);
	}

	finishInput(renderNode) {
		if (!renderNode && this.cachedRenderNodeHack) {
			renderNode = this.cachedRenderNodeHack;
		}
		let val = this.inputfield.value;
		systemState.setKeyFunnelActive(true);
		this.mode = MODE_NORMAL;
		this.setFullValue(val);
		eventQueueDispatcher.enqueueRenderNodeRender(
				renderNode,
				systemState.getGlobalCurrentDefaultRenderFlags()
					| RENDER_FLAG_RERENDER
					| RENDER_FLAG_SHALLOW);
	}

	getDefaultHandler() {
		return 'insertAfterEString';
	}

	getEventTable(context) {
		if (experiments.BETTER_KEYBINDINGS) {
			return {
				'Backspace': 'start-main-editor',
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

