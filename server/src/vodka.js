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

// experiments

// priority queue for events renders
const PRIORITYQUEUE = true;

// store children of NexContainer as linked list
// allowing cons/cdr to work as expected
const LINKEDLIST= true;

// TODO: needed tests
//.  1. equal
//.  2. some tests for object tags
//.  3. copy and paste tests (same as 2?)
//.  4. fix step eval and update goldens if necessary
//.  5. tests for run-js
//.  6. tests for cram and chop
//.  7. to-word
//.  8. DONE - clean up eerror including its css
//.  9. instanceof checks are slow, for nexes instead compare to getTypeName()
//.  10. DONE - make it so that expectations, when evaluated, return the CURRENT contents.
//.  11. make it so you can specify arg type with the codes I use in the builtin param names,
//.      and that you can have them in lambdas.
//.  12. make a list type that is just "list" that can be vert/horiz, looks like
//.      a command or lambda but without the symbol, and which, when you evaluate it,
//       replaces each of its children with the result of evaluating that child
//.  13. NO LONGER SUPPORTED - execution_stepeval_bindwithnormal is broken because somehow when you are step evaluating
//       and you click on a subexpression with bound environment and you normal-eval it,
//.      if you click on the result of that inner normal-eval inside its expectation,
//.      and shift-tab to go to the parent YOU DON'T GO ANYWHERE. why.
//.  14. need test for partial-exploded mode ,it doesn't work because esc is integral to my
//.      test recording framework
//.  15. exceptions thrown from failed parse of file
//.  16. errors do not save/restore correctly
//.  17. I should have a test for each type of error location to make sure error propagation
//.      doesn't get broken. so basically any place that evaluateNexSafely is called
//.  18. test for to-float

// TODO: audit, is this updated in step eval?
let ILVL = 0;

function resetStack() {
	ILVL = 0;
}

function stackCheck() {
	if (ILVL > 10000) {
		throw new Error('stack overflow');
	}
}

function INDENT() {
	let s = '';
	for (var i = 0; i < ILVL; i++) {
		s = s + '  ';
	}
	return s;
}

// render flags
const RENDER_FLAG_NORMAL = 0;
const RENDER_FLAG_SHALLOW = 1;
const RENDER_FLAG_EXPLODED = 2;
const RENDER_FLAG_RERENDER = 4;
const RENDER_FLAG_SELECTED = 8;
const RENDER_FLAG_REMOVE_OVERRIDES = 16; // get rid of normal/exploded overrides

var overrideOnNextRender = false;



// global variables
// TODO: fix naming convention and decide what's a const and what's
// a singleton and generally what's what.

const manipulator = new Manipulator();
const stepEvaluator = new StepEvaluator();
const eventQueue = new EventQueue();
var root = null;
var hiddenroot = null;
var selectedNode = null;

//var environment = null; // unused

// we allow certain "illegal" things when we are step evaluating,
// since performance is less of a factor.
var isStepEvaluating = false;


var current_default_render_flags = RENDER_FLAG_NORMAL;

var BUILTINS = new Environment(null);
const KEY_DISPATCHER = new KeyDispatcher();

const CONSOLE_DEBUG = false;

var appFlags = {};

function getAppFlags() {
	var params = new URLSearchParams(window.location.search);
	params.forEach(function(value, key) {
		appFlags[key] = value;
	})
}

// DO NOT RENAME THIS METHOD OR YOU WILL BREAK ALL THE OLD TESTS
function doKeyInput(keycode, whichkey, hasShift, hasCtrl, hasAlt) {
	let r = KEY_DISPATCHER.dispatch(keycode, whichkey, hasShift, hasCtrl, hasAlt);
	// TODO: somehow figure out the "highest level" nex affected by
	// the keystroke and render from there down

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

let renderPassNumber = 0;

var selectWhenYouFindIt = null;
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
