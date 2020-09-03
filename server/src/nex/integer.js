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

import { ValueNex } from './valuenex.js'

class Integer extends ValueNex {
	constructor(val) {
		if (!val) {
			val = '0';
		}
		super(val, '#', 'integer');
		if (!this._isValid(this.value)) {
			this.value = '0';
		}
		this.minusPressed = false; // TODO: move to editor
	}

	getTypeName() {
		return '-integer-';
	}

	makeCopy() {
		let r = new Integer(this.value);
		this.copyFieldsTo(r);
		return r;
	}

	toString(version) {
		if (version == 'v2') {
			return this.toStringV2();
		}
		return super.toString(version);
	}

	toStringV2() {
		return '#' + this.toStringV2TagList() + this.value;
	}

	_isValid(value) {
		let v = Number(value);
		return !isNaN(v);
	}

	renderValue() {
		return '' + this.value;
	}

	getTypedValue() {
		return Number(this.value);
	}

	appendText(txt) {
		if (txt == '-') {
			// negate it, unless it's zero
			if (this.value == '0') {
				// this hack allows you to type a minus before typing digits
				// if the thing is zero
				this.minusPressed = true;
				return;
			}
			if (this.value.charAt(0) == '-') {
				this.value = this.value.substring(1);
			} else {
				this.value = '-' + this.value;
			}
		} else if (/[0-9]/.test(txt)) {
			if (this.value == '0') {
				if (txt != '0') {
					// just because we pressed minus before doesn't mean that
					// '-004' is a thing
					this.value = (this.minusPressed ? '-' : '') + txt;
				} else {
					this.value = txt;
				}
			} else {
				this.value = this.value + txt;
			}
		};
		this.minusPressed = false;
	}

	deleteLastLetter() {
		let v = this.value;
		if (v == '0') return;
		let isNegative = this.value.charAt(0) == '-';
		let realLength = isNegative ? v.length == 2 : v.length == 1;
		if (realLength == 1) {
			this.value = '0';
			return;
		}
		this.value = v.substr(0, v.length - 1);
	}

	getDefaultHandler() {
		return 'integerDefault';
	}

//	getEventTable(context) {
//		return {
//			'Enter': 'do-line-break-always',
//		}
//	}
}




export { Integer }

