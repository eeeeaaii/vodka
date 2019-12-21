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


class CommandKeyFunnel extends CodelistKeyFunnel {
	constructor(sel) {
		super(sel);
	}

	appendText(letter, escaped) {
		if (escaped) {
			manipulator.appendAndSelect(new Letter(letter));
		} else {
			this.s.appendCommandText(letter);
		}
	};

	isAllowedSymbol(s) {
		return (s == '-'
			 || s == '_'
			 || s == '='
			 || s == '+'
			 || s == '/'
			 || s == '*'
			 || s == '<'
			 || s == '>'
			 || s == ':' // for scoping
			 )
	}

	appendSeparator(letter, escaped) {
		if (escaped) {
			manipulator.appendAndSelect(new Separator(letter));
		} else {
			if (this.isAllowedSymbol(letter)) {
				this.s.appendCommandText(letter);
			} else {
				this.handleAppend(new Separator(letter));
			}
		}
	}

	doSpace() {
		this.handleAppend(new Separator(' '));
	}

	doBackspace() {
		if (this.s.getCommandText().length > 0) {
			this.s.deleteLastCommandLetter();
		} else {
			this.doShiftBackspace();
		}
	}
}