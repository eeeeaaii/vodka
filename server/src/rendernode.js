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

import * as Utils from './utils.js'

import { systemState } from './systemstate.js'
import { LambdaEditor } from './nex/lambda.js'
import { BoolEditor } from './nex/bool.js'
import { ESymbolEditor } from './nex/esymbol.js'
import { EStringEditor } from './nex/estring.js'
import { CommandEditor } from './nex/command.js'
import { TagEditor } from './tag.js'
import { eventQueueDispatcher } from './eventqueuedispatcher.js'
import {
	RENDER_FLAG_SELECTED,
	RENDER_FLAG_REMOVE_OVERRIDES,
	RENDER_FLAG_SHALLOW,
	RENDER_FLAG_NORMAL,
	RENDER_FLAG_RERENDER,
	RENDER_FLAG_EXPLODED,
	RENDER_FLAG_INSERT_INSIDE,
	RENDER_FLAG_INSERT_AFTER,
	RENDER_FLAG_INSERT_BEFORE,
	RENDER_FLAG_INSERT_AROUND,
} from './globalconstants.js'

import { experiments } from './globalappflags.js'

const MAX_RENDER_DEPTH = 100;

const INSERT_UNSPECIFIED = 0;
const INSERT_AFTER = 1;
const INSERT_BEFORE = 2;
const INSERT_INSIDE = 3;
const INSERT_AROUND = 4;

class RenderNode {
	constructor(forNex) {
		this.selected = false;
		this.nex = forNex;
		this.parentalfigure = null;
		this.indexinparentalfigure = -1;
		this.childnodes = [];
		this.wrapperDomNodes = [];
		this.domNode = document.createElement("div");
		this.isCurrentlyExploded = false;
		this.explodedOverride = -1;
		this.firstToggleOnNexRender = false;
		this.currentEd = null;
		this.wrapperDomNode = null;
		this.setInsertionMode(INSERT_UNSPECIFIED);
	}

	debugString() {
		return `[RNODE FOR]\n${this.getNex().debugString()}`
	}

	getCurrentEditor() {
		return this.currentEd;
	}

	setCurrentEditor(newval) {
		this.currentEd = newval;
	}

	routeKeyToCurrentEditor(keycode) {
		try {
			let reroute = this.getCurrentEditor().routeKey(keycode);
			// the editor will decide when it's finished and will stop editing
			if (!this.getCurrentEditor().isEditing()) {
				this.setCurrentEditor(null);
			}
			return reroute;
		} catch (e) {
			if (e.getTypeName && e.getTypeName() == '-error-') {
				// YOU HAVE TO SET THE CURRENT EDITOR TO NULL FIRST
				// because replacing self triggers a forceClose via select/unselect
				this.setCurrentEditor(null);
				this.replaceSelfInParentWith(e);
				return false;
			} else {
				throw e;
			}
		}
	}

	forceCloseEditor() {
		if (this.getCurrentEditor()) {
			this.getCurrentEditor().forceClose();
			this.setCurrentEditor(null);
		}
	}

	usingEditor() {
		// there will be other editors I guess
		return this.getCurrentEditor() && this.getCurrentEditor().isEditing();
	}

	getEditorForType(nex) {
		switch(nex.getTypeName()) {
			case '-lambda-':
				return new LambdaEditor(nex);
			case '-bool-':
				return new BoolEditor(nex);
			case '-command-':
				return new CommandEditor(nex);
			case '-symbol-':
				return new ESymbolEditor(nex);
			case '-string-':
				if (experiments.BETTER_KEYBINDINGS) {
					return new EStringEditor(nex);
				} else {
					return false;
				}
			default:
				return null;
		}
	}

	possiblyStartMainEditor() {
		let editor = this.getEditorForType(this.getNex());
		if (editor) {
			this.startEditor(editor);
		}
	}

	startEditor(editor) {
		if (this.getCurrentEditor()) {
			throw new Error('cannot edit two things at once');
		}
		this.setCurrentEditor(editor);
		this.getCurrentEditor().startEditing();
	}

