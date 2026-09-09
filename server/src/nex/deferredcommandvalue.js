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

/*
Compiled code that either has not run yet or is going to run again.

Its children are a call, written the way lisp writes one: the closure first,
then the arguments. At least one of those arguments is a deferred value or
another deferred command value -- that is the whole reason this exists rather
than a result, and when none are left it collapses into what it computed.

What it has computed so far is a field rather than a child, so that the
children stay a legal call and the first of them stays the thing being called.
Ask for it with `latest`; evaluating this gives back this, because it is still
in the middle of its work and saying otherwise would be a lie about whether
more is coming.

This replaces a copy of the command being stashed inside the value it returned.
That copy was a nex, so it was refcounted as a child, and it lived in the same
slot the answer went into -- so the first answer displaced it, freed it, and
cleanupOnMemoryFree cancelled it. A handler fired once and then went quiet. The
record having a type of its own, and a slot of its own, is what stops that.
*/

import * as Utils from '../utils.js'
import { NexContainer } from './nexcontainer.js'
import { constructNil } from './nil.js'
import { heap } from '../heap.js'
import { constructFatalError } from './eerror.js'
import { eventQueueDispatcher } from '../eventqueuedispatcher.js'
import { experiments } from '../globalappflags.js'
import { RENDER_FLAG_SHALLOW, RENDER_FLAG_EXPLODED } from '../globalconstants.js'
import { executeRunInfo } from '../commandfunctions.js'
import { ARGRESULT_SETTLED, ARGRESULT_FINISHED } from '../argevaluator.js'

// nothing yet: no value has been produced, so it has no latest
const DCV_WAITING = 1;
// has produced at least one value and can produce another
const DCV_SETTLED = 2;
// produced its last value; nothing more is coming
const DCV_FINISHED = 3;
const DCV_CANCELLED = 4;

class DeferredCommandValue extends NexContainer {
	constructor() {
		super();
		this.privateData = '';
		this.mutable = false;
		this.listeners = [];
		this.state = DCV_WAITING;

		/*
		The value computed so far. A field, not a child, so that the children
		remain a call with the closure at its head. Fields are not refcounted
		the way children are, so it is referenced by hand -- see setLatest.
		*/
		this.provisionalValue = null;

		this._runInfo = null;
		this._activationEnv = null;
	}

	getTypeName() {
		return '-deferredcommandvalue-';
	}

	// ---- what it has computed so far

	hasLatest() {
		return this.provisionalValue != null;
	}

	getLatest() {
		return this.provisionalValue ? this.provisionalValue : constructNil();
	}

	setLatest(v) {
		if (this.provisionalValue == v) return;
		let old = this.provisionalValue;
		this.provisionalValue = v;
		if (v) heap.addReference(v);
		if (old) heap.removeReference(old);
		this.setDirtyForRendering(true);
	}

	// ---- state

	isSettled() { return this.state == DCV_SETTLED || this.state == DCV_FINISHED; }
	isFinished() { return this.state == DCV_FINISHED; }
	isCancelled() { return this.state == DCV_CANCELLED; }

	cancel() {
		this.state = DCV_CANCELLED;
		this.releaseRunState();
	}

	releaseRunState() {
		if (this._activationEnv) {
			heap.removeEnvReference(this._activationEnv);
			this._activationEnv = null;
		}
		if (this._runInfo) {
			this._runInfo.finalize();
			this._runInfo = null;
		}
	}

	/*
	Deleting the record is the only thing that ends it. Nothing else frees it
	any more: the answer has a slot of its own and never displaces it.
	*/
	cleanupOnMemoryFree() {
		if (this.state != DCV_FINISHED && this.state != DCV_CANCELLED) {
			this.cancel();
		} else {
			this.releaseRunState();
		}
		this.setLatest(null);
	}

	// ---- the call

	setRunState(runInfo, executionEnv) {
		this._runInfo = runInfo;
		this._activationEnv = executionEnv;
		heap.addEnvReference(executionEnv);
	}

	addListener(obj) {
		if (this.listeners.indexOf(obj) != -1) return;
		this.listeners.push(obj);
		if (this.isFinished()) {
			eventQueueDispatcher.enqueueRenotifyDeferredListeners(this);
		}
	}

	notifyAllListeners() {
		this.listeners.forEach(function (listener) {
			listener.notify();
		});
	}

	// an argument produced something, so this can try again
	notify() {
		this.run();
	}

