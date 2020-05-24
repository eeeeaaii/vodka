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

import { manipulator } from '../vodka.js'
import { isNormallyHandled } from '../keyresponsefunctions.js'
import { ContextType } from '../contexttype.js'
import { UNHANDLED_KEY } from '../vodka.js'

// remove with deprecated defaultHandle
import { Letter } from './letter.js'
import { KeyResponseFunctions } from '../keyresponsefunctions.js'

class Separator extends Letter {
	constructor(letter) {
		super(letter);
	}

	getTypeName() {
		return '-separator-';
	}
	// makeCopy is same as superclass

	toString() {
		return '|[' + this.value + ']|';
	}

	getKeyFunnel() {
		return new SeparatorKeyFunnel(this);
	}

	renderInto(renderNode, renderFlags) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags, true /* skip tags hack */);
		domNode.classList.add('separator');
		domNode.classList.add('data');
	}

	getEventTable(context) {
		return null;
	}

	defaultHandle(txt, context) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let isLine = (context == ContextType.LINE)
		if (!(/^.$/.test(txt))) {
			throw UNHANDLED_KEY;
		};
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);
		if (isSeparator) {
			manipulator.insertAfterSelectedAndSelect(new Separator(txt));
		} else {
			if (isLine) {
				KeyResponseFunctions['insert-letter-after-separator'](txt);
			} else {
				manipulator.insertAfterSelectedAndSelect(new Letter(txt));
			}
		}
		return true;
	}

	getEventTable() {
		return {
			'Tab': 'move-to-next-leaf',
			'ArrowUp': 'move-to-corresponding-letter-in-previous-line',
			'ArrowDown': 'move-to-corresponding-letter-in-next-line',
			'ArrowLeft': 'move-to-previous-leaf',
			'ArrowRight': 'move-to-next-leaf',
			'ShiftBackspace': 'remove-separator-and-possibly-join-words',
			'Backspace': 'remove-separator-and-possibly-join-words',
			'Enter': 'do-line-break-after-letter',
			// all the rest also deprecated, to be removed.
			// end deprecated
			'<': 'insert-zlist-as-next-sibling',
		}
	}
}

export { Separator }

