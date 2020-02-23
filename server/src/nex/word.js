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

class Word extends NexContainer {
	constructor() {
		super();
	}

	makeCopy() {
		let r = new Word();
		this.copyFieldsTo(r);
		return r;
	}

	toString() {
		return '(' + super.childrenToString() + ')';
	}

	// deprecated, words should not create a doc context,
	// but it's needed for legacy behavior.
	getContextType() {
		return ContextType.DOC;
	}

	getValueAsString() {
		let s = '';
		for (let i = 0; i < this.children.length; i++) {
			let c = this.children[i];
			if (!(c instanceof Letter)) {
				throw new EError('cannot convert word to string, invalid format');
			}
			s += c.getText();
		}
		return s;
	}

	getKeyFunnel() {
		return new WordKeyFunnel(this);
	}

	renderInto(domNode, renderFlags) {
		let toPassToSuperclass = domNode;
		if (RENDERNODES) {
			// change param name
			domNode = domNode.getDomNode();
		}
		super.renderInto(toPassToSuperclass, renderFlags);
		domNode.classList.add('word');
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
				manipulator.insertAfterSelectedAndSelect(new Separator(letter));
			} else {
				if (manipulator.selectLastChild()) {
					manipulator.insertAfterSelectedAndSelect(new Letter(letter));
				} else {
					manipulator.appendAndSelect(new Letter(letter))
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
			'Enter': 'do-line-break-always',
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
