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
import { heap } from './heap.js';
import { KeyResponseFunctions, DefaultHandlers } from './keyresponsefunctions.js';
import { manipulator } from './manipulator.js';
import { constructWarning } from './nex/eerror.js';
// estring and eerror each declare this, with the same value; one of them will do
// (comment by Claude)
import { MODE_EXPANDED } from './nex/estring.js';
import { scheduleAutosave } from './autosave.js'
import { eventQueueDispatcher } from './eventqueuedispatcher.js'

const levelsOfUndo = 50;

const actionStack = [];

let nextPosition = 0;
let queueBottom = 0;
let queueTop = 0;
let numItemsInQueue = 0;
/*
How far back undo has walked. Needed because the ring cannot say on its own:
once the buffer is full, nextPosition and queueBottom are the same slot whether
there are fifty things to undo or none, and undo walked straight past the
bottom and undid already-undone actions a second time.

(comment by Claude)
*/
let undosDeep = 0;

function advance(queuePos) {
	return (queuePos + 1) % levelsOfUndo;
}

function retreat(queuePos) {
	let p = queuePos - 1;
	if (p < 0) {
		return p + levelsOfUndo;
	} else {
		return p;
	}
}

/*
What an action is holding so it can be undone.

Its saved state is on its own fields, as render nodes or as nexes, so they are
found by looking rather than by every action having to declare them. Children
are refcounted through their parent, so holding the top of a detached subtree
holds all of it.

(comment by Claude)
*/
function nexesHeldBy(action) {
	let r = [];
	for (let k in action) {
		let v = action[k];
		if (!v || typeof v != 'object') continue;
		if (typeof v.getNex == 'function') {
			let n = v.getNex();
			if (n) r.push(n);
		} else if (typeof v.getTypeName == 'function' && v.references !== undefined) {
			r.push(v);
		}
	}
	return r;
}

/*
Something in the undo buffer has to be counted, or the heap frees what undo is
still holding -- and being freed is no longer only bookkeeping: a wavetable
forgets its samples when it goes, so an uncounted reference is a wavetable that
comes back silent.

It is counted separately from real references, because holding what you deleted
is not the same as using it. Anything asking whether a nex is still wanted has
to be told no while undo is still holding it: see heap.addUndoReference.

Falling off the end of the buffer is therefore the other moment something can
become free, which is why the slot is released before it is written over. That
covers a discarded redo tail as well, since those slots are overwritten too.

(comment by Claude)
*/
function retainActionNexes(action) {
	let held = nexesHeldBy(action);
	for (let i = 0; i < held.length; i++) {
		heap.addUndoReference(held[i]);
	}
	action.heldNexes = held;
}

function releaseActionNexes(action) {
	if (!action || !action.heldNexes) return;
	for (let i = 0; i < action.heldNexes.length; i++) {
		heap.removeUndoReference(action.heldNexes[i]);
	}
	action.heldNexes = null;
}

/*
Putting an action in the next slot, without running it. The two callers differ
only in whether the work has happened yet: a key or a click hands over something
still to do, while a deferred value finishing or an editor failing hands over
something that already happened and only needs to be undoable.

(comment by Claude)
*/
function pushActionSlot(action) {
	// whatever was in this slot is falling out of the buffer
	// (comment by Claude)
	releaseActionNexes(actionStack[nextPosition]);
	actionStack[nextPosition] = action;
	if (nextPosition == queueTop) {
		queueTop = advance(queueTop);
		nextPosition = advance(nextPosition);
		if (numItemsInQueue == levelsOfUndo) {
			queueBottom = advance(queueBottom);
		} else {
			numItemsInQueue++;
		}
	} else {
		/*
		Acting after an undo abandons everything ahead of us. Those entries
		describe a document that no longer exists, and redo would replay them
		onto this one -- the comment above claimed overwriting the slot covered
		it, but only this one slot is overwritten, not the rest of the tail.

		(comment by Claude)
		*/
		nextPosition = advance(nextPosition);
		for (let p = nextPosition; p != queueTop; p = advance(p)) {
			releaseActionNexes(actionStack[p]);
			actionStack[p] = null;
			numItemsInQueue--;
		}
		queueTop = nextPosition;
	}
	undosDeep = 0;
}

function enqueueAndPerformAction(action) {
	/*
	All of it inside one heap action, because between taking a nex out of the
	document and undo taking hold of it there is a gap where nothing holds it at
	all. See heap.beginAction: inside, letting go of the last reference stops a
	nex without freeing it, so what undo is about to ask for is still there when
	it asks.

	The slot is claimed after doAction rather than before, so that an action
	which did nothing never takes one. That also means a doAction that throws
	leaves no entry behind, which is what you want: there is nothing to undo.

	(comment by Claude)
	*/
	heap.beginAction();
	try {
		action.doAction();
		if (!action.didSomething()) {
			return;
		}
		pushActionSlot(action);
		// after doAction, which is where an action captures what it is holding
		// (comment by Claude)
		retainActionNexes(action);
	} finally {
		heap.endAction();
	}
	scheduleAutosave(systemState.getRoot());
}

