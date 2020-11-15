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

import { setAppFlags, otherflags, experiments } from './globalappflags.js'
import { perfmon } from './perfmon.js'

import { eventQueue } from './eventqueue.js'

import { eventQueueDispatcher } from './eventqueuedispatcher.js'
import { keyDispatcher } from './keydispatcher.js'
import { systemState } from './systemstate.js'
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
import { Command } from './nex/command.js'
import { ESymbol } from './nex/esymbol.js'
import { Doc } from './nex/doc.js'
import { runTest } from './tests/unittests.js';
import { checkRecordState } from './testrecorder.js'
import { RENDER_FLAG_REMOVE_OVERRIDES, RENDER_FLAG_EXPLODED } from './globalconstants.js'
import { evaluateNexSafely } from './evaluator.js'
import { BINDINGS } from '../environment.js'


// EXPERIMENTS

// all these should go into SystemState
// possibly some of them would be moved into Render-specific
// SystemState objects (for example, screen rendering vs. audio rendering)
let isStepEvaluating = false; // allows some performance-heavy operations while step evaluating
let hiddenroot = null;
let stackLevel = 0;
let root = null;

function dumpPerf() {
	perfmon.dump();
}

function startPerf() {
	perfmon.activate();
}

function doRealKeyInput(keycode, whichkey, hasShift, hasCtrl, hasMeta, hasAlt) {
	let r = keyDispatcher.dispatch(keycode, whichkey, hasShift, hasCtrl, hasMeta, hasAlt);

	// if it returns false, it means we handled the keystroke and we are
	// canceling the browser event - this also means something 'happened' so we render.
	if (!r) {
		eventQueueDispatcher.enqueueTopLevelRender();
	}
	return r;	
}

// omgg
function doKeyInputNotForTests(keycode, whichkey, hasShift, hasCtrl, hasMeta, hasAlt) {
	eventQueueDispatcher.enqueueDoKeyInput(keycode, whichkey, hasShift, hasCtrl, hasMeta, hasAlt);
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
	eventQueueDispatcher.enqueueDoKeyInput(keycode, whichkey, hasShift, hasCtrl, hasMeta, false);
	eventQueueDispatcher.enqueueImportantTopLevelRender();
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
	systemState.setGlobalRenderPassNumber(systemState.getGlobalRenderPassNumber() + 1);
	let flags = systemState.getGlobalCurrentDefaultRenderFlags();;
	node.render(flags);
}

function topLevelRender() {
	systemState.setGlobalRenderPassNumber(systemState.getGlobalRenderPassNumber() + 1);
	let flags = systemState.getGlobalCurrentDefaultRenderFlags();
	if (systemState.getGlobalOverrideOnNextRender()) {
		systemState.setGlobalOverrideOnNextRender(false);
		flags |= RENDER_FLAG_REMOVE_OVERRIDES;
	}
	systemState.getRoot().setRenderDepth(0);
	systemState.getRoot().render(flags);
}

function setDocRootFromFile(filename) {
	let cmd = Command.makeCommandWithArgs(
		"ff",
		Command.makeCommandWithArgs(
			"load",
			new ESymbol(filename)));
	let exp = evaluateNexSafely(cmd, BINDINGS);
	let expNode = root.appendChild(exp);
	expNode.setSelected(false);
	systemState.setGlobalCurrentDefaultRenderFlags(RENDER_FLAG_EXPLODED);	
}

function setEmptyDocRoot() {
	let docNode = root.appendChild(new Doc());
	docNode.setSelected(false /* don't render yet */);
}

function doStartupWork() {
	if (!!otherflags.FILE) {
		setDocRootFromFile(otherflags.FILE);
	} else {
		setEmptyDocRoot();
	}
}

// app main entry point

function setup() {
	eventQueue.initialize();

	// testharness.js needs this
	window.doKeyInput = doKeyInput;
	window.runTest = runTest;
	createBuiltins();
	setAppFlags();
	hiddenroot = new RenderNode(new Root(true));
	let hiddenRootDomNode = document.getElementById('hiddenroot');
	hiddenroot.setDomNode(hiddenRootDomNode);

	// this code for attaching a render node to a root will expand
	// when there are different render node types.
	// note this is duplicated in undo.js
	let rootnex = new Root(true /* attached */);
	root = new RenderNode(rootnex);
	document.vodkaroot = root; // for debugging in chrome dev tools
	let rootDomNode = document.getElementById('mixroot');
	root.setDomNode(rootDomNode);
	systemState.setRoot(root);


	let justPressedShift = false;

	document.onclick = function(e) {
		checkRecordState(e, 'mouse');
		return true;
	}
	document.onkeyup = function(e) {
		checkRecordState(e, 'up');
		if (justPressedShift) {
			return doKeyInputNotForTests('NakedShift', e.code, e.shiftKey, e.ctrlKey, e.metaKey, e.altKey);
		}
		justPressedShift = false;
		return true;
	}
	document.onkeydown = function(e) {
		checkRecordState(e, 'down');
		if (systemState.isKeyFunnelActive()) {
			if (e.key == 'Shift') {
				justPressedShift = true;
			} else {
				justPressedShift = false;
			}
			return doKeyInputNotForTests(e.key, e.code, e.shiftKey, e.ctrlKey, e.metaKey, e.altKey);
		} else {
			return true;
		}
	}
	doStartupWork();
	eventQueueDispatcher.enqueueTopLevelRender();
}


export {
	setup,
	dumpPerf,
	startPerf,
	topLevelRender,
	nodeLevelRender,
	doRealKeyInput,
	doKeyInput,
}
