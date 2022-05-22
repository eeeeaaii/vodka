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

import { systemState } from './systemstate.js';
import { KeyResponseFunctions, DefaultHandlers } from './keyresponsefunctions.js';
import { manipulator } from './manipulator.js';
import { EError, ERROR_TYPE_WARN } from './nex/eerror.js';

const levelsOfUndo = 100;

const actionStack = [];

let nextPosition = 0;
let queueBottom = 0;
let queueTop = 0;
let numItemsInQueue = 0;

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

function enqueueAndPerformAction(action) {
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
		nextPosition = advance(nextPosition);
	}
	action.doAction();
}


function redo() {
	if (nextPosition != queueTop) {
		actionStack[nextPosition].doAction();
		nextPosition = advance(nextPosition);
	} else {
		console.log('cannot redo');
	}
}

function undo() {
	let pos = retreat(nextPosition);
	if (actionStack[pos].canUndo()) {
		nextPosition = pos;
		actionStack[nextPosition].undoAction();
	} else {
		console.log('cannot undo');
	}
}

class Action {
	constructor(actionName) {
		this.actionName = actionName;
	}

	canUndo() {};
	doAction() {};
	undoAction() {};
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
		this.savedEditorData = fakeEditor.getStateForUndo();
		KeyResponseFunctions[this.actionName](selectedNode);
	}

	undoAction() {
		// if you don't save the node, here's how this can break:
		// exiting the editor changes what node is selected
		// then you try to undo, and the correct thing isn't selected.
		let selectedNode = systemState.getGlobalSelectedNode();
		let fakeEditor = selectedNode.getEditorForType(selectedNode.nex);
		fakeEditor.setStateForUndo(this.savedEditorData);
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
			fakeEditor.setStateForUndo(this.editorDataSavedForRedo);
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
		KeyResponseFunctions[this.actionName](systemState.getGlobalSelectedNode());
		this.newNode = manipulator.getMostRecentInsertedRenderNode();

		if (this.editorDataSavedForRedo) {
			let fakeEditor = this.newNode.getEditorForType(this.newNode.nex);
			fakeEditor.setStateForUndo(this.editorDataSavedForRedo);
		}
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

	undoAction() {
		this.savedSelectedNode.setSelected();
		this.savedSelectedNode.setInsertionMode(this.savedInsertionMode);
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

	undoAction() {
		// no op
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
		this.nodeBeingEvaluated = systemState.getGlobalSelectedNode();
		this.parentOfNodeBeingEvaluated = this.nodeBeingEvaluated.getParent();
		this.index = this.parentOfNodeBeingEvaluated.getIndexOfChild(this.nodeBeingEvaluated);
		this.savedInsertionMode = this.nodeBeingEvaluated.getInsertionMode();
		KeyResponseFunctions[this.actionName](systemState.getGlobalSelectedNode());
	}

	undoAction() {
		let evaluationResult = systemState.getGlobalSelectedNode();
		manipulator.removeAndSelectPreviousSibling(evaluationResult);

		this.parentOfNodeBeingEvaluated.insertChildAt(this.nodeBeingEvaluated, this.index);
		this.nodeBeingEvaluated.setSelected();
		this.nodeBeingEvaluated.setInsertionMode(this.savedInsertionMode);

		let ee = new EError("Warning: undoing code evaluation does not undo side effects.");
		ee.setErrorType(ERROR_TYPE_WARN);
		this.parentOfNodeBeingEvaluated.insertChildBefore(ee, this.nodeBeingEvaluated);
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
		this.nodeBeingEvaluated = systemState.getGlobalSelectedNode();
		this.parentOfNodeBeingEvaluated = this.nodeBeingEvaluated.getParent();
		KeyResponseFunctions[this.actionName](systemState.getGlobalSelectedNode());
	}

	undoAction() {
		let ee = new EError("Warning: undoing code evaluation does not undo side effects.")
		ee.setErrorType(ERROR_TYPE_WARN);
		this.parentOfNodeBeingEvaluated.insertChildBefore(ee, this.nodeBeingEvaluated);
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
				fakeEditor.setStateForUndo(this.editorDataSavedForRedo);
			}
		}
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
	switch(actionName) {
		case 'do-nothing':
			return new NoOpAction(actionName);
 		case 'audition-wave':
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

		// Legacy ones below, these can't be undone

			// basically autocomplete should be handled by the editor when editing,
			// otherwise autocomplete on a non-editing thing is a straight change of its contents,
			// so easy to undo

		// Document related stuff (to do later)

		case 'do-line-break-for-letter':
		case 'do-line-break-for-separator':
		case 'do-line-break-or-eval':
			return new LineBreakAction(actionName);

		// in case I missed any?
		default:
			return new LegacyKeyResponseFunctionAction(actionName);
	}

}



export { actionFactory, enqueueAndPerformAction, undo, redo }