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

let FF_GEN = 0;

import * as Utils from '../utils.js'

import { RENDER_FLAG_SHALLOW, RENDER_FLAG_EXPLODED } from '../globalconstants.js'
import { eventQueueDispatcher } from '../eventqueuedispatcher.js'
import { gc } from '../gc.js'
import { ContextType } from '../contexttype.js'
import { evaluateNexSafely } from '../evaluator.js'
import { getParameterInfo } from '../argevaluator.js'

import { EError } from './eerror.js'
import { NexContainer } from './nexcontainer.js'

import { Command } from './command.js'
import { otherflags } from '../globalappflags.js'
import { experiments } from '../globalappflags.js'
import { Editor } from '../editors.js'


function incFFGen() {
	FF_GEN++;
}


/**
 * Helper class that introduces a level of indirection between
 * an asynchronous process that will be completed sometime in the future
 * and a set of expectations that is waiting for it to complete.
 * Useful for the situation where an expectation is copied while 
 * waiting for fulfillment: all the copies will be simultaneously
 * fulfilled via this class.
 */
class CallbackRouter {
	constructor() {
		this.waitingExpectations = [];
	}

	addExpecting(exp) {
		this.waitingExpectations.push(exp);
	}

	fulfill(result) {
		for (let i = 0; i < this.waitingExpectations.length; i++) {
			this.waitingExpectations[i].fulfill(result);
		}
	}
}

/**
 * Represents an asynchronous process of some kind, usually changing
 * a value into some other value.
 */
class Expectation extends NexContainer {

	constructor() {
		super()
		this.hasBeenSet = false;
		this.setFulfilled(false);
		this.activated = false;
		this.ffClosure = null;

		this.activating = false;
		this.startedTryingToFulfill = false;
		this.autoreset = false;

		this.ffExecutionEnvironment = null;
		this.pendingCallbacks = [];
		this.callbackRouter = null;
		this.ffClosure = null;
		this.ffExecutionEnvironment = null;
		this.activationFunction = null; // this starts the async process, whatever it is
		this.virtualChildren = [];

		// NEW_EXPECTATION_SYNTAX
		this.exptext = '';

		// private data is currently unused but I want the logic for
		// handling it here so I can implement parsing and tests for it
		this.privateData = '';

		gc.register(this);
	}

	evaluate(executionEnv) {
		// we copy empty, dumb expectations because they are all equivalent anyway,
		// and it means I can use them in code

		if (experiments.NEW_EXPECTATION_SYNTAX) {
			this.ffWithFromBindingName(executionEnv);
		}

		// TODO() -- implement final/immutable syntax etc.
		if (!this.isActivated()
				&& !this.isFulfilled()
				&& !this.isSet()
				&& !this.hasFFF()
				&& this.numChildren() == 0) {
			return this.makeCopy();
		} else {
			return this;
		}
	}

	isInFlight() {
		return this.activated && !this.fulfilled;
	}

	isActivated() {
		return this.activated;
	}

	isFulfilled() {
		return this.fulfilled;
	}

	setFulfilled(val) {
		this.fulfilled = val;
	}

	isSet() {
		return this.hasBeenSet;
	}

	hasFFF() {
		return !!this.ffClosure;
	}

	getFFClosure() {
		return this.ffClosure;
	}

	reset() {
		if (otherflags.DEBUG_EXPECTATIONS) {
			console.log('resetting ' + this.debugString());
		}
		this.setFulfilled(false);
		this.activated = false;
		this.startedTryingToFulfill = false;
	}

	addPendingCallback(pendingCallback) {
		if (this.isFulfilled()) {
			pendingCallback();
		} else {
			this.pendingCallbacks.push(pendingCallback);
		}
	}

	notifyPending() {
		for (let i = 0; i < this.pendingCallbacks.length; i++) {
			let pendingCallback = this.pendingCallbacks[i];
			pendingCallback();
		}
		this.pendingCallbacks = [];
	}

	cancel() {
		this.ffgen--;
	}

	getCallbackForSet() {
		return (function(result) {
			eventQueueDispatcher.enqueueExpectationFulfill(this.callbackRouter, result);
		}).bind(this);
	}

