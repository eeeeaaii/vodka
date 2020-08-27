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

import * as Utils from './utils.js'

import { systemState } from './systemstate.js'
import { Nex } from './nex/nex.js' 
import { Root } from './nex/root.js' 
import { InsertionPoint } from './nex/insertionpoint.js' 
import { RenderNode } from './rendernode.js' 
import { Word } from './nex/word.js' 
import { EString } from './nex/estring.js' 
import { Command } from './nex/command.js' 
import { Line } from './nex/line.js' 
import { Newline } from './nex/newline.js' 
import { experiments } from './globalappflags.js'
// V2_INSERTION
import {
	INSERT_UNSPECIFIED,
	INSERT_AFTER,
	INSERT_BEFORE,
	INSERT_INSIDE,
	INSERT_AROUND
} from './rendernode.js'

class Manipulator {





	// private methods






	_conformData(data) {
		if (data instanceof Nex) {
			return new RenderNode(data);
		} else return data;
	}

	_selected() {
		return systemState.getGlobalSelectedNode();		
	}

	_isInsertBefore(node) {
		return (node.getInsertionMode() == INSERT_BEFORE);
	}

	_isInsertAfter(node) {
		return (node.getInsertionMode() == INSERT_AFTER);
	}

	_isLetterInDocFormat(node) {
		if (!Utils.isLetter(node)) return false;
		let word = node.getParent();
		if (!word) return false;
		if (!Utils.isWord(word)) return false;
		let line = word.getParent();
		if (!line) return false;
		if (!Utils.isLine(line)) return false;
		let doc = line.getParent();
		if (!doc) return false;
		if (!Utils.isDoc(doc)) return false;
		return true;
	}

	_isSeparatorInDocFormat(node) {
		if (!Utils.isSeparator(node)) return false;
		let line = node.getParent();
		if (!line) return false;
		if (!Utils.isLine(line)) return false;
		let doc = line.getParent();
		if (!doc) return false;
		if (!Utils.isDoc(doc)) return false;
		return true;
	}

	_isLetterInSeparatorPosition(node) {
		if (!Utils.isLetter(node)) return false;
		let line = node.getParent();
		if (!line) return false;
		if (!Utils.isLine(line)) return false;
		let doc = line.getParent();
		if (!doc) return false;
		if (!Utils.isDoc(doc)) return false;
		return true;
	}

	_isInDocFormat(node) {
		return this._isWordInDocFormat(node)
			|| this._isSeparatorInDocFormat(node);
	}	

	_isFirstLeafInLine(node) {
		if (this._isLetterInDocFormat(node)) {
			let word = node.getParent();
			let line = word.getParent();
			return (word.getChildAt(0) == node
					&& line.getChildAt(0) == word);
		} else if (this._isSeparatorInDocFormat(node)) {
			let line = node.getParent();
			return (line.getChildAt(0) == node);
		} else {
			return false;
		}
	}

	_isOnlyLeafInLine(node) {
		return this._isFirstLeafInLine(node)
			&& this._isLastLeafInLine(node);
	}

	_forceInsertionMode(mode, node) {
		node.setInsertionMode(mode);
		return true;
	}

	_newWord() {
		return new RenderNode(new Word());
	}

	_newLine() {
		return new RenderNode(new Line());
	}

	// given a list
	// ( ( a b c d S e f g ) )
	// where S is the element to split after
	// we are passing in some list type
	// and this does this:
	// ( ( a b c d S ) ( e f g ) )
	_splitParentAfterAndPutIn(toSplitAfter, toPutIn) {
		let p = toSplitAfter.getParent();
		if (!p) return false;
		if (p.getLastChild() == toSplitAfter) {
			return false; // nothing to do
		}
		let c;
		while (c = p.getChildAfter(toSplitAfter)) {
			p.removeChild(c);
			toPutIn.appendChild(c);
		}
		let p2 = p.getParent();
		p2.insertChildAfter(toPutIn, p);
		return true;		
	}

