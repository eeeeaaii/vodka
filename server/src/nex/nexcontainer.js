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

import { Nex } from './nex.js';
import { ContextType } from '../contexttype.js'

class ChildNex {
	// lol
	constructor(n) {
		this.n = n;
		this.next = null;
	}
}

class Iterator {
	constructor(childNex) {
		this.current = childNex;		
	}

	hasMore() {
		return !!this.current;
	}

	next() {
		this.current = this.current.next;
	}

	get() {
		return this.current.n;
	}
}

class NexContainer extends Nex {
	constructor() {
		super();
		this.vdir = false;
		this.firstChildNex = null;
		this.numChildNexes = 0;
		this.lastChildNex = null;
	}

	getChildTagged(tag) {
		for (let i = 0; i < this.numChildren(); i++) {
			let c = this.getChildAt(i);
			if (c.hasTag(tag)) {
				return c;
			}
		}
		return null;
	}

	getChildrenForStepEval() {
		if (!isStepEvaluating) {
			throw new Error("Cannot use unless step evaluating");
		}
		let r = [];
		this.doForEachChild(function(c) {
			r.push(c);
		});
		return r;
	}

	iterator() {
		return new Iterator(this.firstChildNex);
	}

	isNexContainer() {
		return true;
	}

	copyFieldsTo(n) {
		super.copyFieldsTo(n);
		n.vdir = this.vdir;
	}

	evaluate() {
		return this;
	}

	// let the caller instantiate the new container
	// because we don't know what type it is.
	// all this does is set the child pointers
	setChildrenForCons(nex, newContainer) {
		let newP = new ChildNex(nex);
		newP.next = this.firstChildNex;
		newContainer.firstChildNex = newP;
		if (this.lastChildNex == null) {
			newContainer.lastChildNex = newP;
		} else {
			newContainer.lastChildNex = this.lastChildNex;
		}
		newContainer.numChildNexes = this.numChildNexes + 1;
		// because of reference counting we still have to iterate over the children
		// and tell them that we've added a new reference to them.
		// 'nex' and all the children of this object are now going to
		// be referenced by 'newContainer' in addition to being referenced
		// by this object.
		nex.addReference();
		for (let p = this.firstChildNex; p; p = p.next) {
			p.n.addReference();
		}
	}

	getChildrenForCdr(newContainer) {
		if (this.firstChildNex == null) {
			throw new Error('check for empty list outside of here');
		}
		newContainer.firstChildNex = this.firstChildNex.next;
		newContainer.numChildNexes = this.numChildNexes - 1;
		newContainer.lastChildNex = this.lastChildNex;
	}

	copyChildrenTo(n, shallow) {
		// shallow copy is impt so you can copy a list with the style etc.
		// used by map, reduce, filter builtins.
		if (shallow) {
			return;
		} else {
			for (let p = this.firstChildNex; p != null; p = p.next) {
				n.appendChild(p.n.makeCopy());
			}
		}
	}

	listStartV2() {
		return '(' + (this.vdir ? '|' : '_');
	}

	listEndV2() {
		return (this.vdir ? '|' : '_') + ')';
	}

	standardListPrettyPrint(lvl, designator) {
		// designator is like ~, or [doc], or whatever tells you the list type
		let fline = `${this.doTabs(lvl)}${designator}${this.toStringV2PrivateDataSection()}${this.listStartV2()}${this.toStringV2TagList()}\n`;
		let contents = this.prettyPrintChildren(lvl + 1);
		let lline = `${this.doTabs(lvl)}${this.listEndV2()}\n`
		return fline + contents + lline;
	}

	prettyPrintChildren(lvl) {
		let r = '';
		for (let p = this.firstChildNex; p != null; p = p.next) {
			r += p.n.prettyPrintInternal(lvl);
		}
		return r;		
	}

	childrenToStringV2() {
		let r = '';
		for (let p = this.firstChildNex; p != null; p = p.next) {
			if (r != '') {
				r += ' ';
			}
			r += p.n.toString('v2');
		}
		return r;		
	}

	childrenToString(version) {
		if (version == 'v2') {
			return this.childrenToStringV2();
		}
		let r = "";
		let i = 0;
		for (let p = this.firstChildNex; p != null; p = p.next) {
			if (++i > 0) {
				r += ' ';
			}
			r += p.n.toString();
		}
		return r;		
	}

	childrenDebugString() {
		let r = "";
		let i = 0;
		for (let p = this.firstChildNex; p != null; p = p.next) {
			if (++i > 0) {
				r += ' ';
			}
			r += p.n.debugString();
		}
		return r;				
	}

	setRenderType(newType) {
		super.setRenderType(newType);
		for (let p = this.firstChildNex; p != null; p = p.next) {
			p.n.setRenderType(newType);
		}
	}

