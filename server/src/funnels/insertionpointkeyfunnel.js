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



class InsertionPointKeyFunnel extends ValueKeyFunnel {
	constructor(sel) {
		super(sel)
	}

	doArrowUp() {
		(manipulator.selectPreviousLeaf() ||
			manipulator.selectParent()) && manipulator.removeNex(this.s);
	}

	doArrowDown() {
		(manipulator.selectNextLeaf() ||
			manipulator.selectParent()) && manipulator.removeNex(this.s);
	}

	doArrowLeft() {
		(manipulator.selectPreviousLeaf() ||
			manipulator.selectParent()) && manipulator.removeNex(this.s);
	}

	doArrowRight() {
		(manipulator.selectNextLeaf() ||
			manipulator.selectParent()) && manipulator.removeNex(this.s);
	}

	doTab() {

	}

	doShiftTab() {
		super.doShiftTab();
		if (!this.s.isSelected()) {
			manipulator.removeNex(this.s);
		}
	}

	appendText(letter) {
		if (isDoc(this.s.getParent())) {
			var ln = new Line();
			var w = new Word();
			var lt = new Letter(letter);
			ln.appendChild(w);
			w.appendChild(lt);
			manipulator.replaceSelectedWith(ln);
			lt.setSelected();
		} else if (isLine(this.s.getParent())) {
			var w = new Word();
			var lt = new Letter(letter);
			w.appendChild(lt);
			manipulator.replaceSelectedWith(w);
			lt.setSelected();

		} else {			
			manipulator.replaceSelectedWith(new Letter(letter));
		}
	}

	insertNewListType(obj) {
		if (isWord(obj) && isDoc(this.s.getParent())) {
			var ln = new Line();
			ln.appendChild(obj);
			super.insertNewListType(ln);
			obj.setSelected();
		} else {
			super.insertNewListType(obj);
		}
	}

	
	appendSeparator(letter) {
		if (isWord(this.s.getParent())) {
			manipulator.selectParent()
				&& manipulator.insertAfterSelectedAndSelect(new Separator(letter))
				&& manipulator.removeNex(this.s);
		} else {
			manipulator.replaceSelectedWith(new Separator(letter));		
		}
	};

	doShiftBackspace() {
		manipulator.selectPreviousLeaf() || manipulator.selectParent();
		manipulator.removeNex(this.s);
	}

	insertNewCodeObject(obj) {
		manipulator.replaceSelectedWith(obj);
	}

}