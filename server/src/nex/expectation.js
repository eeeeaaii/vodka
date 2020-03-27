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
	constructor() {
		super()
		this.completionlisteners = [];
		this.waitingOnTimeout = -1;
		this.everyTimeout = -1;
		this.fff = null;
		this.ffed = false;
		this.ffwithLambda = null;
		this.ffobject = null;
		this.unlimited = false;
	}

	isSet() {
		return this.fff | this.ffwithLambda | this.ffobject;
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
		nex.ffobject = this.ffobject;
		nex.ffwithLambda = this.ffwithLambda;
		nex.unlimited = this.unlimited;
		// if we copy an expectation while it has a pending timeout,
		// the new one gets its own timeout.
		if (this.waitingOnTimeout > -1) {
			nex.setTimeout(this.waitingOnTimeout);
		}
		if (this.everyTimeout > -1) {
			nex.setTimeoutEvery(this.everyTimeout);
		}
		// notably we do NOT copy ffed because
		// if the original one is already fulfilled, we might want
		// to make a copy of it so it can be fulfilled again.
	}

	setFFF(f) {
		this.ffobject = null;
		this.ffwithLambda = null;
		this.fff = f;
	}

	setFFObject(val) {
		this.fff = null;
		this.ffwithLambda = null;
		this.ffobject = val;
	}

	setupFFWith(lambda, argEnv) {
		this.fff = null;
		this.ffobject = null;
		this.ffwithLambda = {
			lambda: lambda,
			argEnv: argEnv
		};
	}

	fulfillWithLambda() {
		let cmd = new Command('');
		cmd.appendChild(this.ffwithLambda.lambda);
		cmd.appendChild(this.getChildAt(0));
		return evaluateNexSafely(cmd, this.ffwithLambda.argEnv);		
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
		rval = this;
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
			this.unsetDotSpanPaddingClasses(dotspan);
			this.setDotSpanPaddingClass(dotspan);
			dotspan.innerHTML = this.getDotSpanHTML();
		}
	}

	getDotSpanHTML() {
		if (this.ffed) {
			return '*';
		}
		if (this.fff || this.ffobject || this.ffwithLambda) {
			return '...';
		}
		return '.';
	}

	unsetDotSpanPaddingClasses(dotspan) {
		dotspan.classList.remove('fulfilled');
 		dotspan.classList.remove('threedots');
	}

	setDotSpanPaddingClass(dotspan) {
		if (this.ffed) {
			dotspan.classList.add('fulfilled');
		} else if (this.fff || this.ffobject || this.ffwithLambda) {
			dotspan.classList.add('threedots');
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

	_getFulfilledThing(passedInFFF) {
		if (this.ffed && !this.unlimited) {
			throw new EError('Cannot fulfill an already-fulfilled expectation');
		}
		if (passedInFFF) {
			if ((typeof passedInFFF) == 'function') {
				return passedInFFF();
			} else {
				return passedInFFF;
			}
		} else if (this.fff) {
			return this.fff();
		} else if (this.ffobject) {
			return this.ffobject;
		} else if (this.ffwithLambda) {
			return this.fulfillWithLambda();
		} else {
			throw new EError("cannot fulfill unset expectation");
		}
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

		let shouldSelect = this.getRenderNodes()[0] && this.getRenderNodes()[0].isSelected();

		if (this.numChildren() == 0) {
			this.appendChild(new EError("cannot fulfill an empty expectation"));
		} else if (this.numChildren() > 1) {
			while(this.numChildren() > 0) {
				this.removeChildAt(0);
			}
			this.appendChild(new EError("expectations cannot have more than one child value"));
		} else {
			// if anything goes wrong while fulfilling an exp,
			// we fulfill with the error
			let newnex = null;
			try {
				newnex = this._getFulfilledThing(passedInFFF);
				this.ffed = true;
			} catch (e) {
				if (e instanceof EError) {
					newnex = e;
				}
			}
			this.replaceChildAt(newnex, 0);
		}

		this.renderOnlyThisNex(null);
		for (let i = 0; i < this.completionlisteners.length; i++) {
			this.completionlisteners[i].fulfill();
		}
		return;
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
			'ShiftEnter': 'return-exp-child',
			'Enter': 'do-line-break-always',
			// special stuff for expectations that gets rid of the js timeout
			'ShiftBackspace': 'call-delete-handler-then-remove-selected-and-select-previous-sibling',
			'Backspace': 'call-delete-handler-then-remove-selected-and-select-previous-sibling',
		}
	}
}