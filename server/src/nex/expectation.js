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



class Expectation extends NexContainer {
	constructor(hackfunction) {
		super()
		// TODO: deprecated, remove. the only place
		// this is used is in the old "edit" primitive
		// which is also deprecated
		this.hackfunction = hackfunction;
		this.completionlisteners = [];
		this.parentlist = []; // for RENDERNODES
		// fff is somehow more readable than "fulfillfunction"
		// like I don't have to remember how to spell it
		this.fff = null;
		this.ffed = false;
	}

	setFFF(f) {
		this.fff = f;
	}

	// for RENDERNODES
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
		ILVL++;
		let rval = this.getFulfilledThing();
		ILVL--;
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

	toString() {
		return '...';
	}

	copyFieldsTo(nex) {
		super.copyFieldsTo(nex);
		nex.hackfunction = this.hackfunction;
		nex.deleteHandler = this.deleteHandler;
		nex.completionlisteners = this.completionlisteners;
		nex.fff = this.fff;
	}

	getContextType() {
		return ContextType.COMMAND;
	}

	renderInto(domNode, shallow) {
		let toPassToSuperclass = domNode;
		if (RENDERNODES) {
			// change param name
			domNode = domNode.getDomNode();
		}
		let dotspan = null;
		if (RENDERFLAGS) {
			var renderFlags = shallow;
			if (!(renderFlags & RENDER_FLAG_SHALLOW)) {
				dotspan = document.createElement("span");
				dotspan.classList.add('dotspan');
				domNode.appendChild(dotspan);
			}
		} else {
			if (!shallow) {
				dotspan = document.createElement("span");
				dotspan.classList.add('dotspan');
				domNode.appendChild(dotspan);
			}
		}
		super.renderInto(toPassToSuperclass, shallow);
		domNode.classList.add('expectation');
		if (RENDERFLAGS) {
			if (!(renderFlags & RENDER_FLAG_SHALLOW)) {
				if (renderFlags & RENDER_FLAG_EXPLODED) {
					dotspan.classList.add('exploded');
				} else {
					dotspan.classList.remove('exploded');
				}
				dotspan.innerHTML = '...';
			}
		} else {
			if (!shallow) {
				if (this.renderType == NEX_RENDER_TYPE_EXPLODED) {
					dotspan.classList.add('exploded');
				} else {
					dotspan.classList.remove('exploded');
				}
				dotspan.innerHTML = '...';
			}
		}
		if (!RENDERNODES) {
			this.renderTags(domNode, shallow);
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

	// TODO: rename this to fulfill,
	// and rename the function formerly known as fulfill
	// to fulfullAndSetChild or something
	getFulfilledThing(passedInFFF) {
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
		this.ffed = true;
		return this.fff();
	}

	fulfillRendernodes(passedInFFF) {
		let newnex = this.getFulfilledThing(passedInFFF);

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
		}
		// we don't know where the expectations are so we have to render everything.
		// TODO: make a render queue so the renderer doesn't get spammed, and actually we do know
		topLevelRenderSelectingNode(newnex);
		for (let i = 0; i < this.completionlisteners.length; i++) {
			this.completionlisteners[i](newnex);
		}
	}

	fulfill(newnex) {
		if (RENDERNODES) {
			this.fulfillRendernodes(newnex);
			return;
		}
		if (this.hackfunction) {
			newnex = this.hackfunction(newnex);
		}
		if (RENDERNODES) {
			this.fulfillRendernodes(newnex);
		} else {
			let parent = this.getParent();
			let wasSelected = this.isSelected();
			parent.replaceChildWith(this, newnex);
			if (RENDERFLAGS) {
				parent.rerender(current_default_render_flags);
			} else {
				// have to do this in case global render type changed while we were
				// waiting to fulfill
				newnex.setRenderType(current_render_type);
				parent.rerender();
			}
			if (wasSelected) {
				newnex.setSelected(true/*shallow-rerender*/);
			}

		}
		for (let i = 0; i < this.completionlisteners.length; i++) {
			this.completionlisteners[i](newnex);
		}
		// I don't think we usually do anything with this return value.
		return newnex;
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