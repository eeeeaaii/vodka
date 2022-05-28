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

import { eventQueueDispatcher } from '../eventqueuedispatcher.js'
import { NexContainer } from './nexcontainer.js'
import { RENDER_FLAG_SHALLOW, RENDER_FLAG_EXPLODED } from '../globalconstants.js'
import { gc, getFFGen } from '../gc.js'
import { experiments } from '../globalappflags.js'

class DeferredValue extends NexContainer {
	constructor() {
		super();
		this.privateData = '';
		this.mutable = false;
		this.activationFunctionGenerator = null;
		this._set = false;
		this._activated = false;
		this._settled = false;
		this._finished = false;

		this.listeners = [];

		this._cancelled = false;

		gc.register(this);
	}

	addListener(obj) {
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
		this._cancelled = true;
	}

	isActivated() {
		return this._activated;
	}

	isSettled() {
		return this._settled;
	}

	isFinished() {
		return this._finished;
	}

	isSet() {
		return this._set;
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
		this._set = true;
		this.ffgen = getFFGen();
	}

	finish(value, doRepeat) {
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
		this._settled = true;
		this._finished = !doRepeat;
		this.doAlertAnimation();
		this.notifyAllListeners();
	}

	finishWithRepeat(value) {
		this.finish(value, true /* do repeat */)
	}

	activate() {
		this.activationFunctionGenerator.getFunction(function(value) {
			eventQueueDispatcher.enqueueDeferredFulfill(this, value);
		}.bind(this), function(value) {
			eventQueueDispatcher.enqueueDeferredFulfillWithRepeat(this, value);
		}.bind(this), this)();
		this._activated = true;
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

	evaluate(env) {
		if (!this._activated) {
			this.activate();
			return this;
		}
		if (this._settled) {
			return this.getChildAt(0);
		}
		return this;
	}

	setMutable(v) {
		if (v) {
			throw new EError('cannot make deferred values mutable.');
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

			if (this._cancelled) {
				dotspan.innerHTML = '<span class="settledglyph">⤬</span>'
			} else if (this._activated && !this._finished) {
				if (experiments.STATIC_PIPS) {
					dotspan.innerHTML = '<span class="waitingglyph">↻</span>'
				} else {
					dotspan.innerHTML = '<span class="waitingglyph dvspin">↻</span>'
				}
			} else {
				dotspan.innerHTML = '<span class="settledglyph">⤓</span>'
			}
		}
	}
}

export { DeferredValue }