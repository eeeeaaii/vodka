

// javascript timeouts and events are already queued,
// but it's first-come-first-serve. This converts
// them into a priority queue by making every action
// just push an event onto a javascript array queue
// marked w/ the appropriate priority, then we
// pop and execute anything that's been queued.

class EventQueue {
	constructor() {
		this.highPriority = [];
		this.normalPriority = [];
		this.lowPriority = [];
	}

	enqueueRenderNodeRenderSelecting(renderNode, flags, selectThisNode) {
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
		this.normalPriority.push(item);
		this.setTimeoutForProcessingNextItem(item);
	}

	enqueueRenderNodeRender(renderNode, flags) {
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
		this.normalPriority.push(item);
		this.setTimeoutForProcessingNextItem(item);
	}

	enqueueDoKeyInput(keycode, whichkey, hasShift, hasCtrl, hasAlt) {
		let item = {
			action: "doKeyInput",
			keycode: keycode,
			whichkey: whichkey,
			hasShift: hasShift,
			hasCtrl: hasCtrl,
			hasAlt: hasAlt,
			shouldDedupe: false,
			equals: function(other) {
				return
					other.action == this.action
					&& other.keycode == this.keycode
					&& other.whichkey == this.whichkey
					&& other.hasShift == this.hasShift
					&& other.hasCtrl == this.hasCtrl
					&& other.hasAlt == this.hasAlt;
			},
			do: function() {
				doRealKeyInput(this.keycode, this.whichkey, this.hasShift, this.hasCtrl, this.hasAlt);
			}
		};
		this.highPriority.push(item);
		this.setTimeoutForProcessingNextItem(item);
	}

	enqueueTopLevelRenderSelectingNode(nex) {
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
		this.lowPriority.push(item);
		this.setTimeoutForProcessingNextItem(item);
	}

	enqueueImportantTopLevelRender() {
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
		this.highPriority.push(item);
		this.setTimeoutForProcessingNextItem(item);
	}

	enqueueDoClickHandlerAction(target, renderNode, event) {
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
		this.highPriority.push(item);
		this.setTimeoutForProcessingNextItem(item);
	}

	enqueueExpectationFulfill(exp) {
		let item = {
			action: "expectationFulfill",
			exp: exp,
			shouldDedupe: false,
			equals: function(other) {
				return other.action == this.action
						&& other.exp.getID() == this.exp.getID();
			},
			do: function() {
				this.exp.startFulfill();
			}
		};
		this.lowPriority.push(item);
		this.setTimeoutForProcessingNextItem(item);
	}


	enqueueTopLevelRender() {
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
		this.normalPriority.push(item);
		this.setTimeoutForProcessingNextItem(item);
	}

	setTimeoutForProcessingNextItem(item) {
		setTimeout((function() {
			this.processNextItem();
		}).bind(this), 0);
	}

	processNextItem() {
		let queueToUse = null;
		if (!queueToUse && this.highPriority.length > 0) queueToUse = this.highPriority;
		if (!queueToUse && this.normalPriority.length > 0) queueToUse = this.normalPriority;
		if (!queueToUse && this.lowPriority.length > 0) queueToUse = this.lowPriority;
		if (!queueToUse) return;
		let item = queueToUse.shift();
		// if a bunch of equivalent actions were enqueued, pop them all and just do one
		while(queueToUse.length > 0 && queueToUse[0].equals(item) && queueToUse[0].shouldDedupe) {
			queueToUse.shift();
		}
		item.do();
		this.setTimeoutForProcessingNextItem();
	}
}