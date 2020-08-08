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


import { UNHANDLED_KEY, RENDER_FLAG_EXPLODED } from './globalconstants.js';
import { systemState } from './systemstate.js';
import { BINDINGS } from './environment.js';
import { manipulator } from './manipulator.js';
import { undo } from './undo.js';
import { ContextType } from './contexttype.js';
import { KeyResponseFunctions, DefaultHandlers } from './keyresponsefunctions.js';
import { evaluateNexSafely } from './evaluator.js';

class KeyDispatcher {
	dispatch(keycode, whichkey, hasShift, hasCtrl, hasMeta, hasAlt) {
		let keyContext = ContextType.COMMAND;
		let p = systemState.getGlobalSelectedNode().getParent();
		if (p) {
			while((keyContext = p.getNex().getContextType()) == ContextType.PASSTHROUGH) {
				p = p.getParent();
			}
		}
		if (systemState.getGlobalSelectedNode().usingEditor()) {
			// will return whether or not to "reroute"
			// rerouting means the editor didn't handle the key AND wants keydispatcher
			// to handle it instead
			let reroute = this.doEditorEvent(keycode, hasShift, hasCtrl, hasMeta, hasAlt, whichkey);
			if (!reroute) {
				return false;
			}
		}
		let eventName = this.getEventName(keycode, hasShift, hasCtrl, hasMeta, hasAlt, whichkey);

		// if (eventName != 'Meta-z') {
		// 	// If we aren't undoing we save the last state so we can undo to it.
		// 	// any editor stuff short circuits this, so you can undo what you type
		// 	// in an editor (which makes sense because different input devices will
		// 	// have different editors, which may or may not make sense with undo.
		// 	undo.saveForUndo(Vodka.root.getNex());			
		// }

		// there are a few special cases
		if (eventName == '|') {
			// vertical bar is unusable - 'internal use only'
			return false; // to cancel browser event
		} else if (eventName == 'Meta-z') {
			// do not save state for undo obv
			if (undo.canUndo()) {
				undo.performUndo();
			}
			return false; // to cancel browser event
		} else if (eventName == 'Meta-x') {
			this.saveForUndo();
			manipulator.doCut();
			return false; // to cancel browser event
		} else if (eventName == 'Meta-c') {
			this.saveForUndo();
			manipulator.doCopy();
			return false; // to cancel browser event
		} else if (eventName == 'Meta-v') {
			this.saveForUndo();
			manipulator.doPaste();
			return false; // to cancel browser event
		} else if (eventName == 'Escape') {
			// do not save state for undo as esc is non-destructive
			this.doEscape();
			return false; // to cancel browser event
		} else if (eventName == 'MetaEnter') {
			// TODO: only save state for undo first time we hit meta-enter (step execute)
			this.saveForUndo();
			this.doMetaEnter();
			return false; // to cancel browser event
		} else {
			this.saveForUndo();
			// 1. look in override table
			// 2. look in regular table
			// 3. call defaultHandle
			// otherwise try the table first, then the keyfunnel
			if (window.legacyEnterBehaviorForTests
					&& eventName == 'ShiftEnter'
					&& (
						systemState.getGlobalSelectedNode().getNex().getTypeName() == '-command-'
						|| systemState.getGlobalSelectedNode().getNex().getTypeName() == '-symbol-'
					)) {
				eventName = 'Enter';
			}
			try {
				let sourceNex = (systemState.getGlobalSelectedNode().getNex());
				let parentNex = null;
				if (systemState.getGlobalSelectedNode().getParent()) {
					parentNex = systemState.getGlobalSelectedNode().getParent().getNex();
				}
				// returning false here means we tell the browser not to process the event.
				if (this.runDefaultHandle(sourceNex, eventName, keyContext, systemState.getGlobalSelectedNode())) return false;
				if (this.runFunctionFromOverrideTable(sourceNex, parentNex, eventName)) return false;
				if (this.runFunctionFromRegularTable(sourceNex, eventName, keyContext)) return false;
				if (this.runFunctionFromGenericTable(sourceNex, eventName)) return false;
				this.eraseLastUndo();
				return true; // didn't handle it.
			} catch (e) {
				this.eraseLastUndo();
				if (e == UNHANDLED_KEY) {
					console.log("UNHANDLED KEY " +
									':' + 'keycode=' + keycode +
									',' + 'whichkey=' + whichkey +
									',' + 'hasShift=' + hasShift +
									',' + 'hasCtrl=' + hasCtrl +
									',' + 'hasMeta=' + hasMeta);
					return true;
				} else throw e;
			}
		}
	}

