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

import { ContextType, ContextMapBuilder } from '../contexttype.js'
import { Nex } from './nex.js'
import { experiments } from '../globalappflags.js'
import { RENDER_FLAG_INSERT_AFTER } from '../globalconstants.js'
import { parametricFontManager } from '../pfonts/pfontmanager.js'

class Letter extends Nex {
	constructor(letter) {
		super();
		this.value = letter;
		if (experiments.DEFAULT_TO_PARAMETRIC_FONTS) {
			this.pfont = parametricFontManager.getFont('Basic', {});			
		} else {
			this.pfont = null;
		}
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

	toString(version) {
		if (version == 'v2') {
			return this.toStringV2();
		}
		return '|(' + this.value + ')|';
	}

	toStringV2() {
		return `[letter]${this.toStringV2PrivateDataSection()}${this.toStringV2TagList()}`
	}

	serializePrivateData(data) {
		return this.value;
	}

	deserializePrivateData(data) {
		this.value = data;
	}

	isLeaf() {
		return true;
	}

	getKeyFunnel() {
		return new LetterKeyFunnel(this);
	}

	renderInto(renderNode, renderFlags, withEditor) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags, withEditor);
		domNode.classList.add('letter');
		domNode.classList.add('data');
		if (renderFlags & RENDER_FLAG_INSERT_AFTER) {
			domNode.classList.add('rightinsert');
		} else {
			domNode.classList.add('leftinsert');			
		}
		if (this.pfont) {
			domNode.appendChild(this.pfont.getDomNodeFor(this.value));
		} else {
			let contents = (this.value == " " || this.value == "&nbsp;") ? "\xa0" : this.value;
			domNode.appendChild(document.createTextNode(contents));
		}
	}

	getText() {
		return this.value;
	}

	getDefaultHandler() {
		return 'insertAtLetterLevel';
	}

	getEventTable(context) {
		if (experiments.V2_INSERTION) {
			return {
				'Tab': 'move-to-next-leaf',
				'ArrowUp': 'move-to-corresponding-letter-in-previous-line-v2',
				'ArrowDown': 'move-to-corresponding-letter-in-next-line-v2',
				'ArrowLeft': 'move-to-previous-leaf-v2',
				'ArrowRight': 'move-to-next-leaf-v2',
				'Backspace' : 'delete-letter-v2',
				'ShiftBackspace' : 'delete-letter-v2',
				'Enter': 'do-line-break-for-letter-v2',
				// // deprecated, change to insert-command-as-next-sibling
				// '~': 'legacy-insert-command-as-next-sibling-of-parent',
				// // all the rest also deprecated, to be removed.
				// '!': 'legacy-insert-bool-as-next-sibling-of-parent', // deprecated, remove and allow separator insert
				// '@': 'legacy-insert-symbol-as-next-sibling-of-parent', // deprecated, remove and allow separator insert
				// '#': 'legacy-insert-integer-as-next-sibling-of-parent', // deprecated, remove and allow separator insert
				// '$': 'legacy-insert-string-as-next-sibling-of-parent', // deprecated, remove and allow separator insert
				// '%': 'legacy-insert-float-as-next-sibling-of-parent', // deprecated, remove and allow separator insert
				// '^': 'legacy-insert-nil-as-next-sibling-of-parent', // deprecated, remove and allow separator insert
				// '&': 'legacy-insert-lambda-as-next-sibling-of-parent', // deprecated, remove and allow separator insert
				// '*': 'legacy-insert-expectation-as-next-sibling-of-parent', // deprecated, remove and allow separator insert
				// end deprecated

				// '(': 'insert-word-as-next-sibling',
				// '[': 'insert-line-as-next-sibling',
				// '{': 'insert-doc-as-next-sibling',

				// experimental
				// '<': 'insert-zlist-as-next-sibling',
				// '*': 'insert-type-as-next-sibling',
			}
		} else {
			return {
				'Tab': 'move-to-next-leaf',
				'ArrowUp': 'move-to-corresponding-letter-in-previous-line',
				'ArrowDown': 'move-to-corresponding-letter-in-next-line',
				'ArrowLeft': 'move-to-previous-leaf',
				'ArrowRight': 'move-to-next-leaf',
				'ShiftBackspace' : new ContextMapBuilder()
						.add(ContextType.DEFAULT, 'remove-selected-and-select-previous-sibling')
						.add(ContextType.WORD, 'remove-selected-and-select-previous-leaf')
						.build(),
				'Backspace' : new ContextMapBuilder()
						.add(ContextType.DEFAULT, 'remove-selected-and-select-previous-sibling')
						.add(ContextType.WORD, 'remove-selected-and-select-previous-leaf')
						.build(),
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
}

export { Letter }