	set(activationFunctionGenerator, autoreset) {
		if (this.isFulfilled()) {
			throw new EError('Expectation: cannot set the expectation, has already been fulfilled');			
		}
		if (this.activated) {
			throw new EError('Expectation: cannot set the expectation, has already been activated');
		}
		this.hasBeenSet = true;
		this.autoreset = !!autoreset;
		this.ffgen = FF_GEN;
		this.callbackRouter = new CallbackRouter();
		this.callbackRouter.addExpecting(this);
		this.activationFunctionGenerator = activationFunctionGenerator;
		this.activationFunction = activationFunctionGenerator(this.getCallbackForSet(), this);
	}

	ffWithFromBindingName(executionEnvironment) {
		let nameOfBinding = this.getExptextFfname();
		if (nameOfBinding) {
			let b = executionEnvironment.lookupBinding(nameOfBinding);
			if (b && b.getTypeName() == '-closure-') {
				this.ffWith(b, executionEnvironment);
			}
		}
	}

	// this method is called by the ffwith builtin to designate an "ff-with"
	// function, i.e. a callback to call after this is fulfilled
	ffWith(closure, executionEnvironment) {
		// I was going to call ffwith directly if ff-with was called on an already-fulfilled
		// expectation, similar to what happens with promises,
		// but the problem with that is that the pending expectations
		// have already been notified so it's really too late -- too many weird possibilities
		// for order of fulfillment changing or race conditions.
		if (this.isFulfilled()) {
			throw new EError('Expectation: cannot call ff-with on the expectation, has already been fulfilled');			
		}
		if (this.activated) {
			throw new EError('Expectation: cannot call ff-with on the expectation, has already been activated');
		}
		if (this.startedTryingToFulfill) {
			throw new EError('Expectation: cannot call ff-with on the expectation, it currently fulfilling');
		}
		this.ffClosure = closure;
		this.ffExecutionEnvironment = executionEnvironment;
	}

	notifyAfterFulfill() {
		// We only notify after we fulfill AND after calling ffClosure.
		this.notifyPending();

		//eventQueueDispatcher.enqueueTopLevelRender();
		this.setDirtyForRendering(true);
		eventQueueDispatcher.enqueueRenderOnlyDirty()
	}

	testForReactivationAfterFFClosure() {
		if (this.autoreset) {
			this.reset();
			this.activate();
		} else if (this.isFulfilled()) {
			if (otherflags.DEBUG_EXPECTATIONS) {
				console.log('after running fff, still fulfilled, notifying pending, for ' + this.debugString());
			}
			this.notifyAfterFulfill();
		} else if (!this.isActivated()) {
			if (otherflags.DEBUG_EXPECTATIONS) {
				console.log('calling fff reactivated this exp, for ' + this.debugString());
			}
			// ffClosure may have reactivated this expectation.
			this.activate();
		} else {
			// how did we get here?
			throw new Error("In weird state after fulfill, neither fulfilled nor reset");
		}
	}

	callFFClosureOnAllChildren() {
		if (experiments.NEW_EXPECTATION_SYNTAX) {

			// instead of separately calling ffwith on each child (weird)
			// I call ffwith on all of them
			// maybe there's a way to specify one or the other way

			let info = getParameterInfo(this.ffClosure.lambda.paramsArray);
			let args = [];
			let foundExp = false;
			for (let i = 0; i < this.numChildren() && i < info.maxArgCount; i++) {
				let c = this.getChildAt(i);
				if (c.getTypeName() == '-expectation-') {
					// what do if > 1 children?
					if (c.numChildren() > 0) {
						args.push(c.getChildAt(0));
					}
				} else {
					args.push(this.getChildAt(i));
				}
			}
			let cmd = Command.makeCommandWithClosure(this.ffClosure, args);
			let result = evaluateNexSafely(cmd, this.ffExecutionEnvironment);
			this.removeAllChildren();
			this.appendChild(result);
			this.doOrWaitToDo(function() {
				this.testForReactivationAfterFFClosure();
			}.bind(this));		
		} else {

			// just call it on all children first.
			for (let i = 0; i < this.numChildren(); i++) {
				if (otherflags.DEBUG_EXPECTATIONS) {
					console.log(`calling fff on child ${i} for ` + this.debugString());
				}
				let child = this.getChildAt(i);
				let cmd = Command.makeCommandWithClosure(this.ffClosure, child);
				let result = evaluateNexSafely(cmd, this.ffExecutionEnvironment);
				if (result.getID() != child.getID()) {
					this.replaceChildAt(result, i);
				}
			}
			if (this.numChildren() == 0) {
				if (otherflags.DEBUG_EXPECTATIONS) {
					console.log('tried to evaluate fff on children, but there were no children, for ' + this.debugString());
				}
			}
			if (otherflags.DEBUG_EXPECTATIONS) {
				console.log('finished calling fff, need to see if child exps were returned, for ' + this.debugString());
			}
			// ffClosure could have returned expectations, so we wait again.
			this.doOrWaitToDo(function() {
				this.testForReactivationAfterFFClosure();
			}.bind(this));		
		}
	}