/*
Something changed the document that nobody asked for -- a deferred value
finished and put its answer where it stood, an editor threw and left an error
in place of what was being edited. Those are changes like any other, and an
undo stack that does not know about them walks back to an action describing a
document that no longer exists.

Recorded rather than performed, because it has already happened. Redoing it
runs doAction the ordinary way.

(comment by Claude)
*/
function recordPerformedAction(action) {
	pushActionSlot(action);
	retainActionNexes(action);
	scheduleAutosave(systemState.getRoot());
}


function redo() {
	if (nextPosition != queueTop) {
		// the same gap as in enqueueAndPerformAction: a redo deletes again
		// (comment by Claude)
		heap.beginAction();
		try {
			actionStack[nextPosition].doAction();
		} finally {
			heap.endAction();
		}
		nextPosition = advance(nextPosition);
		undosDeep--;
		scheduleAutosave(systemState.getRoot());
	} else {
		console.log('cannot redo');
	}
}

function undo() {
	// nothing recorded yet, or undo has already reached the oldest thing the
	// buffer still holds. Without this, the first ctrl-z of a session reads an
	// empty slot and throws.
	// (comment by Claude)
	if (undosDeep >= numItemsInQueue) {
		console.log('cannot undo');
		return;
	}
	let pos = retreat(nextPosition);
	if (actionStack[pos] && actionStack[pos].canUndo()) {
		nextPosition = pos;
		undosDeep++;
		heap.beginAction();
		try {
			actionStack[nextPosition].undoAction();
		} finally {
			heap.endAction();
		}
		scheduleAutosave(systemState.getRoot());
	} else {
		console.log('cannot undo');
	}
}

/*
An action that turns out to have changed nothing must not go on the stack.
Pressing undo and watching nothing happen is worse than not being able to undo:
the entry is spent, the selection does not move, and the change actually being
reached for is one press further back than it looks.

Asked after doAction rather than before, because whether a keystroke does
anything is usually only known once it has been tried -- an arrow at the end of
a list, a click on what is already selected, a character the default handler
has no use for.

(comment by Claude)
*/
class Action {
	constructor(actionName) {
		this.actionName = actionName;
	}

	canUndo() { };
	doAction() { };
	undoAction() { };

	didSomething() {
		return true;
	}
}


// it doesn't matter what node was selected when the action was created,
// what matters is what is the currently selected node.
// If you want to undo and then redo, by the time you are redoing something,
// the selected node will be different - so we don't save the source node
// that generated the action.

class NoOpAction extends Action {
	constructor(actionName) {
		super(actionName);
	}

	canUndo() {
		return true;
	}

	didSomething() {
		return false;
	}

	doAction() {
	}

	undoAction() {
	}
}


class TagEditorContentChangeAction extends Action {
	constructor(actionName) {
		super(actionName);
	}

	canUndo() {
		return true;
	}

	doAction() {
		let selectedNode = systemState.getGlobalSelectedNode();
		let fakeEditor = selectedNode.getTagEditorForType(selectedNode.nex);
		this.savedEditorData = fakeEditor.getStateForUndo();
		KeyResponseFunctions[this.actionName](selectedNode);
	}

	undoAction() {
		let selectedNode = systemState.getGlobalSelectedNode();
		let fakeEditor = selectedNode.getTagEditorForType(selectedNode.nex);
		fakeEditor.setStateForUndo(this.savedEditorData);
	}
}

class EditorContentChangeAction extends Action {
	constructor(actionName) {
		super(actionName);
	}

	canUndo() {
		return true;
	}

	doAction() {
		let selectedNode = systemState.getGlobalSelectedNode();
		let fakeEditor = selectedNode.getEditorForType(selectedNode.nex);
		if (fakeEditor) {
			this.savedEditorData = fakeEditor.getStateForUndo();
		}
		KeyResponseFunctions[this.actionName](selectedNode);
	}

	undoAction() {
		// if you don't save the node, here's how this can break:
		// exiting the editor changes what node is selected
		// then you try to undo, and the correct thing isn't selected.
		let selectedNode = systemState.getGlobalSelectedNode();
		let fakeEditor = selectedNode.getEditorForType(selectedNode.nex);
		if (fakeEditor) {
			fakeEditor.setStateForUndo(this.savedEditorData);
		}
	}
}

class UnrollAction extends Action {
	constructor(actionName) {
		super(actionName);
	}

	canUndo() {
		return true;
	}

