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


// used with LINKEDLIST
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
		if (LINKEDLIST) {
			this.firstChildNex = null;
			this.numChildNexes = 0;
			this.lastChildNex = null;
		} else {
			this.children = [];
		}
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

	copyFieldsTo(n) {
		super.copyFieldsTo(n);
		n.vdir = this.vdir;
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
		if (LINKEDLIST) {
			// shallow is already only used for cdr/cons
			if (shallow) {
				return;
			} else {
				for (let p = this.firstChildNex; p != null; p = p.next) {
					n.appendChild(p.n.makeCopy());
				}
			}
		} else {
			for (let i = 0; i < this.children.length; i++) {
				if (shallow) {
					n.appendChild(this.children[i]);
				} else {
					n.appendChild(this.children[i].makeCopy());
				}
			}
		}
	}

	childrenToString() {
		let r = "";
		if (LINKEDLIST) {
			let i = 0;
			for (let p = this.firstChildNex; p != null; p = p.next) {
				if (++i > 0) {
					r += ' ';
				}
				r += p.n.toString();
			}
		} else {
			for (let i = 0; i < this.children.length; i++) {
				if (i > 0) {
					r += ' ';
				}
				r += this.children[i].toString();
			}
		}
		return r;		
	}

	childrenDebugString() {
		let r = "";
		if (LINKEDLIST) {
			let i = 0;
			for (let p = this.firstChildNex; p != null; p = p.next) {
				if (++i > 0) {
					r += ' ';
				}
				r += p.n.debugString();
			}
		} else {
			for (let i = 0; i < this.children.length; i++) {
				if (i > 0) {
					r += ' ';
				}
				r += this.children[i].debugString();
			}
		}
		return r;				
	}

	setRenderType(newType) {
		super.setRenderType(newType);
		if (LINKEDLIST) {
			for (let p = this.firstChildNex; p != null; p = p.next) {
				p.n.setRenderType(newType);
			}
		} else {
			for (let i = 0; i < this.children.length; i++) {
				this.children[i].setRenderType(newType);
			}
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

	rerender(renderFlags) {
		if (RENDERNODES) {
			throw new Error('not used with rendernodes');
		}
		if (!this.renderedDomNode) {
			return; // can't rerender if we haven't rendered yet.
		}
		if (renderFlags & RENDER_FLAG_SHALLOW) {
			this.savedChildDomNodes = [];
			if (LINKEDLIST) {
				for (let p = this.firstChildNex; p != null; p = p.next) {
					this.savedChildDomNodes.push(p.n.renderedDomNode);
				}
			} else {
				for (let i = 0; i < this.children.length; i++) {
					this.savedChildDomNodes.push(this.children[i].renderedDomNode);
				}
			}
			// note: this nex may create other dom nodes so we explicitly
			// only save the children and we still allow the superclass
			// to set innerHTML = ""
		}
		super.rerender(renderFlags);
	}

	renderInto(domNode, renderFlags) {
		let toPassToSuperclass = domNode;
		if (RENDERNODES) {
			// change param name
			domNode = domNode.getDomNode();
		}
		super.renderInto(toPassToSuperclass, renderFlags);
		if (this.vdir) {
			domNode.classList.add('vdir');
		} else {
			domNode.classList.remove('vdir');
		}
		if (RENDERNODES) {
			// nothing more to do, the rest has to do with children
			return;
		}
		if (!(renderFlags & RENDER_FLAG_EXPLODED)
				&& !this.renderChildrenIfNormal()) {
			return;
		}

		if (this.savedChildDomNodes) {
			// we are doing a shallow rerender
			for (let i = 0; i < this.savedChildDomNodes.length; i++) {
				domNode.appendChild(this.savedChildDomNodes[i]);
			}
			this.savedChildDomNodes = null;
		} else {
			// full rerender
			if (LINKEDLIST) {
				for (let p = this.firstChildNex; p != null; p = p.next) {
					let childDomNode = document.createElement("div");
					domNode.appendChild(childDomNode);
					p.n.renderInto(childDomNode, renderFlags);
				}
			} else {
				for (let i = 0; i < this.children.length; i++) {
					let childDomNode = document.createElement("div");
					domNode.appendChild(childDomNode);
					this.children[i].renderInto(childDomNode, renderFlags);
				}
			}
		}
	}

	renderChildrenIfNormal() {
		return true;
	}

	getContextType() {
		return ContextType.PASSTHROUGH;
	}

	hasChildren() {
		if (LINKEDLIST) {
			return this.firstChildNex != null;
		} else {
			return this.children.length > 0;
		}
	}

	getChildren() {
		if (LINKEDLIST) {
			// not called anyway
			throw new Error("not allowed with LINKEDLIST")
		} else {
			return this.children;
		}
	}

	numChildren() {
		if (LINKEDLIST) {
			return this.numChildNexes;
		} else {
			return this.children.length;
		}
	}

	getIndexOfChild(c) {
		if (LINKEDLIST) {
			let i = 0;
			for (let p = this.firstChildNex; p != null; p = p.next, i++) {
				if (p.n == c) {
					return i;
				}
			}
		} else {
			for (let i = 0; i < this.children.length; i++) {
				if (this.children[i] == c) {
					return i;
				}
			}
		}
		return -100;// I have reasons
	}

	getChildAt(i, useDefault) {
		if (LINKEDLIST) {
			i = (i < 0 && useDefault) ? 0 : i;
			i = (i >= this.numChildNexes && useDefault) ? this.numChildNexes - 1: i;
			if (i < 0 || i >= this.numChildNexes) return null;
			let ii = 0;
			let p = this.firstChildNex;
			while(ii++ != i) p = p.next;
			return p.n;
		} else {
			i = (i < 0 && useDefault) ? 0 : i;
			i = (i >= this.children.length && useDefault) ? this.children.length - 1: i;
			if (i < 0 || i >= this.children.length) return null;
			return this.children[i];
		}
	}

	// called by RenderNode
	removeChildAt(i) {
		if (LINKEDLIST) {
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
			if (!RENDERNODES) {
				r.setParent(null);
			}
			return r;
		} else {
			if (i < 0 || i >= this.children.length) return null;
			let r = this.children[i];
			this.children.splice(i, 1);
			if (!RENDERNODES) {
				r.setParent(null);
			}
			return r;
		}
	}

	insertChildAt(c, i) {
		if (i < 0 || i > (LINKEDLIST ? this.numChildNexes : this.children.length)) {
			return;
		}
		if (!RENDERNODES) {
			let oldparent = c.getParent();
			if (oldparent) {
				if (oldparent == this) {
					// ugh
					let oldi = oldparent.getIndexOfChild(c);
					if (oldi == i) {
						// no-op
						return;
					} else if (oldi < i) {
						// n0 old n2 n3 n4
						//           ^ins
						// remove:
						// n0 n2 n3 n4
						i--;
						oldparent.removeChild(c);
					} else {
						// n0 n1 n2 old n4
						//    ^ins
						// n0 n1 n2 n4
						// it's fine
						oldparent.removeChild(c);
					}
				} else {
					oldparent.removeChild(c);
				}
			}
		}
		if (LINKEDLIST) {
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
			this.numChildNexes++;
		} else {
			if (i == this.children.length) {
				this.children.push(c);
			} else {
				this.children.splice(i, 0, c);	
			}
		}
		if (!RENDERNODES) {
			c.setParent(this);
		}
		// if we have RENDERNODES we have to do a little fuckery for expectations,
		// but this should be okay because expectations are supposed to be temporary.
		if (RENDERNODES) {
			if (c instanceof Expectation) {
				c.addParent(this);
			}
		}
	}

	replaceChildAt(c, i) {
		if (LINKEDLIST) {
			if (i < 0 || i >= this.numChildNexes) return;
			let q = 0;
			let p = this.firstChildNex;
			while(q++ != i) p = p.next;
			if (p.n == c) return;
		} else {
			if (c == this.children[i]) return;
		}
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
		return this.getChildAt((LINKEDLIST ? this.numChildNexes : this.children.length) - 1);
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
		this.insertChildAt(c, (LINKEDLIST ? this.numChildNexes : this.children.length));
	}

	prependChild(c) {
		this.insertChildAt(c, 0);
	}

	doForEachChild(f) {
		if (LINKEDLIST) {
			for (let p = this.firstChildNex; p != null; p = p.next) {
				f(p.n);
			}

		} else {
			for (let i = 0; i < this.children.length; i++) {
				f(this.children[i]);
			}
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