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


// DeferredValue acts like an atomic value but it's actually a container.

import * as Utils from '../utils.js'

import { eventQueueDispatcher } from '../eventqueuedispatcher.js'
import { NexContainer } from './nexcontainer.js'
import { Nil } from './nil.js'
import { RENDER_FLAG_SHALLOW, RENDER_FLAG_EXPLODED } from '../globalconstants.js'
import { getFFGen } from '../gc.js'
import { experiments } from '../globalappflags.js'
import { heap } from '../heap.js'
import { constructFatalError } from './eerror.js'

const DVSTATE_CANCELLED = 0;
const DVSTATE_NEW = 1;
const DVSTATE_ACTIVATED = 2;
const DVSTATE_SETTLED = 3;
const DVSTATE_FINISHED = 4;


class DeferredValue extends NexContainer {
	constructor() {
		super();
		this.privateData = '';
		this.mutable = false;
		this.activationFunctionGenerator = null;
		this.listeners = [];

		this.state = DVSTATE_NEW;
	}

	addListener(obj) {
		if (this.hasListener(obj)) {
			return;
		}
		this.listeners.push(obj);
		if (this._finished) {
			eventQueueDispatcher.enqueueRenotifyDeferredListeners(this);
		}
	}

	hasListener(obj) {
		for (let i = 0; i < this.listeners.length; i++) {
			if (this.listeners[i] == obj) {
				return true;
			}
		}
		return false;
	}

	notifyAllListeners() {
		this.listeners.forEach(function(listener) {
			listener.notify();
		}.bind(this));
	}

	cancel() {
		this.ffgen--;
		this.state = DVSTATE_CANCELLED;
	}

	isActivated() {
		return this.state >= DVSTATE_ACTIVATED;
	}

	isSettled() {
		return this.state >= DVSTATE_SETTLED;
	}

	isFinished() {
		return this.state >= DVSTATE_FINISHED;
	}

	isCancelled() {
		return this.state == DVSTATE_CANCELLED;
	}

	toString(version) {
		if (version == 'v2') {
			return this.toStringV2();
		}
	}

	toStringV2() {
		// I think deferred values should just save as not a container but rather save as the string of its
		// contained value, whatever that is. We can't, for example, save the state of a file read operation that is in progress.
		return this.getChildAt(0).toStringV2();
	}

	// deferred values are containers but we don't let you insert things in the editor
	canDoInsertInside() {
		return false;
	}

	// rename this
	set(activationFunctionGenerator) {
		this.activationFunctionGenerator = activationFunctionGenerator;
		this.ffgen = getFFGen();
	}

	finish(value) {
		this.finishOrSettle(value, false);
	}

	settle(value) {
		this.finishOrSettle(value, true);
	}

	finishOrSettle(value, justSettling) {
		if (this.isFinished()) {
			// can't finish twice, can't settle after finishing.
			return;
		}
		if (this.ffgen < getFFGen()) {
			// either this was cancelled or all pending deferreds were cancelled.
			this._cancelled = true;
			return;
		}
		this.setDirtyForRendering(true);
		eventQueueDispatcher.enqueueRenderOnlyDirty();
		if (value) {
			if (this.numChildren() == 0) {
				this.appendChild(value);
			} else {
				this.replaceChildAt(value, 0);
			}
		}
		this.state = justSettling ? DVSTATE_SETTLED : DVSTATE_FINISHED;
		if (!experiments.DISABLE_ALERT_ANIMATIONS) {
			this.doAlertAnimation();
		}
		this.notifyAllListeners();
	}

	finishWithRepeat(value) {
		this.finish(value, true /* do repeat */)
	}

	startSettle(value) {
		eventQueueDispatcher.enqueueDeferredSettle(this, value);
	}

	startFinish(value) {
		eventQueueDispatcher.enqueueDeferredFinish(this, value);
	}

	activate() {
		let finishCallback = ((value) => this.startFinish(value));
		let settleCallback = ((value) => this.startSettle(value));
		this.activationFunctionGenerator.getFunction(finishCallback, settleCallback, this)();
		this.state = DVSTATE_ACTIVATED;
	}

