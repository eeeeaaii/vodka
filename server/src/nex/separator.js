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

class Separator extends Letter {
	constructor(letter) {
		super(letter);
		this.render();
	}

	// makeCopy is same as superclass

	toString() {
		return '|[' + this.value + ']|';
	}

	getKeyFunnel() {
		return new SeparatorKeyFunnel(this);
	}

	render() {
		super.render();
		this.domNode.classList.add('separator');
		this.domNode.classList.add('data');
	}
	getEventTable(context) {
		return null;
	}
	// TODO: move tables from these unused functions into getEventTable
	getKeyFunnelVector(context) {
		if (context == ContextType.LINE) {
			let defaultFunction = function(letter) {
				if (!(/^.$/.test(letter))) return;
				let letterRegex = /^[a-zA-Z0-9']$/;
				let isSeparator = !letterRegex.test(letter);
				// TODO: maybe allow regexes in the funnel vector?
				if (isSeparator) {
					manipulator.insertAfterSelectedAndSelect(new Separator(letter));
				} else {
					KeyResponseFunctions['insert-letter-after-separator'](letter);
				}
			}.bind(this);
			return {
				'ShiftTab': 'select-parent',
				'Tab': 'select-next-sibling',
				'ArrowUp': 'move-to-corresponding-letter-in-previous-line',
				'ArrowDown': 'move-to-corresponding-letter-in-next-line',
				'ArrowLeft': 'move-to-previous-leaf',
				'ArrowRight': 'move-to-next-leaf',
				'ShiftBackspace': 'remove-selected-and-select-previous-leaf',
				'Backspace': 'remove-selected-and-select-previous-leaf',
				'~': 'insert-command-as-next-sibling',
				'Enter': 'create-new-line-from-inside-line',
				'defaultHandle': defaultFunction
			};
		} else if (context == ContextType.COMMAND) {
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