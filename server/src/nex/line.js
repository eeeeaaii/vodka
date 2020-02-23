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



class Line extends NexContainer {
	constructor() {
		super();
	}

	makeCopy() {
		let r = new Line();
		this.copyFieldsTo(r);
		return r;
	}

	toString() {
		return '[' + super.childrenToString() + ']';
	}

	getValueAsString() {
		let s = '';
		for (let i = 0; i < this.children.length; i++) {
			let c = this.children[i];
			if (c instanceof Letter) { // erm the space character is a letter ugh
				s += c.getText();
			} else if (c instanceof Word) {
				s += c.getValueAsString();
			} else {
				throw new EError('cannot convert line to string, invalid format');
			}
		}
		return s;
	}

	getKeyFunnelForContext(context) {
		if (context == KeyContext.DOC) {
			return new LineKeyFunnel(this);
		}
		return null;
	}

	getContextType() {
		return ContextType.DOC;
	}

	// deprecated
	getKeyFunnel() {
		return new LineKeyFunnel(this);
	}

	renderInto(domNode, shallow) {
		let toPassToSuperclass = domNode;
		if (RENDERNODES) {
			// change param name
			domNode = domNode.getDomNode();
		}
		super.renderInto(toPassToSuperclass, shallow);
		domNode.classList.add('line');
		domNode.classList.add('data');
		if (!RENDERNODES) {
			this.renderTags(domNode, shallow);
		}

	}

	getEventTable(context) {
		let defaultFunction = function(letter) {
			if (!(/^.$/.test(letter))) return;
			let letterRegex = /^[a-zA-Z0-9']$/;
			let isSeparator = !letterRegex.test(letter);
			if (isSeparator) {
				manipulator.appendAndSelect(new Separator(letter));
			} else {
				if (manipulator.selectLastChild()) {
					selectedNex.appendChild(new Letter(letter));
				} else {
					let w = new Word();
					w.appendChild(new Letter(letter));
					manipulator.appendAndSelect(w);
				}
			}
		}
		return {
			'ShiftTab': 'select-parent',				
			'Tab': 'select-first-child-or-create-insertion-point',
			'ArrowLeft': 'move-left-up',
			'ArrowUp': 'move-left-up',
			'ArrowRight': 'move-right-down',
			'ArrowDown': 'move-right-down',
			'ShiftBackspace': 'remove-selected-and-select-previous-leaf',
			'Backspace': 'remove-selected-and-select-previous-leaf',
			'ShiftEnter': 'evaluate-nex',
			'Enter': 'do-line-break-from-line',
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
			'defaultHandle': defaultFunction
		}
	}
}
