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

function setNextNexId(val) {
	NEXT_NEX_ID = val;
}

import { systemState } from '../systemstate.js'
import { eventQueueDispatcher } from '../eventqueuedispatcher.js'
import { RENDER_FLAG_SELECTED, RENDER_FLAG_SHALLOW, RENDER_FLAG_NORMAL, RENDER_FLAG_RERENDER, RENDER_FLAG_EXPLODED, RENDER_FLAG_DEPTH_EXCEEDED } from '../globalconstants.js'
import { checkRecordState } from '../testrecorder.js'

/**
 * This is the parent class for all nexes, aka pieces of vodka code, aka s-expressions.
 */
class Nex {
	/**
	 * Creates a Nex.
	 */
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

    /**
     * Returns this nex as a string.
     *
     * @deprecated use debugString or prettyPrint instead.
     * @returns {string} string representation of the nex.
     */
	toString() {}

	/**
	 * When pretty printing a vertical nex, members are separated by carriage returns and
	 * some number of tabs (for horizontal nexes, members are just separated by spaces).
	 * This (misnamed) method inserts the appropriate separator between members depending
	 * on whether it's a horizontal or vertical nex.
	 *
	 * @param {number} n number of tabs to insert (if inserting tabs)
	 * @param {boolean} hdir true if horizontal nex printing algorithm, false if vertical
	 * @returns {string} the appropriate separator string
	 * @todo rename to something like 'insertMemberSeparator'
	 * @protected
	 */
	doTabs(n, hdir) {
		if (hdir) return ' '; // exp
		let r = '\n'; // exp
		for (let i = 0; i < n; i++) {
			r += '   ';
		}
		return r;
	}

	prettyPrint(lvl) {
		if (!lvl) {
			lvl = 0;
		}
		return this.prettyPrintInternal(lvl, true);
	}

	prettyPrintInternal(lvl, hdir) {
		let str = this.debugString();
		return this.doTabs(lvl, hdir) + str;// exp // + '\n';
	}

