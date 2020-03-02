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

// - pass in render flags
const RENDERFLAGS = true;

// allows the same nex to be rendered in multiple places on the screen
// (assumes RENDERFLAGS=true)
const RENDERNODES = true;

// TODO: needed tests
//.  1. equal
//.  2. some tests for object tags
//.  3. copy and paste tests (same as 2?)
//.  4. fix step eval and update goldens if necessary
//.  5. tests for run-js
//.  6. tests for cram and chop


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
// only used in RENDERNODES
const RENDER_FLAG_SELECTED = 8;


// global variables
// TODO: fix naming convention and decide what's a const and what's
// a singleton and generally what's what.

const manipulator = new Manipulator();
const stepEvaluator = new StepEvaluator();
var root = null;
if (RENDERNODES) {
	var selectedNode = null;
} else {
	var selectedNex = null; // make singleton?
}

//var environment = null; // unused

// render type is deprecated, changing to flags
const NEX_RENDER_TYPE_NORMAL = 1;
const NEX_RENDER_TYPE_EXPLODED = 2;

if (RENDERNODES || RENDERFLAGS) {
	var current_default_render_flags = RENDER_FLAG_NORMAL;
} else {
	var current_render_type = NEX_RENDER_TYPE_NORMAL;
}

var BUILTINS = new Environment(null);
const KEY_DISPATCHER = new KeyDispatcher();

const CONSOLE_DEBUG = false;

// DO NOT RENAME THIS METHOD OR YOU WILL BREAK ALL THE OLD TESTS
function doKeyInput(keycode, whichkey, hasShift, hasCtrl, hasAlt) {
	let r = KEY_DISPATCHER.dispatch(keycode, whichkey, hasShift, hasCtrl, hasAlt);
	// TODO: somehow figure out the "highest level" nex affected by
	// the keystroke and render from there down

	// if it returns false, it means we handled the keystroke and we are
	// canceling the browser event - this also means something 'happened' so we render.
	if (!r) {
		topLevelRender();
	}
	return r;
}

function createBuiltins() {
	createBasicBuiltins();
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
	if (RENDERNODES) {
		root.render(current_default_render_flags);
	} else if (RENDERFLAGS) {
		let rootDomNode = null;
		rootDomNode = document.getElementById('mixroot');
		while (rootDomNode.firstChild) {
			rootDomNode.removeChild(rootDomNode.firstChild);
		}
		root.renderInto(rootDomNode, current_default_render_flags);		
	} else {
		let rootDomNode = null;
		rootDomNode = document.getElementById('mixroot');
		while (rootDomNode.firstChild) {
			rootDomNode.removeChild(rootDomNode.firstChild);
		}
		root.renderInto(rootDomNode);
	}
}

function setup() {
	// createBuiltins is defined in executors.js
	createBuiltins();
	BUILTINS = BUILTINS.pushEnv();
	if (RENDERNODES) {
		let rootnex = new Root(true /* attached */);
		root = new RenderNode(rootnex);
		let rootDomNode = document.getElementById('mixroot');
		root.setDomNode(rootDomNode);

		let docNode = root.appendChild(new Doc());
		docNode.setSelected(false /* don't render yet */);
	} else {
		root = new Root(true /* attached */);
		let topdoc = new Doc();
		root.appendChild(topdoc);
		topdoc.setSelected();
	}
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
			return doKeyInput(e.key, e.code, e.shiftKey, e.ctrlKey, e.metaKey);
		} else {
			return true;
		}
	}
	topLevelRender();
}
