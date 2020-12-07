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
import { Lambda } from './nex/lambda.js'
import { ESymbol } from './nex/esymbol.js' 
import { EString } from './nex/estring.js' 
import { RenderNode } from './rendernode.js' 
import { Word } from './nex/word.js' 
import { Command } from './nex/command.js' 
import { Bool } from './nex/bool.js' 
import { Line } from './nex/line.js' 
import { Zlist } from './nex/zlist.js' 
import { Org } from './nex/org.js' 
import { Float } from './nex/float.js' 
import { Expectation } from './nex/expectation.js' 
import { Integer } from './nex/integer.js' 
import { Letter } from './nex/letter.js' 
import { Doc } from './nex/doc.js' 
import { Separator } from './nex/separator.js' 
import { Nil } from './nex/nil.js' 
import { experiments } from './globalappflags.js'
import { isRecordingTest } from './testrecorder.js'
import {
	INSERT_UNSPECIFIED,
	INSERT_AFTER,
	INSERT_BEFORE,
	INSERT_INSIDE,
	INSERT_AROUND
} from './rendernode.js'

class Manipulator {


	// private methods start with _
	// everything at the beginning of this file should be new
	// everything at the end is probably deprecated
	// look at the line number, divide by total lines in this doc
	// that is the probability it is deprecated	


	// deprecated
	_conformData(data) {
		if (data instanceof Nex) {
			return new RenderNode(data);
		} else return data;
	}

	// UTILITIES HAVE THIS ASCII ART BULLSHIT SEPARATOR 'KAY

	//////// *********************** --------------------------------------------------
	//////// *********************** --------------------------------------------------
	//////// *********************** --------------------------------------------------
	// TESTS

	_inSameLine(s1, s2) {
		let l1 = this.getEnclosingLine(s1);
		let l2 = this.getEnclosingLine(s2);
		return l1 == l2;
	}

	_isInsertBefore(node) {
		return (node.getInsertionMode() == INSERT_BEFORE);
	}

	_isInsertAfter(node) {
		return (node.getInsertionMode() == INSERT_AFTER);
	}

	_isEmpty(node) {
		return node.numChildren() == 0;
	}

	_isLetterInDocFormat(node) {
		if (!Utils.isLetter(node)) return false;
		let word = node.getParent();
		if (!word) return false;
		if (!Utils.isWord(word)) return false;
		if (experiments.V2_INSERTION_LENIENT_DOC_FORMAT) {
			return true;
		}
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
		if (experiments.V2_INSERTION_LENIENT_DOC_FORMAT) {
			return true;
		}
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
		if (experiments.V2_INSERTION_LENIENT_DOC_FORMAT) {
			return true;
		}
		let doc = line.getParent();
		if (!doc) return false;
		if (!Utils.isDoc(doc)) return false;
		return true;
	}

	_isSeparatorInLetterPosition(node) {
		if (!Utils.isSeparator(node)) return false;
		let word = node.getParent();
		if (!word) return false;
		if (!Utils.isWord(word)) return false;
		if (experiments.V2_INSERTION_LENIENT_DOC_FORMAT) {
			return true;
		}
		let line = word.getParent();
		if (!line) return false;
		if (!Utils.isLine(line)) return false;
		let doc = line.getParent();
		if (!doc) return false;
		if (!Utils.isDoc(doc)) return false;
		return true;
	}

	_isInDocFormat(node) {
		return this._isLetterInDocFormat(node)
			|| this._isSeparatorInDocFormat(node)
			|| this._isLetterInSeparatorPosition(node);
	}	

