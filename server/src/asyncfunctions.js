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

// change "set" to "prime"

import { addMidiListener, removeMidiListener } from './midifunctions.js'
import { convertJSMapToOrg } from './nex/org.js'
import { VODKA_SCHEDULER } from './testutils/virtualclock.js'

/*
One of these is one source of events, and any number of deferred values can be
waiting on it.

It used to be one per waiter: the generator closed over the single pair of
callbacks belonging to the one deferred value that activated it, so there was no
way to have two. That is the thing that made a deferred value uncopyable --
a copy either shared a generator that could only talk to the original, or
started a second file read.

So the waiters are a list, the underlying event is arranged once, and when it
happens every waiter hears. MidiActivationFunctionGenerator used to do exactly
this for itself, with its own `expListeners` and `listening`; this is that,
moved down here so every source has it.

(comment by Claude)
*/
class ActivationFunctionGenerator {

	constructor() {
		// the deferred values waiting on this one source
		this.waiters = [];
		this.started = false;
	}

	/*
	A deferred value starts waiting on me. The source is arranged the first
	time somebody waits and not again, so joining is free.

	Returns truthy if the waiter finished before this returned, which only a
	deferred command can do -- see #292.

	(comment by Claude)
	*/
	attach(dv) {
		if (this.waiters.indexOf(dv) < 0) {
			this.waiters.push(dv);
		}
		if (this.started) {
			return false;
		}
		this.started = true;
		return this.start(dv);
	}

	/*
	A deferred value has stopped waiting, because it left the document. The
	source is torn down when the last one goes and not when the first one does:
	a timer two things are watching is still wanted by the second.

	(comment by Claude)
	*/
	detach(dv) {
		let i = this.waiters.indexOf(dv);
		if (i >= 0) {
			this.waiters.splice(i, 1);
		}
		if (this.waiters.length == 0 && this.started) {
			this.stop();
			this.started = false;
		}
	}

	// one event, one value, handed to everybody waiting. Copied because a
	// waiter can leave the list while it is being notified.
	// (comment by Claude)
	settleAll(value) {
		let w = this.waiters.slice();
		for (let i = 0; i < w.length; i++) {
			w[i].startSettle(value);
		}
	}

	finishAll(value) {
		let w = this.waiters.slice();
		for (let i = 0; i < w.length; i++) {
			w[i].startFinish(value);
		}
	}

	// arrange the underlying event. Called once, with whichever deferred value
	// was first to wait.
	start(dv) {}

	// give it up
	stop() {}

	/*
	How I copy, when a deferred value waiting on me is copied.

	Shared by default: there is one event coming and the copy joins the same
	waiting. A source that watches a nex inside the deferred value answers
	differently -- see ContentsActivationFunctionGenerator.

	(comment by Claude)
	*/
	copyForDeferred(olddv, newdv) {
		return this;
	}

	getAFGName() {}
}

/*
A source that is watching a nex which is, usually, the deferred value's own
contents: a click on it, a change to it, its next render.

These are the ones that cannot be shared by a copy. The copy has its own
children, so it has its own mission -- wait until MY child is clicked -- and it
needs its own registration against that child.

The test is where the watched nex lives, not which class this is, so a source
that watches something outside the deferred value is shared like any other
without having to say so.

(comment by Claude)
*/
class ContentsActivationFunctionGenerator extends ActivationFunctionGenerator {
	constructor(nex) {
		super();
		this.nex = nex;
	}

	// another one of me, watching that nex instead
	makeForNex(nex) {}

	copyForDeferred(olddv, newdv) {
		let i = olddv.getIndexOfChild(this.nex);
		// Not a child of it, so it is watching something out in the document
		// and the copy watches the same thing. A settled one is also in here:
		// settling replaced the contents with the answer, so what it was
		// watching is no longer inside it, and the copy of a settled one
		// behaves exactly as the settled one does.
		// (comment by Claude)
		if (i < 0) {
			return this;
		}
		let n = newdv.getChildAt(i);
		return n ? this.makeForNex(n) : this;
	}
}

