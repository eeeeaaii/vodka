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
import { createNativeOrgs } from './builtins/nativeorgs.js'
import { createOrgBuiltins } from './builtins/orgbuiltins.js'
import { createStringBuiltins } from './builtins/stringbuiltins.js'
import { createSyscalls } from './builtins/syscalls.js'
import { createTagBuiltins } from './builtins/tagbuiltins.js'
import { createTestBuiltins } from './builtins/testbuiltins.js'
import { createTypeConversionBuiltins } from './builtins/typeconversions.js'
import { loadAndRun } from './servercommunication.js'
import { RenderNode } from './rendernode.js'
import { Root } from './nex/root.js'
import { Command } from './nex/command.js'
import { EString } from './nex/estring.js'
import { Doc } from './nex/doc.js'
import { NEXT_NEX_ID, setNextNexId } from './nex/nex.js'
import { runTest } from './tests/unittests.js';
import { checkRecordState } from './testrecorder.js'
import {
	RENDER_FLAG_EXPLODED,
	RENDER_FLAG_NORMAL,
	RENDER_FLAG_RENDER_IF_DIRTY,
	RENDER_MODE_NORM,
	RENDER_MODE_EXPLO } from './globalconstants.js'
import { evaluateNexSafely } from './evaluator.js'
import { BINDINGS } from './environment.js'
import { rootManager } from './rootmanager.js'


// EXPERIMENTS

// all these should go into SystemState
// possibly some of them would be moved into Render-specific
// SystemState objects (for example, screen rendering vs. audio rendering)
let isStepEvaluating = false; // allows some performance-heavy operations while step evaluating
let stackLevel = 0;
let root = null;

let sessionId = null;
let funnelConnected = true;

var justPressedShift;

var mobileMode = false;

var mileInputMode = false;

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
		//eventQueueDispatcher.enqueueTopLevelRender();
		eventQueueDispatcher.enqueueRenderOnlyDirty()
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
	createIterationBuiltins();
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
		root.setRenderMode(RENDER_MODE_NORM);
		systemState.setGlobalCurrentDefaultRenderFlags(0);	
	});
}

function setEmptyDocRoot() {
	let d = new Doc();
	d.setLiteral(true);
	let docNode = root.appendChild(d);
	docNode.setSelected(false /* don't render yet */);
}

function getCookie(key) {
	let cookies = document.cookie;
	let a = cookies.split('; ');
	for (let i = 0; i < a.length; i++) {
		let b = a[i];
		let c = b.split('=');
		if (c[0] == key) {
			return c[1];
		}
	}
	return null;
}

function setCookie(key, val) {
	document.cookie = `${key}=${val}`;
}

function getQSVal(k) {
	let params = new URLSearchParams(window.location.search);
	let lastVal = null;
	params.forEach(function(value, key) {
		if (key == k) {
			lastVal = value;
		}
	});
	return lastVal;
}


function setSessionId() {
	let params = new URLSearchParams(window.location.search);
	if (params.has('sessionId')) {
		sessionId = params.get('sessionId');
		setCookie('sessionId', sessionId);
	} else {
		sessionId = getCookie('sessionId');
	}
}

