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

class RenderNode {
	constructor(forNex) {
		this.selected = false;
		this.nex = forNex;
		this.parentalfigure = null;
		this.childnodes = [];
		this.domNode = document.createElement("div");
		this.isCurrentlyExploded = false;
		this.explodedOverride = -1;
		this.firstToggleOnNexRender = false;
	}

	setRenderDepth(depth) {
		this.renderDepth = depth;
	}

	isExploded() {
		return this.isCurrentlyExploded;
	}

	createChildRenderNodes(nex) {
		if (!(nex instanceof NexContainer)) return;
		for (let i = 0; i < nex.numChildren(); i++) {
			let child = nex.getChildAt(i);
			let childRenderNode = new RenderNode(child);
			childRenderNode.setParent(this);
			this.domNode.appendChild(childRenderNode.domNode);
			this.childnodes.push(childRenderNode);
		}
	}

	getNex() {
		return this.nex;
	}

	getParent() {
		return this.parentalfigure;
	}

	setParent(p) {
		this.parentalfigure = p;
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

	unselect() {
		this.selected = false;
	}

	clearDomNode(renderFlags) {
		while(this.domNode.classList.length > 0) {
			this.domNode.classList.remove(this.domNode.classList.item(0));
		}
		this.domNode.setAttribute("style", "");
		if (!(renderFlags & RENDER_FLAG_SHALLOW)) {
			this.domNode.innerHTML = "";		
		}
	}

	toggleExplodedOverride() {
		// it's not really a toggle, it's more like
		// we tell it to toggle, then on the next
		// render it wakes up, figures out whether it's
		// a normal or exploded render, and then
		// does the opposite from then until it's reset.
		this.firstToggleOnNexRender = true;
	}

	applyExplodedOverride(renderFlags) {
		if (renderFlags & RENDER_FLAG_REMOVE_OVERRIDES) {
			this.firstToggleOnNexRender = false;
			this.explodedOverride = -1;
			return renderFlags;
		}
		if (this.firstToggleOnNexRender) {
			this.firstToggleOnNexRender = false;
			if (renderFlags & RENDER_FLAG_NORMAL) {
				this.explodedOverride = RENDER_FLAG_EXPLODED;
			} else if (renderFlags & RENDER_FLAG_EXPLODED) {
				this.explodedOverride = RENDER_FLAG_NORMAL;
			}
		}
		if (this.explodedOverride != -1) {
			renderFlags &= (~RENDER_FLAG_NORMAL);
			renderFlags &= (~RENDER_FLAG_EXPLODED);
			renderFlags |= this.explodedOverride;
		}
		return renderFlags;
	}

	renderDepthExceeded() {
		let domNode = this.getDomNode();
		domNode.innerHTML = '&#8253;&#8253;&#8253;';
		domNode.classList.add('render-depth-exceeded')
	}

	render(renderFlags) {
		renderFlags = this.applyExplodedOverride(renderFlags);
		this.clearDomNode(renderFlags);
		if (selectWhenYouFindIt && this.getNex().getID() == selectWhenYouFindIt.getID()) {
			this.setSelected(false);
			selectWhenYouFindIt = null;
		}
		let useFlags = this.selected
				? renderFlags | RENDER_FLAG_SELECTED
				: renderFlags;
		if (this.renderDepth > MAX_RENDER_DEPTH) {
			this.renderDepthExceeded();
			return;
		}
		this.nex.renderInto(this, useFlags);
		this.nex.doRenderSequencing(this);
		this.isCurrentlyExploded = !!(renderFlags & RENDER_FLAG_EXPLODED);

		if (!(renderFlags & RENDER_FLAG_EXPLODED)
				&& isNexContainer(this.nex)
				&& !this.nex.renderChildrenIfNormal()) {
			return;
		}
		if (this.getNex() instanceof NexContainer && !(renderFlags & RENDER_FLAG_SHALLOW)) {
			let i = 0;
			for (i = 0; i < this.childnodes.length; i++) {
				if (i >= this.getNex().numChildren()) {
					// oops, we lost children since the last time we rendered
					this.childnodes.splice(i, this.getNex().numChildren() - i);
					// example:
					// there were 5 nodes.
					// two were deleted, now there are just 3.
					// we render the first 3, so i=0, 1, then 2.
					// now i == 3, which == numChildren()
					// we want to splice out 2 nodes.
					// numChildren() = 5, 5 - 3 = 2
					// splice(i, numChildren() - i);
					break;
				}
				let childRenderNode = this.childnodes[i];
				if (childRenderNode.getNex().getID() != this.getNex().getChildAt(i).getID()) {
					// the child changed since the last time we rendered!!!
					// need to fix.
					this.childnodes[i] = childRenderNode = new RenderNode(this.getNex().getChildAt(i));
					this.childnodes[i].setParent(this);
				}
				childRenderNode.setRenderDepth(this.renderDepth + 1);
				// need to append child before drawing so things like focus() work right
				this.domNode.appendChild(childRenderNode.getDomNode());
				childRenderNode.render(renderFlags);

			}
			if (i < (this.getNex().numChildren())) {
				// oops, more nodes added since the last time we rendered.
				for ( ; i < this.getNex().numChildren(); i++) {
					let newNode = new RenderNode(this.getNex().getChildAt(i));
					newNode.setParent(this);
					newNode.setRenderDepth(this.renderDepth + 1);
					this.childnodes[i] = newNode;
					this.domNode.appendChild(newNode.getDomNode());
					newNode.render(renderFlags);
				}
			}

		}
		this.nex.renderTags(this.domNode, renderFlags);
	}

	setSelected(rerender) {
		if (selectedNode == this) return;
		if (selectedNode) {
			selectedNode.setUnselected();
			if (rerender) {
				eventQueue.renderNodeRender(selectedNode, RENDER_FLAG_RERENDER | RENDER_FLAG_SHALLOW | current_default_render_flags);
			}
		}
		selectedNode = this;
		this.selected = true;
		if (rerender) {
			eventQueue.renderNodeRender(this, RENDER_FLAG_RERENDER | RENDER_FLAG_SHALLOW | current_default_render_flags);
		}
	}

	setUnselected() {
		this.selected = false;
	}

	getLeftX() {
		if (this.domNode) {
			return this.domNode.getBoundingClientRect().left;
		} else return 0;
	}

	getRightX() {
		if (this.domNode) {
			return this.domNode.getBoundingClientRect().right;
		} else {
			return 0;
		}
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