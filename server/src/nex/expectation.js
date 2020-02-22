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

	fulfill(newnex) {
		if (this.hackfunction) {
			newnex = this.hackfunction(newnex);
		}
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
		return newnex;
	}
	getEventTable(context) {
		let defaultHandle = function(txt) {
			if (!(/^.$/.test(txt))) {
				return;
			}
			let letterRegex = /^[a-zA-Z0-9']$/;
			let isSeparator = !letterRegex.test(txt);

			if (isSeparator) {
				manipulator.replaceSelectedWith(new Separator(txt));
			} else {
				manipulator.replaceSelectedWith(new Letter(txt));
			}
		}.bind(this);
		// most of these have no tests?
		return {
			'ShiftTab': 'select-parent',
			'Tab': 'select-first-child-or-fail',
			'ArrowUp': 'move-left-up',
			'ArrowLeft': 'move-left-up',
			'ArrowDown': 'move-right-down',
			'ArrowRight': 'move-right-down',
			'ShiftEnter': 'evaluate-nex',
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
			'defaultHandle': defaultHandle,
			// special stuff for expectations that gets rid of the js timeout
			'ShiftBackspace': 'call-delete-handler-then-remove-selected-and-select-previous-sibling',
			'Backspace': 'call-delete-handler-then-remove-selected-and-select-previous-sibling',
		}
	}
}