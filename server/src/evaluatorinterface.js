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

import { eventQueueDispatcher } from './eventqueuedispatcher.js'
import { RenderNode } from './rendernode.js'
import { BINDINGS } from './environment.js'
import { experiments } from './globalappflags.js'
import { manipulator } from './manipulator.js'
import { evaluateNexSafely } from './evaluator.js'


/**
 * This method is used for when you want to evaluate the Nex inside a RenderNode
 * and replace the RenderNode with the result of the computation. If it returns
 * an expectation we activate it. We also emit a beep if it's an error.
 *
 * @param {RenderNode} s - the RenderNode to evaluate and replace (probably the selected node)
 */
function evaluateAndReplace(s) {
	let n = evaluateNexSafely(s.getNex(), BINDINGS);
	if (Utils.isFatalError(n)) {
		Utils.beep();
		// don't replace, since we don't have a functional undo, and users might like to fix and try again.
		manipulator.insertBeforeSelectedAndSelect(n);
		return;
	}

	if (n.getTypeName() == '-expectation-' && !n.isActivated()) {
	// ONLY AT TOP LEVEL we activate expectations.
		n.activate();
	} else if (shouldConvertToNonmutable(n)) {
		n.setMutable(false);
	}
	if (n) {
		manipulator.replaceSelectedWith(new RenderNode(n));
	}
}

function shouldConvertToNonmutable(nex) {
	return nex && (Utils.isBool(nex) ||
			Utils.isEString(nex) ||
			Utils.isFloat(nex) ||
			Utils.isInteger(nex))
}

/**
 * This method is used to evaluate a Nex and throw away the result. Obviously only
 * useful if evaluating the Nex has side effects. If it returns an error, the error
 * will be prepended to the parent of the selected node before the selected node.
 * If an expectation is returned, it is activated.
 *
 * This currently has a hack where it looks for errors in the children of returned
 * expectations. It's not clear this is the right way to do this since the expectation could have an
 * arbitrary number of children
 *
 * @param {RenderNode} s = the RenderNode to evaluate
 */
function evaluateAndKeep(s) {
	let n = evaluateNexSafely(s.getNex(), BINDINGS);
	if (Utils.isFatalError(n)) {
		Utils.beep();
		manipulator.insertBeforeSelectedAndSelect(n);
	} else if (Utils.isExpectation(n)) {
		if (!n.isActivated()) {
			// ONLY AT TOP LEVEL we activate expectations.
			n.activate();
		}
		n.addPendingCallback(function() {
			if (n.hasChildren() && Utils.isFatalError(n.getChildAt(0))) {
				Utils.beep();
				manipulator.insertBeforeSelectedAndSelect(n);
				//eventQueueDispatcher.enqueueTopLevelRender();
				eventQueueDispatcher.enqueueRenderOnlyDirty()
			}
		})
	}
	eventQueueDispatcher.enqueueAlertAnimation(s);
}

function evaluateAndCopy(s) {
	let n = evaluateNexSafely(s.getNex(), BINDINGS);
	if (n) {
		manipulator.replaceSelectedWith(new RenderNode(n));
	}
}

// used by the repl
function evaluateAndReturn(nex) {
	let n = evaluateNexSafely(nex, BINDINGS);
	return n;
}



export {
	evaluateAndReplace,
	evaluateAndCopy,
	evaluateAndKeep,
	evaluateAndReturn
}