	doAction() {
		this.savedContainer = systemState.getGlobalSelectedNode();
		this.allSavedChildren = [];
		for (let i = 0; i < this.savedContainer.numChildren(); i++) {
			this.allSavedChildren.push(this.savedContainer.getChildAt(i));
		}
		this.parentOfContainer = this.savedContainer.getParent();
		this.index = this.parentOfContainer.getIndexOfChild(this.savedContainer);

		KeyResponseFunctions[this.actionName](systemState.getGlobalSelectedNode());
	}

	undoAction() {
		this.parentOfContainer.removeChildAt(this.index);
		for (let i = 0; i < this.allSavedChildren.length; i++) {
			this.savedContainer.appendChild(this.allSavedChildren[i]);
		}
		this.parentOfContainer.insertChildAt(this.savedContainer, this.index);
		this.savedContainer.setSelected();
	}
}

class WrapInNewParentNodeAction extends Action {
	constructor(actionName) {
		super(actionName);
	}

	canUndo() {
		return true;
	}

	doAction() {
		this.savedChildNode = systemState.getGlobalSelectedNode();
		this.savedInsertionMode = this.savedChildNode.getInsertionMode();
		KeyResponseFunctions[this.actionName](systemState.getGlobalSelectedNode());
		this.newNode = manipulator.getMostRecentInsertedRenderNode();

		if (this.editorDataSavedForRedo) {
			let fakeEditor = this.newNode.getEditorForType(this.newNode.nex);
			if (fakeEditor) {
				fakeEditor.setStateForUndo(this.editorDataSavedForRedo);
			}
		}
	}

	undoAction() {

		let fakeEditor = this.newNode.getEditorForType(this.newNode.nex);
		if (fakeEditor) {
			this.editorDataSavedForRedo = fakeEditor.getStateForUndo();
		} else {
			this.editorDataSavedForRedo = null;
		}

		let p = this.newNode.getParent();
		let index = p.getIndexOfChild(this.newNode);
		manipulator.removeNex(this.newNode);
		p.insertChildAt(this.savedChildNode, index);
		this.savedChildNode.setInsertionMode(this.savedInsertionMode);
		this.savedChildNode.setSelected();
	}
}


class InsertNewChildNodeAction extends Action {
	constructor(actionName) {
		super(actionName);
	}

	canUndo() {
		return true;
	}

	doAction() {
		this.savedSelectedNode = systemState.getGlobalSelectedNode();
		this.savedInsertionMode = systemState.getGlobalSelectedNode().getInsertionMode();
		this.insertedBefore = manipulator.getMostRecentInsertedRenderNode();
		KeyResponseFunctions[this.actionName](systemState.getGlobalSelectedNode());
		/*
		getMostRecentInsertedRenderNode is the last one inserted by anybody, not
		by this call. Without comparing, a keystroke that inserted nothing takes
		the node some earlier keystroke inserted, and undoing removes that one --
		the wrong nex, not merely a wasted entry.

		(comment by Claude)
		*/
		let insertedNow = manipulator.getMostRecentInsertedRenderNode();
		this.newNode = (insertedNow && insertedNow != this.insertedBefore) ? insertedNow : null;

		if (this.newNode && this.editorDataSavedForRedo) {
			let fakeEditor = this.newNode.getEditorForType(this.newNode.nex);
			if (fakeEditor) {
				fakeEditor.setStateForUndo(this.editorDataSavedForRedo);
			}
		}
	}

	didSomething() {
		return !!this.newNode;
	}

	undoAction() {
		// okay so someone inserted a node and could have also edited it in the same step.
		// so when we undo we need to potentially save the state
		// so if we redo, we can restore it

		let fakeEditor = this.newNode.getEditorForType(this.newNode.nex);
		if (fakeEditor) {
			this.editorDataSavedForRedo = fakeEditor.getStateForUndo();
		} else {
			this.editorDataSavedForRedo = null;
		}

		manipulator.removeNex(this.newNode);
		this.savedSelectedNode.setSelected();
		this.savedSelectedNode.setInsertionMode(this.savedInsertionMode);
	}
}


class ChangeDirectionAction extends Action {
	constructor(actionName) {
		super(actionName);
	}

	canUndo() {
		return true;
	}

	doAction() {
		this.savedSelectedNode = systemState.getGlobalSelectedNode();
		this.savedDir = this.savedSelectedNode.nex.getDir();
		KeyResponseFunctions[this.actionName](systemState.getGlobalSelectedNode());
	}

	undoAction() {
		this.savedSelectedNode.nex.setDir(this.savedDir);
	}
}

class ChangeSelectedNodeAction extends Action {
	constructor(actionName) {
		super(actionName);
	}

	canUndo() {
		return true;
	}

	doAction() {
		this.savedSelectedNode = systemState.getGlobalSelectedNode();
		this.savedInsertionMode = systemState.getGlobalSelectedNode().getInsertionMode();
		KeyResponseFunctions[this.actionName](systemState.getGlobalSelectedNode());
	}