function checkHelpMessage() {
	document.getElementById('showhotkeys').onclick = function(c) {
		document.getElementById('intro').style.visibility = 'hidden';
		document.getElementById('hotkeyreference').style.visibility = 'visible';
	}
	document.getElementById('closehotkeyreference').onclick = function(c) {
		document.getElementById('hotkeyreference').style.visibility = 'hidden';
		window.scrollTo(0,0);
	}
	document.getElementById('closeintro').onclick = function(c) {
		document.getElementById('intro').style.visibility = 'hidden';
		window.scrollTo(0,0);
	}
	document.getElementById('closeintropermanently').onclick = function(c) {
		document.getElementById('intro').style.visibility = 'hidden';
		document.cookie = 'hasbeenhelped=true';
		window.scrollTo(0,0);
	}
	document.getElementById('sessionid').innerText = sessionId;
	document.getElementById('sessionlink').href = `http://${FEATURE_VECTOR.hostname}?sessionId=${sessionId}`;
	document.getElementById('newsessionlink').href = `http://${FEATURE_VECTOR.hostname}?new=1`;
	let userSaidDoNotRemind = !!getCookie('hasbeenhelped');
	let showIt = function() {
		document.getElementById('intro').style.visibility = 'visible';
	}
	let showIt2 = function() {
		document.getElementById('hotkeyreference').style.visibility = 'visible';
	}
	if (!userSaidDoNotRemind && !experiments.NO_SPLASH) {
		showIt();
	} else {
		var params = new URLSearchParams(window.location.search);
		params.forEach(function(value, key) {
			if (key == 'help') {
				if (value == 'hotkeys') {
					showIt2();
				} else {
					showIt();
				}
			}
		})

	}
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

function doFakeEvent(key, shift, ctrl, alt, cmd, meta) {
	mobileClearInput();
	let e = {};
	e.key = key;
	e.altKey = alt;
	e.ctrlKey = ctrl;
	e.shiftKey = shift;
	e.metaKey = meta;
	doKeydownEvent(e);
}

function mobileClearInput() {
	document.getElementById('mobile_input').value = '';
}

function doMobileKeyDown(e) {
	if (e.key == 'Enter') {
		mobileClearInput();
	}
}

var prev = null
function setupMobile() {
	var mobileInput = document.getElementById("mobile_input");
	mobileInput.onchange = function(e) {
		// lol this is basically when enter
		prev = "";
		doFakeEvent("Enter", false, false, false, false, false);
		setTimeout(function() {
			mobileInput.value = prev;
		}, 1);
	}
	mobileInput.oninput = function(e) {
		if (prev === null) {
			// well I guess we added stuff
			prev = mobileInput.value;
			doFakeEvent(prev, false, false, false, false, false);
		} else {
			// either it's shorter or longer!
			let newone = mobileInput.value;
			if (newone.length > prev.length) {
				let k = newone.charAt(newone.length - 1);
				prev = newone;
				doFakeEvent(k, false, false, false, false, false);
			} else {
				prev = newone;
				// gotta be shorter?
				doFakeEvent("Backspace", false, false, false, false, false);
			}
		}
		setTimeout(function() {
			mobileInput.value = prev;
		}, 1);
		return true;
	}

	document.getElementById("mobilecontrolpanel").style.display = 'block';
	document.getElementById("content").style.position = 'absolute';
	document.getElementById("content").style.top = '225px';

	document.getElementById("mobile_out").onclick = function() {
		doFakeEvent("Tab", true, false, false, false, false);
	}
	document.getElementById("mobile_in").onclick = function() {
		doFakeEvent("Tab", false, false, false, false, false);
	}
	document.getElementById("mobile_prev").onclick = function() {
		doFakeEvent("ArrowLeft", false, false, false, false, false);
	}
	document.getElementById("mobile_next").onclick = function() {
		doFakeEvent("ArrowRight", false, false, false, false, false);
	}

	document.getElementById("mobile_del").onclick = function() {
		doFakeEvent("Backspace", false, false, false, false, false);
	}
	document.getElementById("mobile_sde").onclick = function() {
		doFakeEvent("Backspace", true, false, false, false, false);
	}
	document.getElementById("mobile_esc").onclick = function() {
		doFakeEvent("Escape", false, false, false, false, false);
	}
	document.getElementById("mobile_til").onclick = function() {
		doFakeEvent("~", true, false, false, false, false);
	}
	document.getElementById("mobile_exc").onclick = function() {
		doFakeEvent("!", true, false, false, false, false);
	}
	document.getElementById("mobile_ats").onclick = function() {
		doFakeEvent("@", true, false, false, false, false);
	}
	document.getElementById("mobile_num").onclick = function() {
		doFakeEvent("#", true, false, false, false, false);
	}
	document.getElementById("mobile_dol").onclick = function() {
		doFakeEvent("$", true, false, false, false, false);
	}
	document.getElementById("mobile_per").onclick = function() {
		doFakeEvent("%", true, false, false, false, false);
	}
	document.getElementById("mobile_car").onclick = function() {
		doFakeEvent("^", true, false, false, false, false);
	}
	document.getElementById("mobile_amp").onclick = function() {
		doFakeEvent("&", true, false, false, false, false);
	}
	document.getElementById("mobile_ast").onclick = function() {
		doFakeEvent("*", true, false, false, false, false);
	}
	document.getElementById("mobile_par").onclick = function() {
		doFakeEvent("(", true, false, false, false, false);
	}
	document.getElementById("mobile_bce").onclick = function() {
		doFakeEvent("{", true, false, false, false, false);
	}
	document.getElementById("mobile_brk").onclick = function() {
		doFakeEvent("[", true, false, false, false, false);
	}
	document.getElementById("mobile_flp").onclick = function() {
		doFakeEvent(" ", true, false, false, false, false);
	}

	document.getElementById("mobile_edit").onclick = function() {
		doFakeEvent("Enter", false, true, false, false, false);
	}
	document.getElementById("mobile_sted").onclick = function() {
		doFakeEvent("Enter", false, false, false, false, false);
	}

	document.getElementById("mobile_cut").onclick = function() {
		doFakeEvent("x", false, false, false, false, true);
	}
	document.getElementById("mobile_copy").onclick = function() {
		doFakeEvent("c", false, false, false, false, true);
	}
	document.getElementById("mobile_paste").onclick = function() {
		doFakeEvent("v", false, false, false, false, true);
	}

	document.getElementById("mobile_eval").onclick = function() {
		doFakeEvent("Enter", false, false, false, false, false);
	}
	document.getElementById("mobile_quiet").onclick = function() {
		doFakeEvent("Enter", true, false, false, false, false);
	}
}

function doKeydownEvent(e) {
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

function getUiCallbackObject() {
	return {
		'helpCallback': function() {
			document.getElementById('intro').style.visibility = 'visible';
		},
		'helpCallback2': function() {
			document.getElementById('intro').style.visibility = 'hidden';
			document.getElementById('hotkeyreference').style.visibility = 'visible';
		},
		'setExplodedState': function(exploded) {
			document.getElementById("mobile_esc").innerText = (exploded) ? 'explode' : 'contract'
		}
	}
}


// app main entry point

function setup() {
	setAppFlags();
	setSessionId();
	macSubst();
	checkHelpMessage();
	eventQueue.initialize();

	if (getQSVal('mobile')) {
		setupMobile();
		mobileMode = true;
	}

	keyDispatcher.setCloseHelp(function() {
		let closedIt = false;
		if (document.getElementById('intro').style.visibility != 'hidden') {
			document.getElementById('intro').style.visibility = 'hidden';
			closedIt = true;
		}
		if (document.getElementById('hotkeyreference').style.visibility != 'hidden') {
			document.getElementById('hotkeyreference').style.visibility = 'hidden';
			closedIt = true;
		}
		if (closedIt) {
			window.scrollTo(0,0);
		}
	})
	keyDispatcher.setUiCallbackObject(getUiCallbackObject());
	// keyDispatcher.setHelpCallback(function() {
	// 	document.getElementById('intro').style.visibility = 'visible';
	// })
	// keyDispatcher.setHelp2Callback(function() {
	// 	document.getElementById('intro').style.visibility = 'hidden';
	// 	document.getElementById('hotkeyreference').style.visibility = 'visible';
	// })

	// testharness.js needs this
	window.doKeyInput = doKeyInput;
	window.runTest = runTest;
	createBuiltins();
	// because of https://github.com/eeeeaaii/vodka/issues/29
	if (NEXT_NEX_ID > 1000) {
		throw new Error('too many builtins, increase starting nex ID');
	}
	setNextNexId(1000);

	// this code for attaching a render node to a root will expand
	// when there are different render node types.
	// note this is duplicated in undo.js
	root = rootManager.createNewRoot();

	justPressedShift = false;

	document.onclick = function(e) {
		checkRecordState(e, 'mouse');
		return true;
	}
	document.onkeyup = function(e) {
		checkRecordState(e, 'up');
		if (justPressedShift && systemState.isKeyFunnelActive()) {
			return doKeyInputNotForTests('NakedShift', e.code, e.shiftKey, e.ctrlKey, e.metaKey, e.altKey);
			justPressedShift = false;
		}
		return true;
	}
	document.onkeydown = function(e) {
		if (mobileMode) {
			return true;
		}
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
	//eventQueueDispatcher.enqueueTopLevelRender();
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