	saveForUndo() {
		undo.saveStateForUndo(systemState.getRoot().getNex());
	}

	eraseLastUndo() {
		undo.eraseLastSavedState();
	}

	doEditorEvent(keycode, hasShift, hasCtrl, hasMeta, hasAlt, whichkey) {
		// events are handled differently when an editor is being used
		// all events are routed to the editor instead of the nex, until the editor
		// is finished.
		// right now we just have an editor for tags but we will need editors for
		// strings, symbols, commands/lambdas.
		return systemState.getGlobalSelectedNode().routeKeyToCurrentEditor(keycode);
	}

	getEventName(keycode, hasShift, hasCtrl, hasMeta, hasAlt, whichKey) {
		// maybe I should rewrite this to do something like this:
		// return `${shiftPrefix}${MetaPrefix}${keycode}`
		// the only thing is I don't want it to return 'Shift!' or 'Shift$'
		if (keycode == 'Enter' && hasMeta && hasShift) {
			return 'ShiftMetaEnter';
		} else if (keycode == 'Enter' && hasMeta) {
			return 'MetaEnter';
		} else if (keycode == 'Escape' && hasShift) {
			return 'ShiftEscape';
		} else if (keycode == 'Enter' && hasShift) {
			return 'ShiftEnter';
		} else if (keycode == 'Tab' && hasShift) {
			return 'ShiftTab';
		} else if (keycode == ' ' && hasShift) {
			return 'ShiftSpace';
		} else if (keycode == ' ' && hasCtrl) {
			return 'CtrlSpace';
		} else if (keycode == ' ' && hasMeta) {
			return 'MetaSpace';

		// this stuff only works on a mac AFAIK
		} else if (keycode == '`' && hasAlt && hasShift) {
			return 'Alt~';
		} else if (keycode == 'Dead' && whichKey == 'Backquote' && hasAlt && !hasShift) {
			return 'Alt`';
		} else if (whichKey == 'Digit7' && hasAlt && hasShift) {
			return 'Alt&';
		} else if (whichKey == 'Digit8' && hasAlt && hasShift) {
			return 'Alt*';
		} else if (whichKey == 'Digit9' && hasAlt && hasShift) {
			return 'Alt(';
		} else if (whichKey == 'Digit0' && hasAlt && hasShift) {
			return 'Alt)';
		} else if (whichKey == 'BracketLeft' && hasAlt && !hasShift) {
			return 'Alt[';
		} else if (whichKey == 'BracketLeft' && hasAlt && hasShift) {
			return 'Alt{';
		} else if (keycode == 'Backspace' && hasShift) {
			return 'ShiftBackspace';
		} else if (keycode == 'z' && hasMeta) {
			return 'Meta-z';
		} else if (keycode == 'x' && hasMeta) {
			return 'Meta-x';
		} else if (keycode == 'c' && hasMeta) {
			return 'Meta-c';
		} else if (keycode == 'v' && hasMeta) {
			return 'Meta-v';
		} else {
			return keycode;
		}
	}

	runDefaultHandle(sourceNex, eventName, context, sourceNode) {
		if (sourceNex.getDefaultHandler) {
			let handleFunction = sourceNex.getDefaultHandler();
			if (handleFunction) {
				return DefaultHandlers[handleFunction](sourceNex, eventName, context, sourceNode);
			}
		}
		if (sourceNex.defaultHandle) {
			return sourceNex.defaultHandle(eventName, context, sourceNode);
		}
		return false;
	}

