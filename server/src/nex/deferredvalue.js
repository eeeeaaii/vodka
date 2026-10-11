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
		/*
		A listener that arrives after the value has already finished still has
		to be told, or it waits for a notification that has already been sent.
		This is not a rare case: a deferred command whose body returns without
		waiting finishes inside its own evaluate, so whatever is evaluating it
		as an argument only gets to listen afterwards.

		(This tested this._finished, which is a field on DeferredCommand and
		not on this class, so it was always undefined and the renotify never
		happened.)

		(comment by Claude)
		*/
		if (this.isFinished()) {
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
		this.listeners.forEach(function (listener) {
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

	toString(version, ctx) {
		if (version == 'v2') {
			return this.toStringV2(ctx);
		}
	}

	toStringV2(ctx) {
		// I think deferred values should just save as not a container but rather save as the string of its
		// contained value, whatever that is. We can't, for example, save the state of a file read operation that is in progress.
		// It can have no contained value at all -- `wait` with no argument makes
		// one, and so does anything still waiting for its first result. Nothing
		// is nil.
		// (comment by Claude)
		let c = this.getChildAt(0);
		return c ? c.toStringV2(ctx) : '[nil]';
	}

	// rename this
	/*
	Some activation sources hold something that keeps running whether or not
	anyone is still listening -- a repeating timer, most obviously. Deleting the
	deferred should stop it.

	(comment by Claude)
	*/
	// Deleted means it has stopped waiting. A wait-for-click that is out of the
	// document but still listening would fire into nothing.
	// (comment by Claude)
	// Detach rather than stop: the source may have other deferred values
	// waiting on it, and it goes away when the last one does.
	// (comment by Claude)
	stopFunctioning() {
		if (this.activationFunctionGenerator) {
			this.activationFunctionGenerator.detach(this);
		}
	}

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
		/*
		An error ends it. A settle would normally leave the deferred live and
		able to fire again -- a click handler waiting for the next click, a
		timer for the next tick -- but a source that has just produced an error
		will produce it again on the next event, and a handler that reports the
		same failure forever is no use to anybody. So an error expires it: the
		state goes to finished rather than settled, which makes any later result
		be refused up at the top of this method, and the activation source is
		stopped so nothing stays scheduled.

		The recourse is to handle the error inside the handler. One that lets an
		error out is done.
		*/
		let held = this.getChildAt(0);
		if (Utils.isFatalError(held)) {
			justSettling = false;
		}
		this.state = justSettling ? DVSTATE_SETTLED : DVSTATE_FINISHED;
		/*
		Finished means done waiting, so it stops being one of the source's
		waiters -- which is what stops the source, once the last one is gone.
		Detach rather than stop because the source may be shared: a copy of
		this is waiting on the same file read and has not heard yet.

		(comment by Claude)
		*/
		if (!justSettling && this.activationFunctionGenerator) {
			this.activationFunctionGenerator.detach(this);
		}
		if (!experiments.DISABLE_ALERT_ANIMATIONS) {
			this.doAlertAnimation();
		}
		this.notifyAllListeners();
		/*
		Finished for good, so if this is sitting in a document the answer takes
		its place there. Only on finish: a settled one is still live and may
		produce another value, and there would be nothing left to produce it
		with once the wrapper is gone. Listeners first, so anything waiting on
		it hears before the document changes underneath.

		(comment by Claude)
		*/
		if (!justSettling) {
			eventQueueDispatcher.enqueueUnwrapFinishedDeferred(this);
		}
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
		// TODO: remove the didNotWait check once #292 is fixed
		// (comment by Claude)
		let didNotWait = this.activationFunctionGenerator.attach(this);
		if (!didNotWait) {
			this.state = DVSTATE_ACTIVATED;
		}
	}

	prettyPrintInternal(lvl, hdir) {
		return this.standardListPrettyPrint(lvl, ',', hdir);
	}

	deserializePrivateData(data) {
		this.privateData = data;
	}

	serializePrivateData(ctx) {
		return this.privateData;
	}

	getTypeName() {
		return '-deferredvalue-';
	}

	/*
	A deferred value is a value that is not here yet, plus the arrangement by
	which it will arrive, and the two halves copy differently.

	The children are the value half and copy like any container's. The
	activation function generator is the arrangement, and it is a live
	registration with something outside the nex tree, so it decides for itself
	whether the copy joins it or gets one of its own: a file read or a timer is
	shared, because there is one event coming and the copy should not start a
	second one, while a source watching this value's own contents makes a new
	registration against the copy's contents, because the copy is a different
	thing to click.

	This used to return a copy of the contents instead -- not a deferred value
	at all -- so a deferred inside a copied list was silently replaced by what
	it held, and one with nothing in it yet threw a TypeError.

	(comment by Claude)
	*/
	makeCopy(shallow) {
		let r = constructDeferredValue();
		this.copyChildrenTo(r, shallow);
		this.copyFieldsTo(r);
		r.state = this.state;
		r.privateData = this.privateData;
		// this generation and not a new one: a copy of a cancelled deferred
		// value is cancelled. set() would stamp the current one.
		// (comment by Claude)
		r.ffgen = this.ffgen;
		if (this.activationFunctionGenerator) {
			r.activationFunctionGenerator =
					this.activationFunctionGenerator.copyForDeferred(this, r);
			/*
			The copy carries the state and the contents it was copied from, so
			there is no catching up to do: a copy of a settled one is settled
			holding the current value and waits for the next event, and a copy
			of a finished one holds the answer and waits for nothing.

			(comment by Claude)
			*/
			if (r.isActivated() && !r.isFinished()) {
				r.activationFunctionGenerator.attach(r);
			}
		}
		return r;
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
			let result;
			if (this.numChildren() > 0) {
				/*
				Unwrapping, not evaluating: what a finished deferred value holds
				is already the answer, so it is handed back exactly as it is.
				This is car of the deferred value, not eval of it.

				It did evaluate for a while, which made unwrapping run whatever
				it unwrapped -- a deferred value that finished holding a command
				would run that command on its way out.

				(comment by Claude)
				*/
				result = this.getChildAt(0);
			} else {
				result = new Nil();
			}
			/*
			Tags on the deferred value were put there to describe the answer --
			nobody tags the waiting itself -- so they have to come along or they
			are lost the moment the wrapper goes away. addTag rather than
			copyTagsTo so that evaluating the same deferred value twice does not
			stack up duplicates, which matters more now that result is the child
			itself rather than a fresh copy of it.

			(comment by Claude)
			*/
			for (let i = 0; i < this.tags.length; i++) {
				result.addTag(this.tags[i].copy());
			}
			return result;
		}
		// if just settled, but not finished, return this.
		return this;
	}

	/*
	Always immutable, so there is nothing for the flag to say and nothing to
	complain about. It used to throw, which was unreachable only because
	makeCopy removed the deferred value before anything could ask: now that a
	copy is a real one, pasting it runs setMutableRecursive(true) over it and a
	throw there would put an error in the document instead of the paste.

	(comment by Claude)
	*/
	setMutable(v) {
	}

	getDefaultHandler() {
		return 'standardDefault';
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


			switch (this.state) {
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