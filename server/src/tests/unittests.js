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

import { eventQueue } from '../eventqueue.js'
import { eventQueueDispatcher } from '../eventqueuedispatcher.js'

eventQueue.initialize();

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
	eventQueueDispatcher.enqueueAlertAnimation(fakeRenderNode);
	let item = eventQueue.retrieveNextItem();
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
	let fakeAtTarget = true;
	eventQueueDispatcher.enqueueDoClickHandlerAction(fakeTarget, fakeRenderNode, fakeAtTarget, fakeEvent);
	let item = eventQueue.retrieveNextItem();
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
	eventQueueDispatcher.enqueueDoKeyInput(keycode, whichkey, hasShift, hasCtrl, hasMeta, hasAlt);
	let item = eventQueue.retrieveNextItem();
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


function TEST_eventqueue_events_gc() {
	eventQueueDispatcher.enqueueGC();
	let item = eventQueue.retrieveNextItem();
	let correctItem = {
		action: 'gc',
		shouldDedupe: true,
	}
	assertTruthy(item);
	assertTruthy(item.equals(correctItem));
	assertEqual(item.action, correctItem.action);
	assertEqual(item.shouldDedupe, correctItem.shouldDedupe);
}

function TEST_eventqueue_events_renderonlydirty() {
	eventQueueDispatcher.enqueueRenderOnlyDirty();
	let item = eventQueue.retrieveNextItem();
	let correctItem = {
		action: 'renderOnlyDirty',
		shouldDedupe: true,
	}
	assertTruthy(item);
	assertTruthy(item.equals(correctItem));
	assertEqual(item.action, correctItem.action);
	assertEqual(item.shouldDedupe, correctItem.shouldDedupe);
}

function TEST_eventqueue_events_toplevelrender() {
	eventQueueDispatcher.enqueueTopLevelRender();
	let item = eventQueue.retrieveNextItem();
	let correctItem = {
		action: 'topLevelRender',
		shouldDedupe: true,
	}
	assertTruthy(item);
	assertTruthy(item.equals(correctItem));
	assertEqual(item.action, correctItem.action);
	assertEqual(item.shouldDedupe, correctItem.shouldDedupe);
}

function TEST_eventqueue_events_importanttoplevelrender() {
	eventQueueDispatcher.enqueueImportantTopLevelRender();
	let item = eventQueue.retrieveNextItem();
	let correctItem = {
		action: 'importantTopLevelRender',
		shouldDedupe: true,
	}
	assertTruthy(item);
	assertTruthy(item.equals(correctItem));
	assertEqual(item.action, correctItem.action);
	assertEqual(item.shouldDedupe, correctItem.shouldDedupe);
}


function TEST_eventqueue_priority_inverseordering() {
	let obj = new Object();
	eventQueueDispatcher.enqueueGC();
	eventQueueDispatcher.enqueueAlertAnimation(obj);
	eventQueueDispatcher.enqueueRenderOnlyDirty();
	eventQueueDispatcher.enqueueDeferredFinish(obj, obj)
	eventQueueDispatcher.enqueueDoKeyInput(obj, obj, obj, obj, obj, obj);
	assertEqual(eventQueue.retrieveNextItem().action, 'doKeyInput');
	assertEqual(eventQueue.retrieveNextItem().action, 'deferredFinish');
	assertEqual(eventQueue.retrieveNextItem().action, 'renderOnlyDirty');
	assertEqual(eventQueue.retrieveNextItem().action, 'doAlertAnimation');
	assertEqual(eventQueue.retrieveNextItem().action, 'gc');
}


