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

import * as Vodka from "../vodka.js"

export function runTest(testname) {
	eval('TEST_' + testname + '();');
}

function assertEqual(a, b) {
	if (a != b) {
		throw new Error('asserting equal failed: a = ' + a + ' b = ' + b);
	}
}

function assertTruthy(a) {
	if (!a) {
		throw new Error('asserting truthy failed');
	}
}

function assertFalsy(a) {
	if (a) {
		throw new Error('asserting falsy failed');
	}
}

function TEST_eventqueue_events_alertanimation() {
	let fakeRenderNode = new Object();
	Vodka.eventQueue.enqueueAlertAnimation(fakeRenderNode);
	let item = Vodka.eventQueue.retrieveNextItem();
	let correctItem = {
		action: 'doAlertAnimation',
		shouldDedupe: true,
		renderNode: fakeRenderNode
	}
	assertTruthy(item);
	assertTruthy(item.equals(correctItem));
	assertEqual(item.action, correctItem.action);
	assertEqual(item.shouldDedupe, correctItem.shouldDedupe);
	assertEqual(item.renderNode, correctItem.renderNode);
}

function TEST_eventqueue_events_doclickhandleraction() {
	let fakeTarget = new Object();
	let fakeRenderNode = new Object();
	let fakeEvent = new Object();
	Vodka.eventQueue.enqueueDoClickHandlerAction(fakeTarget, fakeRenderNode, fakeEvent);
	let item = Vodka.eventQueue.retrieveNextItem();
	let correctItem = {
		action: 'doClickHandlerAction',
		target: fakeTarget,
		renderNode: fakeRenderNode,
		event: fakeEvent,
		shouldDedupe: false,
	}
	assertTruthy(item);
	assertEqual(item.action, correctItem.action);
	assertEqual(item.shouldDedupe, correctItem.shouldDedupe);
	assertEqual(item.event, correctItem.event);
	assertEqual(item.target, correctItem.target);
	assertEqual(item.renderNode, correctItem.renderNode);
}

function TEST_eventqueue_events_dokeyinput() {
	let keycode = 'a';
	let whichkey = 'b';
	let hasShift = true;
	let hasCtrl = true;
	let hasMeta = true;
	let hasAlt = true;
	Vodka.eventQueue.enqueueDoKeyInput(keycode, whichkey, hasShift, hasCtrl, hasMeta, hasAlt);
	let item = Vodka.eventQueue.retrieveNextItem();
	let correctItem = {
		action: 'doKeyInput',
		shouldDedupe: false,
		keycode: keycode,
		whichkey: whichkey,
		hasShift: hasShift,
		hasCtrl: hasCtrl,
		hasMeta: hasMeta,
		hasAlt: hasAlt
	}
	assertTruthy(item);
	assertEqual(item.action, correctItem.action);
	assertEqual(item.shouldDedupe, correctItem.shouldDedupe);
	assertEqual(item.keycode, correctItem.keycode);
	assertEqual(item.whichkey, correctItem.whichkey);
	assertEqual(item.hasShift, correctItem.hasShift);
	assertEqual(item.hasCtrl, correctItem.hasCtrl);
	assertEqual(item.hasMeta, correctItem.hasMeta);
	assertEqual(item.hasAlt, correctItem.hasAlt);
}

function TEST_eventqueue_events_expectationcallback() {
	let result = new Object();
	let callback = new Object();
	Vodka.eventQueue.enqueueExpectationCallback(callback, result);
	let item = Vodka.eventQueue.retrieveNextItem();
	let correctItem = {
		action: 'expectationCallback',
		shouldDedupe: false,
		callback: callback,
		result: result
	}
	assertTruthy(item);
	assertEqual(item.action, correctItem.action);
	assertEqual(item.shouldDedupe, correctItem.shouldDedupe);
	assertEqual(item.result, correctItem.result);
	assertEqual(item.callback, correctItem.callback);
}


