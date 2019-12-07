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



class ValueKeyFunnel extends KeyFunnel {
	constructor(sel) {
		super(sel)
	}

	doArrowUp() {
		manipulator.selectCorrespondingLetterInPreviousLine()
			||  manipulator.selectPreviousSibling()
			||  manipulator.insertBeforeSelectedAndSelect(new InsertionPoint());
	}

	doArrowDown() {
		manipulator.selectCorrespondingLetterInNextLine()
			|| manipulator.selectNextSibling()
			|| manipulator.insertAfterSelectedAndSelect(new InsertionPoint());
	}

	doArrowLeft() {
		manipulator.selectPreviousLeaf()
			||  manipulator.insertBeforeSelectedAndSelect(new InsertionPoint());
	}

	doArrowRight() {
		manipulator.selectNextLeaf()
			|| manipulator.insertAfterSelectedAndSelect(new InsertionPoint());
	}

	doShiftTab() {
		manipulator.selectParent();
	}

	doTab() {
		manipulator.selectNextSibling();
	}

	appendText(letter) {
		this.s.appendText(letter);
	}
	
	appendSeparator(letter) {
		this.s.appendText(letter);
	};

	doShiftBackspace() {
		manipulator.removeSelectedAndSelectPreviousLeaf();
	}

	doBackspace() {
		if (!this.s.isEmpty()) {
			this.s.deleteLastLetter();
		} else {
			this.doShiftBackspace();
		}
	}

	insertNewCodeObject(obj) {
		manipulator.insertAfterSelectedAndSelect(obj);
	}

	doEnter() {
		var newline = new Newline();
		manipulator.insertAfterSelected(newline)
			&& manipulator.putAllNextSiblingsInNewLine()
			&& newline.setSelected();
	}
}