	startTagEditor() {
		this.startEditor(new TagEditor(this.getNex()));
	}

	removeAllTags() {
		this.nex.clearTags();
	}

	setAlertStyle(node, codespan) {
		let sel = this.selected ? `selected` : `unselected`;
		let currentNumber = node.classList.contains(`animating-${sel}-executable-1`) ? "1" : "2"
		let newNumber = currentNumber == "1" ? "2" : "1";
		node.classList.remove(`animating-${sel}-executable-${currentNumber}`);
		node.classList.add(`animating-${sel}-executable-${newNumber}`);
		codespan.classList.remove(`animating-${sel}-bg-executable-${currentNumber}`);
		codespan.classList.add(`animating-${sel}-bg-executable-${newNumber}`);
	}

	getCodespanForAlertAnimation() {
		let codespan = null;
		for (let i = 0; i < this.domNode.childNodes.length; i++) {
			let child = this.domNode.childNodes[i];
			if (child.classList && child.classList.contains('codespan')) {
				// this is the part of the lambda that has the params etc
				codespan = child;
			}
		}
		if (codespan == null) {
			throw new Error('tried to call doAlertAnimation on something thats not a lambda or command');
		}
		return codespan;
	}

	doAlertAnimation() {
		// nex should only be a lambda or command.
		this.setAlertStyle(this.domNode, this.getCodespanForAlertAnimation());
	}

	setRenderDepth(depth) {
		this.renderDepth = depth;
	}

	isExploded() {
		return this.isCurrentlyExploded;
	}

	createChildRenderNodes(nex) {
		if (!(nex.isNexContainer())) return;
		for (let i = 0; i < nex.numChildren(); i++) {
			let child = nex.getChildAt(i);
			let childRenderNode = new RenderNode(child);
			childRenderNode.setParent(this, i);
			this.domNode.appendChild(childRenderNode.domNode);
			this.childnodes.push(childRenderNode);
		}
	}

	doOnRenderNodeTree(f) {
		let stopNow = f(this);
		if (stopNow) {
			return true;
		} else {
			for (let i = 0; i < this.childnodes.length; i++) {
				let childRenderNode = this.childnodes[i];
				if (childRenderNode.doOnRenderNodeTree(f)) {
					return true;
				}
			}
			return false;
		}
	}

	getNex() {
		return this.nex;
	}

	getParent() {
		return this.parentalfigure;
	}