	// given a list
	// ( ( a b c d S e f g ) )
	// where S is the element to split before
	// we are passing in some list type
	// and this does this:
	// ( ( a b c d ) ( S e f g ) )
	_splitParentBeforeAndPutIn(toSplitBefore, toPutIn) {
		let p = toSplitBefore.getParent();
		if (!p) return false;
		if (p.getFirstChild() == toSplitBefore) {
			return false; // nothing to do
		}
		let c;
		while (c = p.getChildAfter(toSplitAfter)) {
			p.removeChild(c);
			toPutIn.appendChild(c);
		}
		p.removeChild(toSplitBefore);
		toPutIn.prependChild(toSplitBefore);
		let p2 = p.getParent();
		p2.insertChildAfter(toPutIn, p);
		return true;		
	}

	// given a list like this:
	// ( ( ( a b c S d e f ) ) )
	// splits parent AND grandparent
	// ( ( ( a b c S ) ) ( ( d e f ) ) )
	_splitParentAndGrandparentAfterAndPutIn(toSplitAfter, toPutInParentLevel, toPutInGrandparentLevel) {
		let t = this._splitParentAfterAndPutIn(toSplitAfter, toPutInParentLevel);
		if (!t) return false;
		let p = toSplitAfter.getParent();
		return this._splitParentAfterAndPutIn(p, toPutInGrandparentLevel);
	}

	// given a list like this:
	// ( ( ( a b c S d e f ) ) )
	// splits parent AND grandparent
	// ( ( ( a b c ) ) ( ( S d e f ) ) )
	_splitParentAndGrandparentBeforeAndPutIn(toSplitBefore, toPutInParentLevel, toPutInGrandparentLevel) {
		let t = this._splitParentBeforeAndPutIn(toSplitBefore, toPutInParentLevel);
		if (!t) return false;
		let p = toSplitBefore.getParent();
		return this._splitParentBeforeAndPutIn(p, toPutInGrandparentLevel);
	}

	_appendAfterAndSelect(toAppend, after) {
		let p = after.getParent();
		if (!p) return false;
		p.insertChildAfter(toAppend, after);
		toAppend.setSelected();
		return true;
	}

	_prependBeforeAndSelect(toPrepend, before) {
		let p = before.getParent();
		if (!p) return false;
		p.insertChildBefore(toPrepend, before);
		toPrepend.setSelected();
		return true;
	}

	// takes all the contents of c2 and puts them in c1,
	// then deletes c2
	_joinContainers(c1, c2) {
		let p = c1.getParent();
		if (p.getNextSibling(c1) != c2) return false;
		while (c2.hasChildren()) {
			c1.appendChild(c2.removeChildAt(0));
		}
		this._deleteNode(c2);
	}
	// public methods


	// cleaned up version of removeNex
	_deleteNode(node) {
		let p = node.getParent();
		if (!p) return false;
		if (Utils.isRoot(p) && p.getNex().numChildren() == 1) {
			return false; // can't remove last child of root
		}
		if (node.isSelected()) {
			p.setSelected();
		}
		p.removeChild(node);
		return true;
	}

	_getSiblingAfter(of) {
		let p = of.getParent();
		if (!p) return false;
		let sib = p.getNextSibling(of);
		if (!sib) {
			return false; // meh not strictly necessary but clearer?
		}
		return sib;
	}

	_getSiblingBefore(of) {
		if (!of) return null;
		let p = of.getParent();
		if (!p) return false;
		let sib = p.getPreviousSibling(of);
		if (!sib) {
			return false; // meh not strictly necessary but clearer?
		}
		return sib;
	}

	_getLeafAfter(after) {
		let s = after;
		let c = null;
		while(!(c = this._getSiblingAfter(s))) {
			s = s.getParent();
			if (!s || Utils.isCodeContainer(s)) {
				return after;
			}
		}
		s = c;
		while(!Utils.isCodeContainer(s)) {
			let c = this._getFirstChildOf(s);
			if (!c) {
				break;
			} else {
				s = c;
			}
		}
		return s;
	}

