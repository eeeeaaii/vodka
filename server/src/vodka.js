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
import { setAPIDocCategory, writeDocs } from './documentation.js'
import { maybeKillSound } from './webaudio.js'


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
var enterIsDown;

var mobileMode = false;

var mileInputMode = false;

var helpIsShowing = false;
var helpButtonIsShowing = true;

// used by emscripten
var Module = {}

let apiDocCategory = '';

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
	return false; // we no longer know if we can honor the browser event?
}

var testEventQueue = [];

// DO NOT RENAME THIS METHOD OR YOU WILL BREAK ALL THE OLD TESTS
// it is actually used for every test, to send the escape keys
// that bookend "normal" and "exploded" screenshots
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
	setAPIDocCategory('NativeOrgs'); createNativeOrgs();
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

function setupHelp() {

	document.getElementById('helpbutton').onclick = function(c) {
		toggleHelp();
	}
	document.getElementById('showhotkeys').onclick = function(c) {
		showHelpPage('hotkeyreference');
	}
	document.getElementById('showapi').onclick = function(c) {
		showHelpPage('fullapireference');
	}
	document.getElementById('showwelcome').onclick = function(c) {
		showHelpPage('intro');
	}
	document.getElementById('closehelp').onclick = function(c) {
		toggleHelp();
	}
	document.getElementById('closehelppermanently').onclick = function(c) {
		doPermanentHelpHide();
	}
	document.getElementById('bringbackhelp').onclick = function(c) {
		bringBackHelp();
	}
	document.getElementById('sessionid').innerText = sessionId;
	document.getElementById('sessionlink').href = `http://${FEATURE_VECTOR.hostname}?sessionId=${sessionId}`;
	document.getElementById('newsessionlink').href = `http://${FEATURE_VECTOR.hostname}?new=1`;
}

function toggleHelpButtonButtons() {
	// TODO: make hiding the help button a more difficult thing
//	if (isFirstVisit()) {
		document.getElementById('bringbackhelp').style.display = 'none';
		document.getElementById('closehelppermanently').style.display = 'none';				
// 	} else if (userAskedToHideHelpButton()) {
// 		document.getElementById('bringbackhelp').style.display = 'flex';
// 		document.getElementById('closehelppermanently').style.display = 'none';		
// 	} else {
// 		document.getElementById('bringbackhelp').style.display = 'none';
// 		document.getElementById('closehelppermanently').style.display = 'flex';		
// 	}
 }

function doPermanentHelpHide() {
	if (confirm(
`Note: clicking "ok" will permanently hide the help button.
You can always get back to help by adding "help=me" to the query string.
Only do this if you know what you're doing!
`)) {
		hideHelpPanel();
		hideHelpButton();
		document.cookie = 'hidehelpbutton=true';
		toggleHelpButtonButtons();
	}
}

function bringBackHelp() {
	hideHelpPanel();
	showHelpButton();
	document.cookie = 'hidehelpbutton=false';
	toggleHelpButtonButtons();
}

function hasShowHelpInQueryString() {
	var params = new URLSearchParams(window.location.search);
	return params.has('help');
}

function userAskedToHideHelpButton() {
	return (getCookie('hidehelpbutton') == 'true');
}

function isFirstVisit() {
	return !getCookie('userhasvisited');	
}

function setVeteranCookie() {
	if (isFirstVisit()) {
		document.cookie = 'userhasvisited=true';	
	}
}

function maybeShowHelp() {
	showHelpPage('hotkeyreference');
	if (experiments.NO_SPLASH) {
		// this is used in tests
		hideHelpPanel();
		hideHelpButton();
	} else if (hasShowHelpInQueryString()) {
		showHelpPanel();
		hideHelpButton();
	} else if (isFirstVisit()) {
		showHelpPanel();
		showHelpPage('intro');
		hideHelpButton();
	} else if (userAskedToHideHelpButton()) {
		hideHelpPanel();
		hideHelpButton();
	} else {
		hideHelpPanel();
		showHelpButton();
	}
}

function showHelpButton() {
	helpButtonIsShowing = true;
	document.getElementById('helpbutton').style.display = 'block';
}

function hideHelpButton() {
	helpButtonIsShowing = false;
	document.getElementById('helpbutton').style.display = 'none';
}

function showHelpPanel() {
	helpIsShowing = true;
	document.getElementById('uberhelpcontainer').style.display = 'flex';
}

function hideHelpPanel() {
	helpIsShowing = false;
	document.getElementById('uberhelpcontainer').style.display = 'none';
	window.scrollTo(0,0);
}

function toggleHelp() {
	if (helpIsShowing) {
		hideHelpPanel();
		showHelpButton();
	} else {
		showHelpPanel();
		hideHelpButton();
	}
}

