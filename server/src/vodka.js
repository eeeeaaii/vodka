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

import { Environment } from './environment.js'
import { Manipulator } from './manipulator.js'
import { StepEvaluator } from './stepevaluator.js'
import { EventQueue } from './eventqueue.js'
import { PerformanceMonitor } from './perfmon.js'
import { GarbageCollector } from './gc.js'
import { ContractEnforcer } from './contract.js'
import { KeyDispatcher } from './keydispatcher.js'
import { Autocomplete } from './autocomplete.js'
import { createAsyncBuiltins } from './builtins/asyncbuiltins.js'
import { createBasicBuiltins } from './builtins/basicbuiltins.js'
import { createContractBuiltins } from './builtins/contractbuiltins.js'
import { createEnvironmentBuiltins } from './builtins/environmentbuiltins.js'
import { createFileBuiltins } from './builtins/filebuiltins.js'
import { createLogicBuiltins } from './builtins/logicbuiltins.js'
import { createMakeBuiltins } from './builtins/makebuiltins.js'
import { createMathBuiltins } from './builtins/mathbuiltins.js'
import { createNativeOrgs } from './builtins/nativeorgs.js'
import { createStringBuiltins } from './builtins/stringbuiltins.js'
import { createSyscalls } from './builtins/syscalls.js'
import { createTagBuiltins } from './builtins/tagbuiltins.js'
import { createTestBuiltins } from './builtins/testbuiltins.js'
import { createTypeConversionBuiltins } from './builtins/typeconversions.js'
import { Undo } from '/undo.js'
import { RenderNode } from '/rendernode.js'
import { Root } from '/nex/root.js'
import { Doc } from '/nex/doc.js'

var recording = false;
var firstKeyUp = true; // ignore first key up of recorded session because it's the esc key
var recorded_session = `
var harness = require('../testharness');

var testactions = [];

`

var session_end = `
harness.runTestNew(testactions, 'direct');
`
var shorthand = '';

function captureRecording() {
	let session_output = `
	// ${shorthand}
	` + recorded_session + session_end;
	navigator.clipboard.writeText(session_output);
}

var key_funnel_active = true;

function deactivateKeyFunnel() {
	key_funnel_active = false;
}

function activateKeyFunnel() {
	key_funnel_active = true;
}

const UNHANDLED_KEY = 'unhandled_key'

const EXPECTING_FIRST_DOWN  = 0;
const EXPECTING_FIRST_UP    = 1;
const EXPECTING_SECOND_DOWN = 2;
const EXPECTING_SECOND_UP   = 3;
const EXPECTING_THIRD_DOWN  = 4;
const EXPECTING_THIRD_UP    = 5;
const WILL_NOT_RECORD       = 6;
const RECORDING             = 7;
const RECORDING_DONE_EXPECTING_UP    = 8;
const RECORDING_DONE    = 9;

var state = EXPECTING_FIRST_DOWN;

function checkRecordState(event, type) {
	let kc = event.code;
	switch(state) {
		case EXPECTING_FIRST_DOWN:
			if (kc == 'Escape' && type == 'down') {
				state = EXPECTING_FIRST_UP;
			} else {
				state = WILL_NOT_RECORD;
			}
			break;
		case EXPECTING_FIRST_UP:
			if (kc == 'Escape' && type == 'up') {
				state = EXPECTING_SECOND_DOWN;
			} else {
				state = WILL_NOT_RECORD;
			}
			break;
		case EXPECTING_SECOND_DOWN:
			if (kc == 'Escape' && type == 'down') {
				state = EXPECTING_SECOND_UP;
			} else {
				state = WILL_NOT_RECORD;
			}
			break;
		case EXPECTING_SECOND_UP:
			if (kc == 'Escape' && type == 'up') {
				state = EXPECTING_THIRD_DOWN;
			} else {
				state = WILL_NOT_RECORD;
			}
			break;
		case EXPECTING_THIRD_DOWN:
			if (kc == 'Escape' && type == 'down') {
				state = EXPECTING_THIRD_UP;
			} else {
				state = WILL_NOT_RECORD;
			}
			break;
		case EXPECTING_THIRD_UP:
			if (kc == 'Escape' && type == 'up') {
				state = RECORDING;
			} else {
				state = WILL_NOT_RECORD;
			}
			break;
		case WILL_NOT_RECORD:
			break;
		case RECORDING:
			if (kc == 'Escape' && type == 'down') {
				state = RECORDING_DONE_EXPECTING_UP;
				break;
			}
			switch(type) {
			case 'up':
				logKeyUpEvent(event);
				break;
			case 'down':
				logKeyDownEvent(event);
				break;
			case 'mouse':
				logMouseEvent(event);
				break;
			}
			break;
		case RECORDING_DONE_EXPECTING_UP:
			if (kc == 'Escape' && type == 'up') {
				state = RECORDING_DONE;
				captureRecording();
			} else {
				state = WILL_NOT_RECORD;
			}
			break;
		case RECORDING_DONE:
			break;
	}
}