	/*
	Runs the call if its arguments are ready, and reports what it got by the
	same settle/finish distinction its arguments used: an argument that settled
	means another value may follow, so this settles too and stays armed.
	*/
	run() {
		if (this.isCancelled() || this.isFinished() || !this._runInfo) {
			return;
		}
		let argResult = null;
		try {
			argResult = this._runInfo.argEvaluator.evaluatePotentiallyDeferredArgs(this);
		} catch (e) {
			if (Utils.isFatalError(e)) {
				this.produce(e, false);
				return;
			}
			throw e;
		}
		if (argResult != ARGRESULT_SETTLED && argResult != ARGRESULT_FINISHED) {
			// still waiting on something
			return;
		}
		let result = executeRunInfo(this._runInfo, this._activationEnv);
		/*
		An error ends it. The source that produced it will produce it again on
		the next event, and a handler reporting the same failure forever is no
		use to anybody -- handle the error inside the handler to stay alive.
		*/
		let keepGoing = (argResult == ARGRESULT_SETTLED) && !Utils.isFatalError(result);
		this.produce(result, keepGoing);
	}

	produce(value, keepGoing) {
		this.setLatest(value);
		this.state = keepGoing ? DCV_SETTLED : DCV_FINISHED;
		if (!keepGoing) {
			this.releaseRunState();
		}
		this.setDirtyForRendering(true);
		eventQueueDispatcher.enqueueRenderOnlyDirty();
		if (!experiments.DISABLE_ALERT_ANIMATIONS) {
			this.doAlertAnimation();
		}
		this.notifyAllListeners();
	}

	// ---- nex boilerplate

	evaluate(env) {
		// still in the middle of its work; `latest` is how you look inside
		return this;
	}

	setMutable(v) {
		if (v) {
			throw constructFatalError('cannot make deferred command values mutable.');
		}
	}

	canDoInsertInside() { return false; }
	canDoInsertAfter() { return false; }
	canDoInsertBefore() { return false; }

	getDefaultHandler() { return 'standardDefault'; }

	makeCopy(shallow) {
		let r = constructDeferredCommandValue();
		this.copyChildrenTo(r, shallow);
		this.copyFieldsTo(r);
		r.setLatest(this.provisionalValue);
		r.state = this.state;
		return r;
	}

	toString(version, ctx) {
		if (version == 'v2') return this.toStringV2(ctx);
	}

	/*
	Saved as what it computed, the same as a deferred value is. A running
	handler cannot be written down and read back -- the closure could be, but
	the thing it is waiting for could not -- so what survives a reload is the
	answer, and the handler has to be armed again.
	*/
	toStringV2(ctx) {
		let v = this.provisionalValue;
		return v ? v.toStringV2(ctx) : '[nil]';
	}

	deserializePrivateData(data) { this.privateData = data; }
	serializePrivateData(ctx) { return this.privateData; }

	prettyPrintInternal(lvl, hdir) {
		return this.standardListPrettyPrint(lvl, ',', hdir);
	}

	renderInto(renderNode, renderFlags, withEditor) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags, withEditor);
		domNode.classList.add('deferredcommandvalue');
		if (renderFlags & RENDER_FLAG_SHALLOW) {
			return;
		}
		/*
		The state, then what it has computed, then the call itself. The result
		goes across the direction the call runs in -- above a horizontal call,
		beside a vertical one -- so it never competes with the call's own
		layout. The call is the children; everything else here is drawn from
		fields, so it is built by hand rather than rendered as nexes.
		*/
		let glyph = document.createElement('span');
		glyph.classList.add('dcvglyph');
		glyph.innerHTML = this.stateGlyph();
		domNode.prepend(glyph);
		if (renderFlags & RENDER_FLAG_EXPLODED) {
			domNode.classList.add('exploded');
		}
	}

	// the same as a deferred value does it: nexes do not have this, only the
	// render nodes showing them
	doAlertAnimation() {
		let rn = this.getRenderNodes();
		for (let i = 0; i < rn.length; i++) {
			eventQueueDispatcher.enqueueAlertAnimation(rn[i]);
		}
	}

	stateGlyph() {
		switch (this.state) {
			case DCV_CANCELLED: return '&#x2934;';
			case DCV_FINISHED: return '&#x2913;';
			case DCV_SETTLED: return '&#x293f;';
			default: return '&#x21bb;';
		}
	}
}

function constructDeferredCommandValue() {
	if (!heap.requestMem(heap.sizeDeferredValue())) {
		throw constructFatalError(`OUT OF MEMORY: cannot allocate DeferredCommandValue.
stats: ${heap.stats()}`)
	}
	return heap.register(new DeferredCommandValue());
}

export { DeferredCommandValue, constructDeferredCommandValue }
