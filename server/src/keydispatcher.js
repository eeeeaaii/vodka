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
import { isAutocompleteKeyCombo } from './editors.js'

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
		let clip = this.getClipboardCommand(eventName);
		if (clip == 'zoom-in' || clip == 'zoom-out') {
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
		eventName = this.matchKeyCombo(systemState.getGlobalSelectedNode(), eventName, keycode);

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
		} else if (this.getClipboardCommand(eventName) == 'undo') {
			undo();
		} else if (this.getClipboardCommand(eventName) == 'redo') {
			redo();
		} else if (this.getClipboardCommand(eventName) == 'save') {
			let rn = manipulator.doSave();
			if (rn) {
				evaluateAndKeep(rn)
			}
		} else if (this.getClipboardCommand(eventName) == 'cut') {
			enqueueAndPerformAction(actionFactory('cut'));
		} else if (this.getClipboardCommand(eventName) == 'copy') {
			// copy does not change the document, so there is nothing to undo
			manipulator.doCopy();
		} else if (this.getClipboardCommand(eventName) == 'paste') {
			enqueueAndPerformAction(actionFactory('paste'));
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
									',' + 'hasMeta=' + hasMeta +
									',' + 'hasAlt=' + hasAlt);
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
		let mac = this.isMacPlatform();
		if (sourceNode.nex.isNexContainer()) {
			table = mac ? this.getMacNexContainerGenericTable() : this.getPcNexContainerGenericTable();
		} else {
			table = mac ? this.getMacNexGenericTable() : this.getPcNexGenericTable();
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

	// Names a physical key combination, literally. Modifiers in a fixed order (Ctrl,
	// Alt, Meta, Shift) followed by the physical key from e.code. No platform
	// knowledge, no aliasing one modifier onto another, and nothing rewritten
	// afterwards -- whether ctrl means the same thing as alt is a question for
	// the tables to answer, not this function.
	//
	// Keys pressed with no ctrl/alt/meta are named by e.key instead, because
	// that is the text editors consume when you type ('a', '~', '!'), and
	// because e.key already has shift applied to printable characters. Named
	// keys (Tab, Enter, the arrows) don't encode shift that way, so they say so.
	getEventName(keycode, hasShift, hasCtrl, hasMeta, hasAlt, whichKey) {
		if (!hasCtrl && !hasAlt && !hasMeta) {
			if (keycode == ' ') {
				return hasShift ? 'ShiftSpace' : keycode;
			}
			if (keycode.length == 1) {
				return keycode;
			}
			return (hasShift ? 'Shift' : '') + keycode;
		}
		let name = '';
		if (hasCtrl) name += 'Ctrl';
		if (hasAlt) name += 'Alt';
		if (hasMeta) name += 'Meta';
		if (hasShift) name += 'Shift';
		return name + whichKey;
	}

	// cmd on a mac and ctrl everywhere else both drive this family. Handled here
	// rather than in the tables because these don't go through actionFactory.
	getClipboardCommand(eventName) {
		switch(eventName) {
			case 'CtrlKeyZ': case 'MetaKeyZ': return 'undo';
			case 'MetaKeyY': return 'redo';
			case 'CtrlKeyS': case 'MetaKeyS': return 'save';
			case 'CtrlKeyX': case 'MetaKeyX': return 'cut';
			case 'CtrlKeyC': case 'MetaKeyC': return 'copy';
			case 'CtrlKeyV': case 'MetaKeyV': return 'paste';
			case 'MetaEqual': return 'zoom-in';
			case 'MetaMinus': return 'zoom-out';
			default: return null;
		}
	}

	// Looks up the combination as pressed, and falls back to the bare key when
	// nothing claims it, so ctrl-a still types an 'a' rather than arriving as
	// 'CtrlKeyA'. This is what the old namer's final `return keycode` did for
	// every combination it hadn't enumerated.
	//
	// Shift-only names ('ShiftArrowUp') never took that path, and neither does a
	// combination with no modifier to strip.
	matchKeyCombo(sourceNode, eventName, keycode) {
		if (!keycode || eventName == keycode) return eventName;
		if (!/^(Ctrl|Alt|Meta)/.test(eventName)) return eventName;
		let claimedBy = this.getClipboardCommand(eventName)
			// editors match the autocomplete combination directly, not via a table
			|| isAutocompleteKeyCombo(eventName)
			|| this.getActionNameFromRegularTable(sourceNode, eventName)
			|| this.getActionNameFromGenericTable(sourceNode, eventName);
		return claimedBy ? eventName : keycode;
	}

	isMacPlatform() {
		return ('' + navigator.platform).substring(0, 3) == 'Mac';
	}

	toggleGlobalExplodedMode() {
		let root = systemState.getRoot();
		this.uiCallbackObject.setExplodedState(root.isExploded())
		root.toggleRenderMode();
	}

	// Four tables: mac and pc, each for containers and for atoms. A table may map
	// several key combinations to the same action -- that is how ctrl and alt both
	// reach the wrap-inserts, stated outright instead of achieved by string surgery.
	//
	// Mac and pc currently list identical combinations, because the old code aliased
	// every Ctrl name onto its Alt twin before lookup, so both already worked on
	// both platforms. They are separate now so they can diverge on purpose.
	getMacNexContainerGenericTable() {
		return {
			'ShiftTab':             'select-parent',
			'Tab':                  'select-first-child-or-force-insert-inside-insertion-mode',
			'ArrowUp':              'move-left-up',
			'ArrowLeft':            'move-left-up',
			'ArrowDown':            'move-right-down',
			'ArrowRight':           'move-right-down',
			'AltArrowUp':           'force-insert-before',
			'CtrlArrowUp':          'force-insert-before',
			'AltArrowDown':         'force-insert-after',
			'CtrlArrowDown':        'force-insert-after',
			'AltArrowLeft':         'force-insert-before',
			'CtrlArrowLeft':        'force-insert-before',
			'AltArrowRight':        'force-insert-after',
			'CtrlArrowRight':       'force-insert-after',
			'AltTab':               'force-insert-inside',
			'CtrlTab':              'force-insert-inside',
			'AltShiftTab':          'force-insert-around',
			'CtrlShiftTab':         'force-insert-around',
			'ShiftEnter':           'evaluate-nex-and-keep',
			'Enter':                'evaluate-nex',
			'ShiftSpace':           'toggle-dir',
			'ShiftBackspace':       'remove-selected-and-select-previous-sibling',
			'AltShiftBackspace':    'unroll',
			'CtrlShiftBackspace':   'unroll',
			'LastBackspace':        'remove-selected-and-select-previous-sibling-if-empty',
			'Backspace':            'start-main-editor',
			// ctrl-enter reached start-main-editor through the old Ctrl->Alt
			// rewrite. alt-enter did not: nothing produced 'AltEnter', so it fell
			// through to 'Enter' and evaluated. Preserving that asymmetry.
			'CtrlEnter':            'start-main-editor',
			'CtrlShiftEnter':       'start-main-editor',
			'AltBackspace':         'start-main-editor',
			'CtrlBackspace':        'start-main-editor',
			'ShiftEscape':          'toggle-exploded',
			'~':                    'insert-command-at-insertion-point',
			'!':                    'insert-bool-at-insertion-point',
			'@':                    'insert-symbol-at-insertion-point',
			'#':                    'insert-integer-at-insertion-point',
			'$':                    'insert-string-at-insertion-point',
			'%':                    'insert-float-at-insertion-point',
			'^':                    'insert-instantiator-at-insertion-point',
			'&':                    'insert-lambda-at-insertion-point',
			'*':                    'insert-deferredcommand-at-insertion-point',
			'(':                    'insert-org-at-insertion-point',
			'[':                    'insert-line-at-insertion-point',
			'{':                    'insert-doc-at-insertion-point',
			'<':                    'insert-word-at-insertion-point',
			'_':                    'insert-wavetable-at-insertion-point',
			')':                    'close-off-org',
			']':                    'close-off-line',
			'}':                    'close-off-doc',
			'>':                    'close-off-word',
			'`':                    'add-tag',
			'\\':                 'toggle-collapsed',
			'CtrlBackslash':        'toggle-wave-controls',
			'AltShiftBackquote':    'wrap-in-command',
			'CtrlShiftBackquote':   'wrap-in-command',
			'AltShiftDigit7':       'wrap-in-lambda',
			'CtrlShiftDigit7':      'wrap-in-lambda',
			'AltShiftDigit8':       'wrap-in-deferredcommand',
			'CtrlShiftDigit8':      'wrap-in-deferredcommand',
			'AltShiftComma':        'wrap-in-word',
			'CtrlShiftComma':       'wrap-in-word',
			'AltShiftDigit9':       'wrap-in-org',
			'CtrlShiftDigit9':      'wrap-in-org',
			'AltBracketLeft':       'wrap-in-line',
			'CtrlBracketLeft':      'wrap-in-line',
			'AltShiftBracketLeft':  'wrap-in-doc',
			'CtrlShiftBracketLeft': 'wrap-in-doc',
			'AltShiftDigit6':       'wrap-in-instantiator',
			'CtrlShiftDigit6':      'wrap-in-instantiator',
			'AltShiftArrowUp':     'force-insert-before',
			'CtrlShiftArrowUp':    'force-insert-before',
			'AltShiftArrowDown':   'force-insert-after',
			'CtrlShiftArrowDown':  'force-insert-after',
			'AltShiftArrowLeft':   'force-insert-before',
			'CtrlShiftArrowLeft':  'force-insert-before',
			'AltShiftArrowRight':  'force-insert-after',
			'CtrlShiftArrowRight': 'force-insert-after',
			'MetaShiftTab':       'select-parent',
			'CtrlShiftEnter':     'evaluate-nex-and-keep',
			'AltShiftEnter':      'evaluate-nex-and-keep',
			'MetaShiftEnter':     'evaluate-nex-and-keep',
			'CtrlShiftSpace':     'toggle-dir',
			'AltShiftSpace':      'toggle-dir',
			'MetaShiftSpace':     'toggle-dir',
			'MetaShiftBackspace': 'remove-selected-and-select-previous-sibling',
			'CtrlShiftEscape':    'toggle-exploded',
			'AltShiftEscape':     'toggle-exploded',
			'MetaShiftEscape':    'toggle-exploded',
		};
	}

	getPcNexContainerGenericTable() {
		return {
			'ShiftTab':             'select-parent',
			'Tab':                  'select-first-child-or-force-insert-inside-insertion-mode',
			'ArrowUp':              'move-left-up',
			'ArrowLeft':            'move-left-up',
			'ArrowDown':            'move-right-down',
			'ArrowRight':           'move-right-down',
			'AltArrowUp':           'force-insert-before',
			'CtrlArrowUp':          'force-insert-before',
			'AltArrowDown':         'force-insert-after',
			'CtrlArrowDown':        'force-insert-after',
			'AltArrowLeft':         'force-insert-before',
			'CtrlArrowLeft':        'force-insert-before',
			'AltArrowRight':        'force-insert-after',
			'CtrlArrowRight':       'force-insert-after',
			'AltTab':               'force-insert-inside',
			'CtrlTab':              'force-insert-inside',
			'AltShiftTab':          'force-insert-around',
			'CtrlShiftTab':         'force-insert-around',
			'ShiftEnter':           'evaluate-nex-and-keep',
			'Enter':                'evaluate-nex',
			'ShiftSpace':           'toggle-dir',
			'ShiftBackspace':       'remove-selected-and-select-previous-sibling',
			'AltShiftBackspace':    'unroll',
			'CtrlShiftBackspace':   'unroll',
			'LastBackspace':        'remove-selected-and-select-previous-sibling-if-empty',
			'Backspace':            'start-main-editor',
			// ctrl-enter reached start-main-editor through the old Ctrl->Alt
			// rewrite. alt-enter did not: nothing produced 'AltEnter', so it fell
			// through to 'Enter' and evaluated. Preserving that asymmetry.
			'CtrlEnter':            'start-main-editor',
			'CtrlShiftEnter':       'start-main-editor',
			'AltBackspace':         'start-main-editor',
			'CtrlBackspace':        'start-main-editor',
			'ShiftEscape':          'toggle-exploded',
			'~':                    'insert-command-at-insertion-point',
			'!':                    'insert-bool-at-insertion-point',
			'@':                    'insert-symbol-at-insertion-point',
			'#':                    'insert-integer-at-insertion-point',
			'$':                    'insert-string-at-insertion-point',
			'%':                    'insert-float-at-insertion-point',
			'^':                    'insert-instantiator-at-insertion-point',
			'&':                    'insert-lambda-at-insertion-point',
			'*':                    'insert-deferredcommand-at-insertion-point',
			'(':                    'insert-org-at-insertion-point',
			'[':                    'insert-line-at-insertion-point',
			'{':                    'insert-doc-at-insertion-point',
			'<':                    'insert-word-at-insertion-point',
			'_':                    'insert-wavetable-at-insertion-point',
			')':                    'close-off-org',
			']':                    'close-off-line',
			'}':                    'close-off-doc',
			'>':                    'close-off-word',
			'`':                    'add-tag',
			'\\':                 'toggle-collapsed',
			'CtrlBackslash':        'toggle-wave-controls',
			'AltShiftBackquote':    'wrap-in-command',
			'CtrlShiftBackquote':   'wrap-in-command',
			'AltShiftDigit7':       'wrap-in-lambda',
			'CtrlShiftDigit7':      'wrap-in-lambda',
			'AltShiftDigit8':       'wrap-in-deferredcommand',
			'CtrlShiftDigit8':      'wrap-in-deferredcommand',
			'AltShiftComma':        'wrap-in-word',
			'CtrlShiftComma':       'wrap-in-word',
			'AltShiftDigit9':       'wrap-in-org',
			'CtrlShiftDigit9':      'wrap-in-org',
			'AltBracketLeft':       'wrap-in-line',
			'CtrlBracketLeft':      'wrap-in-line',
			'AltShiftBracketLeft':  'wrap-in-doc',
			'CtrlShiftBracketLeft': 'wrap-in-doc',
			'AltShiftDigit6':       'wrap-in-instantiator',
			'CtrlShiftDigit6':      'wrap-in-instantiator',
			'AltShiftArrowUp':     'force-insert-before',
			'CtrlShiftArrowUp':    'force-insert-before',
			'AltShiftArrowDown':   'force-insert-after',
			'CtrlShiftArrowDown':  'force-insert-after',
			'AltShiftArrowLeft':   'force-insert-before',
			'CtrlShiftArrowLeft':  'force-insert-before',
			'AltShiftArrowRight':  'force-insert-after',
			'CtrlShiftArrowRight': 'force-insert-after',
			'MetaShiftTab':       'select-parent',
			'CtrlShiftEnter':     'evaluate-nex-and-keep',
			'AltShiftEnter':      'evaluate-nex-and-keep',
			'MetaShiftEnter':     'evaluate-nex-and-keep',
			'CtrlShiftSpace':     'toggle-dir',
			'AltShiftSpace':      'toggle-dir',
			'MetaShiftSpace':     'toggle-dir',
			'MetaShiftBackspace': 'remove-selected-and-select-previous-sibling',
			'CtrlShiftEscape':    'toggle-exploded',
			'AltShiftEscape':     'toggle-exploded',
			'MetaShiftEscape':    'toggle-exploded',
		};
	}

	getMacNexGenericTable() {
		return {
			'ShiftTab':             'select-parent',
			'Tab':                  'move-right-down',
			'ArrowUp':              'move-left-up',
			'ArrowDown':            'move-right-down',
			'ArrowLeft':            'move-left-up',
			'ArrowRight':           'move-right-down',
			'AltArrowUp':           'force-insert-before',
			'CtrlArrowUp':          'force-insert-before',
			'AltArrowDown':         'force-insert-after',
			'CtrlArrowDown':        'force-insert-after',
			'AltArrowLeft':         'force-insert-before',
			'CtrlArrowLeft':        'force-insert-before',
			'AltArrowRight':        'force-insert-after',
			'CtrlArrowRight':       'force-insert-after',
			'AltShiftTab':          'force-insert-around',
			'CtrlShiftTab':         'force-insert-around',
			'ShiftBackspace':       'remove-selected-and-select-previous-sibling',
			'LastBackspace':        'remove-selected-and-select-previous-sibling',
			'Backspace':            'start-main-editor',
			// ctrl-enter reached start-main-editor through the old Ctrl->Alt
			// rewrite. alt-enter did not: nothing produced 'AltEnter', so it fell
			// through to 'Enter' and evaluated. Preserving that asymmetry.
			'CtrlEnter':            'start-main-editor',
			'CtrlShiftEnter':       'start-main-editor',
			'AltBackspace':         'start-main-editor',
			'CtrlBackspace':        'start-main-editor',
			'ShiftEscape':          'toggle-exploded',
			'ShiftEscape':          'toggle-exploded',
			'Enter':                'evaluate-nex',
			'~':                    'insert-command-at-insertion-point',
			'!':                    'insert-bool-at-insertion-point',
			'@':                    'insert-symbol-at-insertion-point',
			'#':                    'insert-integer-at-insertion-point',
			'$':                    'insert-string-at-insertion-point',
			'%':                    'insert-float-at-insertion-point',
			'^':                    'insert-instantiator-at-insertion-point',
			'&':                    'insert-lambda-at-insertion-point',
			'*':                    'insert-deferredcommand-at-insertion-point',
			'(':                    'insert-org-at-insertion-point',
			')':                    'close-off-org',
			'[':                    'insert-line-at-insertion-point',
			']':                    'close-off-line',
			'{':                    'insert-doc-at-insertion-point',
			'}':                    'close-off-doc',
			'<':                    'insert-word-at-insertion-point',
			'>':                    'close-off-word',
			'_':                    'insert-wavetable-at-insertion-point',
			'`':                    'add-tag',
			'CtrlBackslash':        'toggle-wave-controls',
			'AltShiftBackquote':    'wrap-in-command',
			'CtrlShiftBackquote':   'wrap-in-command',
			'AltShiftDigit7':       'wrap-in-lambda',
			'CtrlShiftDigit7':      'wrap-in-lambda',
			'AltShiftDigit8':       'wrap-in-deferredcommand',
			'CtrlShiftDigit8':      'wrap-in-deferredcommand',
			'AltShiftComma':        'wrap-in-word',
			'CtrlShiftComma':       'wrap-in-word',
			'AltShiftDigit9':       'wrap-in-org',
			'CtrlShiftDigit9':      'wrap-in-org',
			'AltBracketLeft':       'wrap-in-line',
			'CtrlBracketLeft':      'wrap-in-line',
			'AltShiftBracketLeft':  'wrap-in-doc',
			'CtrlShiftBracketLeft': 'wrap-in-doc',
			'AltShiftDigit6':       'wrap-in-instantiator',
			'CtrlShiftDigit6':      'wrap-in-instantiator',
			'AltShiftArrowUp':     'force-insert-before',
			'CtrlShiftArrowUp':    'force-insert-before',
			'AltShiftArrowDown':   'force-insert-after',
			'CtrlShiftArrowDown':  'force-insert-after',
			'AltShiftArrowLeft':   'force-insert-before',
			'CtrlShiftArrowLeft':  'force-insert-before',
			'AltShiftArrowRight':  'force-insert-after',
			'CtrlShiftArrowRight': 'force-insert-after',
			'AltShiftBackspace':   'start-main-editor',
			'CtrlShiftBackspace':  'start-main-editor',
			'MetaShiftTab':       'select-parent',
			'MetaShiftBackspace': 'remove-selected-and-select-previous-sibling',
			'CtrlShiftEscape':    'toggle-exploded',
			'AltShiftEscape':     'toggle-exploded',
			'MetaShiftEscape':    'toggle-exploded',
		};
	}

	getPcNexGenericTable() {
		return {
			'ShiftTab':             'select-parent',
			'Tab':                  'move-right-down',
			'ArrowUp':              'move-left-up',
			'ArrowDown':            'move-right-down',
			'ArrowLeft':            'move-left-up',
			'ArrowRight':           'move-right-down',
			'AltArrowUp':           'force-insert-before',
			'CtrlArrowUp':          'force-insert-before',
			'AltArrowDown':         'force-insert-after',
			'CtrlArrowDown':        'force-insert-after',
			'AltArrowLeft':         'force-insert-before',
			'CtrlArrowLeft':        'force-insert-before',
			'AltArrowRight':        'force-insert-after',
			'CtrlArrowRight':       'force-insert-after',
			'AltShiftTab':          'force-insert-around',
			'CtrlShiftTab':         'force-insert-around',
			'ShiftBackspace':       'remove-selected-and-select-previous-sibling',
			'LastBackspace':        'remove-selected-and-select-previous-sibling',
			'Backspace':            'start-main-editor',
			// ctrl-enter reached start-main-editor through the old Ctrl->Alt
			// rewrite. alt-enter did not: nothing produced 'AltEnter', so it fell
			// through to 'Enter' and evaluated. Preserving that asymmetry.
			'CtrlEnter':            'start-main-editor',
			'CtrlShiftEnter':       'start-main-editor',
			'AltBackspace':         'start-main-editor',
			'CtrlBackspace':        'start-main-editor',
			'ShiftEscape':          'toggle-exploded',
			'ShiftEscape':          'toggle-exploded',
			'Enter':                'evaluate-nex',
			'~':                    'insert-command-at-insertion-point',
			'!':                    'insert-bool-at-insertion-point',
			'@':                    'insert-symbol-at-insertion-point',
			'#':                    'insert-integer-at-insertion-point',
			'$':                    'insert-string-at-insertion-point',
			'%':                    'insert-float-at-insertion-point',
			'^':                    'insert-instantiator-at-insertion-point',
			'&':                    'insert-lambda-at-insertion-point',
			'*':                    'insert-deferredcommand-at-insertion-point',
			'(':                    'insert-org-at-insertion-point',
			')':                    'close-off-org',
			'[':                    'insert-line-at-insertion-point',
			']':                    'close-off-line',
			'{':                    'insert-doc-at-insertion-point',
			'}':                    'close-off-doc',
			'<':                    'insert-word-at-insertion-point',
			'>':                    'close-off-word',
			'_':                    'insert-wavetable-at-insertion-point',
			'`':                    'add-tag',
			'CtrlBackslash':        'toggle-wave-controls',
			'AltShiftBackquote':    'wrap-in-command',
			'CtrlShiftBackquote':   'wrap-in-command',
			'AltShiftDigit7':       'wrap-in-lambda',
			'CtrlShiftDigit7':      'wrap-in-lambda',
			'AltShiftDigit8':       'wrap-in-deferredcommand',
			'CtrlShiftDigit8':      'wrap-in-deferredcommand',
			'AltShiftComma':        'wrap-in-word',
			'CtrlShiftComma':       'wrap-in-word',
			'AltShiftDigit9':       'wrap-in-org',
			'CtrlShiftDigit9':      'wrap-in-org',
			'AltBracketLeft':       'wrap-in-line',
			'CtrlBracketLeft':      'wrap-in-line',
			'AltShiftBracketLeft':  'wrap-in-doc',
			'CtrlShiftBracketLeft': 'wrap-in-doc',
			'AltShiftDigit6':       'wrap-in-instantiator',
			'CtrlShiftDigit6':      'wrap-in-instantiator',
			'AltShiftArrowUp':     'force-insert-before',
			'CtrlShiftArrowUp':    'force-insert-before',
			'AltShiftArrowDown':   'force-insert-after',
			'CtrlShiftArrowDown':  'force-insert-after',
			'AltShiftArrowLeft':   'force-insert-before',
			'CtrlShiftArrowLeft':  'force-insert-before',
			'AltShiftArrowRight':  'force-insert-after',
			'CtrlShiftArrowRight': 'force-insert-after',
			'AltShiftBackspace':   'start-main-editor',
			'CtrlShiftBackspace':  'start-main-editor',
			'MetaShiftTab':       'select-parent',
			'MetaShiftBackspace': 'remove-selected-and-select-previous-sibling',
			'CtrlShiftEscape':    'toggle-exploded',
			'AltShiftEscape':     'toggle-exploded',
			'MetaShiftEscape':    'toggle-exploded',
		};
	}
}


const keyDispatcher = new KeyDispatcher();

export {
	keyDispatcher
}

