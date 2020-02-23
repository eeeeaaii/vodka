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



class Doc extends NexContainer {
	constructor() {
		super();
	}

	makeCopy() {
		let r = new Doc();
		this.copyFieldsTo(r);
		return r;
	}

	getValueAsString() {
		let s = '';
		for (let i = 0; i < this.children.length; i++) {
			let c = this.children[i];
			if (c instanceof Line) {
				s += c.getValueAsString();
			} else {
				throw new EError('cannot convert doc to string, invalid format');
			}
		}
		return s;
	}

	toString() {
		return '{' + super.childrenToString() + '}';
	}

	getContextType() {
		return ContextType.DOC;
	}

	getKeyFunnel() {
		return new DocKeyFunnel(this);
	}

	renderInto(domNode, renderFlags) {
		let toPassToSuperclass = domNode;
		if (RENDERNODES) {
			// change param name
			domNode = domNode.getDomNode();
		}
		super.renderInto(toPassToSuperclass, renderFlags);
		domNode.classList.add('doc');
		domNode.classList.add('data');
		if (!RENDERNODES) {
			this.renderTags(domNode, renderFlags);
		}
	}

	getEventTable(context) {
		let defaultFunction = function(letter) {
			if (!(/^.$/.test(letter))) return;
			let letterRegex = /^[a-zA-Z0-9']$/;
			let isSeparator = !letterRegex.test(letter);
			if (isSeparator) {
				KeyResponseFunctions['append-separator-to-doc'](letter);
			} else {
				KeyResponseFunctions['append-letter-to-doc'](letter);
			}
		}
		return {
			'ShiftTab': 'select-parent',				
			'Tab': 'select-first-child-or-create-insertion-point',
			'ArrowLeft': 'move-left-up',
			'ArrowUp': 'move-left-up',
			'ArrowRight': 'move-right-down',
			'ArrowDown': 'move-right-down',
			'ShiftBackspace': 'remove-selected-and-select-previous-sibling',
			'Backspace': 'remove-selected-and-select-previous-sibling',
			'ShiftEnter': 'evaluate-nex',
			'Enter': 'do-line-break-always',
			'~': 'insert-or-append-command',
			'!': 'insert-or-append-bool',
			'@': 'insert-or-append-symbol',
			'#': 'insert-or-append-integer',
			'$': 'insert-or-append-string',
			'%': 'insert-or-append-float',
			'^': 'insert-or-append-nil',
			'(': 'insert-word-as-next-sibling',
			'[': 'insert-line-as-next-sibling',
			'{': 'insert-doc-as-next-sibling',
			'defaultHandle': defaultFunction
		}
	}
}
