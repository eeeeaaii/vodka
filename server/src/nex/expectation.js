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

function incFFGen() {
	FF_GEN++;
}

import * as Vodka from '../vodka.js'
import * as Utils from '../utils.js'

import { gc } from '../gc.js'
import { ContextType } from '../contexttype.js'
import { evaluateNexSafely } from '../evaluator.js'

import { EError } from './eerror.js'
import { NexContainer } from './nexcontainer.js'

import { Command } from './command.js'


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

class Expectation extends NexContainer {
	//THESE TESTS ARE BROKEN
	//saveload_bool
	//saveload_commands_basic

	//BUT I MISTAKENLY UPDATED THE GOLDEN

	constructor() {
		super()
		this.hasBeenSet = false;
		this.fulfilled = false;
		this.activated = false;
		this.ffClosure = null;
		this.ffExecutionEnvironment = null;
		// we don't reset callbacks when we reset this exp,
		// because if we did that, the code in ffWidth couldn't
		// reset this expectation.
		this.pendingCallbacks = [];
		this.callbackRouter = null;
		this.ffClosure = null;
		this.ffExecutionEnvironment = null;
		this.activationFunction = null; // this starts the async process, whatever it is
		this.virtualChildren = [];
		gc.register(this);
	}

	getFFClosure() {
		return this.ffClosure;
	}

