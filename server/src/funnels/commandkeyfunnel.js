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


class CommandKeyFunnel extends ContainerKeyFunnel {
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

	doArrowUp() {
		manipulator.selectPreviousSibling()
			||  manipulator.insertBeforeSelectedAndSelect(new InsertionPoint());
	}

	doArrowDown() {
		manipulator.selectNextSibling()
			||  manipulator.insertAfterSelectedAndSelect(new InsertionPoint());
	}
	doArrowLeft() {
		manipulator.selectPreviousSibling()
			||  manipulator.insertBeforeSelectedAndSelect(new InsertionPoint());
	}
	doArrowRight() {
		manipulator.selectNextSibling()
			||  manipulator.insertAfterSelectedAndSelect(new InsertionPoint());
	}	




	appendSeparator(letter, escaped) {
		if (escaped) {
			manipulator.appendAndSelect(new Separator(letter));
		} else {
			if (this.isAllowedSymbol(letter)) {
				this.s.appendCommandText(letter);
			} else {
				manipulator.insertAfterSelectedAndSelect(new Separator(letter))
			}
		}
	}

	insertNewCodeObject(obj) {
		manipulator.insertAfterSelectedAndSelect(obj);
	}

	doEnter() {
		manipulator.selectParent() && 
			manipulator.insertAfterSelectedAndSelect(new Line());		
	}


	doTilde() {
		manipulator.insertAfterSelectedAndSelect(new Command());
	}

	doSpace() {
		manipulator.insertAfterSelectedAndSelect(new Separator(' '));
	}

	doShiftSpace() {
		this.s.toggleDir();
	}

	doTab() {
		if (!manipulator.selectFirstChild()) {
			manipulator.appendAndSelect(new InsertionPoint());
		}
	}

	insertNewListType(lst) {
		if (this.tabEscaped) {
			manipulator.appendAndSelect(lst);
		} else {
			manipulator.insertAfterSelectedAndSelect(lst);
		}
	}

	doShiftBackspace() {
		manipulator.removeSelectedAndSelectPreviousSibling();		
	}

	doBackspace() {
		if (this.s.getCommandText().length > 0) {
			this.s.deleteLastCommandLetter();
		} else {
			this.doShiftBackspace();
		}
	}

}