	_getLeafBefore(before) {
		let s = before;
		let c = null;
		while(!(c = this._getSiblingBefore(s))) {
			s = s.getParent();
			if (!s || Utils.isCodeContainer(s)) {
				return before;
			}
		}
		s = c;
		while(!Utils.isCodeContainer(s)) {
			let c = this._getLastChildOf(s);
			if (!c) {
				break;
			} else {
				s = c;
			}
		}
		return s;
	}

	_getFirstChildOf(s) {
		if (!Utils.isNexContainer(s)) return false;
		let c = s.getFirstChild();
		if (!c) {
			return false;
		}
		return c;
	}

	_getLastChildOf(s) {
		if (!Utils.isNexContainer(s)) return false;
		let c = s.getLastChild();
		if (!c) {
			return false;
		}
		return c;
	}

	_deleteLetterAndPossiblyWord(s) {
		let word = s.getParent();
		if (!word) return;
		if (word.numChildren() == 1) {
			this._deleteNode(word);
		} else {
			this._deleteNode(s);
		}
	}

	_deleteSeparatorAndPossiblyJoinWords(s) {
		let prev = this._getSiblingBefore(s);
		let next = this._getSiblingAfter(s);
		this._deleteNode(s);
		if (prev && next && Utils.isWord(prev) && Utils.isWord(next)) {
			this._joinContainers(prev, next);
		}
	}

	_deleteCorrectlyAccordingToLeafType(toDelete) {
		if (this._isLetterInDocFormat(toDelete)) {
			this._deleteLetterAndPossiblyWord(toDelete);					
		} else if (this._isSeparatorInDocFormat(toDelete) || this._isLetterInSeparatorPosition(toDelete)) {
			this._deleteSeparatorAndPossiblyJoinWords(toDelete);
		}
	}


	// LET'S JUST PUT ALL THE V2 INSERT MODE UP HERE, SHALL WE
	// START V2_INSERTION

	// YEAH LIKE LET'S JUST REWRITE ALL THIS

	deleteLeafV2(s) {
		if (this._isFirstLeafInLine(s)) {
			if (this._isInsertAfter(s)) {
				let nextLeaf = this._getLeafAfter(s);
				nextLeaf.setSelected();
				this._forceInsertionMode(INSERT_BEFORE, nextLeaf);
				this._deleteNode(s);
				return true;
			} else {
				// treat around the same as before
				let enclosingLine = this.getEnclosingLine(s);
				let previousSibLine = this._getSiblingBefore(enclosingLine);
				if (enclosingLine && previousSibLine && Utils.isLine(previousSibLine)) {
					this._joinContainers(previousSibLine, enclosingLine);
					// now maybe join words.
					let enclosingWord = this.getEnclosingWord(s);
					let previousSibWord = this._getSiblingBefore(enclosingWord); // if enclosingWord null, returns null
					if (enclosingWord && previousSibWord && Utils.isWord(previousSibWord)) {
						this._joinContainers(previousSibWord, enclosingWord);
					}
					return true;
				}
			}
		} else {
			if (this._isInsertAfter(s)) {
				let toSelectNext = this._getLeafBefore(s);
				toSelectNext.setSelected();
				this._deleteCorrectlyAccordingToLeafType(s);
			} else {
				let toDelete = this._getLeafBefore(s);
				this._deleteCorrectlyAccordingToLeafType(toDelete);
				// so we want to try to keep the insertion point on the right
				// whenever possible, so if possible we grab previous leaf and select it,
				// putting insertion on right. But if they are in different lines, don't.
				let prev = this._getLeafBefore(s);
				if (prev && this.getEnclosingLine(prev) == this.getEnclosingLine(s)) {
					prev.setSelected();
				}
			}
		}
	}

	selectPreviousLeafV2(s) {
		if (this._isFirstLeafInLine(s)) {
			if (s.getInsertionMode() == INSERT_BEFORE) {
				this.selectPreviousLeaf();
				let changedWhatIsSelected = (s != this._selected());
				if (changedWhatIsSelected) {
					this._forceInsertionMode(INSERT_AFTER, this._selected());
				} else {
					// because attempting to go to the previous leaf temporarily changes
					// which node is selected, doing so will revert selection mode
					// to the default (insert_after), so we need to restore it to before.
					this._forceInsertionMode(INSERT_BEFORE, this._selected());					
				}
			} else {
				this._forceInsertionMode(INSERT_BEFORE, this._selected());
			}
		} else {
			this.selectPreviousLeaf();
		}
	}

