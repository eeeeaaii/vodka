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

	rerender(renderFlags) {
		this.nex.rerenderIntoNode(this, renderFlags);
	}

	render(renderFlags) {
		this.nex.renderIntoNode(this, renderFlags);
	}

	setSelected(rerender) {
		if (selectedNode == this) return;
		if (selectedNode) {
			selectedNode.setUnselected();
			if (rerender) {
				selectedNode.rerender(RENDER_FLAG_RERENDER | RENDER_FLAG_SHALLOW)
			}
		}
		selectedNode = this;
		this.selected = true;
		if (rerender) {
			this.rerender(RENDER_FLAG_RERENDER | RENDER_FLAG_SHALLOW | RENDER_FLAG_SELECTED)
		}
	}

	setUnselected() {
		this.selected = false;
	}
	
}