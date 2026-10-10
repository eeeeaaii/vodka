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

import * as Utils from '../utils.js'

import { NexContainer, V_DIR, H_DIR, Z_DIR } from './nexcontainer.js'
import { experiments } from '../globalappflags.js'
import { wrapError, evaluateNexSafely } from '../evaluator.js'
import { constructEString } from './estring.js'
import { constructInteger } from './integer.js'
import { constructFloat } from './float.js'
import { Tag } from '../tag.js'
import { heap } from '../heap.js'
import { constructFatalError, newTagOrThrowOOM } from './eerror.js'
import { systemState } from '../systemstate.js'
import { RenderNode } from '../rendernode.js'
import { RENDER_FLAG_RERENDER } from '../globalconstants.js'
import { BINDINGS } from '../environment.js'


class Org extends NexContainer {
	constructor() {
		super();
		// private data is currently unused but I want the logic for
		// handling it here so I can implement parsing and tests for it
		this.privateData = '';

		// if this org is instantiated as a template,
		// then it will have this set to the self-scope.
		// this is important because when this obj is freed,
		// we need to pop that scope so references can be decremented.
		this.templateInstantiationLexicalSelfScope = null;

		this.setVertical();
	}

	toString(version, ctx) {
		if (version == 'v2') {
			return this.toStringV2(ctx);
		}
		return `[org]`;
	}

	cleanupOnMemoryFree() {
		if (this.templateInstantiationLexicalSelfScope) {
			this.templateInstantiationLexicalSelfScope.finalize();
		}
	}

	rootLevelPostEvaluationStep() {
		this.setMutable(false);
	}

	prettyPrintInternal(lvl, hdir) {
		return this.standardListPrettyPrint(lvl, '[org]', hdir);
	}

	toStringV2(ctx) {
		return `${this.toStringV2Literal()}${this.toStringV2PrivateDataSection(ctx)}${this.listStartV2()}${this.toStringV2TagList()}${super.childrenToString('v2', ctx)}${this.listEndV2()}`;

	}

	/**
	 * Used by string conversion builtins.
	 */
	getValueAsString() {
		let s = '';
		for (let i = 0; i < this.numChildren(); i++) {
			if (s != '') {
				s += (this.dir == V_DIR ? '\n' : ' ');
			}
			let c = this.getChildAt(i);
			s += c.toString('v2');
		}
		return s;
	}

	deserializePrivateData(data) {
		this.privateData = data;
	}

	serializePrivateData(ctx) {
		return this.privateData;
	}

	getTypeName() {
		return '-org-';
	}

	makeCopy(shallow) {
		let r = constructOrg();
		this.copyChildrenTo(r, shallow);
		this.copyFieldsTo(r);
		return r;
	}

	hasChildTag(tag) {
		let r = false;
		this.doForEachChild(function(c) {
			if (c.hasTag(tag)) {
				r = true;
			}
		});
		return r;
	}

	getChildWithTag(tag) {
		let r = null;
		this.doForEachChild(function(c) {
			if (c.hasTag(tag)) {
				r = c;
			}
		});
		return r;
	}

	nextDir(dir) {
		switch(dir) {
			case H_DIR: return V_DIR;
			case V_DIR: return Z_DIR;
			case Z_DIR: return H_DIR;
		}
	}


	// the member a template tagged :draw, if this org has one
	// (comment by Claude)
	getDrawFunction() {
		return this.getChildWithTag(newTagOrThrowOOM('::drawfunction', 'draw function logic'));
	}

	/*
	An org with a draw function is whatever it drew, so RenderNode stops there
	and does not go on to draw the members underneath it. They are how it is
	made, not what it looks like.

	(comment by Claude)
	*/
	hasCustomDrawing() {
		return !!this.getDrawFunction();
	}

	getDirtyForRendering() {
		let customShouldDraw = this.getChildWithTag(new Tag(':shouldDraw'));
		if (customShouldDraw) {
			// ahem
			return;
		}
		if (this.hasCustomDrawing()) {
			// if you provide a draw function but not a shouldDraw, then we don't know
			// how to keep track of whether state is dirty so we assume it's
			// always dirty and redraw every time.
			return true;
		}
		return super.getDirtyForRendering();
	}

