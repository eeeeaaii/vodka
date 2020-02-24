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



class Bool extends ValueNex {
	constructor(val) {
		if (val === 'true') {
			val = 'yes';
		} else if (val === 'false') {
			val = 'no';
		} else if (val === 'yes' || val === 'no') {
			// do nothing
		} else {
			val = !!val ? 'yes' : 'no';
		}
		super(val, '!', 'boolean')
	}

	getTypeName() {
		return '-bool-';
	}

	makeCopy() {
		let r = new Bool(this.getTypedValue());
		this.copyFieldsTo(r);
		return r;
	}

	toString() {
		return '!' + this.renderValue();
	}

	getTypedValue() {
		return this.value === 'yes';
	}

	isEmpty() {
		return true;
	}

	getKeyFunnel() {
		return new BoolKeyFunnel(this);
	}

	renderValue() {
		return this.value;
	}

	toggleValue(v) {
		this.setValue(this.value === 'yes' ? 'no' : 'yes');
		this.render();
	}

	defaultHandle(txt) {
		// TODO: old behavior is that you can't put a boolean inside a word,
		// so it automatically makes a new word -- except you can, with things
		// like cut and paste, and it should be possible anyway.
		if (isNormallyHandled(txt)) {
			return false;
		}
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);

		if (isSeparator) {
			manipulator.insertAfterSelectedAndSelect(new Separator(txt));
		} else if (txt == 'y' || txt == 'Y') {
			this.setValue('yes');
		} else if (txt == 'n' || txt == 'N') {
			this.setValue('no');
		} else {
			let letter = new Letter(txt);
			manipulator.insertAfterSelectedAndSelect(new Word())
				&& manipulator.appendAndSelect(letter);

		}
		return true;
	}

	getEventTable(context) {
		return {
			// these 2 are questionable but make tests pass?
			'ShiftBackspace': 'remove-selected-and-select-previous-leaf',
			'Backspace': 'remove-selected-and-select-previous-leaf',
			'Enter': 'do-line-break-always',
		}
	}
}
