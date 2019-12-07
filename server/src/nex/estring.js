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

var QUOTE_ESCAPE = 'QQQQ'

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

	unScrewUp() {
		this.setFullValue(this.getFullTypedValue().replace(new RegExp(QUOTE_ESCAPE, "g"), '"'));
	}

	escapeContents() {
		var fv = this.getFullTypedValue();
		fv = fv.replace(new RegExp('"', 'g'), QUOTE_ESCAPE);
		return fv;
	}

	toString() {
		return '$"' + this.escapeContents() + '"';
	}

	makeCopy() {
		var r = new EString(this.getFullTypedValue(), '$', 'string');
		return r;
	}

	setMode(m) {
		this.mode = m;
		this.render();
	}

	toggleRendering() {
		this.mode = (this.mode == MODE_NORMAL) ? MODE_EXPANDED : MODE_NORMAL;
		this.render();
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
		this.render();
	}

	getKeyFunnel() {
		return new EStringKeyFunnel(this);
	}

	render(forceEmpty) {
		super.render();
		this.domNode.innerHTML = this.prefix;
		if (this.displayValue || forceEmpty) {
			this.domNode.classList.add(this.className);
			this.domNode.classList.add('valuenex');
			if (this.mode == MODE_NORMAL) {
				this.drawNormal();
			} else {
				this.drawExpanded();
			}
		}
	}

	drawNormal() {
		this.innerspan = document.createElement("div");
		this.innerspan.classList.add('innerspan');
		this.innerspan.innerHTML = (this.displayValue ? this.displayValue : '');
		this.domNode.appendChild(this.innerspan);
	}

	drawExpanded() {
		this.drawTextField();
		this.drawButton();
	}

	drawTextField() {
		this.inputfield = document.createElement("textarea");	
		this.inputfield.classList.add('stringta');	
		if (this.fullValue) {
			this.inputfield.value = this.fullValue;
		}
		this.domNode.appendChild(this.inputfield);
		this.inputfield.classList.add('stringinput');
	}

	drawButton() {
		this.submitbutton = document.createElement("button")
		this.submitbutton.classList.add('stringinputsubmit');			
		var t = this;
		this.submitbutton.onclick = function() {
			t.finishInput();
		}
		this.domNode.appendChild(this.submitbutton);
	}

	startModalEditing() {
		this.mode = MODE_EXPANDED;
		this.render(true);
		this.inputfield.focus();
		deactivateKeyFunnel();
	}

	finishInput() {
		var val = this.inputfield.value;
		activateKeyFunnel();
		this.mode = MODE_NORMAL;
		this.setFullValue(val); // calls render
	}
}