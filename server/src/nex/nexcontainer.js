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



class NexContainer extends Nex {
	constructor() {
		super();
		this.vdir = false;
		this.children = [];
	}

	copyFieldsTo(n) {
		super.copyFieldsTo(n);
		for (let i = 0; i < this.children.length; i++) {
			n.appendChild(this.children[i].makeCopy());
		}
		n.vdir = this.vdir;
	}

	childrenToString() {
		let r = "";
		for (let i = 0; i < this.children.length; i++) {
			if (i > 0) {
				r += ' ';
			}
			r += this.children[i].toString();
		}
		return r;		
	}

	childrenDebugString() {
		let r = "";
		for (let i = 0; i < this.children.length; i++) {
			if (i > 0) {
				r += ' ';
			}
			r += this.children[i].debugString();
		}
		return r;				
	}

	setRenderType(newType) {
		super.setRenderType(newType);
		for (let i = 0; i < this.children.length; i++) {
			this.children[i].setRenderType(newType);
		}
	}

	toggleDir() {
		this.vdir = !this.vdir;
		if (!DEFER_DRAW) {
			this.render();
		}
	}

	render(parentDomNode, thisDomNode) {
		super.render(parentDomNode, thisDomNode);
		if (this.vdir) {
			this.domNode.classList.add('vdir');
		} else {
			this.domNode.classList.remove('vdir');
		}
		for (let i = 0; i < this.children.length; i++) {
			this.children[i].render(this.domNode);
		}
	}

	getContextType() {
		return ContextType.PASSTHROUGH;
	}

	hasChildren() {
		return this.children.length > 0;
	}

	getChildren() {
		return this.children;
	}

	numChildren() {
		return this.children.length;
	}

	getIndexOfChild(c) {
		for (let i = 0; i < this.children.length; i++) {
			if (this.children[i] == c) {
				return i;
			}
		}
		return -100;// I have reasons
	}

	getChildAt(i, useDefault) {
		i = (i < 0 && useDefault) ? 0 : i;
		i = (i >= this.children.length && useDefault) ? this.children.length - 1: i;
		if (i < 0 || i >= this.children.length) return null;
		return this.children[i];
	}

	removeChildAt(i) {
		if (i < 0 || i >= this.children.length) return null;
		let r = this.children[i];
		this.children.splice(i, 1);
		if (!DEFER_DRAW) {
			this.domNode.removeChild(r.domNode);
		}
		r.setParent(null);
		return r;
	}

	insertChildAt(c, i) {
		if (i < 0 || i > this.children.length) {
			return;
		}
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
		if (i == this.children.length) {
			this.children.push(c);
			if (!DEFER_DRAW) {
				this.domNode.appendChild(c.domNode);
			}
		} else {
			this.children.splice(i, 0, c);	
			if (!DEFER_DRAW) {
				this.domNode.insertBefore(c.domNode, this.children[i + 1].domNode);
			}
		}
		c.setParent(this);
		if (!DEFER_DRAW) {
			this.render();
			c.render();
			if (oldparent) {
				oldparent.render();
			}
		}
	}

	replaceChildAt(c, i) {
		if (c == this.children[i]) return;
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
		return this.getChildAt(this.children.length - 1);
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
		this.insertChildAt(c, this.children.length);
	}

	prependChild(c) {
		this.insertChildAt(c, 0);
	}

	doForEachChild(f) {
		for (let i = 0; i < this.children.length; i++) {
			f(this.children[i]);
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