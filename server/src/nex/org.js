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
import { heap } from '../heap.js'
import { constructFatalError, newTagOrThrowOOM } from './eerror.js'
import { systemState } from '../systemstate.js'
import { RENDERED_TAG } from '../globalconstants.js'
import { BINDINGS } from '../environment.js'


/*
Tags made once each. getChildWithTag needs a Tag to compare against, and a
tag's string is charged to the heap when it is set and given back when the tag
is freed -- so building a fresh one every time anybody asks whether an org has
a drawing spends heap that nothing ever returns.

(comment by Claude)
*/
let theTags = {};

function theTag(s, context) {
	if (!theTags[s]) {
		theTags[s] = newTagOrThrowOOM(s, context);
	}
	return theTags[s];
}

function drawFunctionTag() {
	return theTag('::drawfunction', 'draw function logic');
}

function renderedTag() {
	return theTag(RENDERED_TAG, 'the drawing of an org');
}

function shouldDrawTag() {
	return theTag(':shouldDraw', 'whether to draw an org again');
}


class Org extends NexContainer {
	constructor() {
		super();
		// private data is currently unused but I want the logic for
		// handling it here so I can implement parsing and tests for it
		this.privateData = '';

		// an org that has never been drawn needs drawing
		// (comment by Claude)
		this.drawingIsStale = true;

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
		return this.getChildWithTag(drawFunctionTag());
	}

	/*
	The drawing: an org's first child, wearing the `:rendered` tag.

	It is an ordinary nex in the ordinary tree, which is the whole point. The
	drawing used to be painted through a render node that was a child of
	nothing, so selection, traversal, dirty tracking and undo could not see it,
	and a click handler a draw function set up was thrown away every time the
	face was rebuilt. A real child is reached by all of that machinery for
	free.

	First child, and the tag, and nothing else: the rule is mechanical so that
	you can put a `:rendered` doc there by hand and get a face without writing
	a draw function at all. An org with no `:draw` member is never visited by
	the draw pass, so a face you wrote yourself is never regenerated.

	(comment by Claude)
	*/
	getDrawing() {
		if (this.numChildren() == 0) return null;
		let first = this.getChildAt(0);
		return first.hasTag(renderedTag()) ? first : null;
	}

	/*
	An org that has a drawing is that drawing, so RenderNode draws only the
	first child and nothing descends into it. The other children are how it is
	made, not what it looks like.

	(comment by Claude)
	*/
	hasCustomDrawing() {
		return !!this.getDrawing();
	}

	/*
	Whether the draw pass should run `:draw` again.

	Ordinarily: when something changed the org. `set self.yesorno T` reaches
	Environment.set, which replaces the member in place, which calls changed()
	-- so state moving marks the drawing stale and nothing has to say so.

	A `:shouldDraw` member overrides that and is asked instead. Anything but
	true means no: a member that answers with nil, or with nothing at all,
	means do not draw, because the alternative -- treating "I could not tell"
	as yes -- is an org that redraws for ever.

	(comment by Claude)
	*/
	shouldDraw() {
		let shouldDrawFunction = this.getChildWithTag(shouldDrawTag());
		if (!shouldDrawFunction) {
			return this.drawingIsStale;
		}
		if (shouldDrawFunction.getTypeName() != '-closure-') {
			return false;
		}
		let cmd = systemState.getSCF().makeCommandWithClosureZeroArgs(shouldDrawFunction);
		let r = systemState.getSCF().sEval2(cmd, BINDINGS, 'org: shouldDraw');
		return !!(r && r.getTypeName() == '-bool-' && r.getTypedValue());
	}

	/*
	Run the draw function and keep what it gives back.

	Called by the draw pass, which runs before rendering and never during it.
	Drawing is evaluation -- it allocates, it can settle a deferred, it can
	fail -- and evaluation inside a render pass is how a render asks for the
	render that asks again.

	Whatever comes back is used, whatever it is. An error becomes the face and
	is therefore visible and openable rather than lost. Putting the drawing in
	does not mark the drawing stale, or every pass would ask for another one.

	(comment by Claude)
	*/
	refreshDrawing() {
		let drawFunction = this.getDrawFunction();
		if (!drawFunction) return;
		// No argument: an org passed to a command goes in unquoted, so it
		// would arrive as an evaluated copy. A draw function reaches the real
		// one through self, which the template bound in its lexical scope.
		// (comment by Claude)
		let cmd = systemState.getSCF().makeCommandWithClosureZeroArgs(drawFunction);
		let drawing = systemState.getSCF().sEval2(cmd, BINDINGS, 'org: custom drawing function');
		this.setDrawing(drawing);
	}

	setDrawing(drawing) {
		if (!drawing.hasTag(renderedTag())) {
			drawing.addTag(newTagOrThrowOOM(RENDERED_TAG, 'the drawing of an org'));
		}
		let old = this.getDrawing();
		if (old == drawing) {
			this.drawingIsStale = false;
			return;
		}
		if (old) {
			this.replaceChildAt(drawing, 0);
		} else {
			this.prependChild(drawing);
		}
		// the drawing is the answer to staleness, not another cause of it
		// (comment by Claude)
		this.drawingIsStale = false;
	}

	// an org showing a drawing is drawn as that drawing and nothing else; the
	// members are how it is made, not what it looks like
	// (comment by Claude)
	getChildArrayForRendering() {
		let drawing = this.getDrawing();
		return drawing ? [ drawing ] : this.getChildArray();
	}

	// nothing goes inside an org that is showing a drawing; what you would be
	// putting it next to is not on the screen
	// (comment by Claude)
	canDoInsertInside() {
		return !this.hasCustomDrawing();
	}

	// anything that changes an org makes its drawing out of date, which is
	// what lets `set self.x` redraw a face without saying so
	// (comment by Claude)
	changed() {
		this.drawingIsStale = true;
		super.changed();
	}

	renderInto(renderNode, renderFlags, withEditor) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags, withEditor);
		if (this.hasCustomDrawing()) {
			domNode.classList.add('drawnorg');
			return;
		}
		domNode.classList.add('org');
		domNode.classList.add('data');
		domNode.classList.add('redorgs');
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