	// an arrow at the end of a list moves nothing, and undoing that is invisible
	// (comment by Claude)
	didSomething() {
		let now = systemState.getGlobalSelectedNode();
		return now != this.savedSelectedNode
				|| now.getInsertionMode() != this.savedInsertionMode;
	}

	undoAction() {
		this.savedSelectedNode.setSelected();
		this.savedSelectedNode.setInsertionMode(this.savedInsertionMode);
	}
}

/*
A deferred value in the document finished, so the wrapper came out and the
answer took its place. Nobody asked for it -- a timer went off, a server
answered -- but it is a change to the document all the same, and one that moves
the selection if the wrapper was where you were standing. On the stack like
everything else, so undo has a complete account of how the document got here.

Undoing puts the wrapper back, finished, holding the same answer. Which is
honest: what the undo takes back is the collecting, not the waiting.

(comment by Claude)
*/
class UnwrapDeferredAction extends Action {
	constructor(deferred, replacements) {
		super('unwrap-deferred');
		this.deferred = deferred;
		// {parent, index, wrapperNode, answerNode, wasSelected}, in the order
		// they were replaced
		// (comment by Claude)
		this.replacements = replacements;
	}

	canUndo() {
		return true;
	}

	doAction() {
		// a redo: put the answers back where the wrappers are
		// (comment by Claude)
		for (let i = 0; i < this.replacements.length; i++) {
			let r = this.replacements[i];
			if (r.wrapperNode.getParent() != r.parent) continue;
			r.parent.replaceChildWith(r.wrapperNode, r.answerNode);
			if (r.wasSelected) {
				r.answerNode.setSelected();
			}
		}
	}

	undoAction() {
		for (let i = this.replacements.length - 1; i >= 0; i--) {
			let r = this.replacements[i];
			if (r.answerNode.getParent() != r.parent) continue;
			r.parent.replaceChildWith(r.answerNode, r.wrapperNode);
			if (r.wasSelected) {
				r.wrapperNode.setSelected();
			}
		}
	}
}


/*
An editor threw while a key was being handled, and what was being edited was
replaced with the error. That happens inside whatever action the key made, but
it is not the change that action thinks it made, and it moves the selection
onto the error. Recorded separately so the stack still describes the document.

(comment by Claude)
*/
class EditorErrorAction extends Action {
	constructor(parent, index, replacedNode, errorNode) {
		super('editor-error');
		this.parent = parent;
		this.index = index;
		this.replacedNode = replacedNode;
		this.errorNode = errorNode;
	}

	canUndo() {
		return true;
	}

	doAction() {
		// a redo; the first time round the editor had already done it
		// (comment by Claude)
		if (this.replacedNode.getParent() != this.parent) return;
		this.parent.replaceChildWith(this.replacedNode, this.errorNode);
		this.errorNode.setSelected();
	}

	undoAction() {
		if (this.errorNode.getParent() != this.parent) return;
		this.parent.replaceChildWith(this.errorNode, this.replacedNode);
		this.replacedNode.setSelected();
	}
}


/*
Clicking a nex to select it, which is a change to where you are in the document
just as much as arrowing onto it is, and so belongs on the undo stack next to
ChangeSelectedNodeAction. It was the one way of moving the selection that left
no trace, which is its own small surprise -- undo would step over the click and
walk back to whatever you did before it.

The click can also take something away: the pip is a nex, and moving off it
removes it. That goes in here too, so undoing puts it back where it was rather
than leaving a document that has quietly lost its insertion point.

(comment by Claude)
*/
class ClickSelectAction extends Action {
	constructor(nodeToSelect) {
		super('click-select');
		this.nodeToSelect = nodeToSelect;
	}

	canUndo() {
		return true;
	}

	doAction() {
		this.previouslySelected = systemState.getGlobalSelectedNode();
		this.previousInsertionMode = this.previouslySelected.getInsertionMode();
		this.finishedInput = false;
		this.removedInsertionPoint = null;
		this.removedFrom = null;
		this.removedIndex = -1;

		let insertAfterRemove = false;
		let previousNex = this.previouslySelected.getNex();
		if ((previousNex.getTypeName() == '-estring-'
				|| previousNex.getTypeName() == '-eerror-')
				&& previousNex.getMode() == MODE_EXPANDED) {
			this.finishedInput = true;
			previousNex.finishInput();
		} else if (previousNex.getTypeName() == '-insertionpoint-') {
			insertAfterRemove = true;
		}

		/*
		setSelected already marks the node losing selection, the node gaining
		it, and both their parents, and asks for a render of what is dirty.
		Rendering the whole document on top of that is the cost of every click,
		and it grows with the size of the document rather than with what
		changed.

		(comment by Claude)
		*/
		this.nodeToSelect.setSelected();
		if (insertAfterRemove
				&& systemState.getGlobalSelectedNode() != this.previouslySelected) {
			let wasIn = this.previouslySelected.getParent();
			if (wasIn) {
				this.removedInsertionPoint = this.previouslySelected;
				this.removedFrom = wasIn;
				this.removedIndex = wasIn.getIndexOfChild(this.previouslySelected);
			}
			manipulator.removeNex(this.previouslySelected);
			if (wasIn) wasIn.setRenderNodeDirtyForRendering(true);
		}
		eventQueueDispatcher.enqueueRenderOnlyDirty();
	}