	toggleDir() {
		this.vdir = !this.vdir;
	}

	setVertical() {
		this.vdir = true;
	}

	setHorizontal() {
		this.vdir = false;
	}

	isVertical() {
		return this.vdir;
	}

	isHorizontal() {
		return !this.vdir;
	}

	renderInto(renderNode, renderFlags) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags);
		if (this.vdir) {
			domNode.classList.add('vdir');
		} else {
			domNode.classList.remove('vdir');
		}
	}

	renderChildrenIfNormal() {
		return true;
	}

	getContextType() {
		return ContextType.PASSTHROUGH;
	}

	hasChildren() {
		return this.firstChildNex != null;
	}

	numChildren() {
		return this.numChildNexes;
	}

	getIndexOfChild(c) {
		let i = 0;
		for (let p = this.firstChildNex; p != null; p = p.next, i++) {
			if (p.n == c) {
				return i;
			}
		}
		return -100;// I have reasons
	}

	getChildAt(i, useDefault) {
		i = (i < 0 && useDefault) ? 0 : i;
		i = (i >= this.numChildNexes && useDefault) ? this.numChildNexes - 1: i;
		if (i < 0 || i >= this.numChildNexes) return null;
		let ii = 0;
		let p = this.firstChildNex;
		while(ii++ != i) p = p.next;
		return p.n;
	}

	// called by RenderNode
	removeChildAt(i) {
		if (i < 0 || i >= this.numChildNexes) return null;
		let r = null;
		if (i == 0) {
			if (this.lastChildNex == this.firstChildNex) {
				this.lastChildNex = null;
			}
			r = this.firstChildNex.n;
			this.firstChildNex = this.firstChildNex.next;
		} else {
			let q = 0;
			// predecessor
			let pred = this.firstChildNex;
			while(q++ != (i-1)) pred = pred.next;
			let p = pred.next;
			r = p.n;
			pred.next = p.next;
			if (p.next == null) {
				this.lastChildNex = pred;
			}
		}
		this.numChildNexes--;
		r.removeReference();
		return r;
	}

	insertChildAt(c, i) {
		if (i < 0 || i > this.numChildNexes) {
			return;
		}
		let newP = new ChildNex(c);
		if (i == 0) {
			if (this.lastChildNex == null) {
				this.lastChildNex = newP;
			}
			newP.next = this.firstChildNex;
			this.firstChildNex = newP;
		} else {
			let q = 0;
			let pred = this.firstChildNex;
			while(q++ != (i-1)) pred = pred.next;
			if (pred == this.lastChildNex) {
				this.lastChildNex = newP;
			}
			newP.next = pred.next;
			pred.next = newP;
		}
		c.addReference();
		this.numChildNexes++;
	}

	replaceChildAt(c, i) {
		if (i < 0 || i >= this.numChildNexes) return;
		let q = 0;
		let p = this.firstChildNex;
		while(q++ != i) p = p.next;
		if (p.n == c) return;
		this.removeChildAt(i);
		this.insertChildAt(c, i);
	}

	replaceChildWith(c, c2) {
		if (c == c2) return;
		let ind = this.getIndexOfChild(c);
		this.replaceChildAt(c2, ind);
	}

	getChildAfter(c) {
		let index = this.getIndexOfChild(c);
		return this.getChildAt(index + 1);
	}
	
	getChildBefore(c) {
		let index = this.getIndexOfChild(c);
		return this.getChildAt(index - 1);
	}

	getLastChild() {
		return this.getChildAt(this.numChildNexes - 1);
	}

	getFirstChild() {
		return this.getChildAt(0);
	}

	removeFirstChild() {
		return this.removeChildAt(0);
	}

	removeChild(c) {
		return this.removeChildAt(this.getIndexOfChild(c));
	}

	// delete this, it's the same as the other method
	getPreviousSibling(c) {
		return this.getChildBefore(c);
	}

	// delete this, it's the same as the other method
	getNextSibling(c) {
		return this.getChildAfter(c);
	}

	appendChild(c) {
		this.insertChildAt(c, this.numChildNexes);
	}

	prependChild(c) {
		this.insertChildAt(c, 0);
	}

	doForEachChild(f) {
		for (let p = this.firstChildNex; p != null; p = p.next) {
			f(p.n);
		}
	}

	insertChildAfter(c, sib) {
		this.insertChildAt(c, this.getIndexOfChild(sib) + 1)
	}

	insertChildBefore(c, sib) {
		this.insertChildAt(c, this.getIndexOfChild(sib))
	}

	replaceChildWith(child, newchild) {
		this.replaceChildAt(newchild, this.getIndexOfChild(child));
	}
}

export { NexContainer }

