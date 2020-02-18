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

	getKeyFunnel() {
		return new EStringKeyFunnel(this);
	}

	// RENDERFLAGS // change to renderFlags
	renderInto(domNode, shallow) {
		super.renderInto(domNode, shallow);
		// this one always can rerender because it's not a container
		// we only need to care about rerenders when it's a container type
		domNode.innerHTML = this.prefix;
		domNode.classList.add(this.className);
		domNode.classList.add('valuenex');
		if (this.mode == MODE_NORMAL) {
			this.drawNormal(domNode);
		} else {
			this.drawExpanded(domNode);
		}
		this.renderTags(domNode, shallow);
	}

	drawNormal(domNode) {
		// shim
		if (!domNode) {
			domNode = this.domNode;
		}
		if (this.displayValue !== '') {
			this.innerspan = document.createElement("div");
			this.innerspan.classList.add('innerspan');
			this.innerspan.innerHTML = this.displayValue;
			domNode.appendChild(this.innerspan);
		}
	}

	drawExpanded(domNode) {
		// shim
		if (!domNode) {
			domNode = this.domNode;
		}
		this.drawTextField(domNode);
		this.drawButton(domNode);
		this.inputfield.focus();
	}

	drawTextField(domNode) {
		// shim
		if (!domNode) {
			domNode = this.domNode;
		}
		this.inputfield = document.createElement("textarea");	
		this.inputfield.classList.add('stringta');	
		if (this.fullValue) {
			this.inputfield.value = this.fullValue;
		}
		domNode.appendChild(this.inputfield);
		this.inputfield.classList.add('stringinput');
	}

	drawButton(domNode) {
		// shim
		if (!domNode) {
			domNode = this.domNode;
		}
		this.submitbutton = document.createElement("button")
		this.submitbutton.classList.add('stringinputsubmit');			
		let t = this;
		this.submitbutton.onclick = function() {
			t.finishInput();
		}
		domNode.appendChild(this.submitbutton);
	}

	startModalEditing() {
		this.mode = MODE_EXPANDED;
		deactivateKeyFunnel();
	}

	finishInput() {
		let val = this.inputfield.value;
		activateKeyFunnel();
		this.mode = MODE_NORMAL;
		this.setFullValue(val); // calls render
		if (RENDERFLAGS) {
			this.rerender(current_default_render_flags | RENDER_FLAG_SHALLOW)
		} else {
			this.rerender(true);
		}
	}
	getEventTable(context) {
		return null;
	}
	// TODO: move tables from these unused functions into getEventTable
	getKeyFunnelVector(context) {
		return {
			'ShiftEnter': 'start-modal-editing',
			'ShiftTab': 'select-parent',
			'Tab': 'select-next-sibling',
			'ArrowUp': 'move-left-up',
			'ArrowDown': 'move-right-down',
			'ArrowLeft': 'move-left-up',
			'ArrowRight': 'move-right-down',
			'ShiftBackspace': 'remove-selected-and-select-previous-sibling',
			'Backspace': 'remove-selected-and-select-previous-sibling',
			'~': 'insert-command-as-next-sibling',
			'!': 'insert-bool-as-next-sibling',
			'@': 'insert-symbol-as-next-sibling',
			'#': 'insert-integer-as-next-sibling',
			'$': 'insert-string-as-next-sibling',
			'%': 'insert-float-as-next-sibling',
			'^': 'insert-nil-as-next-sibling',
			'(': 'insert-word-as-next-sibling',
			'[': 'insert-line-as-next-sibling',
			'{': 'insert-doc-as-next-sibling',
			'defaultHandle': null
		};
	}	
}