	// clicking what is already selected changes nothing, unless the click also
	// closed an editor or took an insertion point out
	// (comment by Claude)
	didSomething() {
		return this.nodeToSelect != this.previouslySelected
				|| this.removedInsertionPoint != null
				|| this.finishedInput;
	}

	undoAction() {
		if (this.removedInsertionPoint && this.removedFrom) {
			this.removedFrom.insertChildAt(this.removedInsertionPoint, this.removedIndex);
		}
		/*
		Where you were may not be there any more -- something else deleted it,
		or a deferred value finished and replaced it. Going back to a node that
		is not in the document would put the pip nowhere, so the selection is
		left where it is and only the rest of the undo happens.

		(comment by Claude)
		*/
		if (!this.previouslySelected.getParent()) {
			return;
		}
		this.previouslySelected.setSelected();
		this.previouslySelected.setInsertionMode(this.previousInsertionMode);
		eventQueueDispatcher.enqueueRenderOnlyDirty();
	}
}


/*
Cut and paste change the document, so they belong on the undo stack like any
other change. Without that, undo after a paste reaches back to whatever action
came before it and undoes that instead, against a document it no longer
describes.

(comment by Claude)
*/
class CutAction extends Action {
	constructor(actionName) {
		super(actionName);
	}

	canUndo() {
		return !!this.parentOfCutNode;
	}

	doAction() {
		let node = systemState.getGlobalSelectedNode();
		let parent = node.getParent();
		let index = parent ? parent.getIndexOfChild(node) : -1;
		let insertionMode = node.getInsertionMode();
		if (!manipulator.doCut()) {
			return;
		}
		this.cutNode = node;
		this.parentOfCutNode = parent;
		this.index = index;
		this.savedInsertionMode = insertionMode;
	}

	undoAction() {
		if (!this.parentOfCutNode || this.index < 0) return;
		this.parentOfCutNode.insertChildAt(this.cutNode, this.index);
		this.cutNode.setSelected();
		this.cutNode.setInsertionMode(this.savedInsertionMode);
	}
}

class PasteAction extends Action {
	constructor(actionName) {
		super(actionName);
	}

	canUndo() {
		return !!this.pastedNode;
	}

	doAction() {
		this.selectedBefore = systemState.getGlobalSelectedNode();
		this.insertionModeBefore = this.selectedBefore.getInsertionMode();
		// read off the keystroke before this action was made, because reading
		// the system clipboard is asynchronous and this is not
		this.pastedNode = manipulator.doPaste(this.systemClipboardText);
	}

	undoAction() {
		if (!this.pastedNode) return;
		manipulator.removeNex(this.pastedNode);
		this.selectedBefore.setSelected();
		this.selectedBefore.setInsertionMode(this.insertionModeBefore);
	}
}

class LegacyKeyResponseFunctionAction extends Action {
	constructor(actionName) {
		super(actionName);
	}

	canUndo() {
		console.log('attempting to undo ' + this.actionName);
		return false;
	}

	doAction() {
		KeyResponseFunctions[this.actionName](systemState.getGlobalSelectedNode());
	}

	undoAction() {
		console.log('cannot undo this action');
	}
}

// For things that can be performed but not undone or redone
// example: auditioning a wavetable
class TriviallyUndoableKeyResponseFunctionAction extends Action {
	constructor(actionName) {
		super(actionName);
		this.hasBeenDone = false;
	}

	canUndo() {
		return true;
	}

	doAction() {
		if (!this.hasBeenDone) {
			this.hasBeenDone = true;
			KeyResponseFunctions[this.actionName](systemState.getGlobalSelectedNode());
		}
	}

	didSomething() {
		return false;
	}

	undoAction() {
		// no op
	}
}


/*
The only click that changes the document, so the only one that has to be an
action. It is built and enqueued directly rather than coming from the factory,
which is keyed on the name of a keystroke.

The plan is worked out before the action is made, so a click with no answer
never becomes an undo entry, and redo can apply the same plan again rather than
recomputing it from a selection that has since moved.
*/
class MultiSelectAction extends Action {
	constructor(plan) {
		super('multi-select');
		this.plan = plan;
		// nexesHeldBy only sees fields on the action itself, so the parent has
		// to be one or the undo buffer will not be holding it
		// (comment by Claude)
		this.enclosingParent = plan.parent ? plan.parent : null;
	}

