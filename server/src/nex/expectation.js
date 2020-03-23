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

var TIMEOUTS_GEN = 0;



class Expectation extends NexContainer {
	constructor(hackfunction) {
		super()
		this.hackfunction = hackfunction;
		this.completionlisteners = [];
		this.parentlist = [];
		// fff is somehow more readable than "fulfillfunction"
		// like I don't have to remember how to spell it
		this.fff = null;
		this.ffed = false;
		this.discontinued = false;
		this.waitingOnTimeout = -1;
		this.everyTimeout = -1;
		this.ffwithLambda = null;
		this.ffwithArgEnv = null;
		this.unlimited = false;

	}

	setUnlimited() {
		this.unlimited = true;
	}

	toString() {
		return `*(${super.childrenToString()}*)`;
	}

	setTimeout(time) {
		this.waitingOnTimeout = time;
		setTimeout((function() {
			this.waitingOnTimeout = -1;
			eventQueue.enqueueExpectationFulfill(this);
		}).bind(this), time);
	}

	clearEveryTimeout() {
		this.everyTimeout = -1;
	}

	stop() {
		this.timeoutsGen--;
	}

	setTimeoutEvery(time) {
		this.timeoutsGen = TIMEOUTS_GEN;
		this.everyTimeout = time;
		let f = (function() {
			eventQueue.enqueueExpectationFulfill(this);
			if (this.everyTimeout != -1 && this.timeoutsGen == TIMEOUTS_GEN) {
				setTimeout(f, time);
			}
		}).bind(this);
		setTimeout(f, time);
	}

	copyFieldsTo(nex) {
		super.copyFieldsTo(nex);
		nex.deleteHandler = this.deleteHandler;
		nex.fff = this.fff;
		nex.unlimited = this.unlimited;
		// if we copy an expectation while it has a pending timeout,
		// the new one gets its own timeout.
		if (this.waitingOnTimeout > -1) {
			nex.setTimeout(this.waitingOnTimeout);
		}
		if (this.everyTimeout > -1) {
			nex.setTimeoutEvery(this.everyTimeout);
		}
		if (this.ffwithLambda) {
			nex.setupFFWith(this.ffwithLambda, this.ffwithArgEnv);
		}
		// notably we do NOT copy ffed because
		// if the original one is already fulfilled, we might want
		// to make a copy of it so it can be fulfilled again.
	}

	discontinue() {
		this.discontinued = true;
	}

	setFFF(f) {
		this.fff = f;
	}

	setupFFWith(lambda, argEnv) {
		this.ffwithLambda = lambda;
		this.ffwithArgEnv = argEnv;
		this.fff = (function() {
			let cmd = new Command('');
			cmd.appendChild(this.ffwithLambda);
			cmd.appendChild(this.getChildAt(0));
			return evaluateNexSafely(cmd, this.ffwithArgEnv);
		}).bind(this);
	}

	addParent(parent) {
		this.parentlist.push(parent);
	}

	addCompletionListener(listener) {
		this.completionlisteners.push(listener);
	}

	getTypeName() {
		return '-expectation-';
	}

	setDeleteHandler(f) {
		this.deleteHandler = f;
	}

	evaluate(env) {
		pushStackLevel();
		let rval = null;;
		// if discontinued this will just be itself
		if (EXPECTATIONS_NO_PARENT) {
			return this.getChildAt(0).makeCopy();
//			this.fulfill();
			rval = this;
		} else {
			rval = this.getFulfilledThing();
		}
		popStackLevel();
		return rval;
	}

	insertChildAt(c, i) {
		if (i > 1) {
			throw new EError('Expectation cannot have more than one child.');
		} else {
			super.insertChildAt(c, i);
		}
	}

