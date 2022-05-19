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
import { WavetableEditor } from './nex/wavetable.js'
import { BoolEditor } from './nex/bool.js'
import { FloatEditor } from './nex/float.js'
import { IntegerEditor } from './nex/integer.js'
import { ESymbolEditor } from './nex/esymbol.js'
import { EStringEditor } from './nex/estring.js'
import { CommandEditor } from './nex/command.js'
import { InstantiatorEditor } from './nex/instantiator.js'
import { TagEditor } from './tageditor.js'
import { eventQueueDispatcher } from './eventqueuedispatcher.js'
import { doTutorial } from './help.js'
import {
	RENDER_FLAG_SELECTED,
	RENDER_FLAG_SHALLOW,
	RENDER_FLAG_NORMAL,
	RENDER_FLAG_RERENDER,
	RENDER_FLAG_EXPLODED,
	RENDER_FLAG_INSERT_INSIDE,
	RENDER_FLAG_INSERT_AFTER,
	RENDER_FLAG_INSERT_BEFORE,
	RENDER_FLAG_INSERT_AROUND,
	RENDER_FLAG_RENDER_IF_DIRTY,

	RENDER_MODE_NORM,
	RENDER_MODE_EXPLO,
	RENDER_MODE_INHERIT,
} from './globalconstants.js'

import { experiments } from './globalappflags.js'
import { alertAnimator } from './alertanimator.js'

// I think it's bad that we use INSERT_UNSPECIFIED, like we can reset to that,
// but we still want the if statements to only do pips if the thing is selected.

const INSERT_UNSPECIFIED = 0;
const INSERT_AFTER = 1;
const INSERT_BEFORE = 2;
const INSERT_INSIDE = 3;
const INSERT_AROUND = 4;

const MAX_SIBLING_COUNT = 1000;

/**
 * Represents a rectangle on the screen where a nex is actually rendered or
 * displayed.
 */
class RenderNode {
	constructor(forNex) {
		this.selected = false;
		this.nex = forNex;
		this.parentalfigure = null;
		this.indexinparentalfigure = -1;
		this.childnodes = [];
		this.wrapperDomNodes = [];
		this.domNode = document.createElement("div");

		this.renderMode = RENDER_MODE_INHERIT;

		this.isCurrentlyExploded = false;
		this.currentEd = null;
		this.wrapperDomNode = null;
		this.setInsertionMode(INSERT_UNSPECIFIED);

		this.renderNodeIsDirty = true;

		this.nodesThatIfDroppedInvalidateTheSelection = [];

		this.domNodeEventListener = null;
	}

	nodeCopy() {
		let newNode = new RenderNode(this.nex);
		newNode.selected = this.selected;
		for (let i = 0; i < this.childnodes.length; i++) {
			newNode.childnodes[i] = this.childnodes[i].nodeCopy();
		}
		newNode.renderMode = this.renderMode;
		newNode.isCurrentlyExploded = this.isCurrentlyExploded;
		return newNode;
	}

	addEventListener(type, listener, options) {
		if (this.domNodeEventListener) {
			this.domNode.removeEventListener(
				this.domNodeEventListener.type,
				this.domNodeEventListener.listener,
				this.domNodeEventListener.options,
				);
		}
		this.domNodeEventListener = {
			type:type,
			listener:listener,
			options:options
		}
		this.domNode.addEventListener(type, listener, options);
	}

	setRenderNodeDirtyForRendering(v) {
		this.renderNodeIsDirty = v;
	}

