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

var FF_GEN = 0;

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
		this.reset();
		// we don't reset callbacks when we reset this exp,
		// because if we did that, the code in ffWidth couldn't
		// reset this expectation.
		this.pendingExpectations = [];
		this.callbackRouter = null;
		this.ffClosure = null;
		this.ffExecutionEnvironment = null;
		this.activationFunction = null; // this starts the async process, whatever it is
		this.virtualChildren = [];
		gc.register(this);
	}

	reset() {
		this.hasBeenSet = false; // it's annoying that set the verb and set the adj are the same
		this.fulfilled = false;
		this.activated = false;
		this.ffClosure = null;
		this.ffExecutionEnvironment = null;
	}

	addPendingExpectation(pendingExp) {
		if (this.isFulfilled()) {
			pendingExp.exp.notify(pendingExp.index);
		} else {
			this.pendingExpectations.push(pendingExp);
		}
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
		// do I do this?
//		if (this.activationFunction) {
//			nex.activationFunction = this.activationFunction;
//		}
	}

	ffWith(closure, executionEnvironment) {
		if (this.hasFFF()) {
			throw new EError('Expectation: cannot set ff-with, has already been set');
		}
		// I was going to call ffwith directly if it was set on an already-fulfilled
		// expectation but the problem with that is that the pending expectations
		// have already been notified so it's really too late. The new thing of
		// deferring activation will probably be better/help with this/make it so I don't need to.
		if (this.isFulfilled()) {
			throw new EError('Expectation: cannot set ff-with, has already been fulfilled');
		}
		this.ffClosure = closure;
		this.ffgen = FF_GEN;
		this.ffExecutionEnvironment = executionEnvironment;// do I need to copy this?
	}

	getCallbackForSet() {
		return (function(result) {
			eventQueue.enqueueExpectationFulfill(this.callbackRouter, result);
		}).bind(this);
	}

	notifyPending() {
		for (let i = 0; i < this.pendingExpectations.length; i++) {
			let rec = this.pendingExpectations[i];
			rec.exp.notify(rec.index);
		}
		this.pendingExpectations = [];
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
		if (isFatalError(result)) {
			throw result;
		}
		let cmd = Command.makeCommandWithClosure(this.ffClosure, result);
		let newResult = evaluateNexSafely(cmd, this.ffExecutionEnvironment);
		if (newResult.getTypeName() == '-expectation-' && !newResult.isFulfilled()) {
			newResult.addPendingExpectation({exp:this, index:childIndex});
			success = false;
		}
		this.replaceChildAt(newResult, childIndex);
		return success;
	}

	notify(forChild) {
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
			if (c.getTypeName() == '-expectation-' && !c.isFulfilled()) return false;
		}
		return true;
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
			this.fulfilled = true;
		}
		this.renderOnlyThisNex(null);
		if (this.fulfilled) {
			this.notifyPending();
		}
	}

	cancel() {
		this.ffgen--;
	}

	set(activationFunction) {
		if (this.fulfilled) {
			throw new EError('Expectation: cannot set the expectation, has already been fulfilled');			
		}
		if (this.activated) {
			throw new EError('Expectation: cannot set the expectation, has already been activated');
		}
		this.hasBeenSet = true;
		this.callbackRouter = new CallbackRouter();
		this.callbackRouter.addExpecting(this);
		this.activationFunction = activationFunction;
	}

	activate() {
		if (this.activated) {
			return;
		}
		this.activated = true;
		if (this.activationFunction != null) {
			this.activationFunction();
			this.activationFunction = null;
		} else {
			// directly fulfill
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

	toString() {
		return `*(${super.childrenToString()}*)`;
	}

	getTypeName() {
		return '-expectation-';
	}

	makeCopy(shallow) {
		let r = new Expectation();
		this.copyFieldsTo(r);
		this.copyChildrenTo(r, shallow);
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
			dotspan.innerHTML = this.getDotSpanHTML();
		}
	}

	getDotSpanHTML() {
		if (this.fulfilled) {
			return '*';
		} else if (this.isActivated()) {
			return '...';
		} else if (this.isSet()) {
			return '.';
		} else {
			return '-';
		}
	}

	unsetDotSpanPaddingClasses(dotspan) {
		dotspan.classList.remove('fulfilled');
 		dotspan.classList.remove('activated');
 		dotspan.classList.remove('set');
 		dotspan.classList.remove('unset');
	}

	setDotSpanPaddingClass(dotspan) {
		if (this.fulfilled) {
			dotspan.classList.add('fulfilled');
		} else if (this.isActivated()) {
			dotspan.classList.add('activated');
		} else if (this.set) {
			dotspan.classList.add('set');
		} else {
			dotspan.classList.add('unset');
		}
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

	defaultHandle(txt) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);

		let toInsert = null;
		if (isSeparator) {
			toInsert = new Separator(txt);
		} else {
			toInsert = new Letter(txt);
		}
		if (this.hasChildren()) {
			manipulator.insertAfterSelectedAndSelect(toInsert)
		} else {
			manipulator.appendAndSelect(toInsert);
		}
		return true;
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