class DeferredCommandActivationFunctionGenerator extends ActivationFunctionGenerator {
	constructor(deferredCommand, env) {
		super();
		this.deferredCommand = deferredCommand;
		this.env = env;
	}

	start(dv) {
		// TODO(#292): the only activation that can complete before it
		// returns, so it's the only one that has to report back whether it
		// did. Everything else finishes via the event queue, long after
		// activate() is done.
		// (comment by Claude)
		return this.deferredCommand.activate(this.env);
	}

	getAFGName() {
		return 'deferredcommand';
	}
}


class GenericActivationFunctionGenerator extends ActivationFunctionGenerator {
	constructor(name, asyncFunction) {
		super();
		this.name = name;
		this.asyncFunction = asyncFunction;
	}

	start(dv) {
		this.asyncFunction((value) => this.finishAll(value), dv);
	}

	getAFGName() {
		return this.name;
	}
}


class ImmediateActivationFunctionGenerator extends ActivationFunctionGenerator {
	start(dv) {
		this.finishAll(null);
	}

	getAFGName() {
		return 'nothing';
	}
}

class DelayActivationFunctionGenerator extends ActivationFunctionGenerator {
	constructor(timeout) {
		super();
		this.timeout = timeout;
		this.timer = null;
	}

	start(dv) {
		this.timer = VODKA_SCHEDULER.setTimeout(() => {
			this.timer = null;
			// do not set a value, the default is whatever the child is of the exp
			this.finishAll(null);
		}, this.timeout);
	}

	// the handle was not kept before, so a deleted delay still went off
	// (comment by Claude)
	stop() {
		if (this.timer) {
			window.clearTimeout(this.timer);
			this.timer = null;
		}
	}

	getAFGName() {
		return 'delay';
	}
}


class OnNextRenderActivationFunctionGenerator extends ContentsActivationFunctionGenerator {
	makeForNex(nex) {
		return new OnNextRenderActivationFunctionGenerator(nex);
	}

	start(dv) {
		this.installed = () => this.finishAll(this.nex);
		this.nex.addOnNextRenderCallback(this.installed);
	}

	stop() {
		if (this.installed) {
			this.nex.removeOnNextRenderCallback(this.installed);
			this.installed = null;
		}
	}

	getAFGName() {
		return 'delay';
	}
}

/*
Settles every time the nex is drawn: do-every-render.

Render callbacks are one shot, so it registers again each time. Quietly: asking
for a render as it registers, the way waiting for the next one does, would draw
it again straight away and this would never stop.

(comment by Claude)
*/
class OnEveryRenderActivationFunctionGenerator extends ContentsActivationFunctionGenerator {
	makeForNex(nex) {
		return new OnEveryRenderActivationFunctionGenerator(nex);
	}

	start(dv) {
		this.installed = () => {
			this.settleAll(null);
			if (this.installed) {
				this.nex.addOnNextRenderCallback(this.installed, true /* quietly */);
			}
		};
		this.nex.addOnNextRenderCallback(this.installed);
	}

	stop() {
		if (this.installed) {
			this.nex.removeOnNextRenderCallback(this.installed);
			this.installed = null;
		}
	}

	getAFGName() {
		return 'every-render';
	}
}

class CallbackActivationFunctionGenerator extends ActivationFunctionGenerator {
	constructor(closure) {
		super();
		this.closure = closure;
	}

	start(dv) {
		// no op, the dv has to be manually resolved.
	}

	getAFGName() {
		return 'callback';
	}
}


class ClickActivationFunctionGenerator extends ContentsActivationFunctionGenerator {
	makeForNex(nex) {
		return new ClickActivationFunctionGenerator(nex);
	}

	start(dv) {
		this.installed = (x, y) => {
			let org = convertJSMapToOrg({'x':x, 'y':y});
			this.settleAll(org);
		};
		this.nex.addClickHandler(this.installed);
	}

	stop() {
		if (this.installed) {
			this.nex.removeClickHandler(this.installed);
			this.installed = null;
		}
	}

	getAFGName() {
		return 'click';
	}
}

