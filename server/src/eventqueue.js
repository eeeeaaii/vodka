

// javascript timeouts and events are already queued,
// but it's first-come-first-serve. This converts
// them into a priority queue by making every action
// just push an event onto a javascript array queue
// marked w/ the appropriate priority, then we
// pop and execute anything that's been queued.

// we have:
// - user events, which preempt everything because responsiveness
// - exception fulfill, which should preempt rendering because they affect how things get rendered
// - rendering
// - true low priority things, like alert animation
// additionally, in certain contexts we need to enqueue render events at an equal priority
// to user events, like for example for older tests that directly call into doKeyInput
// rather than mimicking browser events.

// do not do the thing where you have multiple names for a queue
const USER_EVENT_PRIORITY = 0;
const EXCEPTION_PRIORITY = 1;
const RENDER_PRIORITY = 2;
const LOW_PRIORITY = 3;

class EventQueue {
	constructor() {
		this.queueSet = [];
		this.queueSet[USER_EVENT_PRIORITY] = [];
		this.queueSet[EXCEPTION_PRIORITY] = [];
		this.queueSet[RENDER_PRIORITY] = [];
		this.queueSet[LOW_PRIORITY] = [];
	}

	enqueueAlertAnimation(renderNode) {
		EVENT_DEBUG ? console.log('enqueueing: AlertAnimation'):null;
		let item = {
			action: "doAlertAnimation",
			shouldDedupe: true,
			renderNode: renderNode,
			equals: function(other) {
				 // ref equals is okay?
				return
					other.action == this.action
					&& other.renderNode == this.renderNode;
			},
			do: function() {
				this.renderNode.doAlertAnimation();
			}
		};
		this.queueSet[LOW_PRIORITY].push(item);
		this.setTimeoutForProcessingNextItem(item);
	}

	enqueueRenderNodeRenderSelecting(renderNode, flags, selectThisNode) {
		EVENT_DEBUG ? console.log('enqueueing: RenderNodeRenderSelecting'):null;
		let item = {
			action: "renderNodeRenderSelecting",
			shouldDedupe: true,
			renderNode: renderNode,
			selectThisNode: selectThisNode,
			flags: flags,
			equals: function(other) {
				 // ref equals is okay?
				return
					other.action == this.action
					&& other.selectThisNode == this.selectThisNode
					&& other.renderNode == this.renderNode
					&& other.flags == this.flags;
			},
			do: function() {
				selectWhenYouFindIt = this.selectThisNode;
				renderPassNumber++;
				this.renderNode.render(this.flags);
			}
		};
		this.queueSet[RENDER_PRIORITY].push(item);
		this.setTimeoutForProcessingNextItem(item);
	}

	enqueueRenderNodeRender(renderNode, flags) {
		EVENT_DEBUG ? console.log('enqueueing: RenderNodeRender'):null;
		let item = {
			action: "renderNodeRender",
			renderNode: renderNode,
			shouldDedupe: true,
			flags: flags,
			equals: function(other) {
				 // ref equals is okay?
				return
					other.action == this.action
					&& other.renderNode == this.renderNode
					&& other.flags == this.flags;
			},
			do: function() {
				renderPassNumber++;
				this.renderNode.render(this.flags);
			}
		};
		this.queueSet[RENDER_PRIORITY].push(item);
		this.setTimeoutForProcessingNextItem(item);
	}

