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



class EError extends EString {
	constructor(val) {
		if (!val) val = '';
		super(val, '?', 'eerror')
		this.setFullValue(val); // will call render
	}

	makeCopy() {
		let r = new EError(this.getFullTypedValue());
		this.copyFieldsTo(r);
		return r;
	}

	toString() {
		return '?"' + this.escapeContents() + '"';
	}

	debugString() {
		return '?"' + this.getFullTypedValue() + '"';
	}


	getKeyFunnel() {
		return new EErrorKeyFunnel(this);
	}

	drawButton() {
	}

	// bork, does it bork the test tho?
	drawTextField(domNode) {
		super.drawTextField(domNode);
		this.inputfield.setAttribute("readonly", '');
	}

	getEventTable(context) {
		let defaultHandle = function(txt) {
			if (!(/^.$/.test(txt))) {
				return;
			}
			let letterRegex = /^[a-zA-Z0-9']$/;
			let isSeparator = !letterRegex.test(txt);

			if (isSeparator) {
				manipulator.insertAfterSelectedAndSelect(new Separator(txt))
			} else {
				manipulator.insertAfterSelectedAndSelect(new Word())
					&& selectedNex.getKeyFunnel().appendText(txt);
			}
		}.bind(this);
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
			'&': 'insert-lambda-as-next-sibling',
			'(': 'insert-word-as-next-sibling',
			'[': 'insert-line-as-next-sibling',
			'{': 'insert-doc-as-next-sibling',
			'defaultHandle': defaultHandle
		};
	}
}
