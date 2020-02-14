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

class Nex {
	constructor() {
		// unused in MULTIRENDER
		this.parent = null;

		this.selected = false;
		this.renderType = current_render_type;
		this.keyfunnel = null;
		this.currentStyle = "";
		this.enclosingClosure = null; // DO NOT COPY
		this.tags = [];
		if (MULTIRENDER) {
			this.activeNodes = [];
		}
	}

	// only used in MULTIRENDER
	requestNode() {
		let newNode = document.createElement("div");
		newNode.nex = this;
		this.activeNodes.push(newNode);
		return newNode;
	}

	getEventTable(context) {
		return null;
	}

	// Used in step execution to set the environment/closure of an expression
	// this is done when the enclosing statement is evaluated but before
	// the child statement is evaluated. The reason is that if we want to jump
	// in and normal-execute this rather than step-execute it, we need to have
	// a reference to the correct environment.
	setEnclosingClosure(closure) {
		this.enclosingClosure = closure;
	}

	copyFieldsTo(nex) {
		nex.currentStyle = this.currentStyle;
		for (let i = 0; i < this.tags.length; i++) {
			nex.tags[i] = this.tags[i].copy();
		}
	}

	needsEvaluation() {
		return false;
	}

	addTag(tag) {
		if (this.hasTag(tag)) return;
		this.tags.push(tag);
	}

	hasTag(tag) {
		for (let i = 0; i < this.tags.length; i++) {
			if (this.tags[i].equals(tag)) return true;
		}
		return false;
	}

	removeTag(tag) {
		for (let i = 0; i < this.tags.length; i++) {
			if (this.tags[i].equals(tag)) {
				this.tags.splice(i, 1);
			}
		}
	}

	evaluate(env) {
		return this;
	}

	pushNexPhase(phaseExecutor, env) {
		// no op
	}

	stepEvaluate(env) {
		return this;
	}

	makeCopy() {
		throw new Error("unimplemented copy");
	}

	exportToString() {
		throw new Error("unimplemented export to string");
	}

	getLeftX() {
		if (MULTIRENDER) {
			if (this.activeNodes[0]) {
				// not lovely, kinda broken, should work a different way?
				return this.activeNodes[0].getBoundingClientRect().left;
			} else {
				return 0;
			}
		} else {
			if (this.renderedDomNode) {
				return this.renderedDomNode.getBoundingClientRect().left;
			} else return 0;
		}
	}

	getRightX() {
		if (MULTIRENDER) {
			if (this.activeNodes[0]) {
				// not lovely, kinda broken, should work a different way?
				return this.activeNodes[0].getBoundingClientRect().right;
			} else {
				return 0;
			}
		} else {
			if (this.renderedDomNode) {
				return this.renderedDomNode.getBoundingClientRect().right;
			}
		}
	}

	setCurrentStyle(s) {
		this.currentStyle = s;
	}

	getCurrentStyle() {
		return this.currentStyle;
	}

	toString() {}

	debugString() {
		return this.toString();
	}

	setRenderType(newType) {
		this.renderType = newType;
	}

	getInputFunnel() {
		if (!this.keyfunnel) {
			this.keyfunnel = this.getKeyFunnel();
		}
		return this.keyfunnel;
	}

	getKeyFunnel() {}

	getPositionInParent() {
		let p = this.getParent();
		if (!p) return -1;
		for (let i = 0; i < p.children.length; i++) {
			if (p.children[i] == this) {
				return i;
			}
		}
	}

	// MULTIRENDER ONLY
	doNodeRerender(node, renderFlags) {
		if (renderFlags & RENDER_FLAG_RERENDER) {
			if (!(renderFlags & RENDER_FLAG_SHALLOW)) {
				node.innerHTML = "";
			}
			while(node.classList.length > 0) {
				node.classList.remove(node.classList.item(0));
			}
			node.setAttribute("style", "");
		}
		this.renderInto(node, renderFlags);
	}

	// arg only used in MULTIRENDER
	rerender(renderFlags) {
		if (MULTIRENDER) {
			for (let i = 0; i < this.activeNodes.length; i++) {
				let node = this.activeNodes[i];
				this.doNodeRerender(node, renderFlags | RENDER_FLAG_RERENDER);
			}
		} else {
			if (!this.renderedDomNode) {
				return; // can't rerender if we haven't rendered yet.
			}
			this.renderedDomNode.innerHTML = "";
			while(this.renderedDomNode.classList.length > 0) {
				this.renderedDomNode.classList.remove(this.renderedDomNode.classList.item(0));
			}
			this.renderedDomNode.setAttribute("style", "");
			this.renderInto(this.renderedDomNode);
		}
	}

	renderInto(domNode, renderFlags) {
		if (!(renderFlags & RENDER_FLAG_RERENDER)) {
			domNode.onclick = (e) => {
				if (selectedNex instanceof EString
						&& selectedNex.getMode() == MODE_EXPANDED) {
					selectedNex.finishInput();
				}
				e.stopPropagation();
				this.setSelected(true /*shallow-rerender*/);
			}
		}
		domNode.classList.add('nex');

		if (this.selected) {
			domNode.classList.add('selected');		
		// } else {
		// 	domNode.classList.remove('selected');
		}
		let isExploded = (this.renderType == NEX_RENDER_TYPE_EXPLODED);
		if (isExploded) {
			domNode.classList.add('exploded');
		// } else {
		// 	domNode.classList.remove('exploded');
		}
		domNode.setAttribute("style", this.currentStyle);
		if (this.MULTIRENDER) {
			// no op b/c it was already allocated and stored
		} else {
			this.renderedDomNode = domNode; // save for later, like if we need to get x/y loc
		}
	}

	renderTags(domNode, renderFlags) {
		if (
			(renderFlags & RENDER_FLAG_SHALLOW)
			&& (renderFlags & RENDER_FLAG_RERENDER)) {
			return;
		}

//}
//		if (!domNode) {
//			throw new "wtf";
//			domNode = this.domNode;
//		}
		let isExploded = (this.renderType == NEX_RENDER_TYPE_EXPLODED);
		for (let i = 0; i < this.tags.length; i++) {
			this.tags[i].draw(domNode, isExploded);
		}		
	}

	// unused in MULTIRENDER
	setParent(p) {
		this.parent = p;
	}

	// unused in MULTIRENDER
	getParent(evenIfRoot) {
		let p = this.parent;
		if (p instanceof Root && !evenIfRoot) {
			return null;
		}
		return this.parent;
	}

	isLeaf() {
		return true;
	}

	isSelected() {
		return this.selected;
	}

	setSelectedMultirender(domNode) {

	}

	setSelected(rerender) {
		if (selectedNex == this) return;
		if (selectedNex) {
			selectedNex.setUnselected();
			if (rerender) {
				if (MULTIRENDER) {
					selectedNex.rerender(RENDER_FLAG_RERENDER | RENDER_FLAG_SHALLOW)
				} else {
					selectedNex.rerender(true /* shallow rerender, don't do children */);
				}
			}
		}
		selectedNex = this;
		this.selected = true;
		if (rerender) {
			if (MULTIRENDER) {
				this.rerender(RENDER_FLAG_RERENDER | RENDER_FLAG_SHALLOW)
			} else {
				this.rerender(true /* shallow rerender, don't do children */);
			}
		}
	}

	setUnselected() {
		this.selected = false;
	}
	getEventTable(context) {
		return null;
	}
	// TODO: move tables from these unused functions into getEventTable
}


