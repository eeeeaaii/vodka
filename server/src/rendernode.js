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

	appendChild(nex) {
		let renderNode = new RenderNode(nex);
		this.childnodes.push(renderNode);
		this.nex.appendChild(nex);
		this.domNode.appendChild(renderNode.getDomNode())
		renderNode.parent = this;
		return renderNode;
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
		// if (this.nex instanceof NexContainer) {
		// 	for (let i = 0; i < this.nex.numChildren(); i++) {
		// 		let nexChild = this.nex.getChildAt(i);
		// 		let childRenderNode = new RenderNode(nexChild);
		// 		childRenderNode.render(renderFlags);
		// 		this.domNode.appendChild(childRenderNode.getDomNode());
		// 		this.childnodes.push(childRenderNode);
		// 	}
		// }
		this.nex.renderTags(this.domNode, renderFlags);
//		this.nex.renderIntoNode(this, renderFlags);
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
	
}