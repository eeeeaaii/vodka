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
import { systemState } from './systemstate.js'
import { experiments } from './globalappflags.js'
import { manipulator } from './manipulator.js'
import { recordPerformedAction, UnwrapDeferredAction } from './actions.js'
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
for -- and because the selection moving is exactly what the undo stack has to
know about, the whole thing goes on the stack as an action.

(comment by Claude)
*/
function unwrapFinishedDeferredInDocument(deferred) {
	let nodes = deferred.getRenderNodes();
	if (!nodes || nodes.length == 0) return;
	// once, however many places it is rendered in -- what it holds is one nex
	// (comment by Claude)
	let result = evaluateNexSafely(deferred, BINDINGS);
	if (!result || result == deferred) return;
	// a copy of the list: replacing a node takes it out of the one we are walking
	// (comment by Claude)
	nodes = nodes.slice();
	let replacements = [];
	for (let i = 0; i < nodes.length; i++) {
		let wrapperNode = nodes[i];
		let parent = wrapperNode.getParent();
		if (!parent) continue;
		let wasSelected = wrapperNode.isSelected();
		let index = parent.getIndexOfChild(wrapperNode);
		let answerNode = parent.replaceChildWith(wrapperNode, new RenderNode(result));
		if (!answerNode) continue;
		if (wasSelected) {
			answerNode.setSelected();
		}
		replacements.push({
			parent: parent,
			index: index,
			wrapperNode: wrapperNode,
			answerNode: answerNode,
			wasSelected: wasSelected
		});
	}
	if (replacements.length == 0) return;
	recordPerformedAction(new UnwrapDeferredAction(deferred, replacements));
	markPipDirty();
	eventQueueDispatcher.enqueueRenderOnlyDirty();
}

/*
The pip is drawn by the parent of whatever is selected, into the parent's own
dom -- see doInsertionPip -- so a change anywhere under that parent has to mark
the parent dirty or the pip is not put back and the document ends up with no
insertion point at all until something else happens to render.

Replacing a child marks the child's own parent, which is not necessarily the
parent that draws the pip: a deferred value finishing deep inside a list leaves
the selection, and the pip, somewhere else entirely.

(comment by Claude)
*/
function markPipDirty() {
	let selected = systemState.getGlobalSelectedNode();
	if (!selected) return;
	let parent = selected.getParent();
	if (parent) {
		parent.setRenderNodeDirtyForRendering(true);
	}
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
