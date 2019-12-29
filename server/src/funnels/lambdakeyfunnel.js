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

class LambdaKeyFunnel extends CodelistKeyFunnel {
	constructor(sel) {
		super(sel)
	}

	appendText(txt) {
		let okChar = /^[a-zA-Z0-9]$/
		if (okChar.test(txt)) {
			this.s.appendAmpText(txt);
		} else {
			this.handleAppend(new Letter(txt));
		}
	};

	// doSpace intentionally calls appendSeparator

	appendSeparator(txt) {
		let okChar = /^[ _-]$/
		if (okChar.test(txt)) {
			this.s.appendAmpText(txt);
		} else {
			this.handleAppend(new Separator(txt));
		}
	}

	doBackspace() {
		if (this.s.getAmpText().length > 0) {
			this.s.deleteLastAmpLetter();
		} else {
			this.doShiftBackspace();
		}
	}
}