function TEST_eventqueue_priority_addedwhiledequeueing() {
	let obj = new Object();
	eventQueueDispatcher.enqueueGC();
	eventQueueDispatcher.enqueueAlertAnimation(obj);
	eventQueueDispatcher.enqueueRenderOnlyDirty();
	eventQueueDispatcher.enqueueDeferredFinish(obj, obj)
	eventQueueDispatcher.enqueueDoKeyInput(obj, obj, obj, obj, obj, obj);
	assertEqual(eventQueue.retrieveNextItem().action, 'doKeyInput');
	assertEqual(eventQueue.retrieveNextItem().action, 'deferredFinish');
	eventQueueDispatcher.enqueueDoKeyInput(obj, obj, obj, obj, obj, obj);
	assertEqual(eventQueue.retrieveNextItem().action, 'doKeyInput');
	assertEqual(eventQueue.retrieveNextItem().action, 'renderOnlyDirty');
	assertEqual(eventQueue.retrieveNextItem().action, 'doAlertAnimation');
	assertEqual(eventQueue.retrieveNextItem().action, 'gc');
}

function TEST_eventqueue_priority_inverseordering2() {
	let obj = new Object();
	eventQueueDispatcher.enqueueGC();
	eventQueueDispatcher.enqueueAlertAnimation(obj);
	eventQueueDispatcher.enqueueTopLevelRender();
	eventQueueDispatcher.enqueueDeferredFinish(obj, obj)
	eventQueueDispatcher.enqueueDoClickHandlerAction(obj, obj, obj);
	assertEqual(eventQueue.retrieveNextItem().action, 'doClickHandlerAction');
	assertEqual(eventQueue.retrieveNextItem().action, 'deferredFinish');
	assertEqual(eventQueue.retrieveNextItem().action, 'topLevelRender');
	assertEqual(eventQueue.retrieveNextItem().action, 'doAlertAnimation');
	assertEqual(eventQueue.retrieveNextItem().action, 'gc');
}

function TEST_eventqueue_priority_normalandimportantrender() {
	let obj = new Object();
	eventQueueDispatcher.enqueueTopLevelRender();
	eventQueueDispatcher.enqueueImportantTopLevelRender();
	assertEqual(eventQueue.retrieveNextItem().action, 'importantTopLevelRender');
	assertEqual(eventQueue.retrieveNextItem().action, 'topLevelRender');
}

function TEST_eventqueue_deduping() {
	let obj = new Object();
	eventQueueDispatcher.enqueueGC();
	eventQueueDispatcher.enqueueGC();
	eventQueueDispatcher.enqueueGC();
	eventQueueDispatcher.enqueueGC();
	eventQueueDispatcher.enqueueAlertAnimation(obj);
	eventQueueDispatcher.enqueueAlertAnimation(obj);
	eventQueueDispatcher.enqueueAlertAnimation(obj);
	eventQueueDispatcher.enqueueAlertAnimation(obj);
	eventQueueDispatcher.enqueueRenderOnlyDirty();
	eventQueueDispatcher.enqueueRenderOnlyDirty();
	eventQueueDispatcher.enqueueRenderOnlyDirty();
	eventQueueDispatcher.enqueueRenderOnlyDirty();
	eventQueueDispatcher.enqueueTopLevelRender();
	eventQueueDispatcher.enqueueTopLevelRender();
	eventQueueDispatcher.enqueueTopLevelRender();
	eventQueueDispatcher.enqueueTopLevelRender();
	eventQueueDispatcher.enqueueTopLevelRender();
	eventQueueDispatcher.enqueueRenderOnlyDirty();
	eventQueueDispatcher.enqueueTopLevelRender();
	eventQueueDispatcher.enqueueImportantTopLevelRender();
	eventQueueDispatcher.enqueueImportantTopLevelRender();
	eventQueueDispatcher.enqueueImportantTopLevelRender();
	eventQueueDispatcher.enqueueImportantTopLevelRender();
	assertEqual(eventQueue.retrieveNextItem().action, 'importantTopLevelRender');
	assertEqual(eventQueue.retrieveNextItem().action, 'renderOnlyDirty');
	assertEqual(eventQueue.retrieveNextItem().action, 'topLevelRender');
	assertEqual(eventQueue.retrieveNextItem().action, 'renderOnlyDirty');
	assertEqual(eventQueue.retrieveNextItem().action, 'topLevelRender');
	assertEqual(eventQueue.retrieveNextItem().action, 'doAlertAnimation');
	assertEqual(eventQueue.retrieveNextItem().action, 'gc');
	assertFalsy(eventQueue.retrieveNextItem());
}


