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
import { RenderNode, INSERT_AFTER } from './rendernode.js'
import { BINDINGS } from './environment.js'
import { experiments } from './globalappflags.js'
import { manipulator } from './manipulator.js'
import { evaluateNexSafely } from './evaluator.js'


/**
 * This method is used for when you want to evaluate the Nex inside a RenderNode
 * and replace the RenderNode with the result of the computation.
 *
 * @param {RenderNode} s - the RenderNode to evaluate and replace (probably the selected node)
 */
function evaluateAndReplace(s) {

	let n = evaluateNexSafely(s.getNex(), BINDINGS);
	if (Utils.isFatalError(n)) {
		Utils.beep();
		if (!experiments.ERRORS_REPLACE) {
			manipulator.insertBeforeSelectedAndSelect(new RenderNode(n));
			return;
		}
	}

	if (n) {
		manipulator.replaceSelectedWith(new RenderNode(n));
	}
}

/**
 * This method is used to evaluate a Nex and throw away the result. Obviously only
 * useful if evaluating the Nex has side effects. If it returns an error, the error
 * will be prepended to the parent of the selected node before the selected node.
 *
 * @param {RenderNode} s = the RenderNode to evaluate
 */
function evaluateAndKeep(s) {
	let n = evaluateNexSafely(s.getNex(), BINDINGS);
	if (Utils.isFatalError(n)) {
		Utils.beep();
		manipulator.insertBeforeSelectedAndSelect(new RenderNode(n));
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