	escape(str) {
		str = str.replace(/&/g, "&amp;");
		str = str.replace(/</g, "&lt;");
		str = str.replace(/>/g, "&gt;");
		str = str.replace(/"/g, "&quot;");
		str = str.replace(/'/g, "&apos;");
		str = str.replace(/ /g, "&nbsp;");
		str = str.replace(/\n/g, "<br>");
		str = str.replace(/\r/g, "<br>");
		return str;
	}


	toStringV2PrivateDataSection() {
		let v = this.serializePrivateData();
		if (v == '') {
			return '';
		}

		// if this string contains \r, \t, ", {, }, or |, we put the contents in braces,
		// escaping it... otherwise we just use quotes
		if (v.indexOf('\n') >= 0
				|| v.indexOf('\t') >= 0
				|| v.indexOf('\r') >= 0
				|| v.indexOf('"') >= 0
				|| v.indexOf('{') >= 0
				|| v.indexOf('|') >= 0
				|| v.indexOf('}') >= 0) {
			v = v.replace(/\|/g, '||');
			v = v.replace(/\}/g, '|}');
			v = v.replace(/\{/g, '|{');
			return '{' + v + '}';
		} else {
			return '"' + v + '"';
		}
	}

	toStringV2TagList() {
		if (this.numTags() == 0) {
			return '';
		}
		let s = '<';
		for (let i = 0; i < this.numTags(); i++) {
			let tag = this.getTag(i);
			if (s != '<') {
				s += ' ';
			}
			s += '`' + tag.toString() + '`';
		}
		return s + '>';
	}

	/**
	 * Parses any private data that this nex has stored in the file.
	 * @see {@link serializePrivateData}
	 */
	deserializePrivateData(data) {
	}

    /**
     * Serializes private data. The vodka file format is very bare bones,
     * and individual nexes do not get saved out with much more than their
     * name and their children (if they are {@link NexContainer}s). For
     * that reason, if the nex has any special data that it needs to save
     * in the file, this needs to get serialized to the "private data"
     * section. When overriding this function, you can just return the data.
     * Escaping will be handled for you.
     * @returns {string} the serialized private data.
     */
	serializePrivateData() {
		return '';
	}

	debugString() {
		return this.toString('v2');
	}

	/**
	 * Function that returns a string with the type of the nex. Useful because
	 * "instance of" checks in JS are expensive.
	 * @returns {string} a string that gives the type name.
	 */
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
		if (this.lastRenderPassNumber == systemState.getGlobalRenderPassNumber()) {
			// this node has been rendered before in this pass!
			// if this is the first dupe, we go back to the first one
			// and prepend the object tag.
			if (this.rendernodes.length == 1) {
				this.prependObjectTag(this.rendernodes[0]);
			}
			this.rendernodes.push(renderNode);
			this.prependObjectTag(renderNode);
		} else {
			this.rendernodes = [ renderNode ];
			this.lastRenderPassNumber = systemState.getGlobalRenderPassNumber();
			// for now we assume there will be only one render,
			// do not prepend.
		}
	}

	renderOnlyThisNex() {
		for (let i = 0; i < this.rendernodes.length; i++) {
			let flags = systemState.getGlobalCurrentDefaultRenderFlags();
			flags &= (~RENDER_FLAG_NORMAL);
			flags &= (~RENDER_FLAG_EXPLODED);

			eventQueueDispatcher.enqueueRenderNodeRender(
					this.rendernodes[i],
					flags
					| (this.rendernodes[i].isExploded() ? RENDER_FLAG_EXPLODED : RENDER_FLAG_NORMAL)
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
		nex.setCurrentStyle(this.currentStyle);
		nex.copiedFromID = this.id;
		for (let i = 0; i < this.tags.length; i++) {
			nex.tags[i] = this.tags[i].copy();
		}
	}

	needsEvaluation() {
		return false;
	}

	// Tag functions

	addTag(tag) {
		if (this.hasTag(tag)) return;
		this.tags.push(tag);
	}

	addTagAtStart(tag) {
		if (this.hasTag(tag)) return;
		this.tags.unshift(tag);		
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

	removeTagByReference(tag) {
		for (let i = 0; i < this.tags.length; i++) {
			if (this.tags[i] == tag) {
				this.tags.splice(i, 1);
				return;
			}
		}
	}

	numTags() {
		return this.tags.length;
	}

	/**
	 * Gives you the number of tags that are equal to the passed-in tag.
	 * Used for validation, because users can't enter duplicate tags.
	 *
	 * @todo: change to just return whether or not a tag is present.
	 * @returns {bool} the number of tags equal to a given tag.
	 */
	numTagsEqualTo(tag) {
		let ct = 0;
		for (let i = 0; i < this.tags.length; i++) {
			if (this.tags[i].equals(tag)) {
				ct++;
			}
		}
		return ct;
	}

	/**
	 * Retrieves the tag object for a given tag string.
	 *
	 * @todo add error checking
	 * @param {string} tag text
	 * @returns {Tag} the tag
	 */
	getTag(n) {
		// TODO: error checking
		return this.tags[n].copy();
	}

	// by reference
	getTagAfter(tag) {
		for (let i = 0; i < this.tags.length; i++) {
			if (this.tags[i] == tag && i < this.tags.length - 1) {
				return this.tags[i + 1];
			}
		}
		return null;
	}

	// by reference
	getTagBefore(tag) {
		for (let i = 0; i < this.tags.length; i++) {
			if (this.tags[i] == tag && i >= 1) {
				return this.tags[i - 1];
			}
		}
		return null;
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
		return this.makeCopy();
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

	setPfont(pfstring) {
		// no op unless letter?
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

	_setClickHandler(renderNode) {
		renderNode.getDomNode().onmousedown = (event) => {
			checkRecordState(event, 'mouse');
			eventQueueDispatcher.enqueueDoClickHandlerAction(this, renderNode, event)
			event.stopPropagation();
		};
	}

	renderInto(renderNode, renderFlags, withEditor) {
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
		domNode.setAttribute("style", this.getCurrentStyle());
		if (renderFlags & RENDER_FLAG_DEPTH_EXCEEDED) {
			this.clearDomNode(domNode);
		}
	}

	/**
	 * Renders the tags for a nex.
	 *
	 * @param {Node} domNode the dom node to draw into
	 * @param {number} renderFlags bit mask holding render flag values
	 * @param {Editor} editor currently unused
	 */
	renderTags(domNode, renderFlags, editor) {
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



if (typeof module !== 'undefined' && module.exports) module.exports = { Nex: Nex }


export { Nex, setNextNexId, NEXT_NEX_ID }

