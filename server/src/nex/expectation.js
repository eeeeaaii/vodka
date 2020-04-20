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
		this.fulfillCallbacks = [];
		this.callbackRouter = null;
		this.ffClosure = null;
		this.ffExecutionEnvironment = null;
	}

	reset() {
		this.isSet = false;
		this.asyncProcessCompleted = false;
		this.handle = null;
		this.ffClosure = null;
		this.ffExecutionEnvironment = null;
	}

	addFulfillCallback(newListener) {
		if (this.asyncProcessCompleted) {
			// should this be put on the event queue?
			eventQueue.enqueueExpectationCallback(newListener, this.getResultToProcess());
		} else {
			this.fulfillCallbacks.push(newListener);
		}
	}

	/*
	copying expectations sort of works but still doesn't work.
	Here's the code for do-on-every:

	(& f nex interval
		(~let @exp (~cons @nex (* )))
		(~let @fff (& n
			(~reset @exp)
			(~ff-with @exp @fff)
			(~set-delay @exp @interval)
			(~f @n)
		))
		(~set-delay (~ff-with @exp @fff) @interval)
	)

	"reset" is not being called on the correct expectation. it has a stale pointer to
	some other expectation that is not the one that was copied.
	Which makes sense, because when we copy this expectation, we don't
	update anything that points to it.

	This is not caused by the fact that we copy the closure when we copy the expectation.
	Even if we didn't copy the closure, the closure owned by the copied
	expectation would still point to the wrong thing. In fact, it would be worse,
	because it would point to the same (original) expectation that was discarded
	after the copy, which means that that expectation would get ff called on it twice.
	Worse? Better? IDK, just wrong differently. Maybe better because it wouldn't
	fail as silently. This fails silently because the copied expectation is distinct
	but is still not the one on the screen.

	It could be fixed by having ff-with take the expectation as its argument
	rather than the contents of the expectation. The return value of ff-with
	would still be the new contents of the expectation. It's just that you'd
	have to get the car if you didn't want to reset the expectation.

	I could put in some error checking to prevent you from accidentally returning
	the expectation from ff-with (this would be a common mistake and basically
	would always be wrong)

	this is a very flexible solution in that you could ostensibly do other things like
	chain the expectation to other things etc. Also the expectation itself is the
	"most you know" at fulfill time, i.e. you can't go higher to the parent but
	you do have a pointer to the expectation that is being fulfilled.

	I'm not sure I can think of a fancier/better solution.

	*/

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
	}

	ffWith(closure, executionEnvironment) {
		if (this.ffClosure) {
			throw new EError('Expectation: cannot set ff-with, has already been set (try resetting the expectation)');
		}
		this.ffClosure = closure;
		this.ffgen = FF_GEN;
		// I think we also need to close over the execution environment but not sure
		this.ffExecutionEnvironment = executionEnvironment.copy();
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

	callCallbacks(result) {
		for (let i = 0; i < this.fulfillCallbacks.length; i++) {
			eventQueue.enqueueExpectationCallback(this.fulfillCallbacks[i], this.getResultToProcess());
		}
	}

	callFFWith(result) {
		if (isFatalError(result)) {
			return result;
		}
		// do I quote result?
		let cmd = Command.makeCommandWithClosure(this.ffClosure, result);
		return evaluateNexSafely(cmd, this.ffExecutionEnvironment);
	}

	getResultToProcess(result) {
		if (result) {
			return result;
		} else {
			if (this.numChildren() != 1) {
				return new EError("expectation needs one child to be fulfilled")
			} else {
				return this.getChildAt(0);
			}
		}

	}

	fulfill(result) {
		if (this.ffgen < FF_GEN) {
			// fulfillment was cancelled so we don't do ANYTHING including
			// setting any state indicating that it's been fullfilled (because it hasn't)
			// we don't call the callbacks either.
			return;
		}
		result = this.getResultToProcess(result);
		// it's important that we set state of this expectation before calling ffwith,
		// because code in ffWith might decide to reset this expectation.
		this.asyncProcessCompleted = true;
		this.isSet = false;
		if (this.ffClosure) {
			result = this.callFFWith(result);
		}
		this.drainChildren();
		this.appendChild(result);
		this.renderOnlyThisNex(null);
		this.callCallbacks(result);
	}

	cancel() {
		this.ffgen--;
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