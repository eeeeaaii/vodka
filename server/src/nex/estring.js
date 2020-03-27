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


const ESTRING_LIMIT = 20;
const MODE_NORMAL = 1;
const MODE_EXPANDED = 2;
const QUOTE_ESCAPE = 'QQQQ'

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
	}

	getTypeName() {
		return '-string-';
	}

	makeCopy() {
		let r = new EString(this.getFullTypedValue(), '$', 'string');
		this.copyFieldsTo(r);
		return r;
	}

	toString() {
		return '$"' + this.escapeContents() + '"';
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
		this.displayValue = this.fullValue === ' ' ? '&nbsp;' : this.fullValue.trim();
		if (this.displayValue.length > ESTRING_LIMIT) {
			this.displayValue = this.displayValue.substr(0, (ESTRING_LIMIT - 3)) + '...';
		}
	}

	renderInto(renderNode, renderFlags) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags);
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
			this.innerspan.innerHTML = this.displayValue;
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
		this.submitbutton = document.createElement("button")
		this.submitbutton.classList.add('stringinputsubmit');			
		let t = this;
		this.submitbutton.onclick = function() {
			t.finishInput(renderNode);
		}
		domNode.appendChild(this.submitbutton);
	}

	startModalEditing() {
		this.mode = MODE_EXPANDED;
		deactivateKeyFunnel();
	}

	finishInput(renderNode) {
		if (!renderNode && this.cachedRenderNodeHack) {
			renderNode = this.cachedRenderNodeHack;
		}
		let val = this.inputfield.value;
		activateKeyFunnel();
		this.mode = MODE_NORMAL;
		this.setFullValue(val);
		eventQueue.enqueueRenderNodeRender(
				renderNode,
				current_default_render_flags
					| RENDER_FLAG_RERENDER
					| RENDER_FLAG_SHALLOW);
	}

	defaultHandle(txt) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);

		if (isSeparator) {
			manipulator.insertAfterSelectedAndSelect(new Separator(txt))
		} else {
			let l = new RenderNode(new Letter(txt));
			let w = new RenderNode(new Word());
			w.appendChild(l);
			manipulator.insertAfterSelectedAndSelect(w);
			l.setSelected();
		}
	}

	getEventTable(context) {
		return {
			'ShiftEnter': 'start-modal-editing',
			'Enter': 'do-line-break-always',
		};
	}
}