	runFunctionFromGenericTable(sourceNex, eventName) {
		let table = null;
		if (sourceNex.isNexContainer()) {
			table = this.getNexContainerGenericTable();
		} else {
			table = this.getNexGenericTable();
		}
		let f = table[eventName];
		if (f && this.actOnFunction(f)) {
			return true;
		}
		return false;
	}

	runFunctionFromRegularTable(sourceNex, eventName, context) {
		let table = sourceNex.getEventTable();
		if (!table) {
			return false;
		}
		let f = table[eventName];
		if (f && this.actOnFunction(f, context)) {
			return true;
		}
		return false;
	}

	runFunctionFromOverrideTable(sourceNex, parentNex, eventName) {
		if (!parentNex) {
			return false;
		}
		let table = parentNex.getEventOverride();
		let nexTypeName = sourceNex.getTypeName();
		if (!table) {
			return false;
		}
		let subtable = null;
		let f = null;
		subtable = table[parentTypeName];
		if (subtable) {
			let f = subtable[eventName];
			if (f && this.actOnFunction(f)) {
				return true;
			}
		}
		subtable = table['*'];
		if (subtable) {
			let f = subtable[eventName];
			if (f && this.actOnFunction(f)) {
				return true;
			}
		}
		return null;
	}

	// returns true if it was a valid function that could be run
	actOnFunction(f, context) {
		if ((typeof f) == 'string') {
			KeyResponseFunctions[f](systemState.getGlobalSelectedNode());
			return true;
		} else if ((typeof f) == 'function') {
			f(systemState.getGlobalSelectedNode());
			return true;
		} else if ((typeof f) == 'object') {
			// contains different functions for different contexts
			let f2 = f[context];
			if (!f2) {
				f2 = f[ContextType.DEFAULT];
				if (!f2) {
					throw new Error('must specify a default context if associating a key with a map')
				}
			}
			KeyResponseFunctions[f2](systemState.getGlobalSelectedNode());
 			return true;
		} else if (f instanceof Nex) {
			evaluateNexSafely(f, BINDINGS)
			return true;
		}
		return false;
	}

	doEscape() {
		let current_default_render_flags = systemState.getGlobalCurrentDefaultRenderFlags();
		if (current_default_render_flags & RENDER_FLAG_EXPLODED) {
			current_default_render_flags &= (~RENDER_FLAG_EXPLODED);
		} else {
			current_default_render_flags |= RENDER_FLAG_EXPLODED;
		}
		systemState.setGlobalOverrideOnNextRender(true);
		systemState.setGlobalCurrentDefaultRenderFlags(current_default_render_flags);
	}

	doMetaEnter() {
		isStepEvaluating = true;
		try {
			let s = systemState.getGlobalSelectedNode().getNex();
			let phaseExecutor = s.phaseExecutor;
			let firstStep = false;
			if (!phaseExecutor) {
				firstStep = true;
				phaseExecutor = new PhaseExecutor();
				// need to copy the selected nex, replace it in the parent, and discard!
				let copiedNex = systemState.getGlobalSelectedNode().getNex().makeCopy();
				let parentNode = systemState.getGlobalSelectedNode().getParent();
				let parentNex = parentNode.getNex();
				parentNex.replaceChildWith(systemState.getGlobalSelectedNode().getNex(), copiedNex);
				parentNode.childnodes = []; // wtf
				// hack: rerender the parent to refresh/fix the cached childnodes in it
				// we cannot use eventqueue because this thread needs this data later on :(
				parentNode.render(current_default_render_flags);
				let index = parentNex.getIndexOfChild(copiedNex);
				let newSelectedNode = parentNode.getChildAt(index);
				newSelectedNode.setSelected();
				// gross
				topLevelRender();
				s = systemState.getGlobalSelectedNode().getNex();
				s.pushNexPhase(phaseExecutor, BINDINGS);
			}
			phaseExecutor.doNextStep();
			topLevelRender();
			if (!phaseExecutor.finished()) {
				// the resolution of an expectation will change the selected nex,
				// so need to set it back
				if (firstStep) {
					// the first step is PROBABLY an expectation phase
					let operativeNode = s.getRenderNodes()[0].getParent();
					let operativeNex = operativeNode.getNex();
					operativeNode.setSelected();
					operativeNex.phaseExecutor = phaseExecutor;
				} else {
					s.getRenderNodes()[0].setSelected();
				}
			} else {
				// if I don't explicitly set the selected nex, it'll be the
				// result of the last resolved expectation, probably
				s.phaseExecutor = null;
			}
		} finally {
			isStepEvaluating = false;
		}
	}

