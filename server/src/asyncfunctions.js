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

import { addMidiListener } from './midifunctions.js'
import { convertJSMapToOrg } from './nex/org.js'
import { VODKA_SCHEDULER } from './testutils/virtualclock.js'

class ActivationFunctionGenerator {

	constructor() {
	}

	getFunction(cb, exp) {}

	getAFGName() {}
}

class DeferredCommandActivationFunctionGenerator extends ActivationFunctionGenerator {
	constructor(deferredCommand, env) {
		super();
		this.deferredCommand = deferredCommand;
		this.env = env;
	}

	getFunction(finishCallback, settleCallback, exp) {
		return function() {
			// TODO(#292): the only activation that can complete before it
			// returns, so it's the only one that has to report back whether it
			// did. Everything else finishes via the event queue, long after
			// activate() is done.
			return this.deferredCommand.activate(this.env);
		}.bind(this);
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

	getFunction(finishCallback, settleCallback, exp) {
		return function() {
			this.asyncFunction(finishCallback, exp);
		}.bind(this);
	}

	getAFGName() {
		return this.name;
	}
}


class ImmediateActivationFunctionGenerator extends ActivationFunctionGenerator {
	getFunction(finishCallback, settleCallback, exp) {
		return function() {
			finishCallback(null);
		}
	}

	getAFGName() {
		return 'nothing';
	}
}

class DelayActivationFunctionGenerator extends ActivationFunctionGenerator {
	constructor(timeout) {
		super();
		this.timeout = timeout;
	}

	getFunction(finishCallback, settleCallback, exp) {
		return function() {
			VODKA_SCHEDULER.setTimeout(function() {
				finishCallback(null /* do not set a value, the default is whatever the child is of the exp */);
			}, this.timeout)
		}.bind(this);
	}

	getAFGName() {
		return 'delay';
	}
}

class OnNextRenderActivationFunctionGenerator extends ActivationFunctionGenerator {
	constructor(nex) {
		super();
		this.nex = nex;
	}

	getFunction(finishCallback, settleCallback, exp) {
		return function() {
			this.nex.setOnNextRenderCallback(function() {
				finishCallback(this.nex);
			}.bind(this));
		}.bind(this);
	}

	getAFGName() {
		return 'delay';
	}
}

class CallbackActivationFunctionGenerator extends ActivationFunctionGenerator {
	constructor(closure) {
		super();
		this.closure = closure;
	}

	getFunction(finishCallback, settleCallback, exp) {
		return function() {
			// no op, the dv has to be manually resolved.
		}.bind(this);
	}

	getAFGName() {
		return 'callback';
	}
}


class ClickActivationFunctionGenerator extends ActivationFunctionGenerator {
	constructor(nex) {
		super();
		this.nex = nex;
	}

	getFunction(finishCallback, settleCallback, exp) {
		return function() {
			this.nex.extraClickHandler = function(x, y) {
				let org = convertJSMapToOrg({'x':x, 'y':y});
				settleCallback(org);
			}
		}.bind(this);
	}

	getAFGName() {
		return 'click';
	}
}

class MidiActivationFunctionGenerator extends ActivationFunctionGenerator {
	constructor(id) {
		super();
		this.id = id;
		this.listening = false;
		this.expListeners = [];
	}

	getFunction(finishCallback, settleCallback, exp) {
		this.expListeners.push(settleCallback);
		return function() {
			if (!this.listening) {
				this.listening = true;
				addMidiListener(this.id, function(midinote) {
					for (let i = 0; i < this.expListeners.length; i++) {
						this.expListeners[i](midinote);
					}
				}.bind(this));
			}
		}.bind(this);
	}

	getAFGName() {
		return 'midi';
	}
}

class EveryActivationFunctionGenerator extends ActivationFunctionGenerator {
	constructor(intervalMs, onTick) {
		super();
		this.intervalMs = intervalMs;
		this.onTick = onTick;
		this.timer = null;
	}

	getFunction(finishCallback, settleCallback, exp) {
		return function() {
			// Corrected against a running total, not against the last wake up,
			// so lateness does not accumulate. More than a whole interval
			// missed means the skipped ones are dropped rather than fired in a
			// burst.
			let expected = performance.now() + this.intervalMs;
			let tick = function() {
				settleCallback(this.onTick());
				let now = performance.now();
				expected += this.intervalMs;
				if (expected < now) {
					expected += Math.ceil((now - expected) / this.intervalMs) * this.intervalMs;
				}
				this.timer = VODKA_SCHEDULER.setTimeout(tick, expected - now);
			}.bind(this);
			this.timer = VODKA_SCHEDULER.setTimeout(tick, this.intervalMs);
		}.bind(this);
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

class OnContentsChangedActivationFunctionGenerator extends ActivationFunctionGenerator {
	constructor(nex) {
		super();
		this.nex = nex;
	}

	getFunction(finishCallback, settleCallback, exp) {
		return function() {
			this.nex.onContentsChangedCallback = function() {
				settleCallback();
			}
		}.bind(this);
	}

	getAFGName() {
		return 'on-contents-changed';
	}
}


export {
	ImmediateActivationFunctionGenerator,
	DelayActivationFunctionGenerator,
	EveryActivationFunctionGenerator,
	ClickActivationFunctionGenerator,
	GenericActivationFunctionGenerator,
	MidiActivationFunctionGenerator,
	DeferredCommandActivationFunctionGenerator,
	OnContentsChangedActivationFunctionGenerator,
	CallbackActivationFunctionGenerator,
	OnNextRenderActivationFunctionGenerator
}