class MidiActivationFunctionGenerator extends ActivationFunctionGenerator {
	constructor(id) {
		super();
		this.id = id;
		this.installed = null;
	}

	start(dv) {
		this.installed = (midinote) => this.settleAll(midinote);
		addMidiListener(this.id, this.installed);
	}

	stop() {
		if (this.installed) {
			removeMidiListener(this.id, this.installed);
			this.installed = null;
		}
	}

	getAFGName() {
		return 'midi';
	}
}

class EveryActivationFunctionGenerator extends ActivationFunctionGenerator {
	// onTick makes the value each tick settles with
	// (comment by Claude)
	constructor(intervalMs, onTick) {
		super();
		this.intervalMs = intervalMs;
		this.onTick = onTick;
		this.timer = null;
	}

	start(dv) {
		// Corrected against a running total, not against the last wake up,
		// so lateness does not accumulate. More than a whole interval
		// missed means the skipped ones are dropped rather than fired in a
		// burst.
		// The first one happens now, not an interval from now.
		// (comment by Claude)
		let expected = performance.now();
		let tick = function() {
			this.settleAll(this.onTick());
			let now = performance.now();
			expected += this.intervalMs;
			if (expected < now) {
				expected += Math.ceil((now - expected) / this.intervalMs) * this.intervalMs;
			}
			this.timer = VODKA_SCHEDULER.setTimeout(tick, expected - now);
		}.bind(this);
		this.timer = VODKA_SCHEDULER.setTimeout(tick, 0);
	}

	stop() {
		if (this.timer) {
			window.clearTimeout(this.timer);
			this.timer = null;
		}
	}

	getAFGName() {
		return 'every';
	}
}

/*
The first click finishes it, with the same x and y the repeating one settles
with. wait-for-click; do-every-click is the one above.
(comment by Claude)
*/
class ClickOnceActivationFunctionGenerator extends ClickActivationFunctionGenerator {
	makeForNex(nex) {
		return new ClickOnceActivationFunctionGenerator(nex);
	}

	start(dv) {
		this.installed = (x, y) => {
			let org = convertJSMapToOrg({'x':x, 'y':y});
			this.finishAll(org);
		};
		this.nex.addClickHandler(this.installed);
	}

	getAFGName() {
		return 'click-once';
	}
}

class OnContentsChangedActivationFunctionGenerator extends ContentsActivationFunctionGenerator {
	makeForNex(nex) {
		return new OnContentsChangedActivationFunctionGenerator(nex);
	}

	start(dv) {
		this.installed = () => this.settleAll();
		this.nex.addOnContentsChangedCallback(this.installed);
	}

	stop() {
		if (this.installed) {
			this.nex.removeOnContentsChangedCallback(this.installed);
			this.installed = null;
		}
	}

	getAFGName() {
		return 'on-contents-changed';
	}
}

// the first change finishes it: wait-for-contents-change
// (comment by Claude)
class OnContentsChangedOnceActivationFunctionGenerator extends OnContentsChangedActivationFunctionGenerator {
	makeForNex(nex) {
		return new OnContentsChangedOnceActivationFunctionGenerator(nex);
	}

	start(dv) {
		this.installed = () => this.finishAll();
		this.nex.addOnContentsChangedCallback(this.installed);
	}

	getAFGName() {
		return 'on-contents-changed-once';
	}
}


export {
	ActivationFunctionGenerator,
	ContentsActivationFunctionGenerator,
	ImmediateActivationFunctionGenerator,
	DelayActivationFunctionGenerator,
	EveryActivationFunctionGenerator,
	ClickActivationFunctionGenerator,
	ClickOnceActivationFunctionGenerator,
	GenericActivationFunctionGenerator,
	MidiActivationFunctionGenerator,
	DeferredCommandActivationFunctionGenerator,
	OnContentsChangedActivationFunctionGenerator,
	OnContentsChangedOnceActivationFunctionGenerator,
	OnEveryRenderActivationFunctionGenerator,
	CallbackActivationFunctionGenerator,
	OnNextRenderActivationFunctionGenerator
}