	enqueueDoKeyInput(keycode, whichkey, hasShift, hasCtrl, hasMeta, hasAlt) {
		EVENT_DEBUG ? console.log('enqueueing: DoKeyInput'):null;
		let item = {
			action: "doKeyInput",
			keycode: keycode,
			whichkey: whichkey,
			hasShift: hasShift,
			hasCtrl: hasCtrl,
			hasMeta: hasMeta,
			hasAlt: hasAlt,
			shouldDedupe: false,
			equals: function(other) {
				return
					other.action == this.action
					&& other.keycode == this.keycode
					&& other.whichkey == this.whichkey
					&& other.hasShift == this.hasShift
					&& other.hasCtrl == this.hasCtrl
					&& other.hasMeta == this.hasMeta
					&& other.hasAlt == this.hasAlt;
			},
			do: function() {
				doRealKeyInput(this.keycode, this.whichkey, this.hasShift, this.hasCtrl, this.hasMeta, this.hasAlt);
			}
		};
		this.queueSet[USER_EVENT_PRIORITY].push(item);
		this.setTimeoutForProcessingNextItem(item);
	}

	enqueueTopLevelRenderSelectingNode(nex) {
		EVENT_DEBUG ? console.log('enqueueing: TopLevelRenderSelectingNode'):null;
		let item = {
			action: "topLevelRenderSelectingNode",
			nex: nex,
			shouldDedupe: true,
			equals: function(other) {
				return
					other.action == this.action
					&& other.nex.getID() == this.nex.getID();
			},
			do: function() {
				topLevelRenderSelectingNode(this.nex);
			}
		};
		this.queueSet[RENDER_PRIORITY].push(item);
		this.setTimeoutForProcessingNextItem(item);
	}

	enqueueImportantTopLevelRender() {
		EVENT_DEBUG ? console.log('enqueueing: ImportantTopLevelRender'):null;
		let item = {
			action: "topLevelRender",
			shouldDedupe: true,
			equals: function(other) {
				return
				other.action == this.action;
			},
			do: function() {
				topLevelRender();
			}
		};
		// push to the user event queue because higher priority
		this.queueSet[USER_EVENT_PRIORITY].push(item);
		this.setTimeoutForProcessingNextItem(item);
	}

	enqueueDoClickHandlerAction(target, renderNode, event) {
		EVENT_DEBUG ? console.log('enqueueing: DoClickHandlerAction'):null;
		let item = {
			action: "doClickHandlerAction",
			target: target,
			shouldDedupe: false,
			renderNode: renderNode,
			event: event,
			equals: function(other) {
				return other.action == this.action
						&& other.target.getID() == this.target.getID()
						&& other.renderNode == this.renderNode;
			},
			do: function() {
				this.target.doClickHandlerAction(this.renderNode, event);
			}
		};
		// TODO: test this and see if it works at render priority
		this.queueSet[USER_EVENT_PRIORITY].push(item);
		this.setTimeoutForProcessingNextItem(item);
	}

	enqueueExpectationFulfill(exp, result) {
		EVENT_DEBUG ? console.log('enqueueing: ExpectationFulfill'):null;
		let item = {
			action: "expectationFulfill",
			exp: exp,
			result: result,
			shouldDedupe: false,
			equals: function(other) {
				return other.action == this.action
						&& other.exp.getID() == this.exp.getID();
			},
			do: function() {
				this.exp.fulfill(this.result);
			}
		};
		this.queueSet[EXCEPTION_PRIORITY].push(item);
		this.setTimeoutForProcessingNextItem(item);
	}


	enqueueTopLevelRender() {
		EVENT_DEBUG ? console.log('enqueueing: TopLevelRender'):null;
		let item = {
			action: "topLevelRender",
			shouldDedupe: true,
			equals: function(other) {
				return other.action == this.action;
			},
			do: function() {
				topLevelRender();
			}
		};
		this.queueSet[RENDER_PRIORITY].push(item);
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

	processNextItem() {
		let queueToUse = this.selectQueue();
		if (!queueToUse) return;
		let item = queueToUse.shift();
		EVENT_DEBUG ? console.log(`processing: ${item.action}`):null;
		// if a bunch of equivalent actions were enqueued, pop them all and just do one
		while(queueToUse.length > 0 && queueToUse[0].equals(item) && queueToUse[0].shouldDedupe) {
			queueToUse.shift();
		}
		item.do();
		this.setTimeoutForProcessingNextItem();
	}
}