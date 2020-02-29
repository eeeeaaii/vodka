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
		this.hackfunction = hackfunction;
		this.parentlist = []; // for RENDERNODES
	}

	// for RENDERNODES
	addParent(parent) {
		this.parentlist.push(parent);
	}

	getTypeName() {
		return '-expectation-';
	}

	setDeleteHandler(f) {
		this.deleteHandler = f;
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

	fulfillRendernodes(newnex) {
		// fuckery here
		// for each parent, look at all its children and find out
		// whether this expectation is still a child.
		// If it is, replace with the thing.
		// then do a global rerender.
		// Maybe this is how we save step eval!

		for (let i = 0; i < this.parentlist.length; i++) {
			let parent = this.parentlist[i];
			let addresses = this.getAddressesOfThisInParent(parent);
			for (let j = 0; j < addresses.length; j++) {
				let addr = addresses[j];
				parent.replaceChildAt(newnex, addr);
			}
		}
		// we don't know where the expectations are so we have to render everything.
		topLevelRenderSelectingNode(newnex);

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
		// I don't think we usually do anything with this return value.
		return newnex;
	}

	defaultHandle(txt) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);

		if (isSeparator) {
			manipulator.replaceSelectedWith(new Separator(txt));
		} else {
			manipulator.replaceSelectedWith(new Letter(txt));
		}
		return true;
	}

	getEventTable(context) {
		// most of these have no tests?
		return {
			'Tab': 'select-first-child-or-fail',
			'Enter': 'do-line-break-always',
			'~': 'replace-selected-with-command',
			'!': 'replace-selected-with-bool',
			'@': 'replace-selected-with-symbol',
			'#': 'replace-selected-with-integer',
			'$': 'replace-selected-with-string',
			'%': 'replace-selected-with-float',
			'^': 'replace-selected-with-nil',
			'&': 'replace-selected-with-lambda',
			'(': 'replace-selected-with-word',
			'[': 'replace-selected-with-line',
			'{': 'replace-selected-with-doc',
			// special stuff for expectations that gets rid of the js timeout
			'ShiftBackspace': 'call-delete-handler-then-remove-selected-and-select-previous-sibling',
			'Backspace': 'call-delete-handler-then-remove-selected-and-select-previous-sibling',
		}
	}
}