	getNexContainerGenericTable() {
		return {
			'ShiftTab': 'select-parent',
			'Tab': 'select-first-child-or-create-insertion-point',
			'ArrowUp': 'move-left-up',
			'ArrowLeft': 'move-left-up',
			'ArrowDown': 'move-right-down',
			'ArrowRight': 'move-right-down',
			'ShiftBackspace': 'remove-selected-and-select-previous-sibling',
			'Backspace': 'remove-selected-and-select-previous-sibling',
			'ShiftEscape': 'toggle-exploded',
			'~': 'insert-or-append-command',
			'!': 'insert-or-append-bool',
			'@': 'insert-or-append-symbol',
			'#': 'insert-or-append-integer',
			'$': 'insert-or-append-string',
			'%': 'insert-or-append-float',
			'^': 'insert-or-append-nil',
			'&': 'insert-or-append-lambda',
			'*': 'insert-or-append-expectation',
			'(': 'insert-or-append-word',
			')': 'insert-or-append-org',
			'[': 'insert-or-append-line',
			'{': 'insert-or-append-doc',
			'`': 'add-tag',
			'Alt`': 'remove-all-tags',

			'Alt~': 'wrap-in-command',
			'Alt&': 'wrap-in-lambda',
			'Alt*': 'wrap-in-expectation',
			'Alt(': 'wrap-in-word',
			'Alt)': 'wrap-in-org',
			'Alt[': 'wrap-in-line',
			'Alt{': 'wrap-in-doc',
		};
	}

	getNexGenericTable() {
		return {
			'ShiftTab': 'select-parent',
			'Tab': 'select-next-sibling',
			'ArrowUp': 'move-left-up',
			'ArrowDown': 'move-right-down',
			'ArrowLeft': 'move-left-up',
			'ArrowRight': 'move-right-down',
			'ShiftBackspace': 'remove-selected-and-select-previous-sibling',
			'Backspace': 'remove-selected-and-select-previous-sibling',
			'ShiftEscape': 'toggle-exploded',
			'~': 'insert-command-as-next-sibling',
			'!': 'insert-bool-as-next-sibling',
			'@': 'insert-symbol-as-next-sibling',
			'#': 'insert-integer-as-next-sibling',
			'$': 'insert-string-as-next-sibling',
			'%': 'insert-float-as-next-sibling',
			'^': 'insert-nil-as-next-sibling',
			'&': 'insert-lambda-as-next-sibling',
			'*': 'insert-expectation-as-next-sibling',
			'(': 'insert-word-as-next-sibling',
			')': 'insert-org-as-next-sibling',
			'[': 'insert-line-as-next-sibling',
			'{': 'insert-doc-as-next-sibling',
			'`': 'add-tag',
			'Alt`': 'remove-all-tags',

			'Alt~': 'wrap-in-command',
			'Alt&': 'wrap-in-lambda',
			'Alt*': 'wrap-in-expectation',
			'Alt(': 'wrap-in-word',
			'Alt)': 'wrap-in-org',
			'Alt[': 'wrap-in-line',
			'Alt{': 'wrap-in-doc',
		};
	}
}

const keyDispatcher = new KeyDispatcher();

export {
	keyDispatcher
}

