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
		this.setFulfilled(false);
		this.activated = false;
		this.ffClosure = null;

		this.activating = false;
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


	}

	evaluate() {
		// we copy empty, dumb expectations because they are all equivalent anyway,
		// and it means I can use them in code
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

	set(activationFunctionGenerator) {
		if (this.isFulfilled()) {
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
	 	this.renderOnlyThisNex(null);		
	}

	testForReactivationAfterFFClosure() {
		if (this.isFulfilled()) {
			this.notifyAfterFulfill();
		} else if (!this.isActivated()) {
			// ffClosure may have reactivated this expectation.
			this.activate();
		} else {
			// how did we get here?
			throw new Error("In weird state after fulfill, neither fulfilled nor reset");
		}
	}

	callFFClosureOnAllChildren() {
		// just call it on all children first.
		for (let i = 0; i < this.numChildren(); i++) {
			let child = this.getChildAt(i);
			let cmd = Command.makeCommandWithClosure(this.ffClosure, child);
			let result = evaluateNexSafely(cmd, this.ffExecutionEnvironment);
			this.replaceChildAt(result, i);
		}
		if (this.numChildren() == 0) {
			console.log("warning: tried to evaluate ff-with on children, but there were no children.");
		}
		// ffClosure could have returned expectations, so we wait again.
		this.doOrWaitToDo(function() {
			this.testForReactivationAfterFFClosure();
		}.bind(this));		
	}

	completeFulfill() {
		// At this point we are officially fulfilled.
		// however, the ffClosure can undo this.
		this.setFulfilled(true);
		if (this.ffClosure) {
			this.callFFClosureOnAllChildren();
		} else {
			this.notifyAfterFulfill();
		}		
	}

	fulfill(result) {
		if (this.isFulfilled()) {
			throw new Error("expectation fulfilled again somehow: " + this.debugString());
		}
		if (this.ffgen < FF_GEN) {
			// fulfillment was cancelled so we don't do ANYTHING including
			// setting any state indicating that it's been fullfilled (because it hasn't)
			// we don't call the callbacks either.
			return;
		}
		// some builtin-based expectations can have a result supplied by
		// "external forces" 
		if (result) {
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
	 	this.renderOnlyThisNex(null);
		if (this.activationFunction != null) {
			// this means the expectation has been set. We call the asynchronous method
			// and when the callback happens, we will fulfill.
			this.activationFunction();
		} else {
			// this means the exp was not set. We just fulfill immediately.
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
			todo();
		}
	}


	// returns true if we had to wait
	maybeWaitBeforeDoing(todo, exp, childrenFinished, i) {
		if (this.isUnactivatedExpectation(exp)) {
			exp.activate();
		}
		if (this.isUnfulfilledExpectation(exp)) {
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
		return `*${this.toStringV2PrivateDataSection()}${this.listStartV2()}${this.toStringV2TagList()}${super.childrenToString('v2')}${this.listEndV2()}`;
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
		if (this.activating) {
			throw new EError('cannot copy an expectation while it is activating.');
		}
		if (this.isInFlight()) {
			throw new EError('cannot copy an expectation whie it is in flight (pending fulfill)')
		}
		let r = new Expectation();
		this.copyChildrenTo(r, shallow);
		this.copyFieldsTo(r);
		return r;
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

