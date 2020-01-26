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
		if (!DEFER_DRAW) {
			this.dotspan = document.createElement("span");
			this.dotspan.classList.add('dotspan');
			this.domNode.appendChild(this.dotspan);
			this.render();
		}
	}

	setDeleteHandler(f) {
		this.deleteHandler = f;
	}

	callDeleteHandler() {
		if (this.deleteHandler) {
			this.deleteHandler();
		}
	}

	makeCopy() {
		let r = new Expectation();
		this.copyFieldsTo(r);
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

	render(parentDomNode, thisDomNode) {
		if (DEFER_DRAW) {
			if (!thisDomNode) {
				this.domNode = thisDomNode = document.createElement("div");
			}
			this.dotspan = document.createElement("span");
			this.dotspan.classList.add('dotspan');
			this.domNode.appendChild(this.dotspan);
		}
		super.render(parentDomNode, thisDomNode);
		this.domNode.classList.add('expectation');
		if (this.renderType == NEX_RENDER_TYPE_EXPLODED) {
			this.dotspan.classList.add('exploded');
		} else {
			this.dotspan.classList.remove('exploded');
		}
		this.dotspan.innerHTML = '...';
		this.renderTags();
	}

	isEmpty() {
		return true;
	}

	getKeyFunnel() {
		return new ExpectationKeyFunnel(this);
	}

	deleteLastLetter() {}

	appendText(txt) {}

	fulfill(newnex) {
		if (this.hackfunction) {
			newnex = this.hackfunction(newnex);
		}
		let parent = this.getParent();
		let wasSelected = this.isSelected();
		parent.replaceChildWith(this, newnex);
		if (wasSelected) {
			newnex.setSelected();
		}
		// have to do this in case global render type changed while we were
		// waiting to fulfill
		newnex.setRenderType(current_render_type);
		if (!DEFER_DRAW) {
			newnex.render();
		} else {
			root.render();
//			newnex.rerenderSubtree(); // this is broken somehow
		}
		return newnex;
	}
	getEventTable(context) {
		return {
			'ShiftBackspace': 'call-delete-handler-then-remove-selected-and-select-previous-sibling',
			'Backspace': 'call-delete-handler-then-remove-selected-and-select-previous-sibling',
		}
	}
	// TODO: move tables from these unused functions into getEventTable

	getKeyFunnelVector(context) {
		return {
			'ShiftTab': 'select-parent',
			'Tab': 'select-next-sibling',
			'ArrowUp': 'move-left-up',
			'ArrowDown': 'move-right-down',
			'ArrowLeft': 'move-left-up',
			'ArrowRight': 'move-right-down',
			'ShiftBackspace': 'remove-selected-and-select-previous-sibling',
			'Backspace': 'remove-selected-and-select-previous-sibling',
			'~': 'insert-command-as-next-sibling',
			'!': 'insert-bool-as-next-sibling',
			'@': 'insert-symbol-as-next-sibling',
			'#': 'insert-integer-as-next-sibling',
			'$': 'insert-string-as-next-sibling',
			'%': 'insert-float-as-next-sibling',
			'^': 'insert-nil-as-next-sibling',
				'(': 'insert-word-as-next-sibling',
				'[': 'insert-line-as-next-sibling',
				'{': 'insert-doc-as-next-sibling',
			'defaultHandle': null
		};
	}
}