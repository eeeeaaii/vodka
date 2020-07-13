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


// javascript timeouts and events are already queued,
// but it's first-come-first-serve. This converts
// them into a priority queue by making every action
// just push an event onto a javascript array queue
// marked w/ the appropriate priority, then we
// pop and execute anything that's been queued.

// we have:
// - user events, which preempt everything because responsiveness
// - expectation fulfill, which should preempt rendering because they affect how things get rendered
// - rendering
// - true low priority things, like alert animation
// additionally, in certain contexts we need to enqueue render events at an equal priority
// to user events, like for example for older tests that directly call into doKeyInput
// rather than mimicking browser events.

// do not do the thing where you have multiple names for a queue
const USER_EVENT_PRIORITY = 0;
const EXPECTATION_PRIORITY = 1;
const RENDER_PRIORITY = 2;
const ALERT_ANIMATION_PRORITY = 3;
const GC_PRIORITY = 4;

import * as Vodka from './vodka.js'

class EventQueue {
	constructor() {
		this.queueSet = [];
		this.queueSet[USER_EVENT_PRIORITY] = [];
		this.queueSet[EXPECTATION_PRIORITY] = [];
		this.queueSet[RENDER_PRIORITY] = [];
		this.queueSet[ALERT_ANIMATION_PRORITY] = [];
		this.queueSet[GC_PRIORITY] = [];
	}

	enqueueAlertAnimation(renderNode) {
		Vodka.EVENT_DEBUG ? console.log('enqueueing: AlertAnimation'):null;
		let item = {
			action: "doAlertAnimation",
			shouldDedupe: true,
			renderNode: renderNode,
			equals: function(other) {
				 // ref equals is okay?
				return (
					other.action == this.action
					&& other.renderNode == this.renderNode);
			},
			do: function() {
				this.renderNode.doAlertAnimation();
			}
		};
		this.queueSet[ALERT_ANIMATION_PRORITY].push(item);
		this.setTimeoutForProcessingNextItem(item);
	}

	enqueueRenderNodeRender(renderNode, flags) {
		Vodka.EVENT_DEBUG ? console.log('enqueueing: RenderNodeRender'):null;
		let item = {
			action: "renderNodeRender",
			renderNode: renderNode,
			shouldDedupe: true,
			flags: flags,
			equals: function(other) {
				 // ref equals is okay?
				return (
					other.action == this.action
					&& other.renderNode == this.renderNode
					&& other.flags == this.flags);
			},
			do: function() {
				Vodka.setGlobalRenderPassNumber(Vodka.getGlobalRenderPassNumber() + 1);
				this.renderNode.render(this.flags);
			}
		};
		this.queueSet[RENDER_PRIORITY].push(item);
		this.setTimeoutForProcessingNextItem(item);
	}

	enqueueDoKeyInput(keycode, whichkey, hasShift, hasCtrl, hasMeta, hasAlt) {
		Vodka.EVENT_DEBUG ? console.log('enqueueing: DoKeyInput'):null;
		let item = {
			action: "doKeyInput",
			keycode: keycode,
			whichkey: whichkey,
			hasShift: hasShift,
			hasCtrl: hasCtrl,
			hasMeta: hasMeta,
			hasAlt: hasAlt,
			shouldDedupe: false,
			equals: null, // not needed when shouldDedupe = false
			do: function() {
				Vodka.doRealKeyInput(this.keycode, this.whichkey, this.hasShift, this.hasCtrl, this.hasMeta, this.hasAlt);
			}
		};
		this.queueSet[USER_EVENT_PRIORITY].push(item);
		this.setTimeoutForProcessingNextItem(item);
	}

	enqueueImportantTopLevelRender() {
		Vodka.EVENT_DEBUG ? console.log('enqueueing: ImportantTopLevelRender'):null;
		let item = {
			action: "importantTopLevelRender",
			shouldDedupe: true,
			equals: function(other) {
				return (
					other.action == this.action);
			},
			do: function() {
				Vodka.topLevelRender();
			}
		};
		// push to the user event queue because higher priority
		this.queueSet[USER_EVENT_PRIORITY].push(item);
		this.setTimeoutForProcessingNextItem(item);
	}

