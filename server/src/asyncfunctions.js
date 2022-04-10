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

import { addMidiListener } from '../midifunctions.js'

class ActivationFunctionGenerator {

	// the callback is a function in the expectation that will be called after the async operation completes

	constructor() {
	}

	getFunction(cb, exp) {}

	getName() {}
}

class GenericActivationFunctionGenerator extends ActivationFunctionGenerator {
	constructor(name, asyncFunction) {
		super();
		this.name = name;
		this.asyncFunction = asyncFunction;
	}

	getFunction(callback, exp) {
		return function() {
			this.asyncFunction(callback, exp);
		}.bind(this);
	}

	getName() {
		return this.name;
	}
}


class ImmediateActivationFunctionGenerator extends ActivationFunctionGenerator {
	getFunction(callback, exp) {
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

	getFunction(callback, exp) {
		return function() {
			setTimeout(function() {
				callback(null /* do not set a value, the default is whatever the child is of the exp */);
			}, this.timeout)
		}
	}

	getName() {
		return 'delay';
	}
}

class ClickActivationFunctionGenerator extends ActivationFunctionGenerator {
	getFunction(callback, exp) {
		return function() {
			exp.getChildAt(0).extraClickHandler = function() {
				callback();
			}
		}		
	}

	getName() {
		return 'click';
	}
}

class ContentsChangedActivationFunctionGenerator extends ActivationFunctionGenerator {
	getFunction(callback, exp) {
		return function() {
			// the expectation will fulfill when its first child's contents
			// change in any way. We ignore 2nd and later children.
			// we fulfill immediately if there are no children, or if the
			// first child is not a container.
			let n = exp.numChildren();
			if (n == 0) {
				callback(null);
			} else {
				let c1 = exp.getChildAt(0);
				if (!Utils.isNexContainer(c1)) {
					callback(null);
				} else {
					c1.setOnContentsChangedCallback(function() {
						callback(null);
					})
				}
			}			
		}
	}

	getName() {
		return 'contents-changed';
	}
}

class MidiActivationFunctionGenerator extends ActivationFunctionGenerator {
	constructor(id) {
		super();
		this.id = id;
		this.listening = false;
		this.expListeners = [];
	}

	getFunction(callback, exp) {
		this.expListeners.push(callback);
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

export {
	ImmediateActivationFunctionGenerator,
	DelayActivationFunctionGenerator,
	ClickActivationFunctionGenerator,
	ContentsChangedActivationFunctionGenerator,
	GenericActivationFunctionGenerator,
	MidiActivationFunctionGenerator
}