	canUndo() {
		return true;
	}

	doAction() {
		this.previousSelection = systemState.getGlobalSelectedNode();
		this.org = manipulator.applyMultiSelect(this.plan);
	}

	undoAction() {
		manipulator.unapplyMultiSelect(this.plan, this.org);
		if (this.previousSelection) {
			this.previousSelection.setSelected();
		}
	}
}

class DeleteNexAction extends Action {
	constructor(actionName) {
		super(actionName);
	}

	canUndo() {
		return true;
	}

	doAction() {
		this.savedNodeToRestore = systemState.getGlobalSelectedNode();
		this.parentOfNodeWeAreDeleting = this.savedNodeToRestore.getParent();
		this.index = this.parentOfNodeWeAreDeleting.getIndexOfChild(this.savedNodeToRestore);
		this.savedInsertionMode = this.savedNodeToRestore.getInsertionMode();
		KeyResponseFunctions[this.actionName](systemState.getGlobalSelectedNode());
	}

	undoAction() {
		this.parentOfNodeWeAreDeleting.insertChildAt(this.savedNodeToRestore, this.index);
		this.savedNodeToRestore.setSelected();
		this.savedNodeToRestore.setInsertionMode(this.savedInsertionMode);
	}
}

class EvaluateAndReplaceAction extends Action {
	constructor(actionName) {
		super(actionName);
	}

	canUndo() {
		return true;
	}

	doAction() {
		/*
		The warning belongs to the undo, so taking the undo back takes it with
		it -- otherwise every undo/redo cycle leaves another one behind. Having
		one is also what says this is a redo rather than a first run. Removed
		before anything else reads an index, since it sits in the document just
		before the node being evaluated.

		(comment by Claude)
		*/
		if (this.undoWarning) {
			if (this.undoWarning.getParent()) {
				manipulator.removeNex(this.undoWarning);
			}
			this.undoWarning = null;
		}
		this.nodeBeingEvaluated = systemState.getGlobalSelectedNode();
		this.parentOfNodeBeingEvaluated = this.nodeBeingEvaluated.getParent();
		this.index = this.parentOfNodeBeingEvaluated.getIndexOfChild(this.nodeBeingEvaluated);
		this.savedInsertionMode = this.nodeBeingEvaluated.getInsertionMode();
		KeyResponseFunctions[this.actionName](systemState.getGlobalSelectedNode());
	}

	/*
	The selection says what to remove, and is trusted to, because every way the
	selection moves is itself an action: arrowing, clicking, multi-selecting,
	and the two things that change the document without being asked to -- a
	deferred value finishing, an editor throwing. So by the time this runs, the
	stack has walked the selection back onto what this evaluation produced.

	That invariant is the whole design. Anything new that moves the selection
	has to go on the stack too, or this reaches for the wrong node.

	(comment by Claude)
	*/
	undoAction() {
		let evaluationResult = systemState.getGlobalSelectedNode();
		manipulator.removeAndSelectPreviousSibling(evaluationResult);

		this.parentOfNodeBeingEvaluated.insertChildAt(this.nodeBeingEvaluated, this.index);
		this.nodeBeingEvaluated.setSelected();
		this.nodeBeingEvaluated.setInsertionMode(this.savedInsertionMode);

		let ee = constructWarning("Warning: undoing code evaluation does not undo side effects.");
		this.undoWarning = this.parentOfNodeBeingEvaluated.insertChildBefore(ee, this.nodeBeingEvaluated);
	}
}


class EvaluateInPlaceAction extends Action {
	constructor(actionName) {
		super(actionName);
	}

	canUndo() {
		return true;
	}

	doAction() {
		// the warning is the undo's, not the document's -- see
		// EvaluateAndReplaceAction
		// (comment by Claude)
		if (this.undoWarning) {
			if (this.undoWarning.getParent()) {
				manipulator.removeNex(this.undoWarning);
			}
			this.undoWarning = null;
		}
		this.nodeBeingEvaluated = systemState.getGlobalSelectedNode();
		this.parentOfNodeBeingEvaluated = this.nodeBeingEvaluated.getParent();
		KeyResponseFunctions[this.actionName](systemState.getGlobalSelectedNode());
	}

	undoAction() {
		let ee = constructWarning("Warning: undoing code evaluation does not undo side effects.")
		this.undoWarning = this.parentOfNodeBeingEvaluated.insertChildBefore(ee, this.nodeBeingEvaluated);
	}
}


