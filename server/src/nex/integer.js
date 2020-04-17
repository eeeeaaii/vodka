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
		super(val, '#', 'integer');
		if (!this._isValid(this.value)) {
			this.value = '0';
		}
	}

	getTypeName() {
		return '-integer-';
	}

	makeCopy() {
		let r = new Integer(this.value);
		this.copyFieldsTo(r);
		return r;
	}

	_isValid(value) {
		let v = Number(value);
		return !isNaN(v);
	}

	evaluate() {
		return this;
	}

	renderValue() {
		return '' + this.value;
	}

	getTypedValue() {
		return Number(this.value);
	}

	appendWithChecks(txt) {
		if (txt == '-') {
			// negate it, unless it's zero
			if (this.value == '0') return;
			if (this.value.charAt(0) == '-') {
				this.value = this.value.substring(1);
			} else {
				this.value = '-' + this.value;
			}
		} else if (/[0-9]/.test(txt)) {
			if (this.value == '0') {
				this.value = txt;
			} else {
				this.value = this.value + txt;
			}
		};
	}

	deleteLastLetter() {
		let v = this.value;
		if (v == '0') return;
		if (v.length == 1) {
			this.value = '0';
			return;
		}
		this.value = v.substr(0, v.length - 1);
	}

	backspaceHack(sourceNode) {
		if (this.value == '0') {
			KeyResponseFunctions['remove-selected-and-select-previous-leaf'](sourceNode);
			return;
		}
		this.deleteLastLetter();
	}

	defaultHandle(txt, context, sourcenode) {
		if (txt == 'Backspace') {
			this.backspaceHack(sourcenode);
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
