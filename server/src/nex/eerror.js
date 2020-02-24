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

	getTypeName() {
		return '-error-';
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

	defaultHandle(txt) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);

		if (isSeparator) {
			manipulator.insertAfterSelectedAndSelect(new Separator(txt))
		} else {
			manipulator.insertAfterSelectedAndSelect(new Word())
				&& selectedNex.getKeyFunnel().appendText(txt);
		}
		return true;
	}

	getEventTable(context) {
		return {
			'ShiftEnter': 'start-modal-editing',
			'Enter': 'do-line-break-always',
		};
	}
}
