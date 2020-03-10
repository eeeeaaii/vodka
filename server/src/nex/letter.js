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
	}

	getTypeName() {
		return '-letter-';
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

	renderInto(renderNode, renderFlags, skipTags) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags);
		domNode.classList.add('letter');
		domNode.classList.add('data');
		domNode.innerHTML = (this.value == " " ? "&nbsp;" : this.value) ;
	}

	getText() {
		return this.value;
	}

	// maybe instead of talking directly to the manipulator this could return a string
	// that represents the function to call?
	defaultHandle(txt, context) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		// zlists are experimental I guess?
		if (txt == '<') {
			return false;
		}
		let isCommand = (context == ContextType.COMMAND);
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);
		// TODO: maybe allow regexes in the funnel vector?
		if (isSeparator) {
			if (isCommand) {
				manipulator.insertAfterSelectedAndSelect(new Separator(txt));
			} else {
				KeyResponseFunctions['split-word-and-insert-separator'](txt);
			}
		} else {
			manipulator.insertAfterSelectedAndSelect(new Letter(txt));
		}
		return true;
	}

	getEventTable(context) {
		return {
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
			'*': 'legacy-insert-expectation-as-next-sibling-of-parent', // deprecated, remove and allow separator insert
			// end deprecated

			'(': 'insert-word-as-next-sibling',
			'[': 'insert-line-as-next-sibling',
			'{': 'insert-doc-as-next-sibling',

			// experimental
			'<': 'insert-zlist-as-next-sibling',
			'*': 'insert-type-as-next-sibling',
		}
	}
}