/*
Play again, from wherever you are standing.

Working on a wave means being somewhere deep inside the expression that plays
it, and hearing the change means getting back out to the play command and
running it: shift-tab until the whole thing is selected, then shift-enter. This
is that, in one key. It walks up from the selection and runs the first play
command it meets, starting with the selected nex itself, so that pressing it
while already on the play command does the obvious thing.

The selection does not move. Playing is something you do to the document, not
somewhere you go in it, and being thrown out to the top every time you wanted
to hear the change would undo the reason for having the shortcut. Nothing needs
selecting anyway: what runs the code takes the node, and only looks at the
selection to decide where to put an error.

Undoing does nothing, the way undoing an audition does nothing -- the sound has
been made and there is no taking it back. A redo does not play it again, for
the same reason auditioning does not.

(comment by Claude)
*/
class ReplayNearestPlayAction extends Action {
	constructor(actionName) {
		super(actionName);
		this.hasBeenDone = false;
	}

	canUndo() {
		return true;
	}

	doAction() {
		if (this.hasBeenDone) {
			return;
		}
		this.hasBeenDone = true;
		let playNode = null;
		for (let node = systemState.getGlobalSelectedNode(); node; node = node.getParent()) {
			let nex = node.getNex();
			// getCommandName is on Command, and a deferred command is one
			// (comment by Claude)
			if (nex && nex.getCommandName && nex.getCommandName() == 'play') {
				playNode = node;
				break;
			}
		}
		if (!playNode) {
			// nothing above you plays anything, so there is nothing to repeat
			// (comment by Claude)
			Utils.beep();
			return;
		}
		// the same thing shift-enter does: run it and keep the code
		// (comment by Claude)
		KeyResponseFunctions['evaluate-nex-and-keep'](playNode);
	}

	undoAction() {
		// no op
		// (comment by Claude)
	}
}


/*
Stepping a number with shift and an arrow.

The undo saves the value it started from rather than stepping back by the same
amount. The two are the same until something else changes the number in
between, and then only the saved value is right.

It also holds on to the node it acted on instead of reading the selection when
the undo runs -- by then the selection may be somewhere else entirely, and
undoing an edit to whatever happens to be selected now is how you lose work.
*/
class StepValueAction extends Action {
	constructor(actionName) {
		super(actionName);
	}

	canUndo() {
		return true;
	}

	doAction() {
		this.node = systemState.getGlobalSelectedNode();
		this.oldValue = this.node.getNex().getValue();
		KeyResponseFunctions[this.actionName](this.node);
	}

	undoAction() {
		this.node.getNex().setValue(this.oldValue);
	}
}


class ChangeRenderModeAction extends Action {
	constructor(actionName) {
		super(actionName);
	}

	canUndo() {
		return true;
	}

	doAction() {
		this.savedRenderMode = systemState.getGlobalSelectedNode().getRenderMode();
		KeyResponseFunctions[this.actionName](systemState.getGlobalSelectedNode());
	}

	undoAction() {
		systemState.getGlobalSelectedNode().setRenderMode(this.savedRenderMode);
	}
}

class LineBreakAction extends Action {
	// basically to delete a line break.
	// If the line break was "do-line-break-for-letter"
	// then we do one of these three to undo:
	//   delete-letter, delete-separator, or delete-line
	// if it was "do-line-break-for-separator"
	//   delete-separator or delete-line
	// otherwise if it was do-line-break-for-line
	//.  delete-line
	// and you can just look at what is selected now basically
	constructor(actionName) {
		super(actionName);
	}

	canUndo() {
		return true;
	}

	doAction() {
		KeyResponseFunctions[this.actionName](systemState.getGlobalSelectedNode());
	}

	undoAction() {
		manipulator.deleteAnyLineBreak();
	}
}

class DefaultHandlerAction extends Action {
	constructor(actionName, eventName) {
		super(actionName);
		this.eventName = eventName;
	}

	canUndo() {
		return true;
	}

	doAction() {
		this.savedSelectedNode = systemState.getGlobalSelectedNode();
		this.savedInsertionMode = systemState.getGlobalSelectedNode().getInsertionMode();

		let handler = DefaultHandlers[this.actionName];
		let result = handler(systemState.getGlobalSelectedNode(), this.eventName);

		if (result.inserted) {
			this.newNode = result.inserted;

			if (this.editorDataSavedForRedo) {
				let fakeEditor = this.newNode.getEditorForType(this.newNode.nex);
				if (fakeEditor) {
					fakeEditor.setStateForUndo(this.editorDataSavedForRedo);
				}
			}
		}
	}

	// undoAction below does nothing at all without a newNode, so without one
	// there is nothing to keep an entry for
	// (comment by Claude)
	didSomething() {
		return !!this.newNode;
	}

	undoAction() {
		// okay so someone inserted a node and could have also edited it in the same step.
		// so when we undo we need to potentially save the state
		// so if we redo, we can restore it

		if (this.newNode) {
			// then it was successful
			let fakeEditor = this.newNode.getEditorForType(this.newNode.nex);
			if (fakeEditor) {
				this.editorDataSavedForRedo = fakeEditor.getStateForUndo();
			} else {
				this.editorDataSavedForRedo = null;
			}

			manipulator.removeNex(this.newNode);
			this.savedSelectedNode.setSelected();
			this.savedSelectedNode.setInsertionMode(this.savedInsertionMode);
		}
	}
}


