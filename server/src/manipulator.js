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

var CLIPBOARD = null;

class Manipulator {

	doCut() {
		CLIPBOARD = selectedNex.makeCopy();
		var x = selectedNex;
		this.selectPreviousSibling() || this.selectParent();		
		this.removeNex(x);
	}

	doCopy() {
		CLIPBOARD = selectedNex.makeCopy();
	}

	doPaste() {
		if (isInsertionPoint(selectedNex)) {
			this.replaceSelectedWith(CLIPBOARD.makeCopy())
		} else {
			this.insertAfterSelectedAndSelect(CLIPBOARD.makeCopy())
		}
	}

	findNextSiblingThatSatisfies(f) {
		while (this.selectNextSibling()) {
			if (f(selectedNex)) {
				return true;
			}
		}
		return false;
	}

	// used for up and down arrows.

	selectCorrespondingLetterInPreviousLine() {
		// get the current line and the previous line.
		var enclosingLine = this.getEnclosingLine(selectedNex);
		if (!enclosingLine) return false;
		var doc = enclosingLine.getParent();
		if (!doc) return false;
		var previousLine = doc.getChildBefore(enclosingLine);
		if (!previousLine) return false;

		var original = selectedNex;
		var targetX = original.getLeftX();
		var c;

		previousLine.setSelected();
		this.selectFirstLeaf();
		var lastX = selectedNex.getLeftX();
		if (targetX <= lastX) {
			return true;
		}

		do {
			if (this.getEnclosingLine(selectedNex) != previousLine) {
				this.selectPreviousLeaf();
				break;
			}
			var x = selectedNex.getLeftX();
			if (x > targetX) {
				// this is the one
				break;
			}
		} while(this.selectNextLeaf());

		return true;
	}

	selectCorrespondingLetterInNextLine() {
		// get the current line and the previous line.
		var enclosingLine = this.getEnclosingLine(selectedNex);
		if (!enclosingLine) return false;
		var doc = enclosingLine.getParent();
		if (!doc) return false;
		var nextLine = doc.getChildAfter(enclosingLine);
		if (!nextLine) return false;

		var original = selectedNex;
		var targetX = original.getLeftX();
		var c;

		nextLine.setSelected();
		this.selectFirstLeaf();
		var lastX = selectedNex.getLeftX();
		if (targetX <= lastX) {
			return true;
		}

		do {
			if (this.getEnclosingLine(selectedNex) != nextLine) {
				this.selectPreviousLeaf();
				break;
			}
			var x = selectedNex.getLeftX();
			if (x > targetX) {
				// this is the one
				break;
			}
		} while(this.selectNextLeaf());

		return true;
	}

	getEnclosingLine(s) {
		while(s = s.getParent()) {
			if (s instanceof Line) {
				return s;
			}
		}
		return null;
	}

	// traversal

	selectPreviousLeaf() {
		var first = selectedNex;
		while(!this.selectPreviousSibling()) {
			var p = this.selectParent();
			if (!p || isCommand(selectedNex)) {
				first.setSelected();
				return false;
			}
		}
		while(!isCommand(selectedNex) && this.selectLastChild());
		return true;
	}

	selectNextLeaf() {
		var first = selectedNex;
		while(!this.selectNextSibling()) {
			var p = this.selectParent();
			if (!p || isCommand(selectedNex)) {
				first.setSelected();
				return false;
			}
		}
		while(!isCommand(selectedNex) && this.selectFirstChild());
		return true;
	}

	selectFirstLeaf() {
		var c = selectedNex;
		while(c instanceof NexContainer && c.hasChildren()) {
			c = c.getFirstChild();
		}
		c.setSelected();
		return true;
	}

	// generic selection stuff

	selectLastChild() {
		var s = selectedNex;
		if (!(s instanceof NexContainer)) return false;
		var c = s.getLastChild();
		if (c) {
			c.setSelected();
			return true;
		}
		return false;
	}

	selectFirstChild() {
		var s = selectedNex;
		if (!(s instanceof NexContainer)) return false;
		var c = s.getFirstChild();
		if (c) {
			c.setSelected();
			return true;
		}
		return false;
	}

	selectNthChild(n) {
		var s = selectedNex;
		if (n >= s.children.length) return false;
		if (n < 0) return false;
		var c = s.children[n];
		if (!c) return false;
		c.setSelected();
		return true;
	}

	selectNextSibling() {
		var s = selectedNex;
		var p = s.getParent();
		if (!p) return false;
		var nextSib = p.getNextSibling(s);
		if (nextSib) {
			nextSib.setSelected();
			return true;
		}
		return false;
	}

	selectPreviousSibling() {
		var s = selectedNex;
		var p = s.getParent();
		if (!p) return false;
		var sib = p.getPreviousSibling(s);
		if (sib) {
			sib.setSelected();
			return true;
		}
		return false;
	}

	selectParent() {
		var s = selectedNex;
		var p = s.getParent();
		if (!p) return false;
		p.setSelected();
		return true;
	}

	// CRUD operations

	appendNewEString() {
		var s = selectedNex;
		var i = 0;
		for(i = 0;
			s.getChildAt(i) && s.getChildAt(i) instanceof EString;
			i++);
		// i is the insertion point
		var n = new EString();
		s.insertChildAt(n, i);
		n.setSelected();
	}

	appendAndSelect(data) {
		var s = selectedNex;
		var newdata = data;
		s.appendChild(newdata);
		newdata.setSelected();
		return true;		
	}

	insertAfterSelected(data) {
		var s = selectedNex;
		var p = s.getParent();
		if (!p) return false;
		p.insertChildAfter(data, s);
		return true;
	}

	insertAfterSelectedAndSelect(data) {
		return this.insertAfterSelected(data)
			&& this.selectNextSibling();
	}

