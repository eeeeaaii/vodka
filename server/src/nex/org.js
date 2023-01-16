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

	toString(version) {
		if (version == 'v2') {
			return this.toStringV2();
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

	toStringV2() {
		return `${this.toStringV2Literal()}${this.toStringV2PrivateDataSection()}${this.listStartV2()}${this.toStringV2TagList()}${super.childrenToString('v2')}${this.listEndV2()}`;

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

	serializePrivateData(data) {
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


	getDirtyForRendering() {
		let customShouldDraw = this.getChildWithTag(new Tag(':shouldDraw'));
		if (customShouldDraw) {
			// ahem
			return;
		}
		let drawFunction = this.getChildWithTag(new Tag('::draw'));
		if (drawFunction) {
			// if you provide a draw function but not a shouldDraw, then we don't know
			// how to keep track of whether state is dirty so we assume it's
			// always dirty and redraw every time.
			return true;
		}
		return super.getDirtyForRendering();
	}

	renderInto(renderNode, renderFlags, withEditor) {
		let domNode = renderNode.getDomNode();

		let drawFunction = this.getChildWithTag(newTagOrThrowOOM('::drawfunction', 'draw function logic'));
		if (drawFunction) {
			let cmd = systemState.getSCF().makeCommandWithClosureOneArg(drawFunction, this);

			let drawReturn = systemState.getSCF().sEval2(cmd, BINDINGS, 'org: custom drawing function');
			let drawHTML = '<div class="draw-error">ERROR: invalid result from custom draw function.<div>';
			if (Utils.isEString(drawReturn)) {
				drawHTML = drawReturn.getFullTypedValue();
			} else if (Utils.isFatalError(drawReturn)) {
				drawHTML = '<div class="draw-error">' + drawReturn.getFullTypedValue() + '</div>'
			}
			domNode.innerHTML = drawHTML;
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