function TEST_eventqueue_events_expectationfulfill() {
	let exp = new Object();
	let result = new Object();
	Vodka.eventQueue.enqueueExpectationFulfill(exp, result);
	let item = Vodka.eventQueue.retrieveNextItem();
	let correctItem = {
		action: 'expectationFulfill',
		shouldDedupe: false,
		exp: exp,
		result: result
	}
	assertTruthy(item);
	assertEqual(item.action, correctItem.action);
	assertEqual(item.shouldDedupe, correctItem.shouldDedupe);
	assertEqual(item.exp, correctItem.exp);
	assertEqual(item.result, correctItem.result);
}

function TEST_eventqueue_events_gc() {
	Vodka.eventQueue.enqueueGC();
	let item = Vodka.eventQueue.retrieveNextItem();
	let correctItem = {
		action: 'gc',
		shouldDedupe: true,
	}
	assertTruthy(item);
	assertTruthy(item.equals(correctItem));
	assertEqual(item.action, correctItem.action);
	assertEqual(item.shouldDedupe, correctItem.shouldDedupe);
}

function TEST_eventqueue_events_importanttoplevelrender() {
	Vodka.eventQueue.enqueueImportantTopLevelRender();
	let item = Vodka.eventQueue.retrieveNextItem();
	let correctItem = {
		action: 'importantTopLevelRender',
		shouldDedupe: true,
	}
	assertTruthy(item);
	assertTruthy(item.equals(correctItem));
	assertEqual(item.action, correctItem.action);
	assertEqual(item.shouldDedupe, correctItem.shouldDedupe);
}


function TEST_eventqueue_events_rendernoderender() {
	let fakeRenderNode = new Object();
	let flags = 3249;
	Vodka.eventQueue.enqueueRenderNodeRender(fakeRenderNode, flags);
	let item = Vodka.eventQueue.retrieveNextItem();
	let correctItem = {
		action: 'renderNodeRender',
		renderNode: fakeRenderNode,
		shouldDedupe: true,
		flags: flags
	}
	assertTruthy(item);
	assertTruthy(item.equals(correctItem));
	assertEqual(item.action, correctItem.action);
	assertEqual(item.shouldDedupe, correctItem.shouldDedupe);
	assertEqual(item.renderNode, correctItem.renderNode);
	assertEqual(item.flags, correctItem.flags);
}

function TEST_eventqueue_events_toplevelrender() {
	Vodka.eventQueue.enqueueTopLevelRender();
	let item = Vodka.eventQueue.retrieveNextItem();
	let correctItem = {
		action: 'topLevelRender',
		shouldDedupe: true,
	}
	assertTruthy(item);
	assertTruthy(item.equals(correctItem));
	assertEqual(item.action, correctItem.action);
	assertEqual(item.shouldDedupe, correctItem.shouldDedupe);
}

function TEST_eventqueue_priority_inverseordering() {
	let obj = new Object();
	Vodka.eventQueue.enqueueGC();
	Vodka.eventQueue.enqueueAlertAnimation(obj);
	Vodka.eventQueue.enqueueRenderNodeRender(obj, obj);
	Vodka.eventQueue.enqueueExpectationFulfill(obj, obj)
	Vodka.eventQueue.enqueueDoKeyInput(obj, obj, obj, obj, obj, obj);
	assertEqual(Vodka.eventQueue.retrieveNextItem().action, 'doKeyInput');
	assertEqual(Vodka.eventQueue.retrieveNextItem().action, 'expectationFulfill');
	assertEqual(Vodka.eventQueue.retrieveNextItem().action, 'renderNodeRender');
	assertEqual(Vodka.eventQueue.retrieveNextItem().action, 'doAlertAnimation');
	assertEqual(Vodka.eventQueue.retrieveNextItem().action, 'gc');
}


function TEST_eventqueue_priority_addedwhiledequeueing() {
	let obj = new Object();
	Vodka.eventQueue.enqueueGC();
	Vodka.eventQueue.enqueueAlertAnimation(obj);
	Vodka.eventQueue.enqueueRenderNodeRender(obj, obj);
	Vodka.eventQueue.enqueueExpectationFulfill(obj, obj)
	Vodka.eventQueue.enqueueDoKeyInput(obj, obj, obj, obj, obj, obj);
	assertEqual(Vodka.eventQueue.retrieveNextItem().action, 'doKeyInput');
	assertEqual(Vodka.eventQueue.retrieveNextItem().action, 'expectationFulfill');
	Vodka.eventQueue.enqueueDoKeyInput(obj, obj, obj, obj, obj, obj);
	assertEqual(Vodka.eventQueue.retrieveNextItem().action, 'doKeyInput');
	assertEqual(Vodka.eventQueue.retrieveNextItem().action, 'renderNodeRender');
	assertEqual(Vodka.eventQueue.retrieveNextItem().action, 'doAlertAnimation');
	assertEqual(Vodka.eventQueue.retrieveNextItem().action, 'gc');
}