	completeFulfill() {
		// At this point we are officially fulfilled.
		// however, the ffClosure can undo this.
		this.setFulfilled(true);
		if (otherflags.DEBUG_EXPECTATIONS) {
			console.log('completing fulfill for ' + this.debugString());
		}
		if (this.ffClosure) {
			if (otherflags.DEBUG_EXPECTATIONS) {
				console.log('fff present, evaluating it, for ' + this.debugString());
			}
			this.callFFClosureOnAllChildren();
		} else {
			if (otherflags.DEBUG_EXPECTATIONS) {
				console.log('no fff present, notifying pending exps, for ' + this.debugString());
			}
			this.notifyAfterFulfill();
		}		
	}

	fulfill(result) {
		if (otherflags.DEBUG_EXPECTATIONS) {
			console.log('fulfill called for ' + this.debugString());
		}
		if (this.isFulfilled()) {
			throw new Error("expectation fulfilled again somehow: " + this.debugString());
		}
		if (this.ffgen < FF_GEN) {
			// fulfillment was cancelled so we don't do ANYTHING including
			// setting any state indicating that it's been fullfilled (because it hasn't)
			// we don't call the callbacks either.
			if (otherflags.DEBUG_EXPECTATIONS) {
				console.log('fulfill was cancelled, so no-op, for ' + this.debugString());
			}
			return;
		}
		// some builtin-based expectations can have a result supplied by
		// "external forces" 
		if (result) {
			if (otherflags.DEBUG_EXPECTATIONS) {
				console.log('new child provided to fulfill for ' + this.debugString());
			}
			this.replaceChildAt(result, 0);
		}
		// it's possible that unfulfilled exps could have
		// been added while async operation was in process,
		// so we wait for children to be fulfilled again.
		this.doOrWaitToDo(function() {
			this.completeFulfill();
		}.bind(this));
	}


	completeActivation() {
		this.activated = true;
		this.activating = false;
		// render because activated exps look different
		//eventQueueDispatcher.enqueueTopLevelRender();
		this.setDirtyForRendering(true);
		eventQueueDispatcher.enqueueRenderOnlyDirty()
		if (this.activationFunction != null) {
			// this means the expectation has been set. We call the asynchronous method
			// and when the callback happens, we will fulfill.
			if (otherflags.DEBUG_EXPECTATIONS) {
				console.log('completing activation and beginning async process for ' + this.debugString());
			}
			this.activationFunction(this);
		} else {
			// this means the exp was not set. We just fulfill immediately.
			if (otherflags.DEBUG_EXPECTATIONS) {
				console.log('completing activation and commencing immediate fulfill for ' + this.debugString());
			}
			this.fulfill();
		}
	}

	// actClosure can be used to implement rx-like conditional activation
	// of children, i.e. instead of requring all to be fulfilled before
	// fulfilling parent, and running them in parallel, ffact could run them
	// in sequence, and stop when the first one succeeds. It would be
	// a lambda that takes a first param that is a callback which,
	// when executed, tells this to continue activating, basically.