	getRenderNodeDirtyForRendering() {
		return this.renderNodeIsDirty;
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

	stopEditing() {
		this.setCurrentEditor(null);
		// set parent dirty when you stop editing because of redrawing pips
		let p = this.getParent();
		let toSetDirty = p ? p : this;
		toSetDirty.nex.setDirtyForRendering(true);
	}

	routeKeyToCurrentEditor(keycode) {
		try {
			let newkeycode = this.getCurrentEditor().routeKey(keycode);
			// the editor will decide when it's finished and will stop editing
			if (!this.getCurrentEditor().isEditing()) {
				this.stopEditing();
			}
			return newkeycode;
		} catch (e) {
			if (e.getTypeName && e.getTypeName() == '-error-') {
				// YOU HAVE TO SET THE CURRENT EDITOR TO NULL FIRST
				// because replacing self triggers a forceClose via select/unselect
				this.stopEditing();
				this.replaceSelfInParentWith(e);
				return null;
			} else {
				throw e;
			}
		}
	}

	forceCloseEditor() {
		if (this.getCurrentEditor()) {
			this.getCurrentEditor().forceClose();
			this.stopEditing();
		}
	}

	usingEditor() {
		// there will be other editors I guess
		return this.getCurrentEditor() && this.getCurrentEditor().isEditing();
	}

	getEditorForType(nex) {
		switch(nex.getTypeName()) {
			case '-wavetable-':
				return new WavetableEditor(nex);
			case '-lambda-':
				return new LambdaEditor(nex);
			case '-bool-':
				return new BoolEditor(nex);
			case '-command-':
				return new CommandEditor(nex);
			case '-float-':
				return new FloatEditor(nex);
			case '-integer-':
				return new IntegerEditor(nex);
			case '-symbol-':
				return new ESymbolEditor(nex);
			case '-instantiator-':
				return new InstantiatorEditor(nex);
			case '-string-':
				return new EStringEditor(nex);
			case '-deferredcommand-':
				// special case: we cannot edit fulfilled or active deferreds.
				if (nex.isActivated() || nex.isFulfilled()) {
					return false;
				} else {
					// use the same editor as command.
					return new CommandEditor(nex);
				}
			default:
				return null;
		}
	}

	possiblyStartMainEditor() {
		if (!this.getNex().isMutable()) {
			return null;
		}
		let editor = this.getEditorForType(this.getNex());
		if (editor) {
			this.startEditor(editor);
			return editor;
		}
		return null;
	}

	startEditor(editor) {
		if (this.getCurrentEditor()) {
			throw new Error('cannot edit two things at once');
		}
		this.setCurrentEditor(editor);
		this.getCurrentEditor().startEditing();
		let p = this.getParent();
		let toSetDirty = p ? p : this;
		toSetDirty.nex.setDirtyForRendering(true);
	}

	getTagEditorForType(nex) {
		return new TagEditor(nex);
	}

	startTagEditor() {
		if (!this.getNex().canUseTagEditor()) {
			return;
		}
		let tagEditor = this.getTagEditorForType(this.getNex());
		tagEditor.createManagedTagIfNone();
		this.startEditor(tagEditor);
		doTutorial('tag-editor');
	}

	removeAllTags() {
		this.nex.clearTags();
	}

	doAlertAnimation() {
		alertAnimator.doAlertAnimation(this.domNode);
	}

	setRenderDepth(depth) {
		this.renderDepth = depth;
	}

	isExploded() {
		return this.isCurrentlyExploded;
	}

	getRenderMode() {
		if (this.renderMode == RENDER_MODE_INHERIT) {
			let p = this.getParent();
			if (p) {
				this.renderMode = p.getRenderMode();
			} else {
				this.renderMode = RENDER_MODE_EXPLO;
			}
		}
		return this.renderMode;
	}

	setRenderMode(newRenderMode) {
		this.renderMode = newRenderMode;
		for (let i = 0; i < this.childnodes.length; i++) {
			this.childnodes[i].setRenderMode(newRenderMode);
		}
		this.setRenderNodeDirtyForRendering(true);
	}

	toggleRenderMode() {
		let renderMode = this.getRenderMode();
		if (renderMode == RENDER_MODE_EXPLO) {
			this.setRenderMode(RENDER_MODE_NORM);
		} else {
			this.setRenderMode(RENDER_MODE_EXPLO);			
		}
	}

	getNex() {
		return this.nex;
	}

	getParent() {
		return this.parentalfigure;
	}

	hasParent() {
		return !!this.parentalfigure;
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

	setToRenderDepthExceededState() {
		let domNode = this.getDomNode();
		domNode.innerHTML = '&#8253;&#8253;&#8253;';
		domNode.classList.add('render-depth-exceeded')
	}

	getSiblingCountExceededDomElement() {
		let domelt = document.createElement("div");
		domelt.classList.add('render-depth-exceeded');
		domelt.innerHTML = '...';
		return domelt;
	}

	setAllNotDirty() {
		this.nex.setDirtyForRendering(false);
		for (let i = 0; i < this.childnodes.length; i++) {
			let child = this.childnodes[i];
			child.setAllNotDirty();
		}
	}

	getEffectiveFlags(flags) {
		flags = (this.selected ? (flags | RENDER_FLAG_SELECTED) : flags);
		let renderMode = this.getRenderMode();
		if (renderMode == RENDER_MODE_EXPLO) {
			flags |= RENDER_FLAG_EXPLODED;
		} else {
			flags |= RENDER_FLAG_NORMAL;
		}
		return flags;
	}

	render(renderFlags) {
		let useFlags = this.getEffectiveFlags(renderFlags);
		let childFlags = renderFlags;
		if (useFlags & RENDER_FLAG_RENDER_IF_DIRTY) {
			if (this.nex.getDirtyForRendering() || this.getRenderNodeDirtyForRendering()) {
				// from here on down, normal rendering.
				childFlags &= (~RENDER_FLAG_RENDER_IF_DIRTY);
			} else {
				// not dirty but children might be!
				for (let i = 0; i < this.childnodes.length; i++) {
					let child = this.childnodes[i];
					child.render(renderFlags);
				}
				return;
			}
		}
		this.clearDomNode(useFlags);
		if (this.renderDepth > experiments.MAX_RENDER_DEPTH) {
			this.setToRenderDepthExceededState();
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
		this.isCurrentlyExploded = !!(useFlags & RENDER_FLAG_EXPLODED);

		if (!(useFlags & RENDER_FLAG_EXPLODED)
				&& this.nex.isNexContainer()
				&& !this.nex.renderChildrenIfNormal()) {
			return;
		}
		if (this.getNex().isNexContainer() && !(useFlags & RENDER_FLAG_SHALLOW)) {
			if ((useFlags & RENDER_FLAG_EXPLODED) && this.insertionMode == INSERT_INSIDE) {
				this.doInsertionPip(this);
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
				if (childRenderNode.getNex().getID() != this.getNex().getRenderableChildAt(i).getID()) {
					// the child changed since the last time we rendered!!!
					// need to fix.
					this.childnodes[i] = childRenderNode = new RenderNode(this.getNex().getRenderableChildAt(i));
					this.childnodes[i].setParent(this, i);
				}
				childRenderNode.setRenderDepth(this.renderDepth + 1);

				if ((useFlags & RENDER_FLAG_EXPLODED) && childRenderNode.insertionMode == INSERT_BEFORE) {
					this.doInsertionPip(childRenderNode);
				}
				// need to append child before drawing so things like focus() work right
				if ((useFlags & RENDER_FLAG_EXPLODED) && childRenderNode.insertionMode == INSERT_AROUND) {
					this.doInsertionSquare(i, childRenderNode)
					// this.wrapperDomNodes[i] = this.getInsertionPipDomNode(childRenderNode.insertionMode);
					// this.domNode.appendChild(this.wrapperDomNodes[i]);
					// this.wrapperDomNodes[i].appendChild(childRenderNode.getDomNode());
				} else {
					this.wrapperDomNodes[i] = null;
					this.domNode.appendChild(childRenderNode.getDomNode());
				}
				childRenderNode.render(childFlags);
				this.nex.renderAfterChild(i, this, useFlags, this.getCurrentEditor());
				if ((useFlags & RENDER_FLAG_EXPLODED) && childRenderNode.insertionMode == INSERT_AFTER) {
					this.doInsertionPip(childRenderNode);
				}
			}
			if (i < (this.getNex().numChildren())) {
				// oops, more nodes added since the last time we rendered.

				let n = this.getNex().numChildren();
				// if we are exploded we trust the user to just render the right number of things
				// this might be bad
				let truncated = false;
				if (n > MAX_SIBLING_COUNT && (useFlags & RENDER_FLAG_EXPLODED)) {
					n = MAX_SIBLING_COUNT;
					truncated = true;
				}
				for ( ; i < n; i++) {
					this.renderNewChildAt(i, childFlags, useFlags, true);
				}
				if (truncated) {
					// we are truncating because too many children, first display the ellipses
					this.domNode.appendChild(this.getSiblingCountExceededDomElement());
					// then put last child, so it's like 1, 2, 3 ... 1000
					this.renderNewChildAt(this.getNex().numChildren() - 1, childFlags, useFlags, false);
				}
			}
		}
		if (this.nex.hasTags()) {
			let tagHolder = this.nex.getTagHolder(this.domNode);
			this.nex.renderTags(tagHolder, useFlags, this.getCurrentEditor());
		}
		this.setRenderNodeDirtyForRendering(false);
	}

	renderNewChildAt(i, childFlags, useFlags, doChildNode) {
		let newNode = new RenderNode(this.getNex().getRenderableChildAt(i));
		newNode.setParent(this, i);
		newNode.setRenderDepth(this.renderDepth + 1);
		if (doChildNode) {
			this.childnodes[i] = newNode;
		}
		this.domNode.appendChild(newNode.getDomNode());
		newNode.render(childFlags);
		this.nex.renderAfterChild(i, this, useFlags, this.getCurrentEditor());
	}

	// this method is called on the parent of the selected node for insertion modes of
	// INSERT_AFTER, INSERT_BEFORE, and INSERT_AROUND
	// it's called on the actual selected node for
	// INSERT_INSIDE

	doInsertionPip(selectedNode) {
		let pip = document.createElement('div');
		pip.classList.add('insertionpip');

		let beforeafter = (selectedNode.insertionMode == INSERT_BEFORE || selectedNode.insertionMode == INSERT_AFTER);
		let p = selectedNode.getParent();
		if (p) {
			// it has a parent
			if (beforeafter) {
				if (p.nex.isVertical()) {
					if (p.nex.getTypeName() == '-command-'
							|| p.nex.getTypeName() == '-lambda-') {
						pip.classList.add('pipvparentindent');
					} else {
						pip.classList.add('pipvparent');
					}
				} else {
					pip.classList.add('piphparent');
				}				
			} else {
				if (selectedNode.nex.isVertical()) {
					pip.classList.add('pipinvcontainer');
				} else {
					pip.classList.add('pipinhcontainer');
				}								
			}
		} else {
			if (beforeafter) {
				pip.classList.add('pipunderroot');
			}
		}
		// let objectUnderRoot = (!isRoot && p.nex.getTypeName() == '-root-' && (selectedNode.insertionMode == INSERT_BEFORE || selectedNode.insertionMode == INSERT_AFTER));
		// if (isRoot) {
		// 	pip.classList.add('rootpip')
		// } else if (objectUnderRoot) {
		// 	pip.classList.add('pipunderroot')
		// }

		if (selectedNode.usingEditor()) {
			if (!experiments.STATIC_PIPS) {
				pip.classList.add('faintcursorblink');
			}
			pip.classList.add('pipparentusingeditor');
		} else {
			if (!experiments.STATIC_PIPS) {
				pip.classList.add('cursorblink');
			}
		}

		pip.innerHTML = "&bull;";
		this.domNode.appendChild(pip);			
	}

	doInsertionSquare(i, childRenderNode) {
		let square = document.createElement('div');
		square.classList.add('insertionsquare');
		if (!experiments.STATIC_PIPS) {
			square.classList.add('squareblink');
		}
		if (childRenderNode.usingEditor()) {
			square.classList.add('pipparentusingeditor')
		}
		this.wrapperDomNodes[i] = square;
		this.domNode.appendChild(this.wrapperDomNodes[i]);
		this.wrapperDomNodes[i].appendChild(childRenderNode.getDomNode());
	}


	getInsertionMode() {
		return this.insertionMode;
	}

	setInsertionMode(mode) {
		if (Utils.isRoot(this.nex)) {
			mode = (mode == INSERT_UNSPECIFIED) ? mode : INSERT_INSIDE;
		}
		if (mode != this.insertionMode) {
			let p = this.getParent();
			if (p) {
				p.setRenderNodeDirtyForRendering(true);
			} else {
				this.setRenderNodeDirtyForRendering(true);
			}
			this.insertionMode = mode;
			return true;
		} else {
			return false; // no change
		}
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

	getDefaultInsertionMode(nex) {
		if (Utils.isRoot(this.nex)) {
			return INSERT_INSIDE;
		}
		if (nex.isNexContainer() && nex.numChildren() == 0) {
			// for commands that we know have no args, we don't do insert inside by default.
			if (Utils.isCommand(nex)
					&& nex.hasCachedClosure()
					&& nex.getLambdaFromCachedClosure().getParams().length == 0) {
				return INSERT_AFTER;

			// also we don't do insert inside for NexContainers that aren't meant to have
			// their contents modified.
			} else if (Utils.isError(nex) || Utils.isDeferredValue(nex) || Utils.isContract(nex)) {
				return INSERT_AFTER;
			} else {
				return INSERT_INSIDE;				
			}
		} else {
			return INSERT_AFTER;			
		}
	}

	// TODO: this is confusing because you might think that the boolean passed in tells it whether
	// or not to make the thing selected.
	setSelected(rerender) {
		// when we change the selection state we have to set the parent dirty because the parent
		// render node of the selected render node is responsible for drawing the insertion pip
		let selectedNode = systemState.getGlobalSelectedNode();
		if (selectedNode == this) return;
		if (selectedNode) {
			selectedNode.setUnselected();
			selectedNode.setRenderNodeDirtyForRendering(true);
			if (selectedNode.getParent()) {
				selectedNode.getParent().setRenderNodeDirtyForRendering(true);
			}
			eventQueueDispatcher.enqueueRenderOnlyDirty()
		}
		selectedNode = this;
		this.selected = true;
		let nex = this.getNex();
		this.setInsertionMode(this.getDefaultInsertionMode(nex));
		selectedNode.setRenderNodeDirtyForRendering(true);
		if (selectedNode.getParent()) {
			selectedNode.getParent().setRenderNodeDirtyForRendering(true);
		}
		eventQueueDispatcher.enqueueRenderOnlyDirty()
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

	removeAllChildren() {
		let nc = this.numChildren();
		for (let i = 0 ; i < nc; i++) {
			this.removeFirstChild();
		}
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