	callDeleteHandler() {
		if (this.deleteHandler) {
			this.deleteHandler();
		}
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
			dotspan.innerHTML = '...';
		}
	}

	isEmpty() {
		return true;
	}

	getKeyFunnel() {
		return new ExpectationKeyFunnel(this);
	}

	deleteLastLetter() {}

	appendText(txt) {}

	getAddressesOfThisInParent(parent) {
		let addresses = [];
		for (let i = 0; i < parent.numChildren(); i++) {
			let child = parent.getChildAt(i);
			if (child.getID() == this.getID()) {
				// it's the same one
				addresses.push(i);
			}
		}
		return addresses;
	}

	getFulfilledThing(passedInFFF) {
		if (this.discontinued) {
			return this;
		}
		if (this.ffed) {
			throw new EError('Cannot fulfill an already-fulfilled expectation');
		}
		if (!this.fff) {
			// either it was passed in or um
			if (passedInFFF) {
				if ((typeof passedInFFF) == 'function') {
					this.fff = passedInFFF;
				} else {
					this.fff = function() {
						return passedInFFF;
					};
				}
			} else {
				this.fff = (function() {
					return this.getChildAt(0);
				}).bind(this);
			}
		}
		if (!this.unlimited) {
			this.ffed = true;
		}
		return this.fff();
	}

	checkChildren() {
		if (this.numChildren() == 0) {
			throw new EError("cannot fulfill an empty expectation");
		}
		if (this.numChildren() > 1) {
			throw new EError("expectation cannot have more than one value");
		}
	}

	fulfill(passedInFFF) {
		this.checkChildren();
		let newnex = this.getFulfilledThing(passedInFFF);

		let shouldSelect = this.getRenderNodes()[0] && this.getRenderNodes()[0].isSelected();

		if (EXPECTATIONS_NO_PARENT) {
			this.replaceChildAt(newnex, 0);
			if (FASTEXPECTATIONS) {
				this.renderOnlyThisNex(null);
			} else {
				PRIORITYQUEUE ? eventQueue.enqueueTopLevelRender(newnex) : topLevelRender(newnex);
			}
			for (let i = 0; i < this.completionlisteners.length; i++) {
				this.completionlisteners[i](newnex);
			}
			return;
		}

		// fuckery here
		// for each parent, look at all its children and find out
		// whether this expectation is still a child.
		// If it is, replace with the thing.
		// then do a global rerender.
		for (let i = 0; i < this.parentlist.length; i++) {
			let parent = this.parentlist[i];
			let addresses = this.getAddressesOfThisInParent(parent);
			for (let j = 0; j < addresses.length; j++) {
				let addr = addresses[j];
				parent.replaceChildAt(newnex, addr);
			}
			if (FASTEXPECTATIONS) {
				if (shouldSelect) {
					parent.renderOnlyThisNex(newnex);
				} else {
					parent.renderOnlyThisNex(null);
				}
			}
		}
		// we don't know where the expectations are so we have to render everything.

		if (!FASTEXPECTATIONS) {
			if (shouldSelect) {
	 			PRIORITYQUEUE ? eventQueue.enqueueTopLevelRenderSelectingNode(newnex) : topLevelRenderSelectingNode(newnex);
			} else {
				PRIORITYQUEUE ? eventQueue.enqueueTopLevelRender(newnex) : topLevelRender(newnex);
			}
		}
		for (let i = 0; i < this.completionlisteners.length; i++) {
			this.completionlisteners[i](newnex);
		}
	}

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
//			'Tab': 'select-first-child-or-fail',
			'Enter': 'do-line-break-always',
			// '~': 'replace-selected-with-command',
			// '!': 'replace-selected-with-bool',
			// '@': 'replace-selected-with-symbol',
			// '#': 'replace-selected-with-integer',
			// '$': 'replace-selected-with-string',
			// '%': 'replace-selected-with-float',
			// '^': 'replace-selected-with-nil',
			// '&': 'replace-selected-with-lambda',
			// '(': 'replace-selected-with-word',
			// '[': 'replace-selected-with-line',
			// '{': 'replace-selected-with-doc',
			// special stuff for expectations that gets rid of the js timeout
			'ShiftBackspace': 'call-delete-handler-then-remove-selected-and-select-previous-sibling',
			'Backspace': 'call-delete-handler-then-remove-selected-and-select-previous-sibling',
		}
	}
}