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
		this.render();
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

	render() {
		super.render();
		this.domNode.classList.add('line');
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
		let docDefaultFunction = function(letter) {
			if (!(/^.$/.test(letter))) return;
			let letterRegex = /^[a-zA-Z0-9']$/;
			let isSeparator = !letterRegex.test(letter);
			if (isSeparator) {
				manipulator.appendAndSelect(new Separator(letter));
			} else {
				if (this.hasChildren()) {
					manipulator.selectLastChild()
						&& manipulator.appendAndSelect(new Letter(letter));
				} else {
					manipulator.appendAndSelect(new Word());
					manipulator.appendAndSelect(new Letter(letter));
				}							
			}
		}.bind(this);
		let commandDefaultFunction = function(letter) {
			if (!(/^.$/.test(letter))) return;
			let letterRegex = /^[a-zA-Z0-9']$/;
			let isSeparator = !letterRegex.test(letter);
			if (isSeparator) {
				if (this.hasChildren()) {
					manipulator.insertAfterSelectedAndSelect(new Separator(letter));
				} else {
					manipulator.appendAndSelect(new Separator(letter));
				}							
			} else {
				if (this.hasChildren()) {
					manipulator.insertAfterSelectedAndSelect(new Letter(letter));
				} else {
					manipulator.appendAndSelect(new Word());
					manipulator.appendAndSelect(new Letter(letter));
				}							
			}
		}.bind(this);
		if (context == ContextType.DOC) {
			return {
				'ShiftTab': 'select-parent',
				'Tab': 'select-first-child-or-create-insertion-point',
				'ArrowUp': 'move-left-up',
				'ArrowLeft': 'move-left-up',
				'ArrowDown': 'move-right-down',
				'ArrowRight': 'move-right-down',
				'~': 'insert-or-append-command',
				'ShiftBackspace': 'remove-if-empty',
				'Backspace': 'remove-if-empty',
				'Enter': 'just-make-new-line',
				'defaultHandle': docDefaultFunction
			};
		} else { // probably command
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
				'defaultHandle': commandDefaultFunction
			};			
		}
	}
}
