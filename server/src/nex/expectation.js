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

import * as Utils from '../utils.js'

import { RENDER_FLAG_SHALLOW, RENDER_FLAG_EXPLODED } from '../globalconstants.js'
import { eventQueueDispatcher } from '../eventqueuedispatcher.js'
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

	constructor() {
		super()
		this.hasBeenSet = false;
		this.fulfilled = false;
		this.activated = false;
		this.ffClosure = null;

		this.startedTryingToFulfill = false;

		this.ffExecutionEnvironment = null;
		this.pendingCallbacks = [];
		this.callbackRouter = null;
		this.ffClosure = null;
		this.ffExecutionEnvironment = null;
		this.activationFunction = null; // this starts the async process, whatever it is
		this.virtualChildren = [];

		// private data is currently unused but I want the logic for
		// handling it here so I can implement parsing and tests for it
		this.privateData = '';

		gc.register(this);
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

	getFFClosure() {
		return this.ffClosure;
	}

	reset() {
		this.fulfilled = false;
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

	// this method is called by the ffwith builtin to designate an "ff-with"
	// function, i.e. a callback to call after this is fulfilled
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
		if (this.startedTryingToFulfill) {
			throw new EError('Expectation: cannot call ff-with on the expectation, it currently fulfilling');
		}
		this.ffClosure = closure;
		// TODO: think of a bug that is fixed by copying the execution env,
		// or remove the copy.
		this.ffExecutionEnvironment = executionEnvironment.copy();
	}

	runFFClosureOnAllChildren() {
		let allSucceeded = true;
		for (let i = 0; i < this.numChildren(); i++) {
			if (!this.runFFClosureOnOneChild(i)) {
				allSucceeded = false;
			}
		}
		return allSucceeded;
	}

	// what this is doing is calling ffWith, passing it the child.
	// so this is really only valid for exps that have ffwith's.
	// if the result returned by calling ffwith on a child is an expectation,
	// we don't consider this child complete/done yet.
	// the trouble is when we re-call there is a different method for that.
	runFFClosureOnOneChild(childIndex) {
		let success = true;
		let result = this.getChildAt(childIndex);
		if (Utils.isFatalError(result)) {
			throw result;
		}
		let cmd = Command.makeCommandWithClosure(this.ffClosure, result);
		let newResult = evaluateNexSafely(cmd, this.ffExecutionEnvironment);
		if (newResult.getTypeName() == '-expectation-' && !newResult.isFulfilled()) {
			newResult.addPendingCallback(function() {
				this.tryAgainToCallFFClosureOnChild(childIndex);
			}.bind(this))
			success = false;
		}
		this.replaceChildAt(newResult, childIndex);
		return success;
	}

	// so what this does is it calls ff closure on the child, then checks all
	// children to see if we can mark this as fulfilled. I do not know why
	// we can't just check the current child. 
	tryAgainToCallFFClosureOnChild(forChild) {
		// try again to call FFWith.
		this.runFFClosureOnOneChild(forChild);
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

	// this is a different pending callback loop, for expectations that don't have
	// ffclosure set. This just calls itself in the pending callback.
	// this code has a simple test in execution_expectation_ff_childrenfirst.
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

	// if you activate an exp with children,
	// should it actually wait until the children fulfill before activating?
	// for example let's say you have an exp that saves contents in a file,
	// and it contains another that loads contents from a file.
	// seems like parent shouldn't activate until child is fulfilled.

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
			this.fulfilled = this.runFFClosureOnAllChildren();
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


	// activation starts whatever asynchronous process is associated with this exp,
	// or immediately fulfills if some variation on "set-" was not called.
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


	/// ------------------ new methods


	// IDEA.
	// we have the default behavior of expectations that DON'T have ffclosure,
	// which is they just wait until all children are fulfilled before fulfilling themselves.
	// HOWEVER if we have ffClosure we could delegate completely to it the logic for
	// determining whether this expectation is finished/complete or not.
	// This means we could have different ffClosure methods for different
	// reactiveX-eque logic (one has to be fulfilled, all have to be fulfilled, etc)
	// So with this method, if there is an ffClosure, as soon as any children fulfill
	// we call ffClosure, passing it ALL the children, and ffClosure somehow decides
	// whether this exp should fulfill or not.
	// ways it could do this:
	//  return a data structure telling the exp what to do
	//  return a list of children, but if it wants to ignore some children it replaces
	//    them with null, and the parent exp will move forward if no children are unfulfilled
	//
	//
	// also if we wanted the parent to execute in parallel with children,
	// maybe we have an actClosure?
	//
	// like for example we might want one ffClosure that makes sure the children execute
	// in parallel, and another that makes sure they execute serially.
	// 
	// basically the way this would work is similar to below. When we try to activate,
	// we still don't activate until all children are fulfilled.
	// When we try to fulfill, if there's an ffClosure, we call "tryFFClosureOnChildren"
	// this method calls ffClosure (which must be variadic), passing it all the children.
	// after calling that, we iterate through the children. If any of them are expectations that are
	// not fulfilled, we add self as pending (we don't activate anything, that's the job
	// of ffClosure), and the method method is tryFFClosureOnChildren (again).
	// otoh if no children are unfulfilled, we complete fulfill at that point.






	// Some system methods can provide a value for fulled expectations (such as load,
	// which gives you the contents of the loaded file). These are considered to replace
	// the first child of the expectation, as if that child was an expectation that got
	// fulfilled. These values are passed in the "result" argument.
	// 
	// Otherwise, all children must be fulfilled before this one can get fulfilled.
	// You might ask, well, since we also require that all children be fulfilled
	// before we activate this expectation, why do we check again here? The answer is
	// of course children could have been added between the time this expectation was
	// activated and the time it was fulfilled.
	// 
	// another wrinkle is that if this exp has an ffwith, after all children are fulfilled,
	// we call ffwith on all those children. If ffwith returns an unactivated or unfulfilled
	// exp, we STILL don't fulfill. We don't fullfill until ffwith returns nothing that
	// is "live".
	//
	// if ffClosure returns an expectation, after it is fulfilled, do we call ffClosure on it
	// again?!? I'm going with yes, because if ffClosure returns an expectation, it's sort of
	// an indication that "I'm not finished yet."
	//
	// of course another way to do this is just to pass all the children to ffClosure
	//
	// so we need a lot of tests:
	// 1. tests that a system method like load only replaces first argument
	// 2. test that takes a set-delay exp, and adds an unactivated exp child to it before the
	//    delay is complete, and verifies that it will not fulfill until the child completes
	// 3. same as test 2, except the newly added child is activated, but not fulfilled
	// 4. test for an ffwith that returns an unactivated expectation, we wait for it
	// 5. test for an ffwith that returns an activated but unfulfilled exp, we wait for it
	// 6. test for ffwith that sometimes returns an exp and sometimes doesn't, it waits
	//    for them all (so there would be multiple children, let's say #1 #2 #3, and it
	//    only returns an exp for 2 and 3)
	// 7. same as tests 2 and 3, but adds multiple children, waits for all
	// 8. (important) test that ffwith is not called on child expectations until they fulfill
	// 9. if you try to add an ffClosure after we already started trying to fulFill, it doesn't
	//    work.
	//

/*
	tryToFulfill() {
		let canFulfill = true;
		for (let i = 0; i < this.numChildren(); i++) {
			let c = this.getChildAt(i);
			if (c.getTypeName() == '-expectation-' && !c.isActivated()) {
				// if the child is an unactivated exp, we activate and continue.
				c.activate();
				c.addPendingCallback(function() {
					this.tryToFulfill();
				}.bind(this));
				canFulfill = false;
			} else if (c.getTypeName() == '-expectation-' && !c.isFulfilled()) {
				// if the child is an unfulfilled exp, we wait on it and continue.
				c.addPendingCallback(function() {
					this.tryToFulfill();
				}.bind(this));
				canFulfill = false;
			} else {
				if (this.ffClosure) {
					let result = this.callFFClosureOnChild(c);
					// if ffClosure returns an unactivated exp, we 
					if (result.getTypeName() == '-expectation-' && (!result.isFulfilled() || !result.isActivated()) {

					}
				}
			}
		}
		if (canFulfill) {
			this.completeFulfill();
		}		
	}

	fulfill(result) {
		if (this.fulfilled) {
			throw new Error("expectation fulfilled again somehow").
		}
		if (this.ffgen < FF_GEN) {
			// fulfillment was cancelled so we don't do ANYTHING including
			// setting any state indicating that it's been fullfilled (because it hasn't)
			// we don't call the callbacks either.
			return;
		}
		this.tryToFulfill();
	}


	// actually performs activation. Only called if conditions listed in tryToActivate are met.
	completeActivation() {
		this.activated = true;
		if (this.activationFunction != null) {
			// this means the expectation has been set. We call the asynchronous method
			// and when the callback happens, we will fulfill.
			this.activationFunction();
		} else {
			// this means the exp was not set. We just fulfill immediately.
			this.fulfill();
		}
	}
*/
	// Attempts to activate this expectation. Conditions that must be true:
	// all children that are expectations must be fulfilled before this can be activated.
	// need 3 tests here:
	//   if it has only non-expectation children, it activates right away
	//   if it has already activated but non-fulfilled children, it waits for them.
	//   if it has unactivated children, it activates and waits for them.

/*
	tryToActivate() {
		let canActivate = true;
		for (let i = 0; i < this.numChildren(); i++) {
			let c = this.getChildAt(i);
			if (c.getTypeName() == '-expectation-') {
				if (!c.isActivated()) {
					c.activate();
					c.addPendingCallback(function() {
						this.tryToActivate();
					}.bind(this));
					canActivate = false;
				} else if (!c.isFulfilled()) {
					c.addPendingCallback(function() {
						this.tryToActivate();
					}.bind(this));
					canActivate = false;
				}
			}
		}
		if (canActivate) {
			this.completeActivation();
		}
	}

	activate() {
		if (this.activated) {
			return;
		}
		tryToActivate();
	}
*/

	/// ------------------ end new methods



	// standard nex stuff below

	toString(version) {
		if (version == 'v2') {
			return this.toStringV2();
		}
		return `*(${super.childrenToString()}*)`;
	}

	toStringV2() {
		return `*${this.toStringV2PrivateDataSection()}(${this.toStringV2TagList()}${super.childrenToString('v2')})`;
	}

	deserializePrivateData(data) {
		// TODO: this is probably not sustainable - the only way this knows that
		// the data is not "for it" is that it's not 'v' indicating vertical
		if (data && data.length > 0 && data[0] != 'v') {
			this.privateData = data[0];
			data.splice(0, 1);
		}
		super.deserializePrivateData(data);
	}

	serializePrivateData(data) {
		if (this.privateData != '') {
			data.push(this.privateData);
		}
		super.serializePrivateData(data);
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
		if (!(renderFlags & RENDER_FLAG_SHALLOW)) {
			dotspan = document.createElement("span");
			dotspan.classList.add('dotspan');
			domNode.appendChild(dotspan);
		}
		super.renderInto(renderNode, renderFlags);
		domNode.classList.add('expectation');
		if (!(renderFlags & RENDER_FLAG_SHALLOW)) {
			if (renderFlags & RENDER_FLAG_EXPLODED) {
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

