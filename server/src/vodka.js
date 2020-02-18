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

// TODO: audit, is this updated in step eval?
let ILVL = 0;

function resetStack() {
	ILVL = 0;
}

function stackCheck() {
	if (ILVL > 500) {
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

// experiments

// - pass in render flags
const RENDERFLAGS = true;

// allows the same nex to be rendered in multiple places on the screen
// (assumes RENDERFLAGS=true)
const RENDERNODES = false;

// global variables
// TODO: fix naming convention and decide what's a const and what's
// a singleton and generally what's what.

const manipulator = new Manipulator();
const root = new Root(true /* attached */);
var selectedNex = null; // make singleton?
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
	topLevelRender();
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

function topLevelRender() {
	let rootDomNode = null;
	rootDomNode = document.getElementById('mixroot');
	while (rootDomNode.firstChild) {
		rootDomNode.removeChild(rootDomNode.firstChild);
	}
	if (RENDERNODES) {
		let renderNode = new RenderNode(root);
		renderNode.setDomNode(rootDomNode);
		renderNode.render(current_default_render_flags);
	} else if (RENDERFLAGS) {
		root.renderInto(rootDomNode, current_default_render_flags);		
	} else {
		root.renderInto(rootDomNode);
	}
}

function setup() {
	// createBuiltins is defined in executors.js
	createBuiltins();
	BUILTINS = BUILTINS.pushEnv();
	let topdoc = new Doc();
	root.appendChild(topdoc);
	topdoc.setSelected();
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