	prettyPrintInternal(lvl, hdir) {
		return this.standardListPrettyPrint(lvl, ',', hdir);
	}

	deserializePrivateData(data) {
		this.privateData = data;
	}

	serializePrivateData() {
		return this.privateData;
	}

	getTypeName() {
		return '-deferredvalue-';
	}

	makeCopy(shallow) {
		// A copy of a deferred value should ACTUALLY just be a copy of the contents,
		// since you can't really copy a waiting file handle or something.
		// Since this defaults to immutable and can't be made mutable, the only time
		// makeCopy should be called is for a copy and paste operation.
		return this.getChildAt(0).makeCopy();
	}

	doAlertAnimation() {
		let rn = this.getRenderNodes();
		for (let i = 0; i < rn.length; i++) {
			eventQueueDispatcher.enqueueAlertAnimation(rn[i]);
		}
	}

	copyFieldsTo(nex) {
		super.copyFieldsTo(nex);
	}

	getSettledValue() {
		if (this.numChildren() > 0) {
			return this.getChildAt(0);
		} else {
			return new Nil();
		}
	}

	evaluate(env) {
		if (!this.isActivated()) {
			this.activate();
			return this;
		}
		if (this.isFinished()) {
			if (this.numChildren() > 0) {
				let c = this.getChildAt(0);
				if (Utils.isDeferredValue(c) && c.isFinished()) {
					return c.evaluate(env);
				} else {
					return c;
				}
			} else {
				return new Nil();
			}
		}
		// if just settled, but not finished, return this.
		return this;
	}

	setMutable(v) {
		if (v) {
			throw constructFatalError('cannot make deferred values mutable.');
		}
	}

	renderInto(renderNode, renderFlags, withEditor) {
		let domNode = renderNode.getDomNode();
		let dotspan = null;
		if (!(renderFlags & RENDER_FLAG_SHALLOW)) {
			dotspan = document.createElement("span");
			dotspan.classList.add('dotspan');
			domNode.appendChild(dotspan);
		}
		super.renderInto(renderNode, renderFlags, withEditor);
		dotspan.classList.add('dotspan');
		domNode.appendChild(dotspan);
		domNode.classList.add('deferredvalue');
		if (!(renderFlags & RENDER_FLAG_SHALLOW)) {
			if (renderFlags & RENDER_FLAG_EXPLODED) {
				dotspan.classList.add('exploded');
			} else {
				dotspan.classList.remove('exploded');
			}
			if (this.isEditing) {
				dotspan.classList.add('editing');
			} else {
				dotspan.classList.remove('editing');
			}


			switch(this.state) {
				case DVSTATE_CANCELLED:
					dotspan.innerHTML = '<span class="dvglyph cancelledglyph">⤬</span>'
					break;
				case DVSTATE_ACTIVATED:
					if (experiments.STATIC_PIPS) {
						dotspan.innerHTML = '<span class="dvglyph waitingglyph">↻</span>'
					} else {
						dotspan.innerHTML = '<span class="dvglyph waitingglyph dvspin">↻</span>'
					}
					break;
				case DVSTATE_SETTLED:
					dotspan.innerHTML = '<span class="dvglyph settledglyph">⬿</span>'
					break;
				case DVSTATE_FINISHED:
					dotspan.innerHTML = '<span class="dvglyph finishedglyph">⤓</span>'
					break;
				case DVSTATE_NEW:
				default:
					// shouldn't happen
					dotspan.innerHTML = '<span class="dvglyph newglyph">?</span>'
					break;
			}
		}
	}

	memUsed() {
		return super.memUsed() + heap.sizeDeferredValue();
	}
}

function constructDeferredValue() {
	if (!heap.requestMem(heap.sizeDeferredValue())) {
		throw constructFatalError(`OUT OF MEMORY: cannot allocate DeferredValue.
stats: ${heap.stats()}`)
	}
	return heap.register(new DeferredValue());
}

export { DeferredValue, constructDeferredValue }