class LegacyDefaultHandlerAction extends Action {
	constructor(actionName, eventName) {
		super(actionName);
		this.eventName = eventName;
	}

	canUndo() {
		console.log('attempting to undo ' + this.actionName);
		console.log('eventName ' + this.eventName);
		return false;
	}

	doAction() {
		let handler = DefaultHandlers[this.actionName];
		return handler(systemState.getGlobalSelectedNode(), this.eventName);
	}

	undoAction() {
		console.log('cannot undo this action');
	}
}


function actionFactory(actionName, eventName) {
	switch (actionName) {
		case 'do-nothing':
			return new NoOpAction(actionName);
		case 'audition-wave':
		case 'toggle-wave-controls':
			return new TriviallyUndoableKeyResponseFunctionAction(actionName);
		case 'move-left-up':
		case 'move-right-down':
		case 'select-parent':
		case 'select-first-child-or-force-insert-inside-insertion-mode':
		case 'close-off-doc':
		case 'close-off-line':
		case 'close-off-org':
		case 'close-off-word':
		case 'force-insert-after':
		case 'force-insert-around':
		case 'force-insert-before':
		case 'force-insert-inside':
		case 'move-to-corresponding-letter-in-next-line':
		case 'move-to-corresponding-letter-in-previous-line':
		case 'move-to-next-leaf':
		case 'move-to-previous-leaf':
		case 'move-right-for-line':
		case 'move-left-for-line':
		case 'move-up-for-line':
		case 'move-down-for-line':
			return new ChangeSelectedNodeAction(actionName);
		case 'increment-value':
		case 'decrement-value':
			return new StepValueAction(actionName);
		case 'toggle-dir':
			return new ChangeDirectionAction(actionName);

		case 'insert-command-at-insertion-point':
		case 'insert-bool-at-insertion-point':
		case 'insert-symbol-at-insertion-point':
		case 'insert-integer-at-insertion-point':
		case 'insert-string-at-insertion-point':
		case 'insert-float-at-insertion-point':
		case 'insert-instantiator-at-insertion-point':
		case 'insert-lambda-at-insertion-point':
		case 'insert-deferredcommand-at-insertion-point':
		case 'insert-org-at-insertion-point':
		case 'insert-line-at-insertion-point':
		case 'insert-doc-at-insertion-point':
		case 'insert-word-at-insertion-point':
		case 'insert-wavetable-at-insertion-point':
			return new InsertNewChildNodeAction(actionName);

		case 'remove-selected-and-select-previous-sibling':
		case 'delete-letter':
		case 'delete-line':
		case 'delete-separator':
		case 'remove-selected-and-select-previous-sibling-if-empty':
		case 'call-delete-handler-then-remove-selected-and-select-previous-sibling':
			return new DeleteNexAction(actionName);

		case 'evaluate-nex':
			return new EvaluateAndReplaceAction(actionName);

		case 'start-main-editor':
		case 'autocomplete':
			return new EditorContentChangeAction(actionName);

		case 'add-tag':
			return new TagEditorContentChangeAction(actionName);

		case 'evaluate-nex-and-keep':
			return new EvaluateInPlaceAction(actionName);

		case 'replay-nearest-play':
			return new ReplayNearestPlayAction(actionName);

		case 'wrap-in-command':
		case 'wrap-in-doc':
		case 'wrap-in-deferredcommand':
		case 'wrap-in-instantiator':
		case 'wrap-in-lambda':
		case 'wrap-in-line':
		case 'wrap-in-org':
		case 'wrap-in-word':
			return new WrapInNewParentNodeAction(actionName);

		case 'standardDefault':
		case 'letterDefault':
		case 'separatorDefault':
		case 'wordDefault':
		case 'lineDefault':
		case 'docDefault':
			return new DefaultHandlerAction(actionName, eventName);

		case 'toggle-exploded':
			return new ChangeRenderModeAction(actionName);

		case 'do-line-break-for-letter':
		case 'do-line-break-for-separator':
		case 'do-line-break-or-eval':
			return new LineBreakAction(actionName);

		// Legacy ones below, these can't be undone

		case 'cut':
			return new CutAction(actionName);
		case 'paste':
			return new PasteAction(actionName);

		case 'unroll':
			return new UnrollAction(actionName);

		// in case I missed any?

		default:
			return new LegacyKeyResponseFunctionAction(actionName);
	}

}



export { actionFactory, enqueueAndPerformAction, recordPerformedAction, MultiSelectAction,
		 ClickSelectAction, UnwrapDeferredAction, EditorErrorAction, undo, redo }