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

ILVL = 0;

function resetStack() {
	ILVL = 0;
}

function stackCheck() {
	if (ILVL > 500) {
		throw new Error('stack overflow');
	}
}

function INDENT() {
	var s = '';
	for (var i = 0; i < ILVL; i++) {
		s = s + '  ';
	}
	return s;
}

// different stack - used for step execution.
var STEP_STACK = new StepStack();


var manipulator = null;
var root = null;
var selectedNex = null;
var environment = null;

var NEX_RENDER_TYPE_NORMAL = 1;
var NEX_RENDER_TYPE_EXPLODED = 2;
var current_render_type = NEX_RENDER_TYPE_NORMAL;

var BUILTINS;

//var KEYFUNNEL_VERSION = 2;

// DO NOT RENAME THIS METHOD OR YOU WILL BREAK ALL THE OLD TESTS
function doKeyInput(keycode, whichkey, hasShift, hasCtrl, hasAlt) {
	return selectedNex.getInputFunnel().processEvent(keycode, whichkey, hasShift, hasCtrl, hasAlt);
}

function createBuiltins() {
	createBasicBuiltins();
	createMathBuiltins();
	createStringBuiltins();
	createLogicBuiltins();
	createSyscalls();
	createTestBuiltins();
}

function setup() {
	manipulator = new Manipulator();
	environment = new Environment();
	// createBuiltins is defined in executors.js
	BUILTINS = new Environment(null);
	createBuiltins();
	BUILTINS = BUILTINS.pushEnv();
	root = new Root(true /* attached */);
	var topdoc = new Doc();
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
	root.render();
}
