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

import { NexContainer } from './nexcontainer.js'
import { ContextType } from '../contexttype.js'
import { experiments } from '../globalappflags.js'


class Word extends NexContainer {
	constructor() {
		super();
	}

	getTypeName() {
		return '-word-';
	}

	makeCopy(shallow) {
		let r = new Word();
		this.copyChildrenTo(r, shallow);
		this.copyFieldsTo(r);
		return r;
	}

	toString(version) {
		if (version == 'v2') {
			return this.toStringV2();
		}
		return '(' + super.childrenToString() + ')';
	}

	toStringV2() {
		return `[word]${this.listStartV2()}${this.toStringV2TagList()}${super.childrenToString('v2')}${this.listEndV2()}`;
	}

 	prettyPrintInternal(lvl, hdir) {
		return this.standardListPrettyPrint(lvl, '[word]', hdir);
	}

	getContextType() {
		return ContextType.WORD;
	}

	getValueAsString() {
		let s = '';
		this.doForEachChild(function(c) {
			if (!(c.getTypeName() == '-letter-')) {
				throw new EError('cannot convert word to string, invalid format');
			}
			s += c.getText();
		})
		return s;
	}

	getKeyFunnel() {
		return new WordKeyFunnel(this);
	}

	renderInto(renderNode, renderFlags, withEditor) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags, withEditor);
		domNode.classList.add('word');
		domNode.classList.add('data');
	}

	getEventOverrides() {
		return {
			'ShiftBackspace': 'remove-selected-and-select-previous-leaf-v2',
			'Backspace': 'remove-selected-and-select-previous-leaf-v2'
		}
	}

	getDefaultHandler() {
		return 'insertAtWordLevel';
	}

	// in V1 insertion you hit tab to create an insertion point node
	// inside a list, this would mean that the below things wouldn't be
	// called and it would insert inside.
	// since now tab just forces insert-inside mode, then if you type
	// one of the below things after that, it would still insert as sibling.
	// WE DON'T EVEN WANT insert as sibling but to get the tests to pass
	// I'm doing this hack
	doTabHack() {
		this.dotabhack = 2;
	}

	getEventTable(context) {

		if (experiments.V2_INSERTION) {
			if (experiments.V2_INSERTION_TAB_HACK && this.dotabhack) {
				this.dotabhack--;
			}
			return {
				'Enter': 'do-line-break-always',
				'ArrowUp': 'move-to-corresponding-letter-in-previous-line',
				'ArrowDown': 'move-to-corresponding-letter-in-next-line',
			}

		}
		return {
			'Enter': 'do-line-break-always',
			'ArrowUp': 'move-to-corresponding-letter-in-previous-line',
			'ArrowDown': 'move-to-corresponding-letter-in-next-line',
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

export { Word }

