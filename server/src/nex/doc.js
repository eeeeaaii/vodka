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
		if (!DEFER_DRAW) {
			this.render();
		}
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

	render(parentDomNode, thisDomNode) {
		super.render(parentDomNode, thisDomNode);
		this.domNode.classList.add('doc');
		this.domNode.classList.add('data');
	}
	getEventTable(context) {
		//if (context == ContextType.COMMAND) {
			return {
				'ShiftTab': 'select-parent',				
				'Tab': 'select-first-child-or-create-insertion-point',
				'ArrowLeft': 'move-left-up',
				'ArrowUp': 'move-left-up',
				'ArrowRight': 'move-right-down',
				'ArrowDown': 'move-right-down',
			}
		//}
	}


	// TODO: move tables from these unused functions into getEventTable
	getKeyFunnelVector(context) {
		if (context == ContextType.COMMAND) {
			return {
				'ShiftTab': 'select-parent',
				'Tab': 'select-first-child-or-create-insertion-point',
				'ArrowUp': 'move-left-up',
				'ArrowLeft': 'move-left-up',
				'ArrowDown': 'move-right-down',
				'ArrowRight': 'move-right-down',
				'ShiftBackspace': 'remove-selected-and-select-previous-sibling',
				'Backspace': 'remove-selected-and-select-previous-sibling',
				'~': 'insert-or-append-command',
				'!': 'insert-or-append-bool',
				'@': 'insert-or-append-symbol',
				'#': 'insert-or-append-integer',
				'$': 'insert-or-append-string',
				'%': 'insert-or-append-float',
				'^': 'insert-or-append-nil',
				'(': 'insert-or-append-word',
				'[': 'insert-or-append-line',
				'{': 'insert-or-append-doc',
				'defaultHandle': null
			};

		} else {
			let isDocFormat = (context == 'Line');
			// TODO: if you have a doc selected, and the doc is inside a line,
			// then we are in "doc format" - this means that if you type [, and
			// the doc is non-empty, the new line should NOT be appended INSIDE
			// the line that the doc is in. Rather the current line should break
			// into two lines (remaining contents of line shoved into the newly
			// created line). Typing [ in a normal doc context should act more or
			// less the same as typing the enter key, i.e. breaking the current
			// line.
			let defaultFunction = function(letter) {
				if (!(/^.$/.test(letter))) return;
				let letterRegex = /^[a-zA-Z0-9']$/;
				let isSeparator = !letterRegex.test(letter);
				if (isSeparator) {
					if (this.hasChildren()) {
						// TODO: is this wrong?
						manipulator.insertAfterSelectedAndSelect(new Separator(letter));
					} else {
						manipulator.appendAndSelect(new Line());
						manipulator.appendAndSelect(new Separator(letter));
					}							
				} else {
					if (this.hasChildren()) {
						// TODO: is this wrong?
						manipulator.insertAfterSelectedAndSelect(new Word());
						manipulator.appendAndSelect(new Letter(letter));
					} else {
						manipulator.appendAndSelect(new Line());
						manipulator.appendAndSelect(new Word());
						manipulator.appendAndSelect(new Letter(letter));
					}							
				}
			}.bind(this);
			return {
				'ShiftTab': 'select-parent',
				'Tab': 'select-first-child-or-create-insertion-point',
				'ArrowUp': 'move-left-up',
				'ArrowLeft': 'move-left-up',
				'ArrowDown': 'move-right-down',
				'ArrowRight': 'move-right-down',
				'~': 'insert-or-append-command',
				'(': 'insert-or-append-word-to-doc',
				'[': 'insert-or-append-line',
				'{': 'insert-or-append-doc-to-doc',
				'defaultHandle': defaultFunction
			};
		}
	}
}