function logMouseEvent(e) {
	recorded_session += `testactions.push({
		type:'click',
		x:'${e.x}',
		y:'${e.y}'
	});
`;	
}
function logKeyDownEvent(e) {
	shorthand += '|' + e.key;
	recorded_session += `testactions.push({
		type:'keydown',
		code:'${e.code}'
	});
`;	
}
function logKeyUpEvent(e) {
	recorded_session += `testactions.push({
		type:'keyup',
		code:'${e.code}'
	});
`;	
}


// EXPERIMENTS

// CONSTANTS

// render flags
const RENDER_FLAG_NORMAL = 0;
const RENDER_FLAG_SHALLOW = 1;
const RENDER_FLAG_EXPLODED = 2;
const RENDER_FLAG_RERENDER = 4;
const RENDER_FLAG_SELECTED = 8;
const RENDER_FLAG_REMOVE_OVERRIDES = 16; // get rid of normal/exploded overrides
const RENDER_FLAG_DEPTH_EXCEEDED = 32;

// GLOBAL VARIABLES

// flags and temporaries
var overrideOnNextRender = false;
var isStepEvaluating = false; // allows some performance-heavy operations while step evaluating
const CONSOLE_DEBUG = false;
const EVENT_DEBUG = false;
const PERFORMANCE_MONITOR = false;
var appFlags = {};
var selectWhenYouFindIt = null;

// app-wide params
const MAX_RENDER_DEPTH = 500;

// renderer state
var root = null;
var hiddenroot = null;
var selectedNode = null;
var current_default_render_flags = RENDER_FLAG_NORMAL;
let renderPassNumber = 0;

// used by the executor to prevent browser-level stack overflow
let stackLevel = 0;

// global lexical environment.
// BUILTINS are implemented in javascript.
// anything bound with (bind ...) goes in BINDINGS.
// any environments nested under that are closures.
const BUILTINS = new Environment(null);
const BINDINGS = BUILTINS.pushEnv();


// global objects/singletons
const manipulator = new Manipulator();
const stepEvaluator = new StepEvaluator();
const eventQueue = new EventQueue();
const KEY_DISPATCHER = new KeyDispatcher();
const autocomplete = new Autocomplete();
const perfmon = new PerformanceMonitor();
const gc = new GarbageCollector();
const contractEnforcer = new ContractEnforcer(); // someday this will likely be scoped in the environment
const undo = new Undo();

function dumpPerf() {
	perfmon.dump();
}

function startPerf() {
	perfmon.activate();
}

// GLOBAL FUNCTIONS
// (not all of them)

function resetStack() {
	stackLevel = 0;
}

function pushStackLevel() {
	stackLevel++;
}

function popStackLevel() {
	stackLevel--;
}

function stackCheck() {
	if (stackLevel > 10000) {
		throw new Error('stack overflow');
	}
}

function INDENT() {
	let s = '';
	for (var i = 0; i < stackLevel; i++) {
		s = s + '  ';
	}
	return s;
}

function getAppFlags() {
	var params = new URLSearchParams(window.location.search);
	params.forEach(function(value, key) {
		appFlags[key] = value;
	})
}

function doRealKeyInput(keycode, whichkey, hasShift, hasCtrl, hasMeta, hasAlt) {
	let r = KEY_DISPATCHER.dispatch(keycode, whichkey, hasShift, hasCtrl, hasMeta, hasAlt);

	// if it returns false, it means we handled the keystroke and we are
	// canceling the browser event - this also means something 'happened' so we render.
	if (!r) {
		eventQueue.enqueueTopLevelRender();
	}
	return r;	
}

// omgg
function doKeyInputNotForTests(keycode, whichkey, hasShift, hasCtrl, hasMeta, hasAlt) {
	eventQueue.enqueueDoKeyInput(keycode, whichkey, hasShift, hasCtrl, hasMeta, hasAlt);
	return false; // we no longer know if we can honor the browser event?
}

var testEventQueue = [];

// DO NOT RENAME THIS METHOD OR YOU WILL BREAK ALL THE OLD TESTS
function doKeyInput(keycode, whichkey, hasShift, hasCtrl, hasMeta) {
	// in order to make this simulate user activity better I'd need
	// to go modify all the tests so they don't call this method
	// synchronously. Instead I will force a full-screen render
	// in between key events -- there are certain things that
	// require render node caching to happen in between user
	// events (which usually happens because people can't
	// type keys fast enough to beat the js scheduler)
	eventQueue.enqueueDoKeyInput(keycode, whichkey, hasShift, hasCtrl, hasMeta, false);
	eventQueue.enqueueImportantTopLevelRender();
	return false; // we no longer know if we can honor the browser event?
}