	activate() {
		if (this.activated || this.activating) {
			return;
		}
		this.activating = true;
		if (otherflags.DEBUG_EXPECTATIONS) {
			console.log('beginning activation for ' + this.debugString());
		}

		// in the future this will actually do this:
		// if (actClosure) {
		// 	call into the actClosure
		// } else {
		//	doOrWaitToDo completeActivation
		// }
		this.doOrWaitToDo(function() {
			this.completeActivation();
		}.bind(this));
	}

	/// ------------------ waiting for children to fulfill


	// The 5 helpers below encapsulate the algorithm of:
	// You want to do something, but you don't want to do it
	// until all the current children of this expectation
	// are fulfilled. Note that if there are no children,
	// or if none of them are expectations, todo is done
	// immediately.

	doOrWaitToDo(todo) {
		let childrenFinished = [];
		let waiting = false;
		for (let i = 0; i < this.numChildren(); i++) {
			let c = this.getChildAt(i);
			if (this.maybeWaitBeforeDoing(todo, c, childrenFinished, i)) {
				waiting = true;
			}
		}
		if (!waiting) {
			if (otherflags.DEBUG_EXPECTATIONS) {
				console.log('tested children, all are non-exp or fulfilled, for ' + this.debugString());
			}
			todo();
		}
	}


	// returns true if we had to wait
	maybeWaitBeforeDoing(todo, exp, childrenFinished, i) {
		if (this.isUnactivatedExpectation(exp)) {
			if (otherflags.DEBUG_EXPECTATIONS) {
				console.log('when testing child exps, found one that was unactivated, for ' + this.debugString());
			}
			exp.activate();
		}
		if (this.isUnfulfilledExpectation(exp)) {
			if (otherflags.DEBUG_EXPECTATIONS) {
				console.log('when testing child exps, found one that was unfulfilled, for ' + this.debugString());
			}
			childrenFinished[i] = false;
			exp.addPendingCallback(function() {
				this.doIfLastFulfilled(todo, childrenFinished, i);
			}.bind(this))
			return true;
		} else {
			childrenFinished[i] = true;
			return false;
		}
	}

	doIfLastFulfilled(todo, childrenFinished, childPosition) {
		childrenFinished[childPosition] = true;
		for (let i = 0; i < childrenFinished.length; i++) {
			if (!childrenFinished[i]) return;
		}
		todo();
	}

	isUnactivatedExpectation(nex) {
		return nex.getTypeName() == '-expectation-' && !nex.isActivated()
	}

	isUnfulfilledExpectation(nex) {
		return nex.getTypeName() == '-expectation-' && !nex.isFulfilled()
	}

	/// ------------------ end new methods



	// standard nex stuff below

	toString(version) {
		if (version == 'v2') {
			return this.toStringV2();
		}
		return `*(${super.childrenToString()}*)`;
	}

	toStringV2() {
		return `*${this.toStringV2Literal()}${this.toStringV2PrivateDataSection()}${this.listStartV2()}${this.toStringV2TagList()}${super.childrenToString('v2')}${this.listEndV2()}`;
	}

	prettyPrintInternal(lvl, hdir) {
		return this.standardListPrettyPrint(lvl, '*', hdir);
	}

	deserializePrivateData(data) {
		this.privateData = data;
	}

	serializePrivateData() {
		return this.privateData;
	}

	getTypeName() {
		return '-expectation-';
	}

	makeCopy(shallow) {
		let r = new Expectation();
		this.copyChildrenTo(r, shallow);
		this.copyFieldsTo(r);
		return r;
	}

	copyFieldsTo(nex) {
		super.copyFieldsTo(nex);
		if (this.activating || this.isInFlight()) {
			// if we try to copy a exp in this state we just put it in a bare exp
			// that has no set and no fff. We don't want to lose the children.
			return;
		}
		if (this.ffClosure) {
			nex.ffClosure = this.ffClosure;		
		}
		if (this.ffExecutionEnvironment) {
			nex.ffExecutionEnvironment = this.ffExecutionEnvironment;
		}
		if (this.callbackRouter) {
			nex.callbackRouter = this.callbackRouter;
			nex.callbackRouter.addExpecting(nex);
		}
		if (this.hasBeenSet) {
			// generate a new activation function for my new baby expectation.
			nex.set(this.activationFunctionGenerator);
		}
		// when copying a fulfilled expectation, we keep it fulfilled.
		// it might be reset after being copied.
		nex.setFulfilled(this.isFulfilled());
		// we have checks to make sure you can't copy
		// an exp while it's in flight, as a result
		// we can copy all the flags.
		nex.activated = this.activated;
		nex.autoreset = this.autoreset;
		nex.exptext = this.exptext;
	}