// help pages:
//    intro
//    hotkeyreference
function showHelpPage(id) {
	document.getElementById('intro').style.display = 'none';
	document.getElementById('hotkeyreference').style.display = 'none';
	document.getElementById('fullapireference').style.display = 'none';

	document.getElementById(id).style.display = 'block';
	window.scrollTo(0,0);
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

var mobileControlPanelVisible = false;
var hideTimeout = null;

function setHideTimeout() {
	if (hideTimeout) {
		clearTimeout(hideTimeout);
	}
	hideTimeout = setTimeout(function() {
		document.getElementById("mobilecontrolpanel").style.opacity = 0.0;
		mobileControlPanelVisible = false;
	}, 30000);
}

function showOrDoFakeEvent(key, shift, ctrl, alt, cmd, meta) {
	if (!mobileControlPanelVisible) {
		mobileControlPanelVisible = true;
		document.getElementById("mobilecontrolpanel").style.opacity = 1;
		setHideTimeout();
		return;
	}
	setHideTimeout();
	doFakeEvent(key, shift, ctrl, alt, cmd, meta);
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

	systemState.setIsMobile(true);
	document.getElementById("mobilecontrolpanel").style.display = 'flex';
	document.getElementById("codepane").classList.add('mobile');

	document.getElementById("mobile_out").onclick = function() {
		showOrDoFakeEvent("Tab", true, false, false, false, false);
	}
	document.getElementById("mobile_in").onclick = function() {
		showOrDoFakeEvent("Tab", false, false, false, false, false);
	}
	document.getElementById("mobile_prev").onclick = function() {
		showOrDoFakeEvent("ArrowLeft", false, false, false, false, false);
	}
	document.getElementById("mobile_next").onclick = function() {
		showOrDoFakeEvent("ArrowRight", false, false, false, false, false);
	}

	document.getElementById("mobile_del").onclick = function() {
		showOrDoFakeEvent("Backspace", false, false, false, false, false);
	}
	document.getElementById("mobile_sde").onclick = function() {
		showOrDoFakeEvent("Backspace", true, false, false, false, false);
	}
	document.getElementById("mobile_esc").onclick = function() {
		showOrDoFakeEvent("Escape", false, false, false, false, false);
	}
	document.getElementById("mobile_til").onclick = function() {
		showOrDoFakeEvent("~", true, false, false, false, false);
	}
	document.getElementById("mobile_exc").onclick = function() {
		showOrDoFakeEvent("!", true, false, false, false, false);
	}
	document.getElementById("mobile_ats").onclick = function() {
		showOrDoFakeEvent("@", true, false, false, false, false);
	}
	document.getElementById("mobile_num").onclick = function() {
		showOrDoFakeEvent("#", true, false, false, false, false);
	}
	document.getElementById("mobile_dol").onclick = function() {
		showOrDoFakeEvent("$", true, false, false, false, false);
	}
	document.getElementById("mobile_per").onclick = function() {
		showOrDoFakeEvent("%", true, false, false, false, false);
	}
	document.getElementById("mobile_car").onclick = function() {
		showOrDoFakeEvent("^", true, false, false, false, false);
	}
	document.getElementById("mobile_amp").onclick = function() {
		showOrDoFakeEvent("&", true, false, false, false, false);
	}
	document.getElementById("mobile_ast").onclick = function() {
		showOrDoFakeEvent("*", true, false, false, false, false);
	}
	document.getElementById("mobile_par").onclick = function() {
		showOrDoFakeEvent("(", true, false, false, false, false);
	}
	document.getElementById("mobile_bce").onclick = function() {
		showOrDoFakeEvent("{", true, false, false, false, false);
	}
	document.getElementById("mobile_brk").onclick = function() {
		showOrDoFakeEvent("[", true, false, false, false, false);
	}
	document.getElementById("mobile_flp").onclick = function() {
		showOrDoFakeEvent(" ", true, false, false, false, false);
	}

	document.getElementById("mobile_edit").onclick = function() {
		showOrDoFakeEvent("Enter", false, true, false, false, false);
	}
	document.getElementById("mobile_sted").onclick = function() {
		showOrDoFakeEvent("Enter", false, false, false, false, false);
	}

	document.getElementById("mobile_cut").onclick = function() {
		showOrDoFakeEvent("x", false, false, false, false, true);
	}
	document.getElementById("mobile_copy").onclick = function() {
		showOrDoFakeEvent("c", false, false, false, false, true);
	}
	document.getElementById("mobile_paste").onclick = function() {
		showOrDoFakeEvent("v", false, false, false, false, true);
	}

	document.getElementById("mobile_eval").onclick = function() {
		showOrDoFakeEvent("Enter", false, false, false, false, false);
	}
	document.getElementById("mobile_quiet").onclick = function() {
		showOrDoFakeEvent("Enter", true, false, false, false, false);
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
		'toggleHelp': function() {
			toggleHelp();
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
	setupHelp();
	maybeShowHelp()
	toggleHelpButtonButtons();
	setVeteranCookie();
	eventQueue.initialize();

	if (getQSVal('mobile')) {
		setupMobile();
		mobileMode = true;
	}

	keyDispatcher.setUiCallbackObject(getUiCallbackObject());

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
		maybeKillSound();
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