function createBuiltins() {
	createAsyncBuiltins();
	createBasicBuiltins();
	createContractBuiltins();
	createEnvironmentBuiltins();
	createFileBuiltins();
	createLogicBuiltins();
	createMakeBuiltins();
	createMathBuiltins();
	createStringBuiltins();
	createSyscalls();
	createTagBuiltins();
	createTestBuiltins();
	createTypeConversionBuiltins();

	createNativeOrgs();
}

function topLevelRender(node) {
	topLevelRenderSelectingNode(null);
}

function nodeLevelRender(node) {
	renderPassNumber++;
	let flags = current_default_render_flags;
	node.render(flags);
}

function topLevelRenderSelectingNode(node) {
	selectWhenYouFindIt = node;
	renderPassNumber++;
	let flags = current_default_render_flags;
	if (overrideOnNextRender) {
		overrideOnNextRender = false;
		flags |= RENDER_FLAG_REMOVE_OVERRIDES;
	}
	root.setRenderDepth(0);
	root.render(flags);
}

function getGlobalCurrentDefaultRenderFlags() {
	return current_default_render_flags;
}

function setGlobalCurrentDefaultRenderFlags(f) {
	current_default_render_flags = f;
}

function setGlobalSelectWhenYouFindIt(node) {
	selectWhenYouFindIt = node;
}

function getGlobalSelectWhenYouFindIt() {
	return selectWhenYouFindIt;
}

function setGlobalSelectedNode(newNode) {
	selectedNode = newNode;
}

function getGlobalSelectedNode() {
	return selectedNode;
}

function getGlobalAppFlag(flagname) {
	return appFlags[flagname];
}

function setGlobalOverrideOnNextRender(t) {
	overrideOnNextRender = t;
}

function setGlobalRenderPassNumber(n) {
	renderPassNumber = n;
}

function getGlobalRenderPassNumber() {
	return renderPassNumber;
}

function setRoot(newRootNex) {
	root = new RenderNode(newRootNex);
	let rootDomNode = document.getElementById('mixroot');
	root.setDomNode(rootDomNode);	
}

// app main entry point

function setup() {
	// testharness.js needs this
	window.doKeyInput = doKeyInput;
	createBuiltins();
	getAppFlags();
	hiddenroot = new RenderNode(new Root(true));
	let hiddenRootDomNode = document.getElementById('hiddenroot');
	hiddenroot.setDomNode(hiddenRootDomNode);

	let rootnex = new Root(true /* attached */);
	root = new RenderNode(rootnex);
	let rootDomNode = document.getElementById('mixroot');
	root.setDomNode(rootDomNode);

	let docNode = root.appendChild(new Doc());
	docNode.setSelected(false /* don't render yet */);
	document.onclick = function(e) {
		checkRecordState(e, 'mouse');
		return true;
	}
	document.onkeyup = function(e) {
		checkRecordState(e, 'up');
		return true;
	}
	document.onkeydown = function(e) {
		checkRecordState(e, 'down');
		if (key_funnel_active) {
			return doKeyInputNotForTests(e.key, e.code, e.shiftKey, e.ctrlKey, e.metaKey, e.altKey);
		} else {
			return true;
		}
	}
	eventQueue.enqueueTopLevelRender();
}

function beep() {
    var snd = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");  
    snd.play();
}

export {
	setup,

	dumpPerf,
	startPerf,
	resetStack,
	pushStackLevel,
	popStackLevel,
	stackCheck,
	INDENT,
	getAppFlags,
	setGlobalSelectedNode,
	getGlobalSelectedNode,
	topLevelRender,
	nodeLevelRender,
	topLevelRenderSelectingNode,
	getGlobalSelectWhenYouFindIt,
	setGlobalSelectWhenYouFindIt,
	getGlobalAppFlag,
	doRealKeyInput,
	getGlobalCurrentDefaultRenderFlags,
	setGlobalOverrideOnNextRender,
	setGlobalCurrentDefaultRenderFlags,
	getGlobalRenderPassNumber,
	setGlobalRenderPassNumber,
	deactivateKeyFunnel,
	activateKeyFunnel,
	setRoot,

	doKeyInput,

	// consts
	UNHANDLED_KEY,
	RENDER_FLAG_NORMAL,
	RENDER_FLAG_SHALLOW,
	RENDER_FLAG_EXPLODED,
	RENDER_FLAG_RERENDER,
	RENDER_FLAG_SELECTED,
	RENDER_FLAG_REMOVE_OVERRIDES,
	RENDER_FLAG_DEPTH_EXCEEDED,
	CONSOLE_DEBUG,
	EVENT_DEBUG,
	PERFORMANCE_MONITOR,
	MAX_RENDER_DEPTH,
	BUILTINS,
	BINDINGS,
	manipulator,
	stepEvaluator,
	eventQueue,
	KEY_DISPATCHER,
	autocomplete,
	perfmon,
	gc,
	beep,
	undo,
	root

}