	/*
	What a draw function is allowed to hand back.

	A string is html, which is the escape hatch: whatever you can write, the
	org becomes. A doc, a line or a word is drawn as itself, which is the
	ordinary way -- you build the face out of the same pieces everything else
	in vodka is built out of, and because a value coming back from an
	evaluation is immutable, it draws in normal mode without being told to.

	An error is drawn as the error nex itself, so you can open it and see what
	actually went wrong. Flattening it to text lost that: the cause of a
	failure is the wrapped error inside, and a string keeps only the wrapper.

	(comment by Claude)
	*/
	drawCustom(renderNode, domNode, drawReturn) {
		if (Utils.isEString(drawReturn)) {
			domNode.innerHTML = drawReturn.getFullTypedValue();
			return;
		}
		if (Utils.isDocContainerType(drawReturn) || Utils.isFatalError(drawReturn)) {
			this.drawNexInto(renderNode, domNode, drawReturn);
			return;
		}
		domNode.innerHTML = '<div class="draw-error">'
				+ this.escape('a draw function must return a string, a doc, a line or'
						+ ' a word, not ' + drawReturn.getTypeName(), true)
				+ '</div>';
	}

	/*
	The face belongs to the org, so a click on it is a click on the org: the
	drawn nexes do not answer for themselves, and the event goes on up to the
	org's own handler, which is a nex in the document and can be selected.

	Except where a part of the face was given a click handler. That part is a
	button -- an x in a row of x's that turns something on and off -- and the
	click is its business.

	(comment by Claude)
	*/
	silenceClicks(nex) {
		nex.clickActive = false;
		if (nex.isNexContainer()) {
			nex.doForEachChild(c => this.silenceClicks(c));
		}
	}

	// a nex drawn in place of the org, on its own render node because it is
	// not a child of anything -- it is what the org looks like
	// (comment by Claude)
	drawNexInto(renderNode, domNode, nex) {
		this.silenceClicks(nex);
		let node = new RenderNode(nex);
		node.setRenderDepth(renderNode.getRenderDepth() + 1);
		node.render(RENDER_FLAG_RERENDER);
		domNode.innerHTML = '';
		domNode.appendChild(node.getDomNode());
	}

	renderInto(renderNode, renderFlags, withEditor) {
		let domNode = renderNode.getDomNode();

		let drawFunction = this.getDrawFunction();
		if (drawFunction) {
			// No argument: the org went in unquoted, so it arrived as an
			// evaluated copy rather than the org itself, which is no use to
			// anybody. The draw function reaches the real one through self,
			// which the template bound in its lexical scope.
			// (comment by Claude)
			let cmd = systemState.getSCF().makeCommandWithClosureZeroArgs(drawFunction);

			let drawReturn = systemState.getSCF().sEval2(cmd, BINDINGS, 'org: custom drawing function');
			this.drawCustom(renderNode, domNode, drawReturn);
		} else {
			super.renderInto(renderNode, renderFlags, withEditor);
			domNode.classList.add('org');
			domNode.classList.add('data');
			domNode.classList.add('redorgs');			
		}
	}

	/*
	should be in the superclass (nexcontainer) but it creates a circular dependency graph somehow
	*/
	evaluate(env) {
		if (this.mutable) {
			// shallow copy, then evaluate children.
			let listcopy = this.makeCopy(true);
			let iterator = null;
			this.doForEachChild(function(child) {
				let newchild = evaluateNexSafely(child, env);
				// we don't throw exceptions, we just embed them - this isn't a function.
				iterator = listcopy.fastAppendChildAfter(newchild, iterator);
			})
			listcopy.setMutable(false);
			return listcopy;
		} else {
			return this;
		}
	}



	getDefaultHandler() {
		return 'standardDefault';
	}

	getEventTable(context) {
		return {
			'Backspace': 'remove-selected-and-select-previous-sibling-if-empty',
		};
	}

	memUsed() {
		return heap.sizeOrg();
	}
}

// TODO: this is bad bcz anything that needs an org needs to pull in these other deps.
// put this in its own separate util
function convertJSMapToOrg(m) {
	let r = constructOrg();
	for (let key in m) {
		let value = m[key];
		let v = constructEString('' + value);
		if (!isNaN(value)) {
			if (Math.floor(value) == value) {
				v = constructInteger(Math.floor(value));
			} else {
				v = constructFloat(value);
			}
		}
		v.addTag(newTagOrThrowOOM(key, 'converting js map to org'));
		r.appendChild(v);
	}
	return r;
}


function constructOrg() {
	if (!heap.requestMem(heap.sizeOrg())) {
		throw constructFatalError(`OUT OF MEMORY: cannot allocate Org.
stats: ${heap.stats()}`)
	}
	return heap.register(new Org());
}

export { Org, constructOrg, convertJSMapToOrg }

