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
		if (!DEFER_DRAW) {
			this.render();
		}
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
		if (!DEFER_DRAW) {
			this.render()
		}
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
	getEventTable(context) {
		return null;
	}
	// TODO: move tables from these unused functions into getEventTable
	getKeyFunnelVector(context) {
		if (context == ContextType.COMMAND) {
			let defaultHandle = function(letter) {
				let okChar = /^[0-9-]$/;
				if (okChar.test(letter)) {
					this.appendText(letter);
				}
			}.bind(this);
			return {
				'ShiftTab': 'select-parent',
				'Tab': 'select-next-sibling',
				'ArrowUp': 'move-left-up',
				'ArrowDown': 'move-right-down',
				'ArrowLeft': 'move-left-up',
				'ArrowRight': 'move-right-down',
				'ShiftBackspace': 'remove-selected-and-select-previous-sibling',
				'Backspace': 'delete-last-letter-or-remove-selected-and-select-previous-sibling',
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
				'defaultHandle': defaultHandle
			};
		} else {
			let docDefaultHandle = function(letter) {
				let okChar = /^[0-9-]$/;
				if (okChar.test(letter)) {
					this.appendText(letter);
				} else {
					manipulator.insertAfterSelectedAndSelect(new Letter(letter));
				}
			}.bind(this);
			return {
				'ShiftTab': 'select-parent',
				'Tab': 'select-next-sibling',
				'ArrowUp': 'move-to-corresponding-letter-in-previous-line',
				'ArrowDown': 'move-to-corresponding-letter-in-next-line',
				'ArrowLeft': 'move-to-previous-leaf',
				'ArrowRight': 'move-to-next-leaf',
				'ShiftBackspace': 'remove-selected-and-select-previous-leaf',
				'Backspace': 'delete-last-letter-or-remove-selected-and-select-previous-leaf',
				'~': 'insert-command-as-next-sibling',
				'defaultHandle': docDefaultHandle
			};
		}
	}
}