	selectNextLeafV2(s) {
		if (s.getInsertionMode() == INSERT_BEFORE) {
			this._forceInsertionMode(INSERT_AFTER, this._selected());
			return;
		}
		this.selectNextLeaf();
		if (this._isFirstLeafInLine(this._selected())) {
			this._forceInsertionMode(INSERT_BEFORE, this._selected());
		} else {
			this._forceInsertionMode(INSERT_AFTER, this._selected());			
		}
	}

	_doLineBreakBeforeSeparator(s) {
		if (this._isSeparatorInDocFormat(s)) {
			if (this._splitParentBeforeAndPutIn(s, this._newLine())) {
				// split was performed, select next leaf and put insertion point before
				this.selectPreviousLeaf();
				this._forceInsertionMode(INSERT_AFTER, this._selected());
			} else {
				this._prependBeforeAndSelect(this._newLine(), this.getEnclosingLine(s));
			}
		} else {
			// idk, call the method we use for random things? do nothing? idk
		}
	}

	_doLineBreakAfterSeparator(s) {
		if (this._isSeparatorInDocFormat(s)) {
			if (this._splitParentAfterAndPutIn(s, this._newLine())) {
				// split was performed, select next leaf and put insertion point before
				this.selectNextLeaf();
				this._forceInsertionMode(INSERT_BEFORE, this._selected());
			} else {
				// split not performed, insert new empty line
				this._appendAfterAndSelect(this._newLine(), this.getEnclosingLine(s));
			}
		} else {
			// idk, call the method we use for random things? do nothing? idk
		}
	}

	_doLineBreakBeforeLetter(s) {
		if (this._isLetterInDocFormat(s)) {
			if (this._splitParentAndGrandparentBeforeAndPutIn(s, this._newWord(), this._newLine())) {
				// split was performed, need to move selected node
				this.selectPreviousLeaf();
				this._forceInsertionMode(INSERT_AFTER, this._selected());
			} else {
				this._prependBeforeAndSelect(this._newLine(), this.getEnclosingLine(s));
			}
		} else if (this._isLetterInSeparatorPosition(s)) {
			this._doLineBreakBeforeSeparator(s);
		}
	}

	_doLineBreakAfterLetter(s) {
		if (this._isLetterInDocFormat(s)) {
			if (this._splitParentAndGrandparentAfterAndPutIn(s, this._newWord(), this._newLine())) {
				// split was performed, need to move selected node
				this.selectNextLeaf();
				this._forceInsertionMode(INSERT_BEFORE, this._selected());
			} else {
				this._appendAfterAndSelect(this._newLine(), this.getEnclosingLine(s));
			}
		} else if (this._isLetterInSeparatorPosition(s)) {
			this._doLineBreakAfterSeparator(s);
		}
	}

	doLineBreakForLetter(s) {
		if (s.getInsertionMode() == INSERT_AFTER) {
			this._doLineBreakAfterLetter(s);
		} else {
			this._doLineBreakBeforeLetter(s);
		}
	}

	doLineBreakForSeparator(s) {
		if (s.getInsertionMode() == INSERT_AFTER) {
			this._doLineBreakAfterSeparator(s);
		} else {
			this._doLineBreakBeforeSeparator(s);
		}
	}

	doLineBreakForLine(s) {
		let ln = this._newLine();
		let mode = s.getInsertionMode();
		if (mode == INSERT_BEFORE || mode == INSERT_AROUND) {
			this._prependBeforeAndSelect(ln, s);
		} else {
			this._appendAfterAndSelect(ln, s);
		}
	}











	getPreviousLine(line) {
		let p = line.getParent();
		if (!p) return null;
		let sib = p.getPreviousSibling(line);
		if (!Utils.isLine(sib)) return null;
		return sib;
	}