	setParent(p, index) {
		this.parentalfigure = p;
		this.indexinparentalfigure = index;
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
		this.domNode.setAttribute("class", "");
		this.domNode.setAttribute("style", "");
		if (!(renderFlags & RENDER_FLAG_SHALLOW)) {
			// fast removal, do not use innerHTML
			while (this.domNode.firstChild) {
				this.domNode.removeChild(this.domNode.lastChild);
			}
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
		let useFlags = this.selected
				? renderFlags | RENDER_FLAG_SELECTED
				: renderFlags;
		if (this.renderDepth > MAX_RENDER_DEPTH) {
			this.renderDepthExceeded();
			return;
		}
		switch(this.insertionMode) {
			case INSERT_INSIDE: useFlags |= RENDER_FLAG_INSERT_INSIDE; break;
			case INSERT_BEFORE: useFlags |= RENDER_FLAG_INSERT_BEFORE; break;
			case INSERT_AFTER: useFlags |= RENDER_FLAG_INSERT_AFTER; break;
			case INSERT_AROUND: useFlags |= RENDER_FLAG_INSERT_AROUND; break;
		}

		this.nex.renderInto(this, useFlags, this.getCurrentEditor());
		this.nex.doRenderSequencing(this);
		this.isCurrentlyExploded = !!(renderFlags & RENDER_FLAG_EXPLODED);

		if (!(renderFlags & RENDER_FLAG_EXPLODED)
				&& this.nex.isNexContainer()
				&& !this.nex.renderChildrenIfNormal()) {
			return;
		}
		if (this.getNex().isNexContainer() && this.getNex().getTypeName() != '-nativeorg-' && !(renderFlags & RENDER_FLAG_SHALLOW)) {
			if ((renderFlags & RENDER_FLAG_EXPLODED) && this.insertionMode == INSERT_INSIDE) {
				this.domNode.appendChild(this.getInsertionPointDomNode(this.insertionMode));			
			}
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
					this.childnodes[i].setParent(this, i);
				}
				childRenderNode.setRenderDepth(this.renderDepth + 1);

				if ((renderFlags & RENDER_FLAG_EXPLODED) && childRenderNode.insertionMode == INSERT_BEFORE) {
					this.domNode.appendChild(this.getInsertionPointDomNode(childRenderNode.insertionMode));			
				}
				// need to append child before drawing so things like focus() work right
				if ((renderFlags & RENDER_FLAG_EXPLODED) && childRenderNode.insertionMode == INSERT_AROUND) {
					this.wrapperDomNodes[i] = this.getInsertionPointDomNode(childRenderNode.insertionMode);
					this.domNode.appendChild(this.wrapperDomNodes[i]);
					this.wrapperDomNodes[i].appendChild(childRenderNode.getDomNode());
				} else {
					this.wrapperDomNodes[i] = null;
					this.domNode.appendChild(childRenderNode.getDomNode());
				}
				childRenderNode.render(renderFlags);
				if ((renderFlags & RENDER_FLAG_EXPLODED) && childRenderNode.insertionMode == INSERT_AFTER) {
					this.domNode.appendChild(this.getInsertionPointDomNode(childRenderNode.insertionMode));			
				}

			}
			if (i < (this.getNex().numChildren())) {
				// oops, more nodes added since the last time we rendered.
				for ( ; i < this.getNex().numChildren(); i++) {
					let newNode = new RenderNode(this.getNex().getChildAt(i));
					newNode.setParent(this, i);
					newNode.setRenderDepth(this.renderDepth + 1);
					this.childnodes[i] = newNode;
					this.domNode.appendChild(newNode.getDomNode());
					newNode.render(renderFlags);
				}
			}

		}
		if (this.getCurrentEditor() && this.getCurrentEditor().isEditing()) {
			let postNode = this.getCurrentEditor().postNode();
			if (postNode) {
				this.domNode.appendChild(postNode);
			}
		}
		this.nex.renderTags(this.domNode, renderFlags, this.getCurrentEditor());
	}

	getInsertionPointDomNode(insertionMode) {
		if (insertionMode == INSERT_AROUND) {
			return this.getInsertionPointForAround();
		} else {
			return this.getInsertionPointForNotAround();
		}
	}

	getInsertionPointForAround() {
		let ipoint = document.createElement('div');
		let ss = "";
		ss += "padding:5px;";
		ss += "border:2px dotted #ff7777;";
		ipoint.setAttribute("style", ss);
		return ipoint;		
	}

	getInsertionPointForNotAround() {
		let ipoint = document.createElement('div');
		let ss = "";
		ss += "width:5px;";
		ss += "height:6px;";
		ss += "padding:0px;";
		ss += "color:#ff7777;";
		ss += "line-height:0.4;";
		if (this.getNex().isHorizontal && this.getNex().isHorizontal()) {
			ss += "margin-top:6px;";
		} else {
			ss += "margin-left:6px;"
		}

		ipoint.setAttribute("style", ss);
		ipoint.innerHTML = "&bull;";
		return ipoint;
	}

	setInsertionMode(mode) {
		this.insertionMode = mode;
	}

	nextInsertionMode() {
		if (this.getNex().isNexContainer()) {
			switch(this.insertionMode) {
				case INSERT_INSIDE:
					this.setInsertionMode(INSERT_AFTER);
					break;
				case INSERT_AFTER:
					this.setInsertionMode(INSERT_BEFORE);
					break;
				case INSERT_BEFORE:
					this.setInsertionMode(INSERT_AROUND);
					break;
				default:
					this.setInsertionMode(INSERT_INSIDE);
			}
		} else {
			switch(this.insertionMode) {
				case INSERT_AFTER:
					this.setInsertionMode(INSERT_BEFORE);
					break;
				case INSERT_BEFORE:
					this.setInsertionMode(INSERT_AROUND);
					break;
				default:
					this.setInsertionMode(INSERT_AFTER);
			}
		}
	}

	getInsertionMode() {
		return this.insertionMode;
	}

	setSelected(rerender) {
		let selectedNode = systemState.getGlobalSelectedNode();
		if (selectedNode == this) return;
		if (selectedNode) {
			selectedNode.setUnselected();
			if (rerender) {
				eventQueue.renderNodeRender(selectedNode, RENDER_FLAG_RERENDER | RENDER_FLAG_SHALLOW | systemState.getGlobalCurrentDefaultRenderFlags());
			}
		}
		selectedNode = this;
		this.selected = true;
		let nex = this.getNex();
		if (nex.isNexContainer() && nex.numChildren() == 0) {
			// for commands that we know have no args, we don't do insert inside by default.
			if (Utils.isCommand(nex)
					&& nex.hasCachedClosure()
					&& nex.getLambdaFromCachedClosure().getParams().length == 0) {
				this.setInsertionMode(INSERT_AFTER);
			} else {
				this.setInsertionMode(INSERT_INSIDE);
			}
		} else {
			this.setInsertionMode(INSERT_AFTER);
		}
		if (rerender) {
			eventQueue.renderNodeRender(this, RENDER_FLAG_RERENDER | RENDER_FLAG_SHALLOW | systemState.getGlobalCurrentDefaultRenderFlags());
		}
		systemState.setGlobalSelectedNode(selectedNode);
	}

	setUnselected() {
		this.selected = false;
		this.setInsertionMode(INSERT_UNSPECIFIED);
		if (this.getCurrentEditor()) {
			this.forceCloseEditor();
		}
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


	replaceSelfInParentWith(newNode) {
		if (!(newNode instanceof RenderNode)) {
			newNode = this.getRenderNodeFor(newNode);
		}
		this.parentalfigure.replaceChildAt(newNode, this.indexinparentalfigure);
		newNode.setSelected();
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
		let domNodeToRemove = r.getDomNode();
		if (this.wrapperDomNodes[i]) {
			domNodeToRemove = this.wrapperDomNodes[i];
			this.wrapperDomNodes[i] = null;
		}
		this.getDomNode().removeChild(domNodeToRemove);
		r.setParent(null, -1);
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
			let renderNodeToInsertBefore = this.childnodes[i + 1];
			let domNodeToInsertBefore = renderNodeToInsertBefore.getDomNode();
			if (renderNodeToInsertBefore.getInsertionMode() == INSERT_AROUND) {
				domNodeToInsertBefore = domNodeToInsertBefore.parentNode;
			}
			this.getDomNode().insertBefore(c.getDomNode(), domNodeToInsertBefore);
		}
		c.setParent(this, i);
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
		if (!(c instanceof RenderNode)) {
			c = this.getRenderNodeFor(c);
		}
		this.insertChildAt(c, this.childnodes.length);
		return c;
	}

	prependChild(c) {
		if (!(c instanceof RenderNode)) {
			c = this.getRenderNodeFor(c);
		}
		this.insertChildAt(c, 0);
		return c;
	}

	insertChildAfter(c, sib) {
		if (!(c instanceof RenderNode)) {
			c = this.getRenderNodeFor(c);
		}
		this.insertChildAt(c, this.getIndexOfChild(sib) + 1);
		return c;
	}

	insertChildBefore(c, sib) {
		if (!(c instanceof RenderNode)) {
			c = this.getRenderNodeFor(c);
		}
		this.insertChildAt(c, this.getIndexOfChild(sib));
		return c;
	}

	replaceChildWith(child, newchild) {
		if (!(newchild instanceof RenderNode)) {
			newchild = this.getRenderNodeFor(newchild);
		}
		this.replaceChildAt(newchild, this.getIndexOfChild(child));
		return newchild;
	}    
}

export { RenderNode,
	INSERT_UNSPECIFIED,
	INSERT_AFTER,
	INSERT_BEFORE,
	INSERT_INSIDE,
	INSERT_AROUND

 }

