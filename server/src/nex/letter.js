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



class Letter extends Nex {
	constructor(letter) {
		super();
		this.value = letter;
		if (letter == '') {
			throw new Error('cannot have an empty letter');
		}
		this.render();
	}

	makeCopy() {
		let r = new Letter(this.value);
		this.copyFieldsTo(r);
		return r;
	}

	toString() {
		return '|(' + this.value + ')|';
	}

	isLeaf() {
		return true;
	}

	getKeyFunnel() {
		return new LetterKeyFunnel(this);
	}

	render() {
		super.render();
		this.domNode.classList.add('letter');
		this.domNode.classList.add('data');
		this.domNode.innerHTML = (this.value == " " ? "&nbsp;" : this.value) ;
	}

	getText() {
		return this.value;
	}
	getEventTable(context) {
		let r = {
			'ShiftTab': 'select-parent',
			'Tab': 'move-right-down',
			'ArrowLeft': 'move-left-up',
			'ArrowUp': 'move-left-up',
			'ArrowRight': 'move-right-down',
			'ArrowDown': 'move-right-down',
			'<': 'insert-zlist-as-next-sibling',
		}
		if (context == ContextType.WORD) {
			r = {
				'ShiftTab': 'select-parent',
				'Tab': 'move-to-next-leaf',
				'ArrowUp': 'move-to-corresponding-letter-in-previous-line',
				'ArrowDown': 'move-to-corresponding-letter-in-next-line',
				'ArrowLeft': 'move-to-previous-leaf',
				'ArrowRight': 'move-to-next-leaf',
				'<': 'insert-zlist-as-next-sibling',
			}
		}
		return r;
	}
	// TODO: move tables from these unused functions into getEventTable
	getKeyFunnelVector(context) {
		if (context == ContextType.WORD) {
			let defaultFunction = function(letter) {
				if (!(/^.$/.test(letter))) return;
				let letterRegex = /^[a-zA-Z0-9']$/;
				let isSeparator = !letterRegex.test(letter);
				// TODO: maybe allow regexes in the funnel vector?
				if (isSeparator) {
					KeyResponseFunctions['split-word-and-insert-separator'](letter);
				} else {
					manipulator.insertAfterSelectedAndSelect(new Letter(letter));
				}
			}.bind(this);
			return {
				'ShiftTab': 'select-parent',
				'Tab': 'select-next-sibling',
				'ArrowUp': 'move-to-corresponding-letter-in-previous-line',
				'ArrowDown': 'move-to-corresponding-letter-in-next-line',
				'ArrowLeft': 'move-to-previous-leaf',
				'ArrowRight': 'move-to-next-leaf',
				'ShiftBackspace': 'remove-selected-letter-and-select-previous-leaf',
				'Backspace': 'remove-selected-letter-and-select-previous-leaf',
				'~': 'insert-command-as-next-sibling',
				'Enter': 'create-new-line-from-inside-word',
				'defaultHandle': defaultFunction
			};
		} else if (context == ContextType.COMMAND) {
			let commandDefaultFunction = function(letter) {
				if (!(/^.$/.test(letter))) return;
				let letterRegex = /^[a-zA-Z0-9']$/;
				let isSeparator = !letterRegex.test(letter);
				if (isSeparator) {
					manipulator.insertAfterSelectedAndSelect(new Separator(letter));
				} else {
					manipulator.insertAfterSelectedAndSelect(new Letter(letter));
				}
			}.bind(this);
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
				'defaultHandle': commandDefaultFunction
			};
		} else {
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
				'defaultHandle': null
			};
		}
	}
}