	insertAsFirstChild(data) {
		data = this._conformData(data);
		let s = systemState.getGlobalSelectedNode();
		let newNode = s.prependChild(data);
		newNode.setSelected();
		if (experiments.V2_INSERTION) {
			newNode.possiblyStartMainEditor();
		}
		return true;		
	}


	// wtf is this 
	putAllNextSiblingsIn(nex) {
		nex = this._conformData(nex);
		let s = (systemState.getGlobalSelectedNode());
		let p = s.getParent();
		if (!p) return false;
		let c;
		while (c = p.getChildAfter(s)) {
			p.removeChild(c);
			nex.appendChild(c);
		}
		return true;		
	}


	// END V2_INSERTION ----------------------------


	findNextSiblingThatSatisfies(f) {
		while (this.selectNextSibling()) {
			if (f(systemState.getGlobalSelectedNode())) {
				return true;
			}
		}
		return false;
	}


	// used for up and down arrows.

	selectCorrespondingLetterInPreviousLine() {
		// get the current line and the previous line.
		let enclosingLine = this.getEnclosingLine(systemState.getGlobalSelectedNode());
		if (!enclosingLine) return false;
		let doc = enclosingLine.getParent();
		if (!doc) return false;
		let previousLine = doc.getChildBefore(enclosingLine);
		if (!previousLine) return false;

		let original = (systemState.getGlobalSelectedNode());
		let targetX = original.getLeftX();
		let c;

		previousLine.setSelected();
		this.selectFirstLeaf();
		let lastX = (systemState.getGlobalSelectedNode()).getLeftX();
		if (targetX <= lastX) {
			return true;
		}

		do {
			if (this.getEnclosingLine((systemState.getGlobalSelectedNode())) != previousLine) {
				this.selectPreviousLeaf();
				break;
			}
			let x = (systemState.getGlobalSelectedNode()).getLeftX();
			if (x > targetX) {
				// this is the one
				break;
			}
		} while(this.selectNextLeaf());

		return true;
	}

	selectCorrespondingLetterInNextLine() {
		// get the current line and the previous line.
		let enclosingLine = this.getEnclosingLine((systemState.getGlobalSelectedNode()));
		if (!enclosingLine) return false;
		let doc = enclosingLine.getParent();
		if (!doc) return false;
		let nextLine = doc.getChildAfter(enclosingLine);
		if (!nextLine) return false;

		let original = (systemState.getGlobalSelectedNode());
		let targetX = original.getLeftX();
		let c;

		nextLine.setSelected();
		this.selectFirstLeaf();
		let lastX = (systemState.getGlobalSelectedNode()).getLeftX();
		if (targetX <= lastX) {
			return true;
		}

		do {
			if (this.getEnclosingLine((systemState.getGlobalSelectedNode())) != nextLine) {
				this.selectPreviousLeaf();
				break;
			}
			let x = (systemState.getGlobalSelectedNode()).getLeftX();
			if (x > targetX) {
				// this is the one
				break;
			}
		} while(this.selectNextLeaf());

		return true;
	}

	getEnclosingLine(s) {
		while(s = s.getParent()) {
			if (Utils.isLine(s)) {
				return s;
			}
		}
		return null;
	}

	getEnclosingWord(s) {
		while (s = s.getParent()) {
			if (Utils.isWord(s)) {
				return s;
			}
		}
		return null;
	}

	getEnclosingDoc(s) {
		while (s = s.getParent()) {
			if (Utils.isWord(s)) {
				return s;
			}
		}
		return null;
	}

	// traversal

	selectPreviousLeaf() {
		let first = (systemState.getGlobalSelectedNode());
		while(!this.selectPreviousSibling()) {
			let p = this.selectParent();
			if (!p || Utils.isCodeContainer((systemState.getGlobalSelectedNode()))) {
				first.setSelected();
				return false;
			}
		}
		while(!Utils.isCodeContainer((systemState.getGlobalSelectedNode())) && this.selectLastChild());
		return true;
	}