	reset() {
		this.fulfilled = false;
		this.activated = false;
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
			let cb = this.pendingCallbacks[i];
			cb();
		}
		this.pendingCallbacks = [];
	}

	copyFieldsTo(nex) {
		super.copyFieldsTo(nex);
		if (this.ffClosure) {
			nex.ffClosure = this.ffClosure.makeCopy();		
		}
		if (this.ffExecutionEnvironment) {
			nex.ffExecutionEnvironment = this.ffExecutionEnvironment.copy();
		}
		if (this.callbackRouter) {
			nex.callbackRouter = this.callbackRouter;
			nex.callbackRouter.addExpecting(nex);
		}
		if (this.hasBeenSet) {
			// generate a new activation function for my new baby expectation.
			nex.set(this.activationFunctionGenerator);
		}
		// We explicitly DON'T activate when copying
		// because it might mess up the timing.
	}

	ffWith(closure, executionEnvironment) {
		// I was going to call ffwith directly if ff-with was called on an already-fulfilled
		// expectation, similar to what happens with promises,
		// but the problem with that is that the pending expectations
		// have already been notified so it's really too late -- too many weird possibilities
		// for order of fulfillment changing or race conditions.
		if (this.fulfilled) {
			throw new EError('Expectation: cannot call ff-with on the expectation, has already been fulfilled');			
		}
		if (this.activated) {
			throw new EError('Expectation: cannot call ff-with on the expectation, has already been activated');
		}
		this.ffClosure = closure;
		// TODO: think of a bug that is fixed by copying the execution env,
		// or remove the copy.
		this.ffExecutionEnvironment = executionEnvironment.copy();
	}

	ffAll() {
		let allSucceeded = true;
		for (let i = 0; i < this.numChildren(); i++) {
			if (!this.callFFOnChild(i)) {
				allSucceeded = false;
			}
		}
		return allSucceeded;
	}

	callFFOnChild(childIndex) {
		let success = true;
		let result = this.getChildAt(childIndex);
		if (Utils.isFatalError(result)) {
			throw result;
		}
		let cmd = Command.makeCommandWithClosure(this.ffClosure, result);
		let newResult = evaluateNexSafely(cmd, this.ffExecutionEnvironment);
		if (newResult.getTypeName() == '-expectation-' && !newResult.isFulfilled()) {
			newResult.addPendingCallback(function() {
				this.recallFFWith(childIndex);
			}.bind(this))
			success = false;
		}
		this.replaceChildAt(newResult, childIndex);
		return success;
	}

	recallFFWith(forChild) {
		// try again to call FFWith.
		this.callFFOnChild(forChild);
		if (this.shouldMarkFulfilled()) {
			this.fulfilled = true;
			this.notifyPending();
		}
		this.renderOnlyThisNex(null);
	}

	shouldMarkFulfilled() {
		for (let i = 0; i < this.numChildren(); i++) {
			let c = this.getChildAt(i);
			if (!this.childIsFulfilled(c)) {
				return false;
			}
		}
		return true;
	}

	childIsFulfilled(c) {
		if (c.getTypeName() == '-expectation-' && !c.isFulfilled()) return false;
		return true;
	}

	tryToFulfill() {
		let isFulfilled = true;
		for (let i = 0; i < this.numChildren(); i++) {
			let c = this.getChildAt(i);
			if (!this.childIsFulfilled(c)) {
				isFulfilled = false;
				c.addPendingCallback(function() {
					this.tryToFulfill();
				}.bind(this));
			}
		}
		if (isFulfilled) {
			this.fulfilled = true;
			this.notifyPending();
		}
		this.renderOnlyThisNex(null);
	}

	fulfill(result) {
		if (this.ffgen < FF_GEN) {
			// fulfillment was cancelled so we don't do ANYTHING including
			// setting any state indicating that it's been fullfilled (because it hasn't)
			// we don't call the callbacks either.
			return;
		}
		if (result) {
			this.replaceChildAt(result, 0)
		}
		if (this.ffClosure) {
			this.fulfilled = this.ffAll();
		} else {
			// if there is no fff, we still want to wait until all children are 
			// fulfilled before we fulfill.
			if (this.shouldMarkFulfilled()) {
				this.fulfilled = true;
			} else {
				this.tryToFulfill();
			}
		}
		if (this.fulfilled) {
			this.notifyPending();
		}
		this.renderOnlyThisNex(null);
	}

	cancel() {
		this.ffgen--;
	}

	getCallbackForSet() {
		return (function(result) {
			Vodka.eventQueue.enqueueExpectationFulfill(this.callbackRouter, result);
		}).bind(this);
	}

	set(activationFunctionGenerator) {
		if (this.fulfilled) {
			throw new EError('Expectation: cannot set the expectation, has already been fulfilled');			
		}
		if (this.activated) {
			throw new EError('Expectation: cannot set the expectation, has already been activated');
		}
		this.hasBeenSet = true;
		this.ffgen = FF_GEN;
		this.callbackRouter = new CallbackRouter();
		this.callbackRouter.addExpecting(this);
		this.activationFunctionGenerator = activationFunctionGenerator;
		this.activationFunction = activationFunctionGenerator(this.getCallbackForSet(), this);
	}

	// coverage: functions_async_copy_ffwith (for immediately fulfilling when no activation function)
	activate() {
		if (this.activated) {
			return;
		}
		this.activated = true;
		if (this.activationFunction != null) {
			this.activationFunction();
			// I was going to set the activation function to null after activating,
			// but the thing is you might want to copy an exp after it's been
			// activated, and I guess you want the copy to also be activated,
			// so you need to leave the activation function here so you can copy it.
		} else {
			// if no activation function, then we don't wait, we fulfill immediately.
			this.fulfill();
		}
	}

	isActivated() {
		return this.activated;
	}

	isFulfilled() {
		return this.fulfilled;
	}

	isSet() {
		return this.hasBeenSet;
	}

	hasFFF() {
		return !!this.ffClosure;
	}



	// standard nex stuff below

	toString(version) {
		if (version == 'v2') {
			return this.toStringV2();
		}
		return `*(${super.childrenToString()}*)`;
	}

	toStringV2() {
		return `*(${super.childrenToString('v2')})`;		
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

	getContextType() {
		return ContextType.COMMAND;
	}

	renderInto(renderNode, renderFlags) {
		let domNode = renderNode.getDomNode();
		let dotspan = null;
		if (!(renderFlags & Vodka.RENDER_FLAG_SHALLOW)) {
			dotspan = document.createElement("span");
			dotspan.classList.add('dotspan');
			domNode.appendChild(dotspan);
		}
		super.renderInto(renderNode, renderFlags);
		domNode.classList.add('expectation');
		if (!(renderFlags & Vodka.RENDER_FLAG_SHALLOW)) {
			if (renderFlags & Vodka.RENDER_FLAG_EXPLODED) {
				dotspan.classList.add('exploded');
			} else {
				dotspan.classList.remove('exploded');
			}
			this.unsetDotSpanPaddingClasses(dotspan);
			this.setDotSpanPaddingClass(dotspan);
			this.unsetDotSpanParentPaddingClasses(domNode);
			this.setDotSpanParentPaddingClass(domNode);
			dotspan.innerHTML = this.getDotSpanHTML();
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
			'Enter': 'return-exp-child',
			// special stuff for expectations that gets rid of the js timeout
			'ShiftBackspace': 'call-delete-handler-then-remove-selected-and-select-previous-sibling',
			'Backspace': 'call-delete-handler-then-remove-selected-and-select-previous-sibling',
		}
	}
}



export { Expectation, incFFGen }

