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



class Integer extends ValueNex {
	constructor(val) {
		if (!val) {
			val = '0';
		}
		super(val, '#', 'integer')
	}

	getTypeName() {
		return '-integer-';
	}

	makeCopy() {
		let r = new Integer(this.value);
		this.copyFieldsTo(r);
		return r;
	}

	isValid() {
		let v = Number(this.value);
		return !isNaN(v);
	}

	evaluate() {
		if (!this.isValid()) {
			throw new EError(`Integer format invalid: ${this.value}`);
		}
		let n = Number(this.value);
		this.value = '' + n;
		return this;
	}

	renderValue() {
		return '' + this.value;
	}

	getKeyFunnel() {
		return new IntegerKeyFunnel(this);
	}

	getTypedValue() {
		let v = this.value;
		if (v == "") {
			v = "0";
		}
		if (isNaN(v)) {
			throw new Error(`Integer literal incomplete (is "${v}")`);
		}
		return Number(v);
	}

	getRawValue() {
		return this.value;
	}

	appendWithChecks(txt) {
		let t = this.getRawValue();
		if (t == '0') {
			if (txt == '0') {
				return;
			} else {
				this.setValue(txt);
			}
		} else if (t == '-') {
			if (txt == '0') {
				return;
			} else {
				this.appendText(txt);
			}
		} else {
			if (txt == '-') {
				return;
			} else {
				this.appendText(txt);
			}
		}
	}

	backspaceHack() {
		let t = this.getRawValue();
		if (t == '0') {
			KeyResponseFunctions['remove-selected-and-select-previous-leaf'](this);
			return;
		}
		this.deleteLastLetter();
		t = this.getRawValue();
		if (t == '') {
			this.setValue('0');
		}
	}

	defaultHandle(txt) {
		if (txt == 'Backspace') {
			this.backspaceHack();
			return true;
		}
		if (isNormallyHandled(txt)) {
			return false;
		}
		let okRegex = /^[0-9-]$/;
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);
		if (okRegex.test(txt)) {
			this.appendWithChecks(txt);
		} else if (isSeparator) {
			manipulator.insertAfterSelectedAndSelect(new Separator(txt));
		} else {
			manipulator.insertAfterSelectedAndSelect(new Word())
				&& manipulator.appendAndSelect(new Letter(txt));
		}
		return true;
	}

	getEventTable(context) {
		return {
			'Enter': 'do-line-break-always',
		}
	}
}
