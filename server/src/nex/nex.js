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

NEXT_NEX_ID = 0;

class Nex {
	constructor() {
		// unused in RENDERNODES
		this.parent = null;

		this.selected = false;
		if (!RENDERFLAGS) {
			this.renderType = current_render_type;
		}
		this.keyfunnel = null;
		this.currentStyle = "";
		this.enclosingClosure = null; // DO NOT COPY
		this.tags = [];
		this.id = NEXT_NEX_ID++;
	}

	getID() {
		return this.id;
	}

	getTypeName() {
		throw new Error('need a real type name!')
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

	// Not used in RENDERNODES
	getLeftX() {
		if (RENDERNODES) {
			throw new Error("unused with RENDERNODES");
		}
		if (this.renderedDomNode) {
			return this.renderedDomNode.getBoundingClientRect().left;
		} else return 0;
	}

	// Not used in RENDERNODES
	getRightX() {
		if (RENDERNODES) {
			throw new Error("unused with RENDERNODES");
		}
		if (this.renderedDomNode) {
			return this.renderedDomNode.getBoundingClientRect().right;
		} else {
			return 0;
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
		if (RENDERFLAGS) {
			throw new Error("setRenderType deprecated, using flags")
		}
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
		if (RENDERNODES) {
			throw new Error("Don't use in RENDERNODES");
		}
		let p = this.getParent();
		if (!p) return -1;
		for (let i = 0; i < p.children.length; i++) {
			if (p.children[i] == this) {
				return i;
			}
		}
	}

	_setClickHandler(domNode) {
		domNode.onclick = (e) => {
			let insertAfterRemove = false;
			let oldSelectedNex = selectedNex;
			if (selectedNex instanceof EString
					&& selectedNex.getMode() == MODE_EXPANDED) {
				selectedNex.finishInput();
			} else if (selectedNex instanceof InsertionPoint) {
				insertAfterRemove = true;
			}

			e.stopPropagation();
			this.setSelected(true /*shallow-rerender*/);
			if (insertAfterRemove && selectedNex != oldSelectedNex) {
				manipulator.removeNex(oldSelectedNex);
				topLevelRender();
			}
		};
	}

	_setRenderNodesClickHandler(renderNode) {
		renderNode.getDomNode().onclick = (e) => {
			let insertAfterRemove = false;
			let oldSelectedNode = selectedNode;
			if (selectedNode.getNex() instanceof EString
					&& selectedNode.getNex().getMode() == MODE_EXPANDED) {
				selectedNode.finishInput();
			} else if (selectedNode.getNex() instanceof InsertionPoint) {
				insertAfterRemove = true;
			}

			e.stopPropagation();
			renderNode.setSelected(true /*shallow-rerender*/);
			if (insertAfterRemove && selectedNode != oldSelectedNode) {
				manipulator.removeNode(oldSelectedNode);
				topLevelRender();
			}
		};
	}

	rerender(shallow) {
		if (RENDERNODES) {
			throw new Error('not used with rendernodes');
		}
		if (RENDERFLAGS) {
			var renderFlags = shallow;
			renderFlags |= RENDER_FLAG_RERENDER;
		}
		if (!this.renderedDomNode) {
			return; // can't rerender if we haven't rendered yet.
		}
		if (RENDERFLAGS) {
			if (!(renderFlags & RENDER_FLAG_SHALLOW)) {
				this.renderedDomNode.innerHTML = "";
			}
		} else {
			this.renderedDomNode.innerHTML = "";
		}
		while(this.renderedDomNode.classList.length > 0) {
			this.renderedDomNode.classList.remove(this.renderedDomNode.classList.item(0));
		}
		this.renderedDomNode.setAttribute("style", "");
		this.renderInto(this.renderedDomNode, shallow /* aka renderflags */);
	}

	renderInto(domNode, shallow) {
		let toPassToSuperclass = domNode;
		let renderNode = null;
		if (RENDERNODES) {
			// change param name
			renderNode = domNode;
			domNode = domNode.getDomNode();
		}
		if (RENDERFLAGS) {
			var renderFlags = shallow;
		}
		if (!RENDERFLAGS) {
			if (!shallow) {
				RENDERNODES
					? this._setRenderNodesClickHandler(renderNode)
					: this._setClickHandler(domNode);
			}
		} else {
			if (!(renderFlags & RENDER_FLAG_RERENDER)) {
				RENDERNODES
					? this._setRenderNodesClickHandler(renderNode)
					: this._setClickHandler(domNode);
			}
		}
		domNode.classList.add('nex');

		if (RENDERNODES) {
			if (renderFlags & RENDER_FLAG_SELECTED) {
				domNode.classList.add('selected');		
			}
		} else {
			if (this.selected) {
				domNode.classList.add('selected');		
			// } else {
			// 	domNode.classList.remove('selected');
			}
		}
		let isExploded = null;
		if (RENDERFLAGS) {
			isExploded = (renderFlags & RENDER_FLAG_EXPLODED);
		} else {
			isExploded = (this.renderType == NEX_RENDER_TYPE_EXPLODED);
		}
		if (isExploded) {
			domNode.classList.add('exploded');
		// } else {
		// 	domNode.classList.remove('exploded');
		}
		domNode.setAttribute("style", this.currentStyle);
		this.renderedDomNode = domNode; // save for later, like if we need to get x/y loc
	}

	renderTags(domNode, renderFlags) {
		if (RENDERFLAGS) {
			if (
				(renderFlags & RENDER_FLAG_SHALLOW)
				&& (renderFlags & RENDER_FLAG_RERENDER)) {
				return;
			}
		}
		let isExploded = null;
		if (RENDERFLAGS) {
			isExploded = (renderFlags & RENDER_FLAG_EXPLODED);
		} else {
			isExploded = (this.renderType == NEX_RENDER_TYPE_EXPLODED);
		}
		for (let i = 0; i < this.tags.length; i++) {
			this.tags[i].draw(domNode, isExploded);
		}		
	}


	// unused in RENDERNODES
	setParent(p) {
		if (RENDERNODES) {
			throw new Error("deprecated in RENDERNODES");
		}
		this.parent = p;
	}

	// not used in RENDERNODES
	getParent(evenIfRoot) {
		if (RENDERNODES) {
			throw new Error("deprecated in RENDERNODES");
		}
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

	setSelected(rerender) {
		if (RENDERNODES) {
			throw new Error("deprecated in RENDERNODES");
		}
		if (selectedNex == this) return;
		if (selectedNex) {
			selectedNex.setUnselected();
			if (rerender) {
				if (RENDERFLAGS) {
					selectedNex.rerender(current_default_render_flags | RENDER_FLAG_RERENDER | RENDER_FLAG_SHALLOW)
				} else {
					selectedNex.rerender(true /* shallow rerender, don't do children */);
				}
			}
		}
		selectedNex = this;
		this.selected = true;
		if (rerender) {
			if (RENDERFLAGS) {
				this.rerender(current_default_render_flags | RENDER_FLAG_RERENDER | RENDER_FLAG_SHALLOW)
			} else {
				this.rerender(true /* shallow rerender, don't do children */);
			}
		}
	}

	setUnselected() {
		if (RENDERNODES) {
			throw new Error("deprecated in RENDERNODES");
		}
		this.selected = false;
	}

	defaultHandle() {
		
	}

	getEventTable(context) {
		return null;
	}

	getEventOverride() {
		return null;
	}

}


