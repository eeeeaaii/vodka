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

import { Letter } from './letter.js'
import { experiments } from '../globalappflags.js'
import { RENDER_FLAG_INSERT_AFTER } from '../globalconstants.js'

class Separator extends Letter {
	constructor(letter) {
		super(letter);
	}

	makeCopy() {
		let r = new Separator(this.value);
		this.copyFieldsTo(r);
		return r;
	}

	getTypeName() {
		return '-separator-';
	}

	// makeCopy is same as superclass

	toString(version) {
		if (version == 'v2') {
			return this.toStringV2();
		}
		return '|[' + this.value + ']|';
	}

	toStringV2() {
		return `[${this.toStringV2Literal()}separator]${this.toStringV2PrivateDataSection(this.value)}${this.toStringV2TagList()}`
	}

	getKeyFunnel() {
		return new SeparatorKeyFunnel(this);
	}

	renderInto(renderNode, renderFlags, withEditor) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags, withEditor);
		domNode.classList.add('separator');
		domNode.classList.add('data');
		if (renderFlags & RENDER_FLAG_INSERT_AFTER) {
			domNode.classList.add('rightinsert');
		} else {
			domNode.classList.add('leftinsert');			
		}
	}

	getEventTable(context) {
		return null;
	}

	getDefaultHandler() {
		return 'separatorDefault';
	}

	getEventTable() {
		return {
			'Tab': 'move-to-next-leaf',
			'ArrowUp': 'move-to-corresponding-letter-in-previous-line',
			'ArrowDown': 'move-to-corresponding-letter-in-next-line',
			'ArrowLeft': 'move-to-previous-leaf',
			'ArrowRight': 'move-to-next-leaf',
			'ShiftBackspace': 'delete-separator',
			'Backspace': 'delete-separator',
			'Enter': 'do-line-break-for-separator',

			'!': (experiments.BETTER_KEYBINDINGS ? 'insert-actual-!-at-insertion-point-from-separator' : null),
			'@': (experiments.BETTER_KEYBINDINGS ? 'insert-actual-@-at-insertion-point-from-separator' : null),
			'#': (experiments.BETTER_KEYBINDINGS ? 'insert-actual-#-at-insertion-point-from-separator' : null),
			'$': (experiments.BETTER_KEYBINDINGS ? 'insert-actual-$-at-insertion-point-from-separator' : null),
			'%': (experiments.BETTER_KEYBINDINGS ? 'insert-actual-%-at-insertion-point-from-separator' : null),
			'^': (experiments.BETTER_KEYBINDINGS ? 'insert-actual-^-at-insertion-point-from-separator' : null),
			'&': (experiments.BETTER_KEYBINDINGS ? 'insert-actual-&-at-insertion-point-from-separator' : null),
			'*': (experiments.BETTER_KEYBINDINGS ? 'insert-actual-*-at-insertion-point-from-separator' : null),
			'(': (experiments.BETTER_KEYBINDINGS ? 'insert-actual-(-at-insertion-point-from-separator' : null),
			')': (experiments.BETTER_KEYBINDINGS ? 'insert-actual-)-at-insertion-point-from-separator' : null),
			'[': (experiments.BETTER_KEYBINDINGS ? 'insert-actual-[-at-insertion-point-from-separator' : null),
			'{': (experiments.BETTER_KEYBINDINGS ? 'insert-actual-{-at-insertion-point-from-separator' : null),
			'<': (experiments.BETTER_KEYBINDINGS ? 'insert-actual-<-at-insertion-point-from-separator' : null),
		}
	}
}

export { Separator }