	enqueueDoClickHandlerAction(target, renderNode, event) {
		Vodka.EVENT_DEBUG ? console.log('enqueueing: DoClickHandlerAction'):null;
		let item = {
			action: "doClickHandlerAction",
			target: target,
			shouldDedupe: false,
			renderNode: renderNode,
			event: event,
			equals: null, // not needed when shouldDedupe = false
			do: function() {
				this.target.doClickHandlerAction(this.renderNode, event);
			}
		};
		// TODO: test this and see if it works at render priority
		this.queueSet[USER_EVENT_PRIORITY].push(item);
		this.setTimeoutForProcessingNextItem(item);
	}

	enqueueExpectationFulfill(exp, result) {
		Vodka.EVENT_DEBUG ? console.log('enqueueing: ExpectationFulfill'):null;
		let item = {
			action: "expectationFulfill",
			exp: exp,
			result: result,
			shouldDedupe: false,
			equals: null, // not needed when shouldDedupe = false
			do: function() {
				this.exp.fulfill(this.result);
			}
		};
		this.queueSet[EXPECTATION_PRIORITY].push(item);
		this.setTimeoutForProcessingNextItem(item);
	}

	// this is actually pretty generic but the point is that it gets put
	// at expectation priority
	enqueueExpectationCallback(callback, result) {
		Vodka.EVENT_DEBUG ? console.log('enqueueing: ExpectationCallback'):null;
		let item = {
			action: "expectationCallback",
			result: result,
			callback: callback,
			shouldDedupe: false,
			equals: null, // not needed when shouldDedupe = false
			do: function() {
				this.callback(this.result);
			}
		};
		this.queueSet[EXPECTATION_PRIORITY].push(item);
		this.setTimeoutForProcessingNextItem(item);
	}

	enqueueTopLevelRender() {
		Vodka.EVENT_DEBUG ? console.log('enqueueing: TopLevelRender'):null;
		let item = {
			action: "topLevelRender",
			shouldDedupe: true,
			equals: function(other) {
				return (other.action == this.action);
			},
			do: function() {
				Vodka.topLevelRender();
			}
		};
		this.queueSet[RENDER_PRIORITY].push(item);
		this.setTimeoutForProcessingNextItem(item);
	}

	enqueueGC() {
		Vodka.EVENT_DEBUG ? console.log('enqueueing: GC'):null;
		let item = {
			action: "gc",
			shouldDedupe: true,
			equals: function(other) {
				return (other.action == this.action);
			},
			do: function() {
				gc.markAndSweep();
			}
		};
		this.queueSet[GC_PRIORITY].push(item);
		this.setTimeoutForProcessingNextItem(item);
	}

	setTimeoutForProcessingNextItem(item) {
		setTimeout((function() {
			this.processNextItem();
		}).bind(this), 0);
	}

	selectQueue() {
		// queues with lower indices in the queueSet array have higher priority
		for (let i = 0; i < this.queueSet.length; i++) {
			if (this.queueSet[i].length > 0) {
				return this.queueSet[i];
			}
		}
		return null;
	}

	retrieveNextItem() {
		let queueToUse = this.selectQueue();
		if (!queueToUse) return null;
		let item = queueToUse.shift();
		Vodka.EVENT_DEBUG ? console.log(`processing: ${item.action}`):null;
		// if a bunch of equivalent actions were enqueued, pop them all and just do one
		while(queueToUse.length > 0 && queueToUse[0].shouldDedupe && queueToUse[0].equals(item)) {
			queueToUse.shift();
		}
		return item;
	}

	processNextItem() {
		let item = this.retrieveNextItem();
		if (!item) {
			return;
		}
		item.do();
		this.setTimeoutForProcessingNextItem();
	}
}

export { EventQueue }

