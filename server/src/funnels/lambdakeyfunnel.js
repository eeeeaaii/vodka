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

class LambdaKeyFunnel extends ContainerKeyFunnel {
	constructor(sel) {
		super(sel)
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


	appendText(txt) {
		var okChar = /^[a-zA-Z0-9]$/
		if (okChar.test(txt)) {
			this.s.appendAmpText(txt);
		} else {
			manipulator.insertAfterSelectedAndSelect(new Word())
				&& selectedNex.getKeyFunnel().appendText(txt);			
		}
	};

	appendSeparator(txt) {
		var okChar = /^[ _-]$/
		if (okChar.test(txt)) {
			this.s.appendAmpText(txt);
		} else {
			manipulator.insertAfterSelectedAndSelect(new Separator(txt));
		}
	}

	insertNewCodeObject(obj) {
		manipulator.insertAfterSelectedAndSelect(obj);
	}

	doEnter() {
		manipulator.selectParent() && 
			manipulator.insertAfterSelectedAndSelect(new Line());		
	}

	doShiftSpace() {
		this.s.toggleDir();
	}

	
	doTab() {
		if (!manipulator.selectFirstChild()) {
			manipulator.appendAndSelect(new InsertionPoint());
		}
	}

	doShiftBackspace() {
		manipulator.removeSelectedAndSelectPreviousSibling();
	}

	doBackspace() {
		if (this.s.getAmpText().length > 0) {
			this.s.deleteLastAmpLetter();
		} else {
			this.doShiftBackspace();
		}
	}
}