	_isOnlyLeafInLine(node) {
		let line = this.getEnclosingLine(node);
		return (node == this._getFirstLeafInside(line)
				&& node == this._getLastLeafInside(line));
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

	_isEmptyLineInDoc(node) {
		let p = node.getParent();
		if (!p) return false;
		return (Utils.isLine(node)
			&& Utils.isDoc(p)
			&& this._isEmpty(node));
	}

	_isLastChildOf(c, of) {
		if (of.numChildren() == 0) return false;
		return (of.getLastChild() == c);
	}

	_isFirstChildOf(c, of) {
		if (of.numChildren() == 0) return false;
		return (of.getFirstChild() == c);
	}

	_forceInsertionMode(mode, node) {
		node.setInsertionMode(mode);
		return true;
	}

	//////// *********************** --------------------------------------------------
	//////// *********************** --------------------------------------------------
	//////// *********************** --------------------------------------------------
	// SPLITTING


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
		while (c = p.getChildAfter(toSplitBefore)) {
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

	// given a list like this:
	// ( ( a b c ( ...S... ) d e ) )
	// splits just grandparent, ignoring what's in the parent of S
	// ( ( a b c ) ( (...S...) d e ) )
	_splitGrandparentBeforeAndPutIn(toSplitBefore, toPutIn) {
		let p = toSplitBefore.getParent();
		if (!p) return false;
		return this._splitParentBeforeAndPutIn(p, toPutIn);
	}

	// given a list like this:
	// ( ( a b c ( ...S... ) d e ) )
	// splits just grandparent, ignoring what's in the parent of S
	// ( ( a b c (...S...) ) ( d e ) )
	_splitGrandparentAfterAndPutIn(toSplitAfter, toPutIn) {
		let p = toSplitAfter.getParent();
		if (!p) return false;
		return this._splitParentAfterAndPutIn(p, toPutIn);
	}

	//////// *********************** --------------------------------------------------
	//////// *********************** --------------------------------------------------
	//////// *********************** --------------------------------------------------
	// APPENDING

	_appendAfterAndSelect(toAppend, after) {
		if (this._appendAfter(toAppend, after)) {
			toAppend.setSelected();
			return true;
		}
		return false;
	}

	_appendAfter(toAppend, after) {
		let p = after.getParent();
		if (!p) return false;
		p.insertChildAfter(toAppend, after);
		return true;
	}

	_appendAsLastChildOf(toAppend, inside) {
		inside.appendChild(toAppend);
		return true;
	}

	//////// *********************** --------------------------------------------------
	//////// *********************** --------------------------------------------------
	//////// *********************** --------------------------------------------------
	// PREPENDING

	_prependBeforeAndSelect(toPrepend, before) {
		if (this._prependBefore(toPrepend, before)) {
			toPrepend.setSelected();
			return true;
		}
		return false;
	}

	_prependBefore(toPrepend, before) {
		let p = before.getParent();
		if (!p) return false;
		p.insertChildBefore(toPrepend, before);
		return true;
	}

	_prependAsFirstChildOf(toPrepend, inside) {
		inside.prependChild(toPrepend);
		return true;
	}

	//////// *********************** --------------------------------------------------
	//////// *********************** --------------------------------------------------
	//////// *********************** --------------------------------------------------
	// JOINING

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

	//////// *********************** --------------------------------------------------
	//////// *********************** --------------------------------------------------
	//////// *********************** --------------------------------------------------
	// DELETING


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

	_deleteLetterAndPossiblyWord(s) {
		let word = s.getParent();
		if (!word) return;
		if (word.numChildren() == 1) {
			this._deleteNode(word);
		} else {
			this._deleteNode(s);
		}
	}

	_deleteUpToLine(s) {
		// could be line > thing
		// or line > word > thing
		let p = s.getParent();
		if (!p) return false;
		this._deleteNode(s);
		if (Utils.isWord(p)) {
			let line = p.getParent();
			this._deleteNode(p);
		}
		return true;
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

	_deleteLineBreak(s) {
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
			let prev = this._getLeafBefore(s);
			if (prev && this._inSameLine(prev, s)) {
				prev.setSelected();
				this._forceInsertionMode(INSERT_AFTER, prev);
			}
			return true;
		}

	}

	//////// *********************** --------------------------------------------------
	//////// *********************** --------------------------------------------------
	//////// *********************** --------------------------------------------------
	// GETTING OTHER NODES

	// gets the selected node
	selected() {
		return systemState.getGlobalSelectedNode();		
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

	_getLeafBefore(before) {
		let s = before;
		let c = null;
		while(!(c = this._getSiblingBefore(s))) {
			s = s.getParent();
			if (!s || Utils.isCodeContainer(s)) {
				return null;
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

	_getLeafAfter(after) {
		let s = after;
		let c = null;
		while(!(c = this._getSiblingAfter(s))) {
			s = s.getParent();
			if (!s || Utils.isCodeContainer(s)) {
				return null;
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

	_getLeafAfterFromSameLine(after) {
		let c = this._getLeafAfter(after);
		if (!c) return null;
		if (!this._inSameLine(after, c)) {
			return null;
		}
		return c;
	}

	_getLeafBeforeFromSameLine(before) {
		let c = this._getLeafBefore(before);
		if (!c) return null;
		if (!this._inSameLine(before, c)) {
			return null;
		}
		return c;
	}

	_getFirstChildOf(s) {
		if (!Utils.isNexContainer(s)) return false;
		let c = s.getFirstChild();
		if (!c) {
			return false;
		}
		return c;
	}

	_getFirstLeafInside(s) {
		while(Utils.isNexContainer(s)
			&& (s = s.getFirstChild()) != null);
		return s;
	}

	_getLastLeafInside(s) {
		while(Utils.isNexContainer(s)
			&& (s = s.getLastChild()) != null);
		return s;
	}

	_getLastChildOf(s) {
		if (!Utils.isNexContainer(s)) return false;
		let c = s.getLastChild();
		if (!c) {
			return false;
		}
		return c;
	}


	//////// *********************** --------------------------------------------------
	//////// *********************** --------------------------------------------------
	//////// *********************** --------------------------------------------------


	//////// OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
	//////// OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
	//////// OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO

	// OKAY NOW THIS OTHER ASCII GARBAGE IS FOR PRIVATE HELPER METHODS
	// THEY ARE NOT UTILITIES BECAUSE THEY AREN'T GENERAL PURPOSE
	// THEY ARE SPECIFIC IN PURPOSE BUT NOT PUBLIC
	// THESE SHOULD ALL BE SEPARATE CLASSES THEN I WOULDN'T HAVE TO SCREAM IN ALL CAPS


	_doLineBreakBeforeSeparator(s) {
		if (this._isSeparatorInDocFormat(s) || this._isLetterInSeparatorPosition(s)) {
			if (this._splitParentBeforeAndPutIn(s, this.newLine())) {
				// split was performed, select next leaf and put insertion point before
				this.selectPreviousLeaf();
				this._forceInsertionMode(INSERT_AFTER, this.selected());
			} else {
				this._prependBefore(this.newLine(), this.getEnclosingLine(s));
				// leave current thing selected!
			}
		} else if (this._isSeparatorInLetterPosition(s)) {
			this._doLineBreakBeforeLetter(s);
		} else {
			// idk, call the method we use for random things? do nothing? idk
		}
	}

	_doLineBreakAfterSeparator(s) {
		if (this._isSeparatorInDocFormat(s) || this._isLetterInSeparatorPosition(s)) {
			if (this._splitParentAfterAndPutIn(s, this.newLine())) {
				// split was performed, select next leaf and put insertion point before
				this.selectNextLeaf();
				this._forceInsertionMode(INSERT_BEFORE, this.selected());
			} else {
				let line = this.newLine();
				// split not performed, insert new empty line
				this._appendAfterAndSelect(line, this.getEnclosingLine(s));
			}
		} else if (this._isSeparatorInLetterPosition(s)) {
			this._doLineBreakAfterLetter(s);
		} else {
			// idk, call the method we use for random things? do nothing? idk
		}
	}

	_doLineBreakBeforeLetter(s) {
		if (this._isLetterInDocFormat(s) || this._isSeparatorInLetterPosition(s)) {
			// for situations where we have ( ( a S b c) )
			if (this._splitParentAndGrandparentBeforeAndPutIn(s, this.newWord(), this.newLine())) {
				// split was performed, need to move selected node
				this.selectPreviousLeaf();
				this._forceInsertionMode(INSERT_AFTER, this.selected());
			// for situations where we have ( a ( S b c) )
			} else if (this._splitGrandparentBeforeAndPutIn(s, this.newLine())) {
				this.selectPreviousLeaf();
				this._forceInsertionMode(INSERT_AFTER, this.selected());				
			} else {
				this._prependBefore(this.newLine(), this.getEnclosingLine(s));
				// leave current thing selected!
			}
		} else if (this._isLetterInSeparatorPosition(s)) {
			this._doLineBreakBeforeSeparator(s);
		}
	}

	_doLineBreakAfterLetter(s) {
		if (this._isLetterInDocFormat(s) || this._isSeparatorInLetterPosition(s)) {
			// for situations where we have ( ( a b S c ) )
			if (this._splitParentAndGrandparentAfterAndPutIn(s, this.newWord(), this.newLine())) {
				// split was performed, need to move selected node
				this.selectNextLeaf();
				this._forceInsertionMode(INSERT_BEFORE, this.selected());
			// for situations where we have ( ( a b S ) c )
			} else if (this._splitGrandparentAfterAndPutIn(s, this.newLine())) {
				this.selectNextLeaf();
				this._forceInsertionMode(INSERT_BEFORE, this.selected());				
			} else {
				let line = this.newLine();
				this._appendAfterAndSelect(line, this.getEnclosingLine(s));
			}
		} else if (this._isLetterInSeparatorPosition(s)) {
			this._doLineBreakAfterSeparator(s);
		}
	}	


	//////// OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
	//////// OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
	//////// OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO


	// OKAY BELOW THIS WE HAVE ENTRY POINT METHODS
	// THAT ARE CALLED DIRECTLY FROM KEYRESPONSEFUNCTIONS.JS
	// TO PERFORM WHATEVER ACTIONS IT WANTS TO PERFORM
	// THESE NEED A BETTER NAMING CONVENTION THAT TELLS YOU
	// WHAT NEX FIRES THEM IN RESPONSE TO WHAT KEYSTROKES

	deleteLeafV2(s) {
		if (this._isOnlyLeafInLine(s)) {
			if (this._isInsertAfter(s)) {
				let line = this.getEnclosingLine(s);
				this._deleteUpToLine(s);
				line.setSelected();
				this._forceInsertionMode(INSERT_INSIDE, line);
			} else {
				this._deleteLineBreak(s);
			}
		} else if (this._isFirstLeafInLine(s)) {
			if (this._isInsertAfter(s)) {
				let nextLeaf = this._getLeafAfter(s);
				nextLeaf.setSelected();
				this._forceInsertionMode(INSERT_BEFORE, nextLeaf);
				this._deleteNode(s);
				return true;
			} else {
				// treat around the same as before
				this._deleteLineBreak(s);
			}
		} else if (this._isInDocFormat(s)) {
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
		} else {
			// simpler delete for "naked" letters
			this.removeAndSelectPreviousSiblingV2(s);
		}
	}

	removeAndSelectPreviousSiblingV2(s) {
		let b = this._getSiblingBefore(s);
		let a = this._getSiblingAfter(s);
		let p = s.getParent();
		this._deleteNode(s);
		if (b) {
			b.setSelected();
		} else if (a) {
			a.setSelected();
			this._forceInsertionMode(INSERT_BEFORE, a);
		} else {
			p.setSelected();
			this._forceInsertionMode(INSERT_INSIDE, p);
		}
	}


	removeSelectedAndSelectPreviousLeafV2(s) {
		// this is used by other things that are not letters or separators
		// when they are in a line context I guess?
		// or at various times.
		// basically most of the time it's the same as the old way
		// but we have to put in special code for like
		// for example if this was the only thing in a line--
		// in the old way, there would be a newline object preceding this
		// but now there isn't
		let p = s.getParent();

		if (Utils.isLine(p) && p.numChildren() == 1) {
			this._deleteNode(s);
			p.setSelected();
			this._forceInsertionMode(INSERT_INSIDE, p);
			return;
		}

		let toDel = this.selected();
		let r = (
			this.attemptToRemoveLastItemInCommand()
			||
			(this.selectPreviousLeaf() || this.selectParent())
			&&
			this.removeNex(toDel)
		);	
		if (!p.hasChildren() && (Utils.isWord(p) || Utils.isLine(p))) {
			manipulator.removeNex(p);
		}
	}

	selectPreviousLeafV2(s) {
		if (this._isFirstLeafInLine(s)) {
			if (s.getInsertionMode() == INSERT_BEFORE) {
				this.selectPreviousLeaf();
				let changedWhatIsSelected = (s != this.selected());
				if (changedWhatIsSelected) {
					if (Utils.isLine(this.selected())) {
						this._forceInsertionMode(INSERT_INSIDE, this.selected());
					} else {
						this._forceInsertionMode(INSERT_AFTER, this.selected());
					}
				} else {
					// because attempting to go to the previous leaf temporarily changes
					// which node is selected, doing so will revert selection mode
					// to the default (insert_after), so we need to restore it to before.
					this._forceInsertionMode(INSERT_BEFORE, this.selected());					
				}
			} else {
				this._forceInsertionMode(INSERT_BEFORE, this.selected());
			}
		} else if (this._isEmptyLineInDoc(s)) {
			let sib = this._getSiblingBefore(s);
			if (sib) {
				if (this._isEmptyLineInDoc(sib)) {
					sib.setSelected();
					this._forceInsertionMode(INSERT_INSIDE, sib);
				} else {
					let c = this._getLastLeafInside(sib);
					c.setSelected();
					this._forceInsertionMode(INSERT_AFTER, c);
				}
			} else return false;
		} else {
			this.selectPreviousLeaf();
		}
	}

	selectNextLeafV2(s) {
		if (s.getInsertionMode() == INSERT_BEFORE) {
			this._forceInsertionMode(INSERT_AFTER, this.selected());
			return;
		}
		this.selectNextLeaf();
		if (this._isFirstLeafInLine(this.selected())) {
			this._forceInsertionMode(INSERT_BEFORE, this.selected());
		} else {
			if (Utils.isLine(this.selected())) {
				this._forceInsertionMode(INSERT_INSIDE, this.selected());
			} else {
				this._forceInsertionMode(INSERT_AFTER, this.selected());
			}
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
		let ln = this.newLine();
		let mode = s.getInsertionMode();
		if (mode == INSERT_BEFORE || mode == INSERT_AROUND) {
			this._prependBeforeAndSelect(ln, s);
		} else {
			this._appendAfterAndSelect(ln, s);
		}
	}

	doLineBreakAlwaysV2(s) {
		let line = this.newLine();
		let p = s.getParent();
		if (!p) return false;
		if (!this._splitParentAfterAndPutIn(s, line)) {
			this._appendAfterAndSelect(line, p);
		} else {
			let child = this._getFirstLeafInside(line);
			if (child) {
				child.setSelected();
				this._forceInsertionMode(INSERT_BEFORE, child);
			} else {
				line.setSelected();
				this._forceInsertionMode(INSERT_INSIDE, line);
			}
		}
	}

	moveLeftUpV2(s) {
		this.selectPreviousSibling()
			|| this._forceInsertionMode(INSERT_BEFORE, this.selected())
	}

	moveRightDownV2(s) {
		if (s.getInsertionMode() == INSERT_BEFORE) {
			this._forceInsertionMode(INSERT_AFTER, s);
		} else {
			this.selectNextSibling()
				||  this._forceInsertionMode(INSERT_AFTER, this.selected());
		}		
	}

	moveRightV3(s) {
		let isVert = s.getParent().getNex().isVertical();
		if (isVert) {
			this.selectParent();
		} else {
			if (s.getInsertionMode() == INSERT_BEFORE) {
				this._forceInsertionMode(INSERT_AFTER, s);
			} else {
				if (this.selectNextSibling()) {
					this._forceInsertionMode(INSERT_AFTER, this.selected());
				} else {
					this.selectParent();
				}
				
			}			
		}
	}

	moveLeftV3(s) {
		let isVert = s.getParent().getNex().isVertical();
		if (isVert) {
			this.selectParent();
		} else {
			if (!this.selectPreviousSibling()) {
				let mode = s.getInsertionMode();
				if (mode != INSERT_BEFORE) {
					this._forceInsertionMode(INSERT_BEFORE, this.selected())					
				} else {
					this.selectParent();
				}
			}
		}
	}

	moveDownV3(s) {
		let isVert = s.getParent().getNex().isVertical();
		if (!isVert) {
			this.selectParent();
		} else {
			if (s.getInsertionMode() == INSERT_BEFORE) {
				this._forceInsertionMode(INSERT_AFTER, s);
			} else {
				if (this.selectNextSibling()) {
					this._forceInsertionMode(INSERT_AFTER, this.selected());
				} else {
					this.selectParent();
				}
				
			}			
		}
	}

	moveUpV3(s) {
		let isVert = s.getParent().getNex().isVertical();
		if (!isVert) {
			this.selectParent();
		} else {
			if (!this.selectPreviousSibling()) {
				let mode = s.getInsertionMode();
				if (mode != INSERT_BEFORE) {
					this._forceInsertionMode(INSERT_BEFORE, this.selected())					
				} else {
					this.selectParent();
				}
			}
		}
	}

	forceInsertUpV3(s) {
		let isVert = s.getParent().getNex().isVertical();
		if (isVert) {
			this._forceInsertionMode(INSERT_BEFORE, this.selected());
		} else {
			this._forceInsertionMode(INSERT_AROUND, this.selected());
		}
	}

	forceInsertDownV3(s) {
		let isVert = s.getParent().getNex().isVertical();
		if (isVert) {
			this._forceInsertionMode(INSERT_AFTER, this.selected());
		} else {
			this._forceInsertionMode(INSERT_INSIDE, this.selected());
		}
	}

	forceInsertLeftV3(s) {
		let isVert = s.getParent().getNex().isVertical();
		if (isVert) {
			this._forceInsertionMode(INSERT_AROUND, this.selected());
		} else {
			this._forceInsertionMode(INSERT_BEFORE, this.selected());
		}
	}

	forceInsertRightV3(s) {
		let isVert = s.getParent().getNex().isVertical();
		if (isVert) {
			this._forceInsertionMode(INSERT_INSIDE, this.selected());
		} else {
			this._forceInsertionMode(INSERT_AFTER, this.selected());
		}
	}

	selectFirstChildOrMoveInsertionPoint(s) {
		if (!this.selectFirstChild()) {
			this._forceInsertionMode(INSERT_INSIDE, this.selected());
		} else {

			// when selecting first child, put insertion point before it
			// WILL BREAK ALL THE TESTS
			// so I need some kind of flag for old tests
			manipulator._forceInsertionMode(INSERT_BEFORE, this.selected())

			return true;
		};

	}

	defaultInsertForV2(insertInto, toInsert) {
		// ahem this only works if insertInto is selected
		switch(insertInto.getInsertionMode()) {
			case INSERT_AFTER:
				return this.insertAfterSelectedAndSelect(toInsert);
			case INSERT_BEFORE:
				return this.insertBeforeSelectedAndSelect(toInsert);
			case INSERT_INSIDE:
				return this.insertAsFirstChild(toInsert);
			case INSERT_AROUND:
				if (Utils.isNexContainer(toInsert)) {
					return this.wrapSelectedInAndSelect(toInsert);
				} else {
					return this.insertBeforeSelectedAndSelect(toInsert);
				}
		}
	}

	forceInsertBefore() {
			this._forceInsertionMode(INSERT_BEFORE, this.selected());		
	}

	forceInsertAfter() {
			this._forceInsertionMode(INSERT_AFTER, this.selected());		
	}

	forceInsertAround() {
			this._forceInsertionMode(INSERT_AROUND, this.selected());		
	}

	forceInsertInside() {
			this._forceInsertionMode(INSERT_INSIDE, this.selected());		
	}

	insertSeparatorBeforeOrAfterSelectedLetter(newSeparator) {
		let s = this.selected();
		if (s.getInsertionMode() == INSERT_AFTER) {
			let w = s.getParent();
			// we always put the separator after the word
			// we are currently in, but sometimes we split that
			// word.
			if (!this._isLastChildOf(s, w)) {
				let nw = this.newWord();
				this._splitParentAfterAndPutIn(s, nw)
			}
			this._appendAfterAndSelect(newSeparator, w);
		} else {
			let w = s.getParent();
			if (!this._isFirstChildOf(s, w)) {
				let nw = this.newWord();
				this._splitParentBeforeAndPutIn(s, nw)
				this._prependBeforeAndSelect(newSeparator, nw);
			} else {
				this._prependBeforeAndSelect(newSeparator, w);				
			}
		}
	}

	// doc elements get special insert methods I guess
	// I'm going to hold the line on keeping regexes out of this file
	insertLetterFromLineV2(newLetter, line) {
		if (line.getInsertionMode() == INSERT_INSIDE) {
			if (this._isEmpty(line) || !Utils.isWord(this._getFirstChildOf(line))) {
				let word = this.newWord();
				this._prependAsFirstChildOf(newLetter, word)
				this._prependAsFirstChildOf(word, line);
				newLetter.setSelected();
				return true;
			} else {
				let word = this._getFirstChildOf(line);
				this._prependAsFirstChildOf(newLetter, word);
				newLetter.setSelected();
				return true;
			}
		} else {
			return this.defaultInsertForV2(line, newLetter);
		}
	}

	insertSeparatorFromLineV2(newSeparator, line) {
		return this.defaultInsertForV2(line, newSeparator);
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

	selectCorrespondingLetterInPreviousLineV2(s) {
		let thisLine = Utils.isLine(s) ? s : this.getEnclosingLine(s);
		// Okay in the weird/wrong event that we have a word inside a doc that's not
		// inside a line, we just... do our best.
		if (!thisLine) {
			thisLine = Utils.isWord(s) ? s : this.getEnclosingWord(s);
		}
		if (!thisLine) {
			// ok shit we just have a letter by itself inside a doc. Cool we can keep going.
			thisLine = s;
		}
		let sib = this._getSiblingBefore(thisLine);
		if (!sib) return;
		if (!Utils.isLine(sib)) {
			sib.setSelected();
			return;
		}
		if (this._isEmptyLineInDoc(sib)) {
			sib.setSelected();
			this._forceInsertionMode(INSERT_INSIDE, sib);
			return;
		}
		if (this._isEmptyLineInDoc(s)) {
			let lf = this._getFirstLeafInside(sib);
			// we already know it has at least one child
			// or above would 
			lf.setSelected();
			this._forceInsertionMode(INSERT_AFTER, lf);
			return;
		}
		let putBefore = this._isInsertBefore(s);
		let targetX = s.getLeftX();
		// I think the dot is 5 px
		if (putBefore) targetX -= 5;
		let c = this._getFirstLeafInside(sib);
		while(c && c.getLeftX() <= targetX) {
			let d = this._getLeafAfterFromSameLine(c);
			if (c == d) throw new Error('not supposed to happen');
			if (!d) {
				break;
			} else {
				c = d;
			}
		}
		if (!c) {
			throw new Error('not supposed to happen');
		}
		c.setSelected();
		if (putBefore) {
			this._forceInsertionMode(INSERT_BEFORE, c);
		}
		return true;
	}

	selectCorrespondingLetterInNextLineV2(s) {
		let thisLine = Utils.isLine(s) ? s : this.getEnclosingLine(s);
		// Okay in the weird/wrong event that we have a word inside a doc that's not
		// inside a line, we just... do our best.
		if (!thisLine) {
			thisLine = Utils.isWord(s) ? s : this.getEnclosingWord(s);
		}
		if (!thisLine) {
			// ok shit we just have a letter by itself inside a doc. Cool we can keep going.
			thisLine = s;
		}
		let sib = this._getSiblingAfter(thisLine);
		if (!sib) return;
		if (!Utils.isLine(sib)) {
			sib.setSelected();
			return;
		}
		if (this._isEmptyLineInDoc(sib)) {
			sib.setSelected();
			this._forceInsertionMode(INSERT_INSIDE, sib);
			return;
		}
		if (this._isEmptyLineInDoc(s)) {
			let lf = this._getFirstLeafInside(sib);
			// we already know it has at least one child
			// or above would 
			lf.setSelected();
			this._forceInsertionMode(INSERT_AFTER, lf);
			return;
		}
		let putBefore = this._isInsertBefore(s);
		let targetX = s.getLeftX();
		// I think the dot is 5 px
		if (putBefore) targetX -= 5;
		let c = this._getFirstLeafInside(sib);
		// should really be < but this is for getting tests to pass
		while(c && c.getLeftX() <= targetX) {
			let d = this._getLeafAfterFromSameLine(c);
			if (c == d) throw new Error('not supposed to happen');
			if (!d) {
				break;
			} else {
				c = d;
			}
		}
		if (!c) {
			throw new Error('not supposed to happen');
		}
		c.setSelected();
		if (putBefore) {
			this._forceInsertionMode(INSERT_BEFORE, c);
		}
		return true;
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

	findNextSiblingThatSatisfies(f) {
		while (this.selectNextSibling()) {
			if (f(systemState.getGlobalSelectedNode())) {
				return true;
			}
		}
		return false;
	}

	getEnclosingLine(s) {
		while(s = s.getParent()) {
			if (Utils.isDoc(s)) {
				// we don't want to stray out of the immediate doc.
				return null;
			}
			if (Utils.isLine(s)) {
				return s;
			}
		}
		return null;
	}

	getEnclosingWord(s) {
		while (s = s.getParent()) {
			if (Utils.isDoc(s)) {
				// we don't want to stray out of the immediate doc.
				return null;
			}
			if (Utils.isWord(s)) {
				return s;
			}
		}
		return null;
	}

	getEnclosingDoc(s) {
		while (s = s.getParent()) {
			if (!s) return null;
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

	// ALL THE INSERTS SHOULD BE REPLACED BY THIS
	insertAtSelectedObjInsertionPoint(node) {
		let s = this.selected();
		switch(s.getInsertionMode()) {
			case INSERT_AFTER:
				return manipulator.insertAfterSelectedAndSelect(node);
			case INSERT_BEFORE:
				return manipulator.insertBeforeSelectedAndSelect(node);
			case INSERT_INSIDE:
				return manipulator.insertAsFirstChild(node);
			case INSERT_AROUND:
				if (node.getNex().isNexContainer()) {
					return manipulator.wrapSelectedInAndSelect(node);
				} else {
					return manipulator.insertBeforeSelectedAndSelect(node);
				}
		}
	}	

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

	wrapSelectedInAndSelect(wrapperNode) {
		let s = this.selected();
		let p = s.getParent();
		p.replaceChildWith(s, wrapperNode);
		wrapperNode.appendChild(s);
		wrapperNode.setSelected();
		return s;
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
		return r;
	}

	attemptToRemoveLastItemInCommand() {
		let p = (systemState.getGlobalSelectedNode()).getParent();
		if (!p) return false;
		if (p.numChildren() == 1 && Utils.isCodeContainer(p)) {
			if (!this.removeNex((systemState.getGlobalSelectedNode()))) return false;
			p.setSelected();
			this._forceInsertionMode(INSERT_INSIDE, p);
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


	copyTextToSystemClipboard(txt) {
		navigator.permissions.query({name: "clipboard-write"}).then(result => {
			if (result.state == "granted" || result.state == "prompt") {
				navigator.clipboard.writeText(txt);
			}
		});		
	}

	// used in keydispatcher.js
	doCut() {
		CLIPBOARD = systemState.getGlobalSelectedNode().getNex();
		if (!isRecordingTest()) {
			this.copyTextToSystemClipboard(CLIPBOARD.prettyPrint());
		}
		let x = systemState.getGlobalSelectedNode();
		this.selectPreviousSibling() || this.selectParent();		
		this.removeNex(x);
	}

	// used in keydispatcher.js
	doCopy() {
		try {
			CLIPBOARD = systemState.getGlobalSelectedNode().getNex().makeCopy();
			if (!isRecordingTest()) {
				this.copyTextToSystemClipboard(CLIPBOARD.prettyPrint());
			}
		} catch (e) {
			if (Utils.isFatalError(e)) {
				Utils.beep();
				this.insertBeforeSelectedAndSelect(e);				
			} else throw e;
		}
	}

	// used in keydispatcher.js
	doPaste() {
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
	}


	newDoc() {
		return new RenderNode(new Doc());
	}

	newWord() {
		return new RenderNode(new Word());
	}

	newLine() {
		return new RenderNode(new Line());
	}

	// public
	newLambda() {
		let r = new RenderNode(new Lambda());		
		r.possiblyStartMainEditor();
		return r;
	}

	newESymbol() {
		let r = new RenderNode(new ESymbol());
		r.possiblyStartMainEditor();
		return r;
	}

	// public
	newCommand() {
		let r = new RenderNode(new Command());		
		r.possiblyStartMainEditor();
		return r;
	}

	newBool() {
		let r = new RenderNode(new Bool());		
		r.possiblyStartMainEditor();
		return r;
	}

	newInteger() {
		let r = new RenderNode(new Integer());		
		r.possiblyStartMainEditor();
		return r;		
	}

	newEString() {
		let r = new RenderNode(new EString());
		r.possiblyStartMainEditor();
		return r;
	}

	newFloat() {
		let r = new RenderNode(new Float());
		r.possiblyStartMainEditor();
		return r;		
	}

	newNil() {
		let r = new RenderNode(new Nil());
		return r;		
	}

	newExpectation() {
		let r = new RenderNode(new Expectation());
		return r;		
	}

	newZlist() {
		let r = new RenderNode(new Zlist());
		return r;		
	}

	newOrg() {
		let r = new RenderNode(new Org());
		return r;
	}

	newSeparator(txt) {
		let r = new RenderNode(new Separator(txt));
		return r;
	}

	newLetter(txt) {
		let r = new RenderNode(new Letter(txt));
		return r;
	}
}

const manipulator = new Manipulator();

export { manipulator }

