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

// RENDERNODES ONLY
class RenderNode {
	constructor(forNex) {
		this.selected = false;
		this.nex = forNex;
		this.parent = null;
		this.childnodes = [];
		this.domNode = document.createElement("div");
	}

	getNex() {
		return this.nex;
	}

	getParent() {
		return this.parent;
	}

	setParent(p) {
		this.parent = p;
	}

	hasChildren() {
		return this.childnodes.length > 0;
	}

	numChildren() {
		return this.childnodes.length;
	}

	getRenderNodeFor(nex) {
		return new RenderNode(nex);
	}

	// appendChild(nex) {
	// 	let renderNode = new RenderNode(nex);
	// 	this.childnodes.push(renderNode);
	// 	this.nex.appendChild(nex);
	// 	this.domNode.appendChild(renderNode.getDomNode())
	// 	renderNode.parent = this;
	// 	return renderNode;
	// }

	appendDecorationDomNode(node) {
		this.domNode.appendChild(node);
	}

	getDomNode() {
		return this.domNode;
	}

	setDomNode(domNode) {
		// only used for the root
		this.domNode = domNode;
	}

	isSelected() {
		return this.selected;
	}

	setSelected() {
		this.selected = true;
	}

	unselect() {
		this.selected = false;
	}

	clearDomNode() {
		while(this.domNode.classList.length > 0) {
			this.domNode.classList.remove(this.domNode.classList.item(0));
		}
		this.domNode.setAttribute("style", "");
		this.domNode.innerHTML = "";		
	}

	render(renderFlags) {
		// test for shallow and rerender
		this.clearDomNode();
		let useFlags = this.selected
				? renderFlags | RENDER_FLAG_SELECTED
				: renderFlags;
		this.nex.renderInto(this, useFlags);
		for (let i = 0; i < this.childnodes.length; i++) {
			let childRenderNode = this.childnodes[i];
			childRenderNode.render(renderFlags);
			this.domNode.appendChild(childRenderNode.getDomNode());

		}
		this.nex.renderTags(this.domNode, renderFlags);
	}

	setSelected(rerender) {
		if (selectedNode == this) return;
		if (selectedNode) {
			selectedNode.setUnselected();
			if (rerender) {
				selectedNode.render(RENDER_FLAG_RERENDER | RENDER_FLAG_SHALLOW)
			}
		}
		selectedNode = this;
		this.selected = true;
		if (rerender) {
			this.render(RENDER_FLAG_RERENDER | RENDER_FLAG_SHALLOW | RENDER_FLAG_SELECTED)
		}
	}

	setUnselected() {
		this.selected = false;
	}

    ////////////////////////////////////////
    ////////////////////////////////////////
    ////////////////////////////////////////
    ////////////////////////////////////////

    // most of these copied from nexcontainer
	getIndexOfChild(c) {
		for (let i = 0; i < this.childnodes.length; i++) {
			if (this.childnodes[i] == c) {
				return i;
			}
		}
		return -100;// I have reasons
	}

	getChildAt(i, useDefault) {
		i = (i < 0 && useDefault) ? 0 : i;
		i = (i >= this.childnodes.length && useDefault) ? this.childnodes.length - 1: i;
		if (i < 0 || i >= this.childnodes.length) return null;
		return this.childnodes[i];
	}

	removeChildAt(i) {
		if (i < 0 || i >= this.childnodes.length) return null;
		let r = this.childnodes[i];
		this.childnodes.splice(i, 1);
		this.getNex().removeChildAt(i);
		this.getDomNode().removeChild(r.getDomNode());
		r.setParent(null);
		return r;
	}

	insertChildAt(c, i) {
		if (i < 0 || i > this.childnodes.length) {
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
		if (i == this.childnodes.length) {
			this.childnodes.push(c);
			this.getNex().appendChild(c.getNex());
			this.domNode.appendChild(c.getDomNode());
		} else {
			this.childnodes.splice(i, 0, c);
			this.getNex().insertChildAt(c.getNex(), i);
			this.getDomNode().insertBefore(c.getDomNode(), this.childnodes[i + 1].getDomNode());
		}
		c.setParent(this);
	}

	replaceChildAt(c, i) {
		if (c == this.childnodes[i]) return;
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
		return this.getChildAt(this.childnodes.length - 1);
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

	doForEachChild(f) {
		for (let i = 0; i < this.childnodes.length; i++) {
			f(this.childnodes[i]);
		}
	}

	appendChild(c) {
		if (c instanceof Nex) {
			c = this.getRenderNodeFor(c);
		}
		this.insertChildAt(c, this.childnodes.length);
		return c;
	}

	prependChild(c) {
		if (c instanceof Nex) {
			c = this.getRenderNodeFor(c);
		}
		this.insertChildAt(c, 0);
		return c;
	}

	insertChildAfter(c, sib) {
		if (c instanceof Nex) {
			c = this.getRenderNodeFor(c);
		}
		this.insertChildAt(c, this.getIndexOfChild(sib) + 1);
		return c;
	}

	insertChildBefore(c, sib) {
		if (c instanceof Nex) {
			c = this.getRenderNodeFor(c);
		}
		this.insertChildAt(c, this.getIndexOfChild(sib));
		return c;
	}

	replaceChildWith(child, newchild) {
		if (newchild instanceof Nex) {
			newchild = this.getRenderNodeFor(newchild);
		}
		this.replaceChildAt(newchild, this.getIndexOfChild(child));
		return newchild;
	}    
}