	selectNextLeaf() {
		let first = (systemState.getGlobalSelectedNode());
		while(!this.selectNextSibling()) {
			let p = this.selectParent();
			if (!p || Utils.isCodeContainer((systemState.getGlobalSelectedNode()))) {
				first.setSelected();
				return false;
			}
		}
		while(!Utils.isCodeContainer((systemState.getGlobalSelectedNode())) && this.selectFirstChild());
		return true;
	}

	selectFirstLeaf() {
		let c = (systemState.getGlobalSelectedNode());
		while(Utils.isNexContainer(c) && c.hasChildren()) {
			c = c.getFirstChild();
		}
		c.setSelected();
		return true;
	}

	// generic selection stuff

	selectLastChild() {
		let s = (systemState.getGlobalSelectedNode());
		if (!Utils.isNexContainer(s)) return false;
		let c = s.getLastChild();
		if (c) {
			c.setSelected();
			return true;
		}
		return false;
	}

	selectFirstChild() {
		let s = (systemState.getGlobalSelectedNode());
		if (!Utils.isNexContainer(s)) return false;
		let c = s.getFirstChild();
		if (c) {
			c.setSelected();
			return true;
		}
		return false;
	}

	selectNthChild(n) {
		let s = (systemState.getGlobalSelectedNode());
		if (n >= s.numChildren()) return false;
		if (n < 0) return false;
		let c = s.getChildAt(n);
		if (!c) return false;
		c.setSelected();
		return true;
	}

	selectNextSibling() {
		let s = (systemState.getGlobalSelectedNode());
		let p = s.getParent();
		if (!p) return false;
		let nextSib = p.getNextSibling(s);
		if (nextSib) {
			nextSib.setSelected();
			return true;
		}
		return false;
	}

	selectPreviousSibling() {
		let s = (systemState.getGlobalSelectedNode());
		let p = s.getParent();
		if (!p) return false;
		let sib = p.getPreviousSibling(s);
		if (sib) {
			sib.setSelected();
			return true;
		}
		return false;
	}

	selectParent() {
		let s = (systemState.getGlobalSelectedNode());
		let p = s.getParent();
		if (!p) return false;
		p.setSelected();
		return true;
	}

	// CRUD operations

	appendNewEString() {
		let s = (systemState.getGlobalSelectedNode());
		let i = 0;
		for(i = 0;
			s.getChildAt(i) && Utils.isEString(s.getChildAt(i));
			i++);
		// i is the insertion point
		let n = new EString();
		s.insertChildAt(n, i);
		n.setSelected();
	}

	wrapSelectedInAndSelect(wrapperNex) {
		let s = systemState.getGlobalSelectedNode();
		let p = systemState.getGlobalSelectedNode().getParent();
		if (!p) return false;
		let selectedNex = s.getNex();
		wrapperNex.appendChild(selectedNex);
		let wrapperNode = new RenderNode(wrapperNex);
		p.replaceChildWith(s, wrapperNode);
		wrapperNode.setSelected();
		if (experiments.V2_INSERTION) {
			wrapperNode.possiblyStartMainEditor();
		}
	}

	appendAndSelect(data) {
		data = this._conformData(data);
		let s = systemState.getGlobalSelectedNode();
		let newNode = s.appendChild(data);
		newNode.setSelected();
		return true;		
	}



	insertAfterSelected(data) {
		data = this._conformData(data);
		let s = (systemState.getGlobalSelectedNode());
		let p = s.getParent();
		if (!p) return false;
		p.insertChildAfter(data, s);
		return true;
	}

	insertAfterSelectedAndSelect(data) {
		data = this._conformData(data);
		let r = this.insertAfterSelected(data)
			&& this.selectNextSibling();
		if (experiments.V2_INSERTION) {
			systemState.getGlobalSelectedNode().possiblyStartMainEditor();
		}
		return r;
	}

	insertBeforeSelected(data) {
		data = this._conformData(data);
		let s = (systemState.getGlobalSelectedNode());
		let p = s.getParent();
		if (!p) return false;
		p.insertChildBefore(data, s);
		return true;
	}

