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



class LetterKeyFunnel extends KeyFunnel {
	constructor(sel) {
		super(sel)
	}

	doArrowLeft() {
		manipulator.selectPreviousLeaf()
			||  manipulator.insertBeforeSelectedAndSelect(new InsertionPoint())
			;
	}

	doArrowRight() {
		manipulator.selectNextLeaf()
			|| manipulator.insertAfterSelectedAndSelect(new InsertionPoint())
			;
	}

	doArrowUp() {
		manipulator.selectCorrespondingLetterInPreviousLine()
			|| manipulator.selectPreviousLeaf()
			||  manipulator.insertBeforeSelectedAndSelect(new InsertionPoint())
			;
	}

	doArrowDown() {
		manipulator.selectCorrespondingLetterInNextLine()
			|| manipulator.selectNextLeaf()
			|| manipulator.insertAfterSelectedAndSelect(new InsertionPoint())
			;
	}

	appendText(letter) {
		manipulator.insertAfterSelectedAndSelect(new Letter(letter));
	}

	appendSeparator(letter) {
		if (isInDocContext(this.s)) {
			manipulator.splitCurrentWordIntoTwo()
				&& manipulator.selectParent()
				&& manipulator.insertAfterSelectedAndSelect(new Separator(letter));
		} else {
			manipulator.insertAfterSelectedAndSelect(new Separator(letter));			
		}
	}

	doShiftBackspace() {
		let parent = this.s.getParent();
		manipulator.removeSelectedAndSelectPreviousLeaf();
		if (isDocElement(parent) && !parent.hasChildren()) {
			manipulator.removeNex(parent);
		}		
	}

	insertNewCodeObject(obj) {
		manipulator.selectParent() && manipulator.insertAfterSelectedAndSelect(obj);			
	}

	insertNewListType(lst) {
		manipulator.insertAfterSelectedAndSelect(lst);
	}

	doEnter() {
		let newline = new Newline();
		if (isWord(this.s.getParent())) {
			manipulator.splitCurrentWordIntoTwo()
				&& manipulator.selectParent()
				&& manipulator.insertAfterSelected(newline)
				&& manipulator.putAllNextSiblingsInNewLine()
				&& newline.setSelected();			
		} else {
			// treat as separator.
			let newline = new Newline();
			manipulator.insertAfterSelected(newline)
				&& manipulator.putAllNextSiblingsInNewLine()
				&& newline.setSelected();

		}
	}
}