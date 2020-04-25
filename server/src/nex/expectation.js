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
		this.activationFunction = null;
		gc.register(this);
	}

	reset() {
		this.isSet = false;
		this.asyncProcessCompleted = false;
		this.handle = null;
		this.ffClosure = null;
		this.ffExecutionEnvironment = null;
	}

	addPendingExpectation(pendingExp) {
		if (this.asyncProcessCompleted) {
			pendingExp.activateIfAllComplete();
			// should this be put on the event queue?
//			eventQueue.enqueueExpectationCallback(newListener, this.getResultToProcess());
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
		if (this.ffClosure) {
			throw new EError('Expectation: cannot set ff-with, has already been set (try resetting the expectation)');
		}
		this.ffClosure = closure;
		this.ffgen = FF_GEN;
		this.ffExecutionEnvironment = executionEnvironment;// do I need to copy this?
		if (this.asyncProcessCompleted) {
			let result = this.callFFWith(this.getResultToProcess());
		}
	}


	getCallbackForSet() {
		if (this.isSet) {
			throw new EError('Expectation: cannot set the expectation, has already been set (try resetting)');
		}
		this.isSet = true;
		this.callbackRouter = new CallbackRouter();
		this.callbackRouter.addExpecting(this);
		return (function(result) {
			eventQueue.enqueueExpectationFulfill(this.callbackRouter, result);
		}).bind(this);
	}

	// this is used when you want the callback to actually be stored in the expectation itself,
	// i.e., the expectation acts as a handle that you can use to fulfill itself.
	// usually an expectation can only be fulfilled by some external process
	// but this allows the expectation to fulfill itself.
	setHandle(callback) {
		this.handle = callback;
	}

	hasHandle() {
		return !!this.handle;
	}

	getHandle() {
		return this.handle;
	}

	drainChildren() {
		// in the error case there may be more than one child but we
		// follow the same path so we drain all here
		while(this.numChildren() > 0) {
			this.removeChildAt(0);
		}
	}

	notifyPending() {
		for (let i = 0; i < this.pendingExpectations.length; i++) {
			this.pendingExpectations[i].activateIfAllComplete();
//			eventQueue.enqueueExpectationCallback(this.fulfillCallbacks[i], this.getResultToProcess());
		}
	}

	callFFWith() {
		let result = this.getChildAt(0);
		if (isFatalError(result)) {
			throw result;
		}
		let cmd = Command.makeCommandWithClosure(this.ffClosure, result);
		let newResult = evaluateNexSafely(cmd, this.ffExecutionEnvironment);
		this.replaceChildAt(newResult, 0)
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
		// it's important that we set state of this expectation before calling ffwith,
		// because code in ffWith might decide to reset this expectation.
		this.asyncProcessCompleted = true;
		this.isSet = false;
		if (this.ffClosure) {
			this.callFFWith();
		}
//		this.drainChildren();
//		this.appendChild(getC);
		this.renderOnlyThisNex(null);
		this.notifyPending();
	}

	cancel() {
		this.ffgen--;
	}

	set(activationFunction) {
		this.activationFunction = activationFunction;
	}

	activate() {
		this.activationFunction();
		this.activationFunction = null;
	}

	activateIfAllComplete() {
		if (this.activationFunction != null && this.numChildren() > 0) {
			let isComplete = true;
			for (let i = 0; i < this.numChildren(); i++) {
				let c = this.getChildAt(0);
				if (c.getTypeName() == '-expectation-' && !c.asyncProcessCompleted) {
					isComplete == false;
				}
			}
			if (isComplete) {
				this.activate();
			}
		}
	}

	activateOrMakePending() {
		if (this.activationFunction != null && this.numChildren() > 0) {
			let isPending = false;
			for (let i = 0; i < this.numChildren(); i++) {
				let c = this.getChildAt(0);
				if (c.getTypeName() == '-expectation-') {
					c.addPendingExpectation(this);
					isPending = true;
				}
			}
			if (!isPending) {
				this.activate();
			}
		}
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
		if (this.isSet) {
			return '*';
		}
		return '.';
	}

	unsetDotSpanPaddingClasses(dotspan) {
		dotspan.classList.remove('fulfilled');
 		dotspan.classList.remove('threedots');
	}

	setDotSpanPaddingClass(dotspan) {
		if (this.isSet) {
			dotspan.classList.add('fulfilled');
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