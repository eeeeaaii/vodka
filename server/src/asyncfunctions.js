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

class ActivationFunctionGenerator {

	constructor() {
	}

	getFunction(cb, exp) {}

	getName() {}
}

class DeferredCommandActivationFunctionGenerator extends ActivationFunctionGenerator {
	constructor(deferredCommand, env) {
		super();
		this.deferredCommand = deferredCommand;
		this.env = env;
	}

	getFunction(callback, repeatCallback, exp) {
		return function() {
			this.deferredCommand.activate(this.env);
		}.bind(this);
	}

	getName() {
		return 'deferredcommand';
	}
}


class GenericActivationFunctionGenerator extends ActivationFunctionGenerator {
	constructor(name, asyncFunction) {
		super();
		this.name = name;
		this.asyncFunction = asyncFunction;
	}

	getFunction(callback, repeatCallback, exp) {
		return function() {
			this.asyncFunction(callback, exp);
		}.bind(this);
	}

	getName() {
		return this.name;
	}
}


class ImmediateActivationFunctionGenerator extends ActivationFunctionGenerator {
	getFunction(callback, repeatCallback, exp) {
		return function() {
			callback(null);
		}
	}

	getName() {
		return 'nothing';
	}
}

class DelayActivationFunctionGenerator extends ActivationFunctionGenerator {
	constructor(timeout) {
		super();
		this.timeout = timeout;
	}

	getFunction(callback, repeatCallback, exp) {
		return function() {
			setTimeout(function() {
				callback(null /* do not set a value, the default is whatever the child is of the exp */);
			}, this.timeout)
		}.bind(this);
	}

	getName() {
		return 'delay';
	}
}

class CallbackActivationFunctionGenerator extends ActivationFunctionGenerator {
	constructor(closure) {
		super();
		this.closure = closure;
	}

	getFunction(callback, repeatCallback, exp) {
		return function() {
			// no op, the dv has to be manually resolved.
		}.bind(this);
	}

	getName() {
		return 'callback';
	}
}


class ClickActivationFunctionGenerator extends ActivationFunctionGenerator {
	constructor(nex) {
		super();
		this.nex = nex;
	}

	getFunction(callback, repeatCallback, exp) {
		return function() {
			this.nex.extraClickHandler = function(x, y) {
				let org = convertJSMapToOrg({'x':x, 'y':y});
				repeatCallback(org);
			}
		}.bind(this);
	}

	getName() {
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

	getFunction(callback, repeatCallback, exp) {
		this.expListeners.push(repeatCallback);
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

	getName() {
		return 'midi';
	}
}

class OnContentsChangedActivationFunctionGenerator extends ActivationFunctionGenerator {
	constructor(nex) {
		super();
		this.nex = nex;
	}

	getFunction(callback, repeatCallback, exp) {
		return function() {
			this.nex.onContentsChangedCallback = function() {
				repeatCallback();
			}
		}.bind(this);
	}

	getName() {
		return 'on-contents-changed';
	}
}

export {
	ImmediateActivationFunctionGenerator,
	DelayActivationFunctionGenerator,
	ClickActivationFunctionGenerator,
	GenericActivationFunctionGenerator,
	MidiActivationFunctionGenerator,
	DeferredCommandActivationFunctionGenerator,
	OnContentsChangedActivationFunctionGenerator,
	CallbackActivationFunctionGenerator
}