function TEST_eventqueue_priority_inverseordering2() {
	let obj = new Object();
	Vodka.eventQueue.enqueueGC();
	Vodka.eventQueue.enqueueAlertAnimation(obj);
	Vodka.eventQueue.enqueueTopLevelRender();
	Vodka.eventQueue.enqueueExpectationCallback(obj, obj)
	Vodka.eventQueue.enqueueDoClickHandlerAction(obj, obj, obj);
	assertEqual(Vodka.eventQueue.retrieveNextItem().action, 'doClickHandlerAction');
	assertEqual(Vodka.eventQueue.retrieveNextItem().action, 'expectationCallback');
	assertEqual(Vodka.eventQueue.retrieveNextItem().action, 'topLevelRender');
	assertEqual(Vodka.eventQueue.retrieveNextItem().action, 'doAlertAnimation');
	assertEqual(Vodka.eventQueue.retrieveNextItem().action, 'gc');
}

function TEST_eventqueue_priority_normalandimportantrender() {
	let obj = new Object();
	Vodka.eventQueue.enqueueTopLevelRender();
	Vodka.eventQueue.enqueueImportantTopLevelRender();
	assertEqual(Vodka.eventQueue.retrieveNextItem().action, 'importantTopLevelRender');
	assertEqual(Vodka.eventQueue.retrieveNextItem().action, 'topLevelRender');
}

function TEST_eventqueue_deduping() {
	let obj = new Object();
	Vodka.eventQueue.enqueueGC();
	Vodka.eventQueue.enqueueGC();
	Vodka.eventQueue.enqueueGC();
	Vodka.eventQueue.enqueueGC();
	Vodka.eventQueue.enqueueAlertAnimation(obj);
	Vodka.eventQueue.enqueueAlertAnimation(obj);
	Vodka.eventQueue.enqueueAlertAnimation(obj);
	Vodka.eventQueue.enqueueAlertAnimation(obj);
	Vodka.eventQueue.enqueueRenderNodeRender();
	Vodka.eventQueue.enqueueRenderNodeRender();
	Vodka.eventQueue.enqueueRenderNodeRender();
	Vodka.eventQueue.enqueueRenderNodeRender();
	Vodka.eventQueue.enqueueTopLevelRender();
	Vodka.eventQueue.enqueueTopLevelRender();
	Vodka.eventQueue.enqueueTopLevelRender();
	Vodka.eventQueue.enqueueTopLevelRender();
	Vodka.eventQueue.enqueueTopLevelRender();
	Vodka.eventQueue.enqueueRenderNodeRender();
	Vodka.eventQueue.enqueueTopLevelRender();
	Vodka.eventQueue.enqueueImportantTopLevelRender();
	Vodka.eventQueue.enqueueImportantTopLevelRender();
	Vodka.eventQueue.enqueueImportantTopLevelRender();
	Vodka.eventQueue.enqueueImportantTopLevelRender();
	assertEqual(Vodka.eventQueue.retrieveNextItem().action, 'importantTopLevelRender');
	assertEqual(Vodka.eventQueue.retrieveNextItem().action, 'renderNodeRender');
	assertEqual(Vodka.eventQueue.retrieveNextItem().action, 'topLevelRender');
	assertEqual(Vodka.eventQueue.retrieveNextItem().action, 'renderNodeRender');
	assertEqual(Vodka.eventQueue.retrieveNextItem().action, 'topLevelRender');
	assertEqual(Vodka.eventQueue.retrieveNextItem().action, 'doAlertAnimation');
	assertEqual(Vodka.eventQueue.retrieveNextItem().action, 'gc');
	assertFalsy(Vodka.eventQueue.retrieveNextItem());
}


