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
		if (!DEFER_DRAW) {
			this.render();
		}
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

	render(parentDomNode, thisDomNode) {
		super.render(parentDomNode, thisDomNode);
		this.domNode.classList.add('letter');
		this.domNode.classList.add('data');
		this.domNode.innerHTML = (this.value == " " ? "&nbsp;" : this.value) ;
	}

	getText() {
		return this.value;
	}

	// maybe instead of talking directly to the manipulator this could return a string
	// that represents the function to call?
	defaultHandle(key, isCommand) {
		if (!(/^.$/.test(key))) {
			throw UNHANDLED_KEY;
		};
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(key);
		// TODO: maybe allow regexes in the funnel vector?
		if (isSeparator) {
			if (isCommand) {
				manipulator.insertAfterSelectedAndSelect(new Separator(key));
			} else {
				KeyResponseFunctions['split-word-and-insert-separator'](key);
			}
		} else {
			manipulator.insertAfterSelectedAndSelect(new Letter(key));
		}
	}

	getEventTable(context) {
		var t = this;
		if (context == ContextType.COMMAND) {
			return {
				'ShiftTab': 'select-parent',
				'Tab': 'move-right-down',
				'ArrowLeft': 'move-left-up',
				'ArrowUp': 'move-left-up',
				'ArrowRight': 'move-right-down',
				'ArrowDown': 'move-right-down',
				'ShiftBackspace': 'remove-selected-and-select-previous-sibling',
				'Backspace': 'remove-selected-and-select-previous-sibling',

				// deprecated, change to insert-command-as-next-sibling
				'~': 'legacy-insert-command-as-next-sibling-of-parent',
				'!': 'legacy-insert-bool-as-next-sibling-of-parent',
				'@': 'legacy-insert-symbol-as-next-sibling-of-parent',
				'#': 'legacy-insert-integer-as-next-sibling-of-parent',
				'$': 'legacy-insert-string-as-next-sibling-of-parent',
				'%': 'legacy-insert-float-as-next-sibling-of-parent',
				'^': 'legacy-insert-nil-as-next-sibling-of-parent',
				'&': 'legacy-insert-lambda-as-next-sibling-of-parent',
				// end deprecated

				'<': 'insert-zlist-as-next-sibling',
				'(': 'insert-word-as-next-sibling',
				'[': 'insert-line-as-next-sibling',
				'{': 'insert-doc-as-next-sibling',
				defaultHandle: function(key) {
					this.defaultHandle(key, true /* is command */);
				}.bind(t)
			}
		} else if (context == ContextType.DOC) {
			return {
				'ShiftTab': 'select-parent',
				'Tab': 'move-to-next-leaf',
				'ArrowUp': 'move-to-corresponding-letter-in-previous-line',
				'ArrowDown': 'move-to-corresponding-letter-in-next-line',
				'ArrowLeft': 'move-to-previous-leaf',
				'ArrowRight': 'move-to-next-leaf',
				'ShiftBackspace': 'remove-selected-and-select-previous-leaf',
				'Backspace': 'remove-selected-and-select-previous-leaf',
				'Enter': 'do-line-break-after-letter',
				// deprecated, change to insert-command-as-next-sibling
				'~': 'legacy-insert-command-as-next-sibling-of-parent',
				// all the rest also deprecated, to be removed.
				'!': 'legacy-insert-bool-as-next-sibling-of-parent', // deprecated, remove and allow separator insert
				'@': 'legacy-insert-symbol-as-next-sibling-of-parent', // deprecated, remove and allow separator insert
				'#': 'legacy-insert-integer-as-next-sibling-of-parent', // deprecated, remove and allow separator insert
				'$': 'legacy-insert-string-as-next-sibling-of-parent', // deprecated, remove and allow separator insert
				'%': 'legacy-insert-float-as-next-sibling-of-parent', // deprecated, remove and allow separator insert
				'^': 'legacy-insert-nil-as-next-sibling-of-parent', // deprecated, remove and allow separator insert
				'&': 'legacy-insert-lambda-as-next-sibling-of-parent', // deprecated, remove and allow separator insert
				// end deprecated
				'<': 'insert-zlist-as-next-sibling',
				'(': 'insert-word-as-next-sibling',
				'[': 'insert-line-as-next-sibling',
				'{': 'insert-doc-as-next-sibling',
				defaultHandle: function(key) {
					this.defaultHandle(key, false /* is command */);
				}.bind(t)
			}
		}
	}
}
