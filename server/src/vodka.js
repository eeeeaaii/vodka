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

// EXPERIMENTS

// priority queue for event, renders, etc
const PRIORITYQUEUE = true;

// store children of NexContainer as linked list
// allowing cons/cdr to work as expected
const LINKEDLIST= true;

// CONSTANTS

// render flags
const RENDER_FLAG_NORMAL = 0;
const RENDER_FLAG_SHALLOW = 1;
const RENDER_FLAG_EXPLODED = 2;
const RENDER_FLAG_RERENDER = 4;
const RENDER_FLAG_SELECTED = 8;
const RENDER_FLAG_REMOVE_OVERRIDES = 16; // get rid of normal/exploded overrides

// GLOBAL VARIABLES

// flags and temporaries
var overrideOnNextRender = false;
var isStepEvaluating = false; // allows some performance-heavy operations while step evaluating
const CONSOLE_DEBUG = false;
var appFlags = {};
var selectWhenYouFindIt = null;

// renderer state
var root = null;
var hiddenroot = null;
var selectedNode = null;
var current_default_render_flags = RENDER_FLAG_NORMAL;
let renderPassNumber = 0;

// used by the executor to prevent browser-level stack overflow
let stackLevel = 0;

// global lexical environment
var BUILTINS = new Environment(null); // cannot be const

// global modules
const manipulator = new Manipulator();
const stepEvaluator = new StepEvaluator();
const eventQueue = new EventQueue();
const KEY_DISPATCHER = new KeyDispatcher();



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

// DO NOT RENAME THIS METHOD OR YOU WILL BREAK ALL THE OLD TESTS
function doKeyInput(keycode, whichkey, hasShift, hasCtrl, hasAlt) {
	let r = KEY_DISPATCHER.dispatch(keycode, whichkey, hasShift, hasCtrl, hasAlt);

	// if it returns false, it means we handled the keystroke and we are
	// canceling the browser event - this also means something 'happened' so we render.
	if (!r) {
		PRIORITYQUEUE ? eventQueue.enqueueTopLevelRender() : topLevelRender();
	}
	return r;
}

function createBuiltins() {
	createBasicBuiltins();
	createAsyncBuiltins();
	createFileBuiltins();
	createMathBuiltins();
	createStringBuiltins();
	createTagBuiltins();
	createLogicBuiltins();
	createSyscalls();
	createTestBuiltins();
	createTypeConversionBuiltins();
}

function topLevelRender(node) {
	topLevelRenderSelectingNode(null);
}

function topLevelRenderSelectingNode(node) {
	selectWhenYouFindIt = node;
	renderPassNumber++;
	let flags = current_default_render_flags;
	if (overrideOnNextRender) {
		overrideOnNextRender = false;
		flags |= RENDER_FLAG_REMOVE_OVERRIDES;
	}
	root.render(flags);
}

// app main entry point

function setup() {
	// createBuiltins is defined in executors.js
	createBuiltins();
	getAppFlags();
	BUILTINS = BUILTINS.pushEnv();
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
			if (PRIORITYQUEUE) {
				eventQueue.enqueueDoKeyInput(e.key, e.code, e.shiftKey, e.ctrlKey, e.metaKey);
				return false; // we no longer know if we can honor the browser event?
			} else {
				return doKeyInput(e.key, e.code, e.shiftKey, e.ctrlKey, e.metaKey);
			}
		} else {
			return true;
		}
	}
	PRIORITYQUEUE ? eventQueue.enqueueTopLevelRender() : topLevelRender();
}
