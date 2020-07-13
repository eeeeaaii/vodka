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

let NEXT_NEX_ID = 0;

import { getGlobalAppFlag } from '../globalappflags.js'
import * as Vodka from '../vodka.js'

class Nex {
	constructor() {
		this.lastRenderPassNumber = null;
		this.firstRenderNode = null;
		this.rendernodes = [];
		this.references = 0;

		this.selected = false;
		this.keyfunnel = null;
		this.currentStyle = "";
		this.tags = [];
		this.id = NEXT_NEX_ID++;
		this.copiedFromID = -1;
		this.extraClickHandler = null;
		this.closure = null; // only lambdas have closures but just copying is prob cheaper than testing?
		this.inPackage = null; // well here we go with more things in the env I guess.
	}

	toString() {}

	debugString() {
		return this.toString();
	}

	writeV2PrivateData() {
		let s = this.serializeV2PrivateData();
		if (s) {
			return '|SP|' + s + '|EP|'
		}
		return '';
	}

	serializeV2PrivateData() {
		return '';
	}

	getTypeName() {
		throw new Error("only leaf types have names");
	}

	addReference() {
		this.references++;
	}

	removeReference() {
		this.references--;
	}

	numReferences() {
		return this.references;
	}

	shouldActivateReturnedExpectations() {
		return false;
	}

	isNexContainer() {
		return false;
	}

	doRenderSequencing(renderNode) {
		if (getGlobalAppFlag('otags') || this.lastRenderPassNumber == Vodka.getGlobalRenderPassNumber()) {
			// this node has been rendered before in this pass!
			// if this is the first dupe, we go back to the first one
			// and prepend the object tag.
			if (getGlobalAppFlag('otags') || this.rendernodes.length == 1) {
				this.prependObjectTag(this.rendernodes[0]);
			}
			this.rendernodes.push(renderNode);
			this.prependObjectTag(renderNode);
		} else {
			this.rendernodes = [ renderNode ];
			this.lastRenderPassNumber = Vodka.getGlobalRenderPassNumber();
			// for now we assume there will be only one render,
			// do not prepend.
		}
	}

	renderOnlyThisNex() {
		for (let i = 0; i < this.rendernodes.length; i++) {
			let flags = Vodka.getGlobalCurrentDefaultRenderFlags();
			flags &= (~Vodka.RENDER_FLAG_NORMAL);
			flags &= (~Vodka.RENDER_FLAG_EXPLODED);

			Vodka.eventQueue.enqueueRenderNodeRender(
					this.rendernodes[i],
					flags
					| (this.rendernodes[i].isExploded() ? Vodka.RENDER_FLAG_EXPLODED : Vodka.RENDER_FLAG_NORMAL)
					);
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
		tagNode.appendChild(document.createTextNode('o'+this.getID()));
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
		nex.copiedFromID = this.id;
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

	numTags() {
		return this.tags.length;
	}

	getTag(n) {
		return this.tags[n].copy();
	}

	clearTags() {
		this.tags = [];		
	}

	// evaluation flow

	evalSetup(executionEnv) {

	}

	getExpectedReturnType() {
		return null;
	}

	maybeGetCommandName() {
		return null;
	}

	evaluate(env) {
		return this;
	}

	evalCleanup() {
	}

	// end evaluation flow

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

	getDefaultHandler() {
		return null;
	}

	// can return null if user clicks on some other thing
	getParentNexOfDomElement(elt) {
		while(elt && !elt.classList.contains('nex')) {
			elt = elt.parentNode;
		}
		return elt;
	}

	_setClickHandler(renderNode) {
		renderNode.getDomNode().onmousedown = (event) => {
			Vodka.eventQueue.enqueueDoClickHandlerAction(this, renderNode, event)
			event.stopPropagation();
		};
	}

	doClickHandlerAction(renderNode, e) {
		if (this.extraClickHandler) {
			this.extraClickHandler();
			return;
		}
		let parentNexDomElt = this.getParentNexOfDomElement(e.target);
		if (Vodka.getGlobalSelectedNode().getDomNode() == parentNexDomElt) {
			return;
		}
		let insertAfterRemove = false;
		let oldSelectedNode = Vodka.getGlobalSelectedNode();
		if ((Vodka.getGlobalSelectedNode().getNex().getTypeName() == '-estring-'
			|| Vodka.getGlobalSelectedNode().getNex().getTypeName() == '-eerror-')
				&& Vodka.getGlobalSelectedNode().getNex().getMode() == MODE_EXPANDED) {
			Vodka.getGlobalSelectedNode().getNex().finishInput();
		} else if (Vodka.getGlobalSelectedNode().getNex().getTypeName() == '-insertionpoint-') {
			insertAfterRemove = true;
		}

		e.stopPropagation();
		renderNode.setSelected(false /*shallow-rerender*/);
		if (insertAfterRemove && Vodka.getGlobalSelectedNode() != oldSelectedNode) {
			Vodka.manipulator.removeNex(oldSelectedNode);
		}
		Vodka.eventQueue.enqueueImportantTopLevelRender();
	}

	renderInto(renderNode, renderFlags) {
		let domNode = renderNode.getDomNode();
		if (!(renderFlags & Vodka.RENDER_FLAG_RERENDER)) {
			this._setClickHandler(renderNode);
		}
		domNode.classList.add('nex');

		if (renderFlags & Vodka.RENDER_FLAG_SELECTED) {
			domNode.classList.add('selected');		
		}
		let isExploded = (renderFlags & Vodka.RENDER_FLAG_EXPLODED);
		if (isExploded) {
			domNode.classList.add('exploded');
		}
		domNode.setAttribute("style", this.currentStyle);
		if (renderFlags & Vodka.RENDER_FLAG_DEPTH_EXCEEDED) {
			this.clearDomNode(domNode);
		}
	}

	// actually is a domNode, not a renderNode
	renderTags(domNode, renderFlags) {
		if (
			(renderFlags & Vodka.RENDER_FLAG_SHALLOW)
			&& (renderFlags & Vodka.RENDER_FLAG_RERENDER)) {
			return;
		}
		let isExploded = (renderFlags & Vodka.RENDER_FLAG_EXPLODED);
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

if (typeof module !== 'undefined' && module.exports) module.exports = { Nex: Nex }


export { Nex }

