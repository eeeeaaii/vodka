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

import { setAppFlags } from './globalappflags.js'

import { Environment } from './environment.js'
import { perfmon } from './perfmon.js'

import { eventQueue } from './eventqueue.js'
import { keyDispatcher } from './keydispatcher.js'

import { createAsyncBuiltins } from './builtins/asyncbuiltins.js'
import { createBasicBuiltins } from './builtins/basicbuiltins.js'
import { createContractBuiltins } from './builtins/contractbuiltins.js'
import { createEnvironmentBuiltins } from './builtins/environmentbuiltins.js'
import { createFileBuiltins } from './builtins/filebuiltins.js'
import { createLogicBuiltins } from './builtins/logicbuiltins.js'
import { createMakeBuiltins } from './builtins/makebuiltins.js'
import { createMathBuiltins } from './builtins/mathbuiltins.js'
import { createNativeOrgs } from './builtins/nativeorgs.js'
import { createOrgBuiltins } from './builtins/orgbuiltins.js'
import { createStringBuiltins } from './builtins/stringbuiltins.js'
import { createSyscalls } from './builtins/syscalls.js'
import { createTagBuiltins } from './builtins/tagbuiltins.js'
import { createTestBuiltins } from './builtins/testbuiltins.js'
import { createTypeConversionBuiltins } from './builtins/typeconversions.js'
import { RenderNode } from './rendernode.js'
import { Root } from './nex/root.js'
import { Doc } from './nex/doc.js'

import { runTest } from './tests/unittests.js';

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
	let session_output = `//testspec// ${shorthand}
//starttest//` + recorded_session + session_end + `//endtest//
`;
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
	recorded_session += `testactions.push({type:'click',x:'${e.x}',y:'${e.y}'});
`;	
}
function logKeyDownEvent(e) {
	if (e.code == 'AltLeft' || e.code == 'AltRight') {
		alert("Do not use the option key when recording tests! Puppeteer does not support this and your test will not work correctly.");
	}
	shorthand += '|' + e.key;
	recorded_session += `testactions.push({type:'keydown',code:'${e.code}'});
`;	
}
function logKeyUpEvent(e) {
	recorded_session += `testactions.push({type:'keyup',code:'${e.code}'});
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
const PERFORMANCE_MONITOR = false;

// app-wide params
const MAX_RENDER_DEPTH = 100;

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


function doRealKeyInput(keycode, whichkey, hasShift, hasCtrl, hasMeta, hasAlt) {
	let r = keyDispatcher.dispatch(keycode, whichkey, hasShift, hasCtrl, hasMeta, hasAlt);

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
	createOrgBuiltins();
	createStringBuiltins();
	createSyscalls();
	createTagBuiltins();
	createTestBuiltins();
	createTypeConversionBuiltins();

	createNativeOrgs();
}

function nodeLevelRender(node) {
	renderPassNumber++;
	let flags = current_default_render_flags;
	node.render(flags);
}

function topLevelRender() {
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

function getRoot() {
	return root;
}

// app main entry point

function setup() {
	// testharness.js needs this
	window.doKeyInput = doKeyInput;
	window.runTest = runTest;
	createBuiltins();
	setAppFlags();
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


export {
	setup,

	dumpPerf,
	startPerf,
	resetStack,
	pushStackLevel,
	popStackLevel,
	stackCheck,
	INDENT,
	setGlobalSelectedNode,
	getGlobalSelectedNode,
	topLevelRender,
	nodeLevelRender,
	doRealKeyInput,
	getGlobalCurrentDefaultRenderFlags,
	setGlobalOverrideOnNextRender,
	setGlobalCurrentDefaultRenderFlags,
	getGlobalRenderPassNumber,
	setGlobalRenderPassNumber,
	deactivateKeyFunnel,
	activateKeyFunnel,
	setRoot,
	getRoot,
	checkRecordState,

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
	PERFORMANCE_MONITOR,
	MAX_RENDER_DEPTH,
	BUILTINS,
	BINDINGS,
	root

}