	// used in evaluator.js
	insertBeforeSelectedAndSelect(data) {
		let r = this.insertBeforeSelected(data)
			&& this.selectPreviousSibling();
		if (experiments.V2_INSERTION) {
			systemState.getGlobalSelectedNode().possiblyStartMainEditor();
		}
		return r;
	}

	attemptToRemoveLastItemInCommand() {
		let p = (systemState.getGlobalSelectedNode()).getParent();
		if (!p) return false;
		if (p.numChildren() == 1 && Utils.isCodeContainer(p)) {
			if (!this.removeNex((systemState.getGlobalSelectedNode()))) return false;
			p.setSelected();
			this.appendAndSelect(new InsertionPoint());
			return true;
		}
		return false;
	}

	removeSelectedAndSelectPreviousSibling() {
		let toDel = (systemState.getGlobalSelectedNode());
		return (
			this.attemptToRemoveLastItemInCommand()
			||
			(this.selectPreviousSibling() || this.selectParent())
			&&
			this.removeNex(toDel)
		);	
	}

	removeSelectedAndSelectPreviousLeaf() {
		let toDel = (systemState.getGlobalSelectedNode());
		return (
			this.attemptToRemoveLastItemInCommand()
			||
			(this.selectPreviousLeaf() || this.selectParent())
			&&
			this.removeNex(toDel)
		);	
	}

	// used in browsereventresponsefunctions.js
	removeNex(toDel) {
		// toDel must not be a nex, has to be a RenderNode.
		if (!(toDel instanceof RenderNode)) {
			throw new Error('need to delete the rendernode not the nex');
		}
		let p = toDel.getParent();
		if (!p) return false;
		if (
			((p.getNex()) instanceof Root)
			&&
			(p.getNex()).numChildren() == 1
			) {
			toDel.setSelected();
			return false; // can't remove last child of root
		}
		if (toDel.isSelected()) {
			p.setSelected();
		}
		p.removeChild(toDel);
		return true;
	}

	// used in evaluator.js
	replaceSelectedWith(nex) {
		nex = this._conformData(nex);
		let s = (systemState.getGlobalSelectedNode());
		if (s === nex) return true; // trivially true
		let p = s.getParent(true);
		if (!p) return false;
		p.replaceChildWith(s, nex);
		nex.setSelected();
		return true;
	}

	replaceSelectedWithFirstChildOfSelected() {
		let s = systemState.getGlobalSelectedNode();
		let p = s.getParent(true);
		if (!p) return false;
		if (!(s.numChildren() == 1)) return false;
		let nex = s.getChildAt(0);
		p.replaceChildWith(s, nex);
		nex.setSelected();
		return true;
	}

	replaceSelectedWithNewCommand() {
		let s = (systemState.getGlobalSelectedNode());
		let p = s.getParent(true);
		if (!p) return false;
		let nex = new Command();
		p.replaceChildWith(s, nex);
		nex.setSelected();
		return true;
	}

	// split/join

	selectTopmostEnclosingLine() {
		let p = (systemState.getGlobalSelectedNode()).getParent();
		if (!p) return false;
		while(!Utils.isLine(p)) {
			p = p.getParent();
			if (!p) return false;
		}
		while(Utils.isLine(p)) {
			let p2 = p.getParent();
			if (p2 && Utils.isLine(p2)) {
				p = p2;
			} else {
				break;
			}
		}
		p.setSelected();
		return true;
	}

	gatherRemainingSiblingsIntoNewLine() {
		let ln = new Line();
		ln.appendChild(new Newline());
		this.moveRemainingSiblingsInto(ln);
		return ln;
	}

	moveRemainingSiblingsInto(nex) {
		nex = this._conformData(nex);
		let s = (systemState.getGlobalSelectedNode());
		let p = s.getParent();
		if (!p) return false;
		if (p.getLastChild() == s) {
			return true; // nothing to do
		}
		let c;
		while (c = p.getChildAfter(s)) {
			p.removeChild(c);
			nex.appendChild(c);
		}
	}

