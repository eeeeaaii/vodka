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
	}

	// makeCopy is same as superclass

	toString() {
		return '|[' + this.value + ']|';
	}

	getKeyFunnel() {
		return new SeparatorKeyFunnel(this);
	}

	renderInto(domNode, renderFlags) {
		let toPassToSuperclass = domNode;
		if (RENDERNODES) {
			// change param name
			domNode = domNode.getDomNode();
		}
		super.renderInto(toPassToSuperclass, renderFlags, true /* skip tags hack */);
		domNode.classList.add('separator');
		domNode.classList.add('data');
		if (!RENDERNODES) {
			this.renderTags(domNode, renderFlags);
		}
	}

	getEventTable(context) {
		return null;
	}

	// TODO: maybe allow regexes in the funnel vector?
	defaultHandle(key, isCommand) {
		if (!(/^.$/.test(key))) {
			throw UNHANDLED_KEY;
		};
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(key);
		// TODO: maybe allow regexes in the funnel vector?
		if (isSeparator) {
			manipulator.insertAfterSelectedAndSelect(new Separator(key));
		} else {
			if (isCommand) {
				manipulator.insertAfterSelectedAndSelect(new Letter(key));
			} else {
				KeyResponseFunctions['insert-letter-after-separator'](key);
			}
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
				'~': 'insert-command-as-next-sibling',
				'!': 'insert-bool-as-next-sibling',
				'@': 'insert-symbol-as-next-sibling',
				'#': 'insert-integer-as-next-sibling',
				'$': 'insert-string-as-next-sibling',
				'%': 'insert-float-as-next-sibling',
				'^': 'insert-nil-as-next-sibling',
				'&': 'insert-lambda-as-next-sibling',
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
				'ShiftBackspace': 'remove-separator-and-possibly-join-words',
				'Backspace': 'remove-separator-and-possibly-join-words',
				'Enter': 'do-line-break-after-letter',
				'~': 'insert-command-as-next-sibling',
				// all the rest also deprecated, to be removed.
				'!': 'insert-bool-as-next-sibling',
				'@': 'insert-symbol-as-next-sibling',
				'#': 'insert-integer-as-next-sibling',
				'$': 'insert-string-as-next-sibling',
				'%': 'insert-float-as-next-sibling',
				'^': 'insert-nil-as-next-sibling',
				'&': 'insert-lambda-as-next-sibling',
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