	getContextType() {
		return ContextType.COMMAND;
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
		domNode.classList.add('expectation');
		if (!(renderFlags & RENDER_FLAG_SHALLOW)) {
			if (renderFlags & RENDER_FLAG_EXPLODED) {
				dotspan.classList.add('exploded');
			} else {
				dotspan.classList.remove('exploded');
			}
			if (experiments.NEW_EXPECTATION_SYNTAX) {
				if (this.isEditing) {
					dotspan.classList.add('editing');
				} else {
					dotspan.classList.remove('editing');
				}
				if (this.isFulfilled()) {
					dotspan.innerText = '(' + this.exptext + ')';
				} else if (this.isActivated()) {
					dotspan.innerText = '...' + this.exptext + '...';
				} else {
					dotspan.innerText = this.exptext;
				}
			} else {
				this.unsetDotSpanPaddingClasses(dotspan);
				this.setDotSpanPaddingClass(dotspan);
				this.unsetDotSpanParentPaddingClasses(domNode);
				this.setDotSpanParentPaddingClass(domNode);
				dotspan.innerHTML = this.getDotSpanHTML();
			}
		}
	}

	setDotSpanPaddingClass(dotspan) {
		let s = 'dsstate';
		if (this.isSet()) {
			s += '-set';
		}
		if (this.hasFFF()) {
			s += '-fff';
		}
		if (this.isActivated()) {
			s += '-activated';
		}
		if (this.isFulfilled()) {
			s += '-fulfilled';
		}
		dotspan.classList.add(s);
	}

	setDotSpanParentPaddingClass(dotspanParent) {
		let s = 'parentdsstate';
		if (this.isSet()) {
			s += '-set';
		}
		if (this.hasFFF()) {
			s += '-fff';
		}
		if (this.isActivated()) {
			s += '-activated';
		}
		if (this.isFulfilled()) {
			s += '-fulfilled';
		}
		dotspanParent.classList.add(s);
	}

	getDotSpanHTML() {
		let s = '';
		if (this.isSet()) {
			s += '.';
		}
		if (this.hasFFF()) {
			s += ',';
		}
		if (this.isActivated()) {
			s += '&bull;';
		}
		if (this.isFulfilled()) {
			s += '*';
		}
		return s;
	}

	unsetDotSpanPaddingClasses(dotspan) {
		dotspan.classList.remove('dsstate');
		dotspan.classList.remove('dsstate-set');
		dotspan.classList.remove('dsstate-set-fff');
		dotspan.classList.remove('dsstate-set-fff-activated');
		dotspan.classList.remove('dsstate-set-fff-activated-fulfilled');
		dotspan.classList.remove('dsstate-fff');
		dotspan.classList.remove('dsstate-set-activated');
		dotspan.classList.remove('dsstate-set-activated-fulfilled');
		dotspan.classList.remove('dsstate-fff-activated-fulfilled');
		dotspan.classList.remove('dsstate-activated-fulfilled');
	}

	unsetDotSpanParentPaddingClasses(dotspanParent) {
		dotspanParent.classList.remove('parentdsstate');
		dotspanParent.classList.remove('parentdsstate-set');
		dotspanParent.classList.remove('parentdsstate-set-fff');
		dotspanParent.classList.remove('parentdsstate-set-fff-activated');
		dotspanParent.classList.remove('parentdsstate-set-fff-activated-fulfilled');
		dotspanParent.classList.remove('parentdsstate-fff');
		dotspanParent.classList.remove('parentdsstate-set-activated');
		dotspanParent.classList.remove('parentdsstate-set-activated-fulfilled');
		dotspanParent.classList.remove('parentdsstate-fff-activated-fulfilled');
		dotspanParent.classList.remove('parentdsstate-activated-fulfilled');
	}

	callDeleteHandler() {
		this.cancel();
	}

	isEmpty() {
		return true;
	}

	getKeyFunnel() {
		return new ExpectationKeyFunnel(this);
	}

	deleteLastLetter() {}

	appendText(txt) {}

	getDefaultHandler() {
		return 'expectationDefault';
	}

	getEventTable(context) {
		// most of these have no tests?
		return {
			'Enter': (experiments.NEW_EXPECTATION_SYNTAX ? 'activate-or-return-exp-child' : 'return-exp-child' ),
			// special stuff for expectations that gets rid of the js timeout
			'Backspace': 
				(experiments.NEW_EXPECTATION_SYNTAX ?
					'start-main-editor' :
					'call-delete-handler-then-remove-selected-and-select-previous-sibling'),
			'ShiftBackspace': 'call-delete-handler-then-remove-selected-and-select-previous-sibling',
		}
	}

	deleteLastExptextLetter() {
		this.exptext = this.exptext.substr(0, this.exptext.length - 1);
		this.setBuiltinAsyncType(this.getExptextSetname());
	}

	appendExptext(t) {
		this.exptext = this.exptext + t;
		this.setBuiltinAsyncType(this.getExptextSetname());
	}

	getExptextSetname() {
		if (this.exptext.indexOf(',') > 0) {
			let a = this.exptext.split(',');
			return a[0];
		} else {
			return this.exptext;
		}
	}

	getExptextFfname() {
		if (this.exptext.indexOf(',') > 0) {
			let a = this.exptext.split(',');
			return a[1];
		} else {
			return null;
		}
	}

	getExptext() {
		return this.exptext;
	}

	setExptextSetname(setname) {
		// do not do lookup as this is called only by the builtins
		if (this.exptext.indexOf(',') > 0) {
			let a = this.exptext.split(',');
			this.exptext = setname + ',' + a[1];
		} else {
			this.exptext = setname;
		}
	}

	// supported types:
	// click, delay, set-contents-changed, immediate
	// 'and' is a synonym for immediate (because 'and' is the default behavior)
	// these types can be set directly by changing the exptext
	// not all types can be set that way
	setBuiltinAsyncType(type) {

		let delayAFG = function(callback) {
					return function(exp) {
						let timeout = 1000; // default timeout 1 second
						let n = exp.numChildren();
						// if last child is an integer, use that for timeout instead
						if (n > 0) {
							let c1 = exp.getChildAt(exp.numChildren() - 1);
							if (c1.getTypeName() == '-integer-') {
								timeout = c1.getTypedValue();
							}
						}
						setTimeout(function() {
							callback(null /* do not set a value, the default is whatever the child is of the exp */);
						}, timeout)							
					}
				};

		switch(type) {
			case 'and':
			case 'immediate':
				this.set(function(callback) {
					return function() {
						callback(null);
					}
				});
				break;
			case 'repeat':
				this.set(delayAFG, true);
				break;
			case 'delay':
				this.set(delayAFG, false);
				break;
			case 'click':
				this.set(function(callback, ex) {
					return function() {
						ex.getChildAt(0).extraClickHandler = function() {
							callback();
						}
					}
				});
				break;
			case 'set-contents-changed':
				this.set(function(callback) {
					return function(exp) {
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
				});
				break;
		}
	}


}

// NEW_EXPECTATION_SYNTAX
class ExpectationEditor extends Editor {

	constructor(nex) {
		super(nex, 'ExpectationEditor');
	}

	finish() {
		super.finish();
	}

	doBackspaceEdit() {
		this.nex.deleteLastExptextLetter();
	}

	doAppendEdit(text) {
		this.nex.appendExptext(text);
	}

	hasContent() {
		return this.nex.getExptext() != '';
	}

	shouldAppend(text) {
		if (/^[a-zA-Z0-9:,-]$/.test(text)) return true; // normal chars
		return false;
	}

	shouldTerminateAndReroute(input) {
		if (super.shouldTerminateAndReroute()) return true;

		if (/^[a-zA-Z0-9:,-]$/.test(input)) return false;

		// anything else, pop out
		return true;
	}
}

export { Expectation, ExpectationEditor, incFFGen }