	// this takes all the selected node's right-hand
	// siblings and puts them inside nex, then
	// puts nex inside the selected node's grandparent
	// after the selected node's parent
	// i.e.
	// start:
	// ( ( a b c SEL d e f ) )
	// pass in nex
	// end
	// ( ( a b c SEL ) ( d e f ) )
	split(nex) {
		nex = this._conformData(nex);
		let s = (systemState.getGlobalSelectedNode());
		let p = s.getParent();
		if (!p) return false;
		if (p.getLastChild() == s) {
			return true; // nothing to do
		}
		let c;
		while (c = p.getChildAfter(s)) {
			p.removeChild(c);
			nex.appendChild(c);
		}
		let p2 = p.getParent();
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
		let s = (systemState.getGlobalSelectedNode());
		let toSelect = s.getLastChild();
		if (!toSelect) {
			return false;
		}
		let p = s.getParent();
		if (!p) return false;
		let c = p.getChildAfter(s);
		if (!c) return false;		
		let c2;
		while (c2 = c.removeFirstChild()) {
			s.appendChild(c2);
		}
		// now that c is empty, delete it.
		p.removeChild(c);
		toSelect.setSelected();
		return true;
	}

	join(p, a, b) {
		p = this._conformData(p);
		a = this._conformData(a);
		b = this._conformData(b);
		let c;
		while (c = b.removeFirstChild()) {
			a.appendChild(c);
		}
		// now that c is empty, delete it.
		p.removeChild(b);
		return true;
	}

	joinSelectedToNextSiblingIfSameType() {
		let s = (systemState.getGlobalSelectedNode());
		let p = s.getParent();
		if (!p) return false;
		let c = p.getChildAfter(s);
		if ((Utils.isLine(s) && Utils.isLine(c))
				|| (Utils.isWord(s) && Utils.isWord(c))
				|| (Utils.isDoc(s) && Utils.isDoc(c))) {
			return this.joinSelectedWithNextSibling();
		}
	}

	joinParentOfSelectedToNextSiblingIfSameType() {
		let s = (systemState.getGlobalSelectedNode());
		let p = s.getParent();
		if (!p) return false;
		p.setSelected();
		this.joinSelectedToNextSiblingIfSameType();
	}

	joinToSiblingIfSame(s) {
		s = this._conformData(s);
		let p = s.getParent();
		if (!p) return false;
		let c = p.getChildAfter(s);
		if ((Utils.isLine(s) && Utils.isLine(c))
				|| (Utils.isWord(s) && Utils.isWord(c))
				|| (Utils.isDoc(s) && Utils.isDoc(c))) {
			return this.join(p, s, c);
		}
	}

	// deprecated
	startNewEString() {
		(systemState.getGlobalSelectedNode()).createNewEString();
		return true;
	}



	// used in keydispatcher.js
	doCut() {
		CLIPBOARD = systemState.getGlobalSelectedNode().getNex();
		let x = systemState.getGlobalSelectedNode();
		this.selectPreviousSibling() || this.selectParent();		
		this.removeNex(x);
	}

	// used in keydispatcher.js
	doCopy() {
		CLIPBOARD = systemState.getGlobalSelectedNode().getNex();
	}

	// used in keydispatcher.js
	doPaste() {
		if (experiments.V2_INSERTION) {
			let s = systemState.getGlobalSelectedNode();
			switch(s.getInsertionMode()) {
				case INSERT_AFTER:
					this.insertAfterSelectedAndSelect(CLIPBOARD.makeCopy());
					break;
				case INSERT_BEFORE:
				case INSERT_AROUND:
					this.insertBeforeSelectedAndSelect(CLIPBOARD.makeCopy());
					break;
				case INSERT_INSIDE:
					this.insertAsFirstChild(CLIPBOARD.makeCopy());
					break;
			}
		} else {
			if (Utils.isInsertionPoint(systemState.getGlobalSelectedNode())) {
				this.replaceSelectedWith(CLIPBOARD.makeCopy())
			} else {
				this.insertAfterSelectedAndSelect(CLIPBOARD.makeCopy())
			}
		}
	}

}

const manipulator = new Manipulator();

export { manipulator }

