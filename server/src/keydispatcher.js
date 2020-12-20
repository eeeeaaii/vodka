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


import { UNHANDLED_KEY, RENDER_MODE_EXPLO, RENDER_MODE_NORM } from './globalconstants.js';
import { systemState } from './systemstate.js';
import { BINDINGS } from './environment.js';
import { manipulator } from './manipulator.js';
import { undo } from './undo.js';
import { ContextType } from './contexttype.js';
import { KeyResponseFunctions, DefaultHandlers } from './keyresponsefunctions.js';
import { evaluateNexSafely } from './evaluator.js';
import { experiments } from './globalappflags.js'

class KeyDispatcher {
	dispatch(keycode, whichkey, hasShift, hasCtrl, hasMeta, hasAlt) {
		let keyContext = ContextType.COMMAND;
		let p = systemState.getGlobalSelectedNode().getParent();
		if (p) {
			while((keyContext = p.getNex().getContextType()) == ContextType.PASSTHROUGH) {
				p = p.getParent();
			}
		}
		let eventName = this.getEventName(keycode, hasShift, hasCtrl, hasMeta, hasAlt, whichkey);

		if (!experiments.BETTER_KEYBINDINGS) {
			if (eventName == 'NakedShift') {
				// if we get a naked shift while editing, we leave the editor.
				if (systemState.getGlobalSelectedNode().usingEditor()) {
					systemState.getGlobalSelectedNode().forceCloseEditor();
				}
				systemState.getGlobalSelectedNode().nextInsertionMode();
				return false;
			}
		}

		if (systemState.getGlobalSelectedNode().usingEditor()) {
			// will return whether or not to "reroute"
			// rerouting means the editor didn't handle the key AND wants keydispatcher
			// to handle it instead
			let reroute = this.doEditorEvent(eventName);
			if (!reroute) {
				return false;
			}
		}

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

	doEditorEvent(eventName) {
		// events are handled differently when an editor is being used
		// all events are routed to the editor instead of the nex, until the editor
		// is finished.
		// right now we just have an editor for tags but we will need editors for
		// strings, symbols, commands/lambdas.
		return systemState.getGlobalSelectedNode().routeKeyToCurrentEditor(eventName);
	}

	getEventName(keycode, hasShift, hasCtrl, hasMeta, hasAlt, whichKey) {
		// maybe I should rewrite this to do something like this:
		// return `${shiftPrefix}${MetaPrefix}${keycode}`
		// the only thing is I don't want it to return 'Shift!' or 'Shift$'
		if (keycode == 'Enter' && hasMeta && hasShift) {
			return 'ShiftMetaEnter';
		} else if (keycode == 'ArrowDown' && hasAlt) {
			return 'AltArrowDown';
		} else if (keycode == 'ArrowUp' && hasAlt) {
			return 'AltArrowUp';
		} else if (keycode == 'ArrowRight' && hasAlt) {
			return 'AltArrowRight';
		} else if (keycode == 'ArrowLeft' && hasAlt) {
			return 'AltArrowLeft';
		} else if (keycode == 'ArrowDown' && hasShift) {
			return 'ShiftArrowDown';
		} else if (keycode == 'ArrowUp' && hasShift) {
			return 'ShiftArrowUp';
		} else if (keycode == 'ArrowRight' && hasShift) {
			return 'ShiftArrowRight';
		} else if (keycode == 'ArrowLeft' && hasShift) {
			return 'ShiftArrowLeft';
		} else if (keycode == 'Enter' && hasMeta) {
			return 'MetaEnter';
		} else if (keycode == 'Enter' && hasCtrl) {
			return 'CtrlEnter';
		} else if (keycode == 'Escape' && hasShift) {
			return 'ShiftEscape';
		} else if (keycode == 'Enter' && hasShift) {
			return 'ShiftEnter';
		} else if (keycode == 'Tab' && hasShift && hasAlt) {
			return 'ShiftAltTab';
		} else if (keycode == 'Tab' && hasShift) {
			return 'ShiftTab';
		} else if (keycode == 'Tab' && hasAlt) {
			return 'AltTab';
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
		let root = systemState.getRoot();
		root.toggleRenderMode();
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
			'Tab': 'select-first-child-or-force-insert-inside-insertion-mode',

			'ArrowUp': 'move-left-up-v2',
			'ArrowLeft': 'move-left-up-v2',
			'ArrowDown': 'move-right-down-v2',
			'ArrowRight': 'move-right-down-v2',

			'ShiftArrowUp': (experiments.BETTER_KEYBINDINGS ? 'force-insert-before' : null),
			'ShiftArrowDown': (experiments.BETTER_KEYBINDINGS ? 'force-insert-after' : null),
			'ShiftArrowLeft': (experiments.BETTER_KEYBINDINGS ? 'force-insert-before' : null),
			'ShiftArrowRight': (experiments.BETTER_KEYBINDINGS ? 'force-insert-after' : null),

			'AltTab': (experiments.BETTER_KEYBINDINGS ? 'force-insert-inside' : null),
			'ShiftAltTab': (experiments.BETTER_KEYBINDINGS ? 'force-insert-around' : null),

			'ShiftEnter': (experiments.BETTER_KEYBINDINGS ? 'evaluate-nex-and-keep' : null),
			'Enter': (experiments.BETTER_KEYBINDINGS ? 'evaluate-nex' : null),

			'ShiftSpace': (experiments.BETTER_KEYBINDINGS ? 'toggle-dir' : null),

			'ShiftBackspace': 'remove-selected-and-select-previous-sibling-v2',
			'Backspace': (experiments.BETTER_KEYBINDINGS ? 'start-main-editor-or-delete' : 'remove-selected-and-select-previous-sibling-v2'),
			'ShiftEscape': 'toggle-exploded',

			'CtrlEnter': (experiments.CTRL_ENTER_CHANGE ? 'evaluate-v2' : 'start-main-editor'),

			'~': 'insert-command-at-insertion-point-v2',
			'!': 'insert-bool-at-insertion-point-v2',
			'@': 'insert-symbol-at-insertion-point-v2',
			'#': 'insert-integer-at-insertion-point-v2',
			'$': 'insert-string-at-insertion-point-v2',
			'%': 'insert-float-at-insertion-point-v2',
			'^': 'insert-nil-at-insertion-point-v2',
			'&': 'insert-lambda-at-insertion-point-v2',
			'*': 'insert-expectation-at-insertion-point-v2',
			'(': 'insert-word-at-insertion-point-v2',
			')': 'insert-org-at-insertion-point-v2',
			'[': 'insert-line-at-insertion-point-v2',
			'{': 'insert-doc-at-insertion-point-v2',
			'`': 'add-tag',
			'Alt`': 'remove-all-tags',

			'Alt~': 'wrap-in-command',
			'Alt&': 'wrap-in-lambda',
			'Alt*': 'wrap-in-expectation',
			'Alt(': 'wrap-in-word',
			'Alt)': 'wrap-in-org',
			'Alt[': 'wrap-in-line',
			'Alt{': 'wrap-in-doc'
		};			
	}

	getNexGenericTable() {
		return {
			'ShiftTab': 'select-parent',
			'Tab': 'select-next-sibling',

			'ArrowUp': 'move-left-up-v2',
			'ArrowDown': 'move-right-down-v2',
			'ArrowLeft': 'move-left-up-v2',
			'ArrowRight': 'move-right-down-v2',

			'ShiftArrowUp': (experiments.BETTER_KEYBINDINGS ? 'force-insert-before' : null),
			'ShiftArrowDown': (experiments.BETTER_KEYBINDINGS ? 'force-insert-after': null),
			'ShiftArrowLeft': (experiments.BETTER_KEYBINDINGS ? 'force-insert-before': null),
			'ShiftArrowRight': (experiments.BETTER_KEYBINDINGS ? 'force-insert-after': null),

			'ShiftAltTab': (experiments.BETTER_KEYBINDINGS ? 'force-insert-around' : null),

			'ShiftBackspace': 'remove-selected-and-select-previous-sibling-v2',
			'Backspace': (experiments.BETTER_KEYBINDINGS ? 'start-main-editor-or-delete' : 'remove-selected-and-select-previous-sibling-v2'),

			'ShiftEscape': 'toggle-exploded',
			'Enter': 'evaluate-v2',
			'CtrlEnter': (experiments.CTRL_ENTER_CHANGE ? 'evaluate-v2' : 'start-main-editor'),
			'~': 'insert-command-at-insertion-point-v2',
			'!': 'insert-bool-at-insertion-point-v2',
			'@': 'insert-symbol-at-insertion-point-v2',
			'#': 'insert-integer-at-insertion-point-v2',
			'$': 'insert-string-at-insertion-point-v2',
			'%': 'insert-float-at-insertion-point-v2',
			'^': 'insert-nil-at-insertion-point-v2',
			'&': 'insert-lambda-at-insertion-point-v2',
			'*': 'insert-expectation-at-insertion-point-v2',
			'(': 'insert-word-at-insertion-point-v2',
			')': 'insert-org-at-insertion-point-v2',
			'[': 'insert-line-at-insertion-point-v2',
			'{': 'insert-doc-at-insertion-point-v2',
			'<': 'insert-zlist-at-insertion-point-v2',
			'`': 'add-tag',
			'Alt`': 'remove-all-tags',
			'Alt~': 'wrap-in-command',
			'Alt&': 'wrap-in-lambda',
			'Alt*': 'wrap-in-expectation',
			'Alt(': 'wrap-in-word',
			'Alt)': 'wrap-in-org',
			'Alt[': 'wrap-in-line',
			'Alt{': 'wrap-in-doc'
		};
	}
}

const keyDispatcher = new KeyDispatcher();

export {
	keyDispatcher
}

