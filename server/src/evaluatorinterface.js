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
import { sHoldDeferred } from './syntheticroot.js'

import { eventQueueDispatcher } from './eventqueuedispatcher.js'
import { RenderNode, INSERT_AFTER } from './rendernode.js'
import { BINDINGS } from './environment.js'
import { experiments } from './globalappflags.js'
import { manipulator } from './manipulator.js'
import { evaluateNexSafely } from './evaluator.js'


// TODO(#264): this file used to call n.rootLevelPostEvaluationStep() in
// evaluateAndReplace and evaluateAndKeep, which is what made root-level
// evaluation results immutable. Those calls were removed in e6a7884 (May 2022)
// alongside the expectations cleanup, seemingly by accident. As a result only
// self-evaluating values come back immutable and builtin results stay mutable.
// Decide whether to restore this before doing anything else with mutability.

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
 * This method is used to evaluate a Nex and keep the code rather than replacing
 * it with the result. An error thrown while evaluating is prepended to the
 * parent of the selected node, before the selected node.
 *
 * The result itself is not wanted, but a deferred result cannot simply be
 * dropped: it is still running, and it is not in the document, so nothing would
 * ever show what it came back with -- which is how a failed save reported
 * nothing at all. sHoldDeferred gives it to the engine to hold, and an error it
 * finishes with goes to the top of the document.
 *
 * @param {RenderNode} s = the RenderNode to evaluate
 */
function evaluateAndKeep(s) {
	let n = evaluateNexSafely(s.getNex(), BINDINGS);
	if (Utils.isFatalError(n)) {
		Utils.beep();
		manipulator.insertBeforeSelectedAndSelect(new RenderNode(n));
	} else {
		sHoldDeferred(n);
	}

	eventQueueDispatcher.enqueueAlertAnimation(s);
}

/*
A deferred value in the document has finished, so the wrapper comes out and what
it holds takes its place, right where the wrapper was. This is what pressing
enter on a finished one does; doing it on finish means the two ways a deferred
value gets unwrapped -- as an argument to a deferred command, and as something
sitting in a document -- agree with each other, which they did not before: an
argument was collected for you and a document was left holding a wrapper.

Every render node of it, because the same nex can be in the document more than
once. One with no parent is not in a document -- an argument, or the root -- and
is left alone.

Selection follows the answer if it was on the wrapper, so the pip does not
vanish out from under someone who was sitting on the thing they were waiting
for.
*/
function unwrapFinishedDeferredInDocument(deferred) {
	let nodes = deferred.getRenderNodes();
	if (!nodes || nodes.length == 0) return;
	// once, however many places it is rendered in -- what it holds is one nex
	let result = evaluateNexSafely(deferred, BINDINGS);
	if (!result || result == deferred) return;
	// a copy of the list: replacing a node takes it out of the one we are walking
	nodes = nodes.slice();
	for (let i = 0; i < nodes.length; i++) {
		let node = nodes[i];
		let parent = node.getParent();
		if (!parent) continue;
		let wasSelected = node.isSelected();
		let newNode = parent.replaceChildWith(node, new RenderNode(result));
		if (wasSelected && newNode) {
			newNode.setSelected();
		}
	}
	eventQueueDispatcher.enqueueRenderOnlyDirty();
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
	unwrapFinishedDeferredInDocument,
	evaluateAndReturn
}
