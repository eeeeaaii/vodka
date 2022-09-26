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

import { UNHANDLED_KEY } from './globalconstants.js';
import { systemState } from './systemstate.js';
import { BINDINGS } from './environment.js';
import { manipulator } from './manipulator.js';
import { actionFactory, enqueueAndPerformAction, undo, redo } from './actions.js'
import { evaluateAndKeep } from './evaluatorinterface.js';
import { experiments } from './globalappflags.js'

class KeyDispatcher {
	constructor() {
		this.nqmarks = 0;
		this.uiCallbackObject = null;
	}

	setUiCallbackObject(obj) {
		this.uiCallbackObject = obj;
	}

	shouldBubble(keycode, whichkey, hasShift, hasCtrl, hasMeta, hasAlt) {
		let eventName = this.getEventName(keycode, hasShift, hasCtrl, hasMeta, hasAlt, whichkey);		
		if (eventName == 'Meta-+' || eventName == 'Meta--') {
			return true;
		}
		if (hasMeta && (keycode == '2')) {
			return true;
		}
		return false;
	}

	dispatch(keycode, whichkey, hasShift, hasCtrl, hasMeta, hasAlt) {
		// don't need to do anything with modifier key presses directly, and having them go through the pipline
		// makes it hard to debug key presses.
		//
		// returning true means "don't cancel browser event" - this weirdly only affects the tests
		if (keycode == 'CapsLock') return;
		if (keycode == 'Shift') return;
		if (keycode == 'Alt') return;
		if (keycode == 'Meta') return;
		if (keycode == 'Control') return;

		if (hasMeta && (keycode == '2')) {
			return;
		}
		let eventName = this.getEventName(keycode, hasShift, hasCtrl, hasMeta, hasAlt, whichkey);

		if (systemState.getGlobalSelectedNode().usingEditor()) {
			// Will either return a keycode, or null.
			// if a keycode, we reroute that keycode (handle it below), else we exit.
			// if it returns null it means that the editor handled the key
			// usually it won't change the keycode, but it can.

			eventName = this.doEditorEvent(eventName);
			if (eventName === null) {
				return;
			}
		}


		// there are a few special cases
		if (eventName == '|') {
			// vertical bar is unusable - 'internal use only'
		} else if (eventName == 'Meta-z') {
			undo();
		} else if (eventName == 'Meta-y') {
			redo();
		} else if (eventName == 'Meta-s') {
			let rn = manipulator.doSave();
			if (rn) {
				evaluateAndKeep(rn)
			}
		} else if (eventName == 'Meta-x') {
			manipulator.doCut();
		} else if (eventName == 'Meta-c') {
			manipulator.doCopy();
		} else if (eventName == 'Meta-v') {
			manipulator.doPaste();
		} else if (eventName == 'Escape' && !systemState.getGlobalSelectedNode().usingEditor()) {
			this.toggleGlobalExplodedMode();
		} else {
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
				let sourceNode = systemState.getGlobalSelectedNode();

				let actionName = this.getActionNameFromRegularTable(sourceNode, eventName);
				if (!actionName) {
					actionName = this.getActionNameFromGenericTable(sourceNode, eventName);
				}
				if (!actionName || actionName == 'JUST_USE_DEFAULT') {
					actionName = this.getDefaultHandleActionName(sourceNode, eventName);
				}
				if (actionName) {
					// we don't save the source node because it becomes irrelevant
					// if we undo and then redo
					let action = actionFactory(actionName, eventName);
					enqueueAndPerformAction(action);
				}
			} catch (e) {
				if (e == UNHANDLED_KEY) {
					console.log("UNHANDLED KEY " +
									':' + 'keycode=' + keycode +
									',' + 'whichkey=' + whichkey +
									',' + 'hasShift=' + hasShift +
									',' + 'hasCtrl=' + hasCtrl +
									',' + 'hasMeta=' + hasMeta);
				} else throw e;
			}
		}
	}

	getActionNameFromRegularTable(sourceNode, eventName) {
		let table = sourceNode.nex.getEventTable();
		if (!table) {
			return '';
		}
		let f = table[eventName];
		if (f) {
			return f;
		}
		return '';
	}

	getActionNameFromGenericTable(sourceNode, eventName) {
		let table = null;
		if (sourceNode.nex.isNexContainer()) {
			table = this.getNexContainerGenericTable();
		} else {
			table = this.getNexGenericTable();
		}
		let f = table[eventName];
		if (f) {
			return f;
		}
		return '';
	}

	getDefaultHandleActionName(sourceNode, eventName) {
		let fname = 'standardDefault';
		if (sourceNode.nex.getDefaultHandler) {
			let f = sourceNode.nex.getDefaultHandler();
			if (f) {
				return f;
			}
		}
		return '';
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
		let eventName = this.getEventNameImpl(keycode, hasShift, hasCtrl, hasMeta, hasAlt, whichKey);
		eventName = eventName.replace(/^Ctrl/, 'Alt');
		return eventName;
	}


	getEventNameImpl(keycode, hasShift, hasCtrl, hasMeta, hasAlt, whichKey) {
		// maybe I should rewrite this to do something like this:
		// return `${shiftPrefix}${MetaPrefix}${keycode}`
		// the only thing is I don't want it to return 'Shift!' or 'Shift$'
		if (keycode == 'Enter' && hasMeta && hasShift) {
			return 'ShiftMetaEnter';
		} else if (keycode == 'Enter' && hasMeta) {
			return 'MetaEnter';
		} else if (keycode == 'Enter' && hasCtrl) {
			return 'CtrlEnter';
		} else if (keycode == 'Enter' && hasShift) {
			return 'ShiftEnter';

		} else if (keycode == 'ArrowDown' && hasAlt) {
			return 'AltArrowDown';
		} else if (keycode == 'ArrowUp' && hasAlt) {
			return 'AltArrowUp';
		} else if (keycode == 'ArrowRight' && hasAlt) {
			return 'AltArrowRight';
		} else if (keycode == 'ArrowLeft' && hasAlt) {
			return 'AltArrowLeft';

		} else if (keycode == 'ArrowDown' && hasCtrl) {
			return 'CtrlArrowDown';
		} else if (keycode == 'ArrowUp' && hasCtrl) {
			return 'CtrlArrowUp';
		} else if (keycode == 'ArrowRight' && hasCtrl) {
			return 'CtrlArrowRight';
		} else if (keycode == 'ArrowLeft' && hasCtrl) {
			return 'CtrlArrowLeft';

		} else if (keycode == 'ArrowDown' && hasShift) {
			return 'ShiftArrowDown';
		} else if (keycode == 'ArrowUp' && hasShift) {
			return 'ShiftArrowUp';
		} else if (keycode == 'ArrowRight' && hasShift) {
			return 'ShiftArrowRight';
		} else if (keycode == 'ArrowLeft' && hasShift) {
			return 'ShiftArrowLeft';


		} else if (keycode == 'Escape' && hasAlt && hasShift) {
			return 'ShiftAltEscape';
		} else if (keycode == 'Escape' && hasAlt) {
			return 'AltEscape';
		} else if (keycode == 'Escape' && hasShift) {
			return 'ShiftEscape';

		} else if (keycode == 'Tab' && hasShift && hasAlt) {
			return 'ShiftAltTab';
		} else if (keycode == 'Tab' && hasShift && hasCtrl) {
			return 'ShiftCtrlTab';
		} else if (keycode == 'Tab' && hasAlt) {
			return 'AltTab';
		} else if (keycode == 'Tab' && hasCtrl) {
			return 'CtrlTab';
		} else if (keycode == 'Tab' && hasShift) {
			return 'ShiftTab';

		} else if (keycode == ' ' && hasShift) {
			return 'ShiftSpace';
		} else if (keycode == ' ' && hasCtrl) {
			return 'CtrlSpace';
		} else if ((keycode == ' ' || whichKey == 'Space') && hasAlt) { // on a mac, option-space inserts ascii 160, non-breaking space
			return 'AltSpace';
		} else if (keycode == ' ' && hasMeta) {
			return 'MetaSpace';

		} else if (keycode == '`' && hasAlt && hasShift) {
			return 'Alt~';
		} else if (keycode == 'Dead' && whichKey == 'Backquote' && hasAlt && !hasShift) {
			return 'Alt`';
		} else if (whichKey == 'Digit6' && hasAlt && hasShift) {
			return 'Alt^';
		} else if (whichKey == 'Digit7' && hasAlt && hasShift) {
			return 'Alt&';
		} else if (whichKey == 'Digit8' && hasAlt && hasShift) {
			return 'Alt*';
		} else if (whichKey == 'Digit9' && hasAlt && hasShift) {
			return 'Alt(';
		} else if (whichKey == 'Comma' && hasAlt && hasShift) {
			return 'Alt<';
		} else if (whichKey == 'BracketLeft' && hasAlt && !hasShift) {
			return 'Alt[';
		} else if (whichKey == 'BracketLeft' && hasAlt && hasShift) {
			return 'Alt{';
		} else if (keycode == '`' && hasCtrl && hasShift) {
			return 'Ctrl~';
		} else if (keycode == 'Dead' && whichKey == 'Backquote' && hasCtrl && !hasShift) {
			return 'Ctrl`';
		} else if (whichKey == 'Digit7' && hasCtrl && hasShift) {
			return 'Ctrl&';
		} else if (whichKey == 'Digit8' && hasCtrl && hasShift) {
			return 'Ctrl*';
		} else if (whichKey == 'Digit9' && hasCtrl && hasShift) {
			return 'Ctrl(';
		} else if (whichKey == 'Digit0' && hasCtrl && hasShift) {
			return 'Ctrl)';
		} else if (whichKey == 'BracketLeft' && hasCtrl && !hasShift) {
			return 'Ctrl[';
		} else if (whichKey == 'BracketLeft' && hasCtrl && hasShift) {
			return 'Ctrl{';

		} else if (keycode == 'Backspace' && hasShift && hasAlt) {
			return 'AltShiftBackspace';
		} else if (keycode == 'Backspace' && hasShift && hasCtrl) {
			return 'CtrlShiftBackspace';
		} else if (keycode == 'Backspace' && hasShift) {
			return 'ShiftBackspace';
		} else if (keycode == 'Backspace' && hasCtrl) {
			return 'CtrlBackspace';
		} else if (keycode == 'Backspace' && hasAlt) {
			return 'AltBackspace';

		} else if (keycode == 'z' && hasCtrl) {
			return 'Meta-z';
		} else if (keycode == 'x' && hasCtrl) {
			return 'Meta-x';
		} else if (keycode == 'c' && hasCtrl) {
			return 'Meta-c';
		} else if (keycode == 'v' && hasCtrl) {
			return 'Meta-v';
		} else if (keycode == 's' && hasCtrl) {
			return 'Meta-s';

		} else if (keycode == 'z' && hasMeta) {
			return 'Meta-z';
		} else if (keycode == 'x' && hasMeta) {
			return 'Meta-x';
		} else if (keycode == 'c' && hasMeta) {
			return 'Meta-c';
		} else if (keycode == 'v' && hasMeta) {
			return 'Meta-v';
		} else if (keycode == 'y' && hasMeta) {
			return 'Meta-y';
		} else if (keycode == 's' && hasMeta) {
			return 'Meta-s';
		} else if (keycode == '=' && hasMeta) {
			return 'Meta-+';
		} else if (keycode == '-' && hasMeta) {
			return 'Meta--';
		} else {
			return keycode;
		}
	}

	toggleGlobalExplodedMode() {
		let root = systemState.getRoot();
		this.uiCallbackObject.setExplodedState(root.isExploded())
		root.toggleRenderMode();
	}

	getNexContainerGenericTable() {
		return {
			'ShiftTab': 'select-parent',
			'Tab': 'select-first-child-or-force-insert-inside-insertion-mode',

			'ArrowUp': 'move-left-up',
			'ArrowLeft': 'move-left-up',
			'ArrowDown': 'move-right-down',
			'ArrowRight': 'move-right-down',

			'AltArrowUp': 'force-insert-before',
			'AltArrowDown': 'force-insert-after',
			'AltArrowLeft': 'force-insert-before',
			'AltArrowRight': 'force-insert-after',

			'AltTab': 'force-insert-inside',
			'ShiftAltTab': 'force-insert-around',

			'ShiftEnter': 'evaluate-nex-and-keep',
			'Enter': 'evaluate-nex',

			'ShiftSpace': 'toggle-dir',

			'ShiftBackspace': 'remove-selected-and-select-previous-sibling',
			'AltShiftBackspace': 'unroll',


			'LastBackspace': 'remove-selected-and-select-previous-sibling-if-empty',

			'Backspace': 'start-main-editor',

			'AltBackspace': 'start-main-editor',

			'ShiftEscape': 'toggle-exploded',

			'AltEnter': 'start-main-editor',

			'~': 'insert-command-at-insertion-point',
			'!': 'insert-bool-at-insertion-point',
			'@': 'insert-symbol-at-insertion-point',
			'#': 'insert-integer-at-insertion-point',
			'$': 'insert-string-at-insertion-point',
			'%': 'insert-float-at-insertion-point',
			'^': 'insert-instantiator-at-insertion-point',
			'&': 'insert-lambda-at-insertion-point',
			'*': 'insert-deferredcommand-at-insertion-point',
			'(': 'insert-org-at-insertion-point',
			'[': 'insert-line-at-insertion-point',
			'{': 'insert-doc-at-insertion-point',
			'<': 'insert-word-at-insertion-point',
			'_': 'insert-wavetable-at-insertion-point',

			')': 'close-off-org',
			']': 'close-off-line',
			'}': 'close-off-doc',
			'>': 'close-off-word',
			'`': 'add-tag',

			'Alt~': 'wrap-in-command',
			'Alt&': 'wrap-in-lambda',
			'Alt*': 'wrap-in-deferredcommand',
			'Alt<': 'wrap-in-word',
			'Alt(': 'wrap-in-org',
			'Alt[': 'wrap-in-line',
			'Alt{': 'wrap-in-doc',
			'Alt^': 'wrap-in-instantiator',
		};			
	}

	getNexGenericTable() {
		return {
			'ShiftTab': 'select-parent',
			'Tab': 'move-right-down',

			'ArrowUp': 'move-left-up',
			'ArrowDown': 'move-right-down',
			'ArrowLeft': 'move-left-up',
			'ArrowRight': 'move-right-down',

			'AltArrowUp': 'force-insert-before' ,
			'AltArrowDown': 'force-insert-after',
			'AltArrowLeft': 'force-insert-before',
			'AltArrowRight': 'force-insert-after',

			'ShiftAltTab': 'force-insert-around' ,

			'ShiftBackspace': 'remove-selected-and-select-previous-sibling',
			'LastBackspace': 'remove-selected-and-select-previous-sibling',

			'Backspace': 'start-main-editor',

			'AltBackspace': 'start-main-editor',

			'ShiftEscape': 'toggle-exploded',

			'AltEnter': 'start-main-editor',

			'ShiftEscape': 'toggle-exploded',
			'Enter': 'evaluate-nex',
			'~': 'insert-command-at-insertion-point',
			'!': 'insert-bool-at-insertion-point',
			'@': 'insert-symbol-at-insertion-point',
			'#': 'insert-integer-at-insertion-point',
			'$': 'insert-string-at-insertion-point',
			'%': 'insert-float-at-insertion-point',
			'^': 'insert-instantiator-at-insertion-point',
			'&': 'insert-lambda-at-insertion-point',
			'*': 'insert-deferredcommand-at-insertion-point',

			'(': 'insert-org-at-insertion-point',
			')': 'close-off-org',
			'[': 'insert-line-at-insertion-point',
			']': 'close-off-line',
			'{': 'insert-doc-at-insertion-point',
			'}': 'close-off-doc',
			'<': 'insert-word-at-insertion-point',
			'>': 'close-off-word',

			'_': 'insert-wavetable-at-insertion-point',

			'`': 'add-tag',
			'Alt~': 'wrap-in-command',
			'Alt&': 'wrap-in-lambda',
			'Alt*': 'wrap-in-deferredcommand',
			'Alt<': 'wrap-in-word',
			'Alt(': 'wrap-in-org',
			'Alt[': 'wrap-in-line',
			'Alt{': 'wrap-in-doc',
			'Alt^': 'wrap-in-instantiator'
		};
	}
}

const keyDispatcher = new KeyDispatcher();

export {
	keyDispatcher
}

