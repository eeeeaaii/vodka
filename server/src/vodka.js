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
import { createIterationBuiltins } from './builtins/iterationbuiltins.js'
import { createLogicBuiltins } from './builtins/logicbuiltins.js'
import { createMakeBuiltins } from './builtins/makebuiltins.js'
import { createMathBuiltins } from './builtins/mathbuiltins.js'
import { createOrgBuiltins } from './builtins/orgbuiltins.js'
import { createStringBuiltins } from './builtins/stringbuiltins.js'
import { createSyscalls } from './builtins/syscalls.js'
import { createTagBuiltins } from './builtins/tagbuiltins.js'
import { createTestBuiltins } from './builtins/testbuiltins.js'
import { createTypeConversionBuiltins } from './builtins/typeconversions.js'
import { createWavetableBuiltins } from './builtins/wavetablebuiltins.js'
import { createMidiBuiltins } from './builtins/midibuiltins.js'
import { loadAndRun } from './servercommunication.js'
import { RenderNode } from './rendernode.js'
import { Root } from './nex/root.js'
import { Command } from './nex/command.js'
import { EString } from './nex/estring.js'
import { Doc } from './nex/doc.js'
import { NEXT_NEX_ID, setNextNexId } from './nex/nex.js'
import { runTest } from './tests/unittests.js';
import { possiblyRecordAction, startRecordingTest } from './testrecorder.js'
import {
	RENDER_FLAG_EXPLODED,
	RENDER_FLAG_NORMAL,
	RENDER_FLAG_RENDER_IF_DIRTY,
	RENDER_MODE_NORM,
	RENDER_MODE_EXPLO } from './globalconstants.js'
import { evaluateNexSafely } from './evaluator.js'
import { BINDINGS } from './environment.js'
import { rootManager } from './rootmanager.js'
import { setAPIDocCategory, writeDocs } from './documentation.js'
import { maybeKillSound } from './webaudio.js'
import { setupMobile, doMobileKeyDown } from './mobile.js'
import { setupHelp } from './help.js'


// EXPERIMENTS

// all these should go into SystemState
// possibly some of them would be moved into Render-specific
// SystemState objects (for example, screen rendering vs. audio rendering)

let root = null;

// used by emscripten
var Module = {}

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
		eventQueueDispatcher.enqueueRenderOnlyDirty()
	}
	return r;	
}

// omgg
function doKeyInputNotForTests(keycode, whichkey, hasShift, hasCtrl, hasMeta, hasAlt) {
	eventQueueDispatcher.enqueueDoKeyInput(keycode, whichkey, hasShift, hasCtrl, hasMeta, hasAlt);
	// will return true if we want the browser event to propagate
	return keyDispatcher.shouldBubble(keycode, whichkey, hasShift, hasCtrl, hasMeta, hasAlt);
}

var testEventQueue = [];

// the tests that use this legacy method are updated to use the new way,
// but this is still used in two places in testharness.js
function doKeyInput(keycode, whichkey, hasShift, hasCtrl, hasMeta) {
	//if you have to debug an old test you can alert the keycode
	// and run with -s
	//alert(keycode);



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
	// in the order we want them in the docs
	setAPIDocCategory('Basic Builtins'); createBasicBuiltins();
	setAPIDocCategory('Environment Builtins'); createEnvironmentBuiltins();
	setAPIDocCategory('Iteration Builtins'); createIterationBuiltins();
	setAPIDocCategory('Logic Builtins'); createLogicBuiltins();
	setAPIDocCategory('Math Builtins'); createMathBuiltins();
	setAPIDocCategory('Syscalls'); createSyscalls();
	setAPIDocCategory('Tag Builtins'); createTagBuiltins();
	setAPIDocCategory('Contract Builtins'); createContractBuiltins();
	setAPIDocCategory('Async Builtins'); createAsyncBuiltins();
	setAPIDocCategory('File Builtins'); createFileBuiltins();
	setAPIDocCategory('Org Builtins'); createOrgBuiltins();
	setAPIDocCategory('String Builtins'); createStringBuiltins();
	setAPIDocCategory('Wavetable Builtins'); createWavetableBuiltins();
	setAPIDocCategory('Midi Builtins'); createMidiBuiltins();
	setAPIDocCategory('Make Builtins'); createMakeBuiltins();
	setAPIDocCategory('Type Conversion Builtins'); createTypeConversionBuiltins();
	setAPIDocCategory('Test Builtins'); createTestBuiltins();
}

function nodeLevelRender(node) {
	systemState.setGlobalRenderPassNumber(systemState.getGlobalRenderPassNumber() + 1);
	let flags = systemState.getGlobalCurrentDefaultRenderFlags();;
	node.render(flags);
}

