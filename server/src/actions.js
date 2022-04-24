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
import { KeyResponseFunctions, DefaultHandlers, figureOutWhatItCanBe } from './keyresponsefunctions.js';
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
	return action.doAction();
}


// NOTE:
// return false means success
// return true means failure
// I don't make the rules
// well, I do make the rules, but I made bad rules


function redo() {
	if (nextPosition != queueTop) {
		let r = actionStack[nextPosition].doAction();
		nextPosition = advance(nextPosition);
		return r;
	} else {
		console.log('cannot redo');
		return true;
	}
}

function undo() {
	let pos = retreat(nextPosition);
	if (actionStack[pos].canUndo()) {
		nextPosition = pos;
		return actionStack[nextPosition].undoAction();
	} else {
		console.log('cannot undo');
		return true;
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
		return false;
	}

	undoAction() {
		return false;
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
		return false;
	}

	undoAction() {
		let selectedNode = systemState.getGlobalSelectedNode();
		let fakeEditor = selectedNode.getTagEditorForType(selectedNode.nex);
		fakeEditor.setStateForUndo(this.savedEditorData);
		return false;
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
		return false;
	}

	undoAction() {
		// if you don't save the node, here's how this can break:
		// exiting the editor changes what node is selected
		// then you try to undo, and the correct thing isn't selected.
		let selectedNode = systemState.getGlobalSelectedNode();
		let fakeEditor = selectedNode.getEditorForType(selectedNode.nex);
		fakeEditor.setStateForUndo(this.savedEditorData);
		return false;
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


		return false;
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
		return false;
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
		return false;
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
		return false;
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
		return false;
	}

	undoAction() {
		this.savedSelectedNode.nex.setDir(this.savedDir);
		return false;
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
		return false;
	}

	undoAction() {
		this.savedSelectedNode.setSelected();
		this.savedSelectedNode.setInsertionMode(this.savedInsertionMode);
		return false;
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
		return false;
	}

	undoAction() {
		console.log('cannot undo this action');
		return true;
	}
}

class DeleteNexAction extends Action {
	constructor(actionName) {
		super(actionName);
	}

	canUndo() {
		return !!systemState.getGlobalSelectedNode().getParent();
	}

	doAction() {
		this.savedNodeToRestore = systemState.getGlobalSelectedNode();
		this.parentOfNodeWeAreDeleting = this.savedNodeToRestore.getParent();
		this.index = this.parentOfNodeWeAreDeleting.getIndexOfChild(this.savedNodeToRestore);
		this.savedInsertionMode = this.savedNodeToRestore.getInsertionMode();
		KeyResponseFunctions[this.actionName](systemState.getGlobalSelectedNode());
		return false;
	}

	undoAction() {
		this.parentOfNodeWeAreDeleting.insertChildAt(this.savedNodeToRestore, this.index);
		this.savedNodeToRestore.setSelected();
		this.savedNodeToRestore.setInsertionMode(this.savedInsertionMode);
		return false;
	}
}

class EvaluateAndReplaceAction extends Action {
	constructor(actionName) {
		super(actionName);
	}

	canUndo() {
		return !!systemState.getGlobalSelectedNode().getParent();
	}

	doAction() {
		this.nodeBeingEvaluated = systemState.getGlobalSelectedNode();
		this.parentOfNodeBeingEvaluated = this.nodeBeingEvaluated.getParent();
		this.index = this.parentOfNodeBeingEvaluated.getIndexOfChild(this.nodeBeingEvaluated);
		this.savedInsertionMode = this.nodeBeingEvaluated.getInsertionMode();
		KeyResponseFunctions[this.actionName](systemState.getGlobalSelectedNode());
		return false;
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
		return false;
	}
}


class EvaluateInPlaceAction extends Action {
	constructor(actionName) {
		super(actionName);
	}

	canUndo() {
		return !!systemState.getGlobalSelectedNode().getParent();
	}

	doAction() {
		this.nodeBeingEvaluated = systemState.getGlobalSelectedNode();
		this.parentOfNodeBeingEvaluated = this.nodeBeingEvaluated.getParent();
		KeyResponseFunctions[this.actionName](systemState.getGlobalSelectedNode());
		return false;
	}

	undoAction() {
		let ee = new EError("Warning: undoing code evaluation does not undo side effects.")
		ee.setErrorType(ERROR_TYPE_WARN);
		this.parentOfNodeBeingEvaluated.insertChildBefore(ee, this.nodeBeingEvaluated);
		return false;
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
		return false;
	}

	undoAction() {
		systemState.getGlobalSelectedNode().setRenderMode(this.savedRenderMode);
		return false;
	}
}

class StandardDefaultHandlerAction extends Action {
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
		let success = handler(systemState.getGlobalSelectedNode(), this.eventName);

		if (success) {
			this.newNode = manipulator.getMostRecentInsertedRenderNode();

			if (this.editorDataSavedForRedo) {
				let fakeEditor = this.newNode.getEditorForType(this.newNode.nex);
				fakeEditor.setStateForUndo(this.editorDataSavedForRedo);
			}
		}
		return false;
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

		return false;
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
		return true;
	}
}


function actionFactory(actionName, eventName) {
	switch(actionName) {
		case 'do-nothing':
 		case 'audition-wave':
			return new NoOpAction(actionName, eventName);
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
		case 'insert-expectation-at-insertion-point':
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
		case 'wrap-in-expectation':
		case 'wrap-in-instantiator':
		case 'wrap-in-lambda':
		case 'wrap-in-line':
		case 'wrap-in-org':
		case 'wrap-in-word':
			return new WrapInNewParentNodeAction(actionName);

 		case 'standardDefault':
 			return new StandardDefaultHandlerAction(actionName, eventName);


 		case 'toggle-exploded':
 			return new ChangeRenderModeAction(actionName);

		// Legacy ones below, these can't be undone

			// basically autocomplete should be handled by the editor when editing,
			// otherwise autocomplete on a non-editing thing is a straight change of its contents,
			// so easy to undo

		case 'activate-or-return-exp-child':
			// when hitting enter on an expectation

		// Document related stuff (to do later)

		case 'do-line-break-for-letter':
		case 'do-line-break-for-separator':
		case 'do-line-break-or-eval':
			return new LegacyKeyResponseFunctionAction(actionName);

		case 'letterDefault':
		case 'separatorDefault':
		case 'wordDefault':
		case 'lineDefault':
		case 'docDefault':
			return new LegacyDefaultHandlerAction(actionName, eventName);

		// in case I missed any?
		default:
			return new LegacyKeyResponseFunctionAction(actionName);
	}

}



export { actionFactory, enqueueAndPerformAction, undo, redo }