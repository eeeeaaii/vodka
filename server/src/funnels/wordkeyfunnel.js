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



class WordKeyFunnel extends ContainerKeyFunnel {
	constructor(sel) {
		super(sel)
	}

	doArrowRight() {
		var old = this.s;
		while(manipulator.selectNextSibling()) {
			if (isWord(selectedNex)) {
				return;
			}
		}
		old.setSelected();
	}

	doArrowLeft() {
		var old = this.s;
		while(manipulator.selectPreviousSibling()) {
			if (isWord(selectedNex)) {
				return;
			}
		}
		old.setSelected();
	}

	doArrowUp() {
		manipulator.selectCorrespondingWordInPreviousLine();
	}

	doTab() {
		if (!manipulator.selectFirstChild()) {
			manipulator.appendAndSelect(new InsertionPoint());
		}
	}

	doArrowDown() {
		manipulator.selectCorrespondingWordInNextLine();
	}

	appendText(letter) {
		if (manipulator.selectLastChild()) {
			manipulator.insertAfterSelectedAndSelect(new Letter(letter));
		} else {
			manipulator.appendAndSelect(new Letter(letter))
		}
	};

	appendSeparator(letter) {
		manipulator.insertAfterSelectedAndSelect(new Separator(letter));
	}

	insertNewCodeObject(obj) {
		manipulator.insertAfterSelectedAndSelect(obj);
	}

	insertNewListType(lst) {
		manipulator.insertAfterSelectedAndSelect(lst);
	}

	doShiftBackspace() {
		manipulator.removeSelectedAndSelectPreviousLeaf();		
	}

	doEnter() {
		var newline = new Newline();
		manipulator.insertAfterSelected(newline)
			&& manipulator.putAllNextSiblingsInNewLine()
			&& newline.setSelected();
	}
}