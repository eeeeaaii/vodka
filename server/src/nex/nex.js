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
		this.lastRenderPassNumber = null;
		this.firstRenderNode = null;
		this.rendernodes = [];

		this.selected = false;
		this.keyfunnel = null;
		this.currentStyle = "";
		this.enclosingClosure = null; // DO NOT COPY
		this.tags = [];
		this.id = NEXT_NEX_ID++;
		this.boundName = "";
	}

	getTypeName() {
		throw new Error("only leaf types have names");
	}

	setBoundName(str) {
		// I mean it's not perfect, it will get overwritten each time, but...
		this.boundName = str;
	}

	doRenderSequencing(renderNode) {
		if (appFlags['otags'] || this.lastRenderPassNumber == renderPassNumber) {
			// this node has been rendered before in this pass!
			// if this is the first dupe, we go back to the first one
			// and prepend the object tag.
			if (appFlags['otags'] || this.rendernodes.length == 1) {
				this.prependObjectTag(this.rendernodes[0]);
			}
			this.rendernodes.push(renderNode);
			this.prependObjectTag(renderNode);
		} else {
			this.rendernodes = [ renderNode ];
			this.lastRenderPassNumber = renderPassNumber;
			// for now we assume there will be only one render,
			// do not prepend.
		}
	}

	renderOnlyThisNex(selectThisNode) {
		for (let i = 0; i < this.rendernodes.length; i++) {
			if (PRIORITYQUEUE) {
				let flags = current_default_render_flags;
				flags &= (~RENDER_FLAG_NORMAL);
				flags &= (~RENDER_FLAG_EXPLODED);

				if (selectThisNode) {
					eventQueue.enqueueRenderNodeRenderSelecting(
							this.rendernodes[i],
							flags
							| (this.rendernodes[i].isExploded() ? RENDER_FLAG_EXPLODED : RENDER_FLAG_NORMAL)
							,
							selectThisNode);
				} else {
					eventQueue.enqueueRenderNodeRender(
							this.rendernodes[i],
							flags
							| (this.rendernodes[i].isExploded() ? RENDER_FLAG_EXPLODED : RENDER_FLAG_NORMAL)
							);
				}
			} else {
				nodeLevelRender(this.rendernodes[i]);
			}
		}
	}

	getRenderNodes() {
		return this.rendernodes;
	}

	prependObjectTag(renderNode) {
		if (!renderNode) return;
		let domNode = renderNode.getDomNode();
		if (!domNode) return;
		let firstChild = domNode.firstChild;
		let tagNode = document.createElement("div");
		tagNode.innerHTML = 'o'+this.getID();
		tagNode.classList.add('objecttag');
		domNode.classList.add('duplicatednex');
		if (firstChild) {
			domNode.insertBefore(tagNode, firstChild);
		} else {
			domNode.appendChild(tagNode);
		}
	}

	getNumRendersThisPass() {
		return numRendersThisPass;
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

	doStep() {
	}

	makeCopy() {
		throw new Error("unimplemented copy");
	}

	exportToString() {
		throw new Error("unimplemented export to string");
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

	getInputFunnel() {
		if (!this.keyfunnel) {
			this.keyfunnel = this.getKeyFunnel();
		}
		return this.keyfunnel;
	}

	getKeyFunnel() {}

	// can return null if user clicks on some other thing
	getParentNexOfDomElement(elt) {
		while(elt && !elt.classList.contains('nex')) {
			elt = elt.parentNode;
		}
		return elt;
	}

	_setClickHandler(renderNode) {
		renderNode.getDomNode().onmousedown = (event) => {
			console.log('a');
			PRIORITYQUEUE
					? eventQueue.enqueueDoClickHandlerAction(this, renderNode, event)
					: this.doClickHandlerAction(renderNode);
			event.stopPropagation();
		};
	}

	doClickHandlerAction(renderNode, e) {
		let parentNexDomElt = this.getParentNexOfDomElement(e.target);
		if (selectedNode.getDomNode() == parentNexDomElt) {
			return;
		}
		let insertAfterRemove = false;
		let oldSelectedNode = selectedNode;
		if ((selectedNode.getNex() instanceof EString
			|| selectedNode.getNex() instanceof EError)
				&& selectedNode.getNex().getMode() == MODE_EXPANDED) {
			selectedNode.getNex().finishInput();
		} else if (selectedNode.getNex() instanceof InsertionPoint) {
			insertAfterRemove = true;
		}

		e.stopPropagation();
		renderNode.setSelected(false /*shallow-rerender*/);
		if (insertAfterRemove && selectedNode != oldSelectedNode) {
			manipulator.removeNex(oldSelectedNode);
		}
		PRIORITYQUEUE ? eventQueue.enqueueImportantTopLevelRender() : topLevelRender();
	}

	renderInto(renderNode, renderFlags) {
		let domNode = renderNode.getDomNode();
		if (!(renderFlags & RENDER_FLAG_RERENDER)) {
			this._setClickHandler(renderNode);
		}
		domNode.classList.add('nex');

		if (renderFlags & RENDER_FLAG_SELECTED) {
			domNode.classList.add('selected');		
		}
		let isExploded = (renderFlags & RENDER_FLAG_EXPLODED);
		if (isExploded) {
			domNode.classList.add('exploded');
		}
		domNode.setAttribute("style", this.currentStyle);
	}

	// actually is a domNode, not a renderNode
	renderTags(domNode, renderFlags) {
		if (
			(renderFlags & RENDER_FLAG_SHALLOW)
			&& (renderFlags & RENDER_FLAG_RERENDER)) {
			return;
		}
		let isExploded = (renderFlags & RENDER_FLAG_EXPLODED);
		for (let i = 0; i < this.tags.length; i++) {
			this.tags[i].draw(domNode, isExploded);
		}		
	}

	isLeaf() {
		return true;
	}

	isSelected() {
		return this.selected;
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