function topLevelRender() {
	systemState.setGlobalRenderPassNumber(systemState.getGlobalRenderPassNumber() + 1);
	let flags = systemState.getGlobalCurrentDefaultRenderFlags();
	systemState.getRoot().setRenderDepth(0);
	systemState.getRoot().render(flags);
}

function renderOnlyDirty() {
	systemState.setGlobalRenderPassNumber(systemState.getGlobalRenderPassNumber() + 1);
	let flags = systemState.getGlobalCurrentDefaultRenderFlags();
	systemState.getRoot().setRenderDepth(0);
	systemState.getRoot().render(flags | RENDER_FLAG_RENDER_IF_DIRTY);
	systemState.getRoot().setAllNotDirty();
}

function setDocRootFromFile(filename) {
	let cmd = Command.makeCommandWithArgs(
		"ff",
		Command.makeCommandWithArgs(
			"load",
			new EString(filename)));
	let exp = evaluateNexSafely(cmd, BINDINGS);
	let expNode = root.appendChild(exp);
	expNode.setSelected(false);
	root.setRenderMode(RENDER_MODE_EXPLO);
	systemState.setGlobalCurrentDefaultRenderFlags(0);	
}

function setDocRootFromStart() {
	loadAndRun(':start', function(result) {
		let expNode = root.appendChild(result);
		expNode.setSelected(false);
		root.setRenderMode(RENDER_MODE_EXPLO);
		systemState.setGlobalCurrentDefaultRenderFlags(0);	
	});
}

function setEmptyDocRoot() {
	root.setRenderMode(RENDER_MODE_EXPLO);
	root.setSelected(false);
}


function setSessionId() {
	let params = new URLSearchParams(window.location.search);
	let sessionId = null;
	if (params.has('sessionId')) {
		sessionId = params.get('sessionId');
		Utils.setCookie('sessionId', sessionId);
	} else {
		sessionId = Utils.getCookie('sessionId');
	}
	systemState.setSessionId(sessionId);
}

function replSetup() {
	eventQueue.initialize();
	createBuiltins();
	// because of https://github.com/eeeeaaii/vodka/issues/29
	if (NEXT_NEX_ID > 1000) {
		throw new Error('too many builtins, increase starting nex ID');
	}
	setNextNexId(1000);
}

function macSubst() {
	if (!Utils.isMac()) {
		let opts = document.getElementsByClassName('optionkey');
		for (let i = 0; i < opts.length; i++) {
			opts[i].textContent = 'ctrl';
		}		
		let metas = document.getElementsByClassName('metakey');
		for (let i = 0; i < metas.length; i++) {
			metas[i].textContent = 'ctrl';
		}		
	}
}


function doKeydownEvent(e) {
	possiblyRecordAction(e, 'down');
	if (systemState.isKeyFunnelActive()) {
		return doKeyInputNotForTests(e.key, e.code, e.shiftKey, e.ctrlKey, e.metaKey, e.altKey);
	} else {
		return true;
	}
}


// app main entry point

function setup() {
	setAppFlags();
	// do session id before doing help
	setSessionId();
	macSubst();

	setupHelp();
	eventQueue.initialize();

	if (Utils.getQSVal('mobile')) {
		setupMobile();
	}


	keyDispatcher.setUiCallbackObject({
		'setExplodedState': function(exploded) {
			document.getElementById("mobile_esc").innerText = (exploded) ? 'explode' : 'contract'
		}});

	// testharness.js needs this
	window.doKeyInput = doKeyInput;
	window.runTest = runTest;
	createBuiltins();
	writeDocs();
	// because of https://github.com/eeeeaaii/vodka/issues/29
	if (NEXT_NEX_ID > 1000) {
		throw new Error('too many builtins, increase starting nex ID');
	}
	setNextNexId(1000);

	// this code for attaching a render node to a root will expand
	// when there are different render node types.
	// note this is duplicated in undo.js
	root = rootManager.createNewRoot();

	if (Utils.getQSVal('createtest')) {
		startRecordingTest();
	}


	document.onclick = function(e) {
		possiblyRecordAction(e, 'mouse');
		return true;
	}
	document.onkeyup = function(e) {
		possiblyRecordAction(e, 'up');
		maybeKillSound();
		return true;
	}
	document.onkeydown = function(e) {
		doMobileKeyDown(e);
		return doKeydownEvent(e);
	}
	if (!!otherflags.FILE) {
		setDocRootFromFile(otherflags.FILE);
	} else if (FEATURE_VECTOR.hasstart) {
		setDocRootFromStart();
	} else {
		setEmptyDocRoot();
	}
	eventQueueDispatcher.enqueueRenderOnlyDirty()
}


export {
	setup,
	dumpPerf,
	startPerf,
	topLevelRender,
	nodeLevelRender,
	doRealKeyInput,
	doKeyInput,
	renderOnlyDirty,
	replSetup
}