	insertBeforeSelected(data) {
		var s = selectedNex;
		var p = s.getParent();
		if (!p) return false;
		p.insertChildBefore(data, s);
		return true;
	}

	insertBeforeSelectedAndSelect(data) {
		return this.insertBeforeSelected(data)
			&& this.selectPreviousSibling();
	}

	attemptToRemoveLastItemInCommand() {
		var p = selectedNex.getParent();
		if (!p) return false;
		if (p.numChildren() == 1 && (isCommand(p) || isLambda(p))) {
			if (!this.removeNex(selectedNex)) return false;
			p.setSelected();
			this.appendAndSelect(new InsertionPoint());
			return true;
		}
		return false;
	}

	removeSelectedAndSelectPreviousSibling() {
		var toDel = selectedNex;
		return (
			this.attemptToRemoveLastItemInCommand()
			||
			(this.selectPreviousSibling() || this.selectParent())
			&&
			this.removeNex(toDel)
		);	
	}

	removeSelectedAndSelectPreviousLeaf() {
		var toDel = selectedNex;
		return (
			this.attemptToRemoveLastItemInCommand()
			||
			(this.selectPreviousLeaf() || this.selectParent())
			&&
			this.removeNex(toDel)
		);	
	}

	removeNex(toDel) {
		var p = toDel.getParent();
		if (!p) return false;
		if (toDel.isSelected()) {
			p.setSelected();
		}
		p.removeChild(toDel);
		return true;
	}

	replaceSelectedWith(nex) {
		var s = selectedNex;
		if (s === nex) return true; // trivially true
		var p = s.getParent(true);
		if (!p) return false;
		p.replaceChildWith(s, nex);
		nex.setSelected();
		return true;
	}

	replaceSelectedWithNewCommand() {
		var s = selectedNex;
		var p = s.getParent(true);
		if (!p) return false;
		var nex = new Command();
		p.replaceChildWith(s, nex);
		nex.setSelected();
		return true;
	}

	// split/join

	selectTopmostEnclosingLine() {
		var p = selectedNex.getParent();
		if (!p) return false;
		while(!isLine(p)) {
			p = p.getParent();
			if (!p) return false;
		}
		while(isLine(p)) {
			var p2 = p.getParent();
			if (p2 && isLine(p2)) {
				p = p2;
			} else {
				break;
			}
		}
		p.setSelected();
		return true;
	}

	gatherRemainingSiblingsIntoNewLine() {
		var ln = new Line();
		ln.appendChild(new Newline());
		this.moveRemainingSiblingsInto(ln);
		return ln;
	}

	moveRemainingSiblingsInto(nex) {
		var s = selectedNex;
		var p = s.getParent();
		if (!p) return false;
		if (p.getLastChild() == s) {
			return true; // nothing to do
		}
		var c;
		while (c = p.getChildAfter(s)) {
			p.removeChild(c);
			nex.appendChild(c);
		}
//		var p2 = p.getParent();
//		p2.insertChildAfter(on, p);
//		return true;		
	}

	split(nex) {
		var s = selectedNex;
		var p = s.getParent();
		if (!p) return false;
		if (p.getLastChild() == s) {
			return true; // nothing to do
		}
		var c;
		while (c = p.getChildAfter(s)) {
			p.removeChild(c);
			nex.appendChild(c);
		}
		var p2 = p.getParent();
		p2.insertChildAfter(nex, p);
		return true;		
	}

	putAllNextSiblingsInNewLine() {
		return this.split(new Line())
	}

	splitCurrentWordIntoTwo() {
		return this.split(new Word())
	}

	joinSelectedWithNextSibling() {
		// note that after joining, the thing
		// to select is the last thing in
		// the first of the two
		// things being joined.
		var s = selectedNex;
		var toSelect = s.getLastChild();
		if (!toSelect) {
			return false;
		}
		var p = s.getParent();
		if (!p) return false;
		var c = p.getChildAfter(s);
		if (!c) return false;		
		var c2;
		while (c2 = c.removeFirstChild()) {
			s.appendChild(c2);
		}
		// now that c is empty, delete it.
		p.removeChild(c);
		toSelect.setSelected();
		return true;
	}

	join(p, a, b) {
		var c;
		while (c = b.removeFirstChild()) {
			a.appendChild(c);
		}
		// now that c is empty, delete it.
		p.removeChild(b);
		return true;
	}

	joinSelectedToNextSiblingIfSameType() {
		var s = selectedNex;
		var p = s.getParent();
		if (!p) return false;
		var c = p.getChildAfter(s);
		if ((s instanceof Line && c instanceof Line)
				|| (s instanceof Word && c instanceof Word)
				|| (s instanceof Doc && c instanceof Doc)) {
			return this.joinSelectedWithNextSibling();
		}
	}

	joinParentOfSelectedToNextSiblingIfSameType() {
		var s = selectedNex;
		var p = s.getParent();
		if (!p) return false;
		p.setSelected();
		this.joinSelectedToNextSiblingIfSameType();
	}

	joinToSiblingIfSame(s) {
		var p = s.getParent();
		if (!p) return false;
		var c = p.getChildAfter(s);
		if ((s instanceof Line && c instanceof Line)
				|| (s instanceof Word && c instanceof Word)
				|| (s instanceof Doc && c instanceof Doc)) {
			return this.join(p, s, c);
		}
	}

	// wrapping

	wrapSelectedInCommand() {
		var s = selectedNex;
		var p = s.getParent(true);
		if (!p) return false;
		var c = new Command();
		p.replaceChildWith(s, c);
		c.appendChild(s);
		c.setSelected();
		return true;
	}

	// idk

	startNewEString() {
		selectedNex.createNewEString();
		return true;
	}

}