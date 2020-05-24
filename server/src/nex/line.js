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


import { ContextType } from '../contexttype.js'
import { manipulator } from '../vodka.js'
import { NexContainer } from './nexcontainer.js'
import { isNormallyHandled } from '../keyresponsefunctions.js'

// remove with deprecated defaultHandle
import { Word } from './word.js'
import { Separator } from './separator.js'
import { Letter } from './letter.js'
import { EError } from './eerror.js'

class Line extends NexContainer {
	constructor() {
		super();
	}

	getTypeName() {
		return '-line-';
	}

	makeCopy(shallow) {
		let r = new Line();
		this.copyChildrenTo(r, shallow);
		this.copyFieldsTo(r);
		return r;
	}

	toString() {
		return '[' + super.childrenToString() + ']';
	}

	getValueAsString() {
		let s = '';
		this.doForEachChild(c => {
			if (c.getTypeName() == '-letter-') {
				s += c.getText();
			} else if (c.getTypeName() == '-separator-') {
				s += c.getText();
			} else if (c.getTypeName() == '-newline-') {
				s += '\n';
			} else if (c.getTypeName() == '-word-') {
				s += c.getValueAsString();
			} else {
				throw new EError('cannot convert line to string, invalid format');
			}
		});
		return s;
	}

	getKeyFunnelForContext(context) {
		if (context == KeyContext.DOC) {
			return new LineKeyFunnel(this);
		}
		return null;
	}

	getContextType() {
		return ContextType.LINE;
	}

	// deprecated
	getKeyFunnel() {
		return new LineKeyFunnel(this);
	}

	renderInto(renderNode, renderFlags) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags);
		domNode.classList.add('line');
		domNode.classList.add('data');
	}

	getEventOverrides() {
		return {
			'-newline-': {
				'Tab': 'move-to-next-leaf',
				'ArrowUp': 'move-to-corresponding-letter-in-previous-line',
				'ArrowDown': 'move-to-corresponding-letter-in-next-line',
				'ArrowLeft': 'move-to-previous-leaf',
				'ArrowRight': 'move-to-next-leaf',
				'Enter': 'do-line-break-after-letter'
			},
			'*': {
				'Enter': 'do-line-break-in-line'
			}
		}
	}

	defaultHandle(txt) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);
		if (isSeparator) {
			manipulator.appendAndSelect(new Separator(txt));
		} else {
			if (manipulator.selectLastChild()) {
				selectedNex.appendChild(new Letter(txt));
			} else {
				let w = new Word();
				w.appendChild(new Letter(txt));
				manipulator.appendAndSelect(w);
			}
		}
		return true;
	}

	getEventTable(context) {
		return {
			'ShiftBackspace': 'remove-selected-and-select-previous-leaf',
			'Backspace': 'remove-selected-and-select-previous-leaf',
			'Enter': 'do-line-break-from-line',
			'~': 'insert-command-as-next-sibling',
			'!': 'insert-bool-as-next-sibling',
			'@': 'insert-symbol-as-next-sibling',
			'#': 'insert-integer-as-next-sibling',
			'$': 'insert-string-as-next-sibling',
			'%': 'insert-float-as-next-sibling',
			'^': 'insert-nil-as-next-sibling',
			'&': 'insert-lambda-as-next-sibling',
			'*': 'insert-expectation-as-next-sibling',
			'(': 'insert-word-as-next-sibling',
			'[': 'insert-line-as-next-sibling',
			'{': 'insert-doc-as-next-sibling',
		}
	}
}

export { Line }

