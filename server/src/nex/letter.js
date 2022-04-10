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
import { otherflags } from '../globalappflags.js'
import { RENDER_FLAG_INSERT_AFTER } from '../globalconstants.js'
import { parametricFontManager } from '../pfonts/pfontmanager.js'
import { experiments } from '../globalappflags.js'

class Letter extends Nex {
	constructor(letter) {
		super();
		this.value = letter;
		if (otherflags.DEFAULT_TO_PARAMETRIC_FONTS) {
			this.pfont = parametricFontManager.getFont('Basic', {}, {});	
			this.pfont.setLetter(this.value);		
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

	copyFieldsTo(nex) {
		super.copyFieldsTo(nex);
		if (this.pfont) {
			nex.pfont = this.pfont.copy();
		}
	}

	setPfont(pfstring) {
		if (this.pfont && parametricFontManager.isSameFont(this.pfont, pfstring)) {
			parametricFontManager.redrawFontStringInFont(this.pfont, pfstring);
		} else {
			this.pfont = parametricFontManager.getFontForString(pfstring);
			this.pfont.setLetter(this.value);		
		}
		this.setDirtyForRendering(true);
	}

	toString(version) {
		if (version == 'v2') {
			return this.toStringV2();
		}
		return '|(' + this.value + ')|';
	}

	toStringV2() {
		return `[${this.toStringV2Literal()}letter]${this.toStringV2PrivateDataSection()}${this.toStringV2TagList()}`
	}

	serializePrivateData(data) {
		let style = this.getCurrentStyle();
		if (style) {
			return `${this.value}|${this.getCurrentStyle()}`;
		} else {
			return `${this.value}`;
		}
	}

	deserializePrivateData(data) {
		let a = data.split('|');
		this.value = a[0];
		if (a.length > 1) {
			this.setCurrentStyle(a[1]);
		}
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
			domNode.appendChild(this.pfont.drawIntoDomNode(this.value));
		} else {
			let contents = (this.value == " " || this.value == "&nbsp;") ? "\xa0" : this.value;
			domNode.appendChild(document.createTextNode(contents));
		}
	}

	getText() {
		return this.value;
	}

	getDefaultHandler() {
		return 'letterDefault';
	}

	getEventTable(context) {
		return {
			'Tab': 'move-to-next-leaf-v2',
			'ArrowUp': 'move-to-corresponding-letter-in-previous-line-v2',
			'ArrowDown': 'move-to-corresponding-letter-in-next-line-v2',
			'ArrowLeft': 'move-to-previous-leaf-v2',
			'ArrowRight': 'move-to-next-leaf-v2',
			'Backspace' : 'delete-letter-v2',
			'ShiftBackspace' : 'delete-letter-v2',
			'Enter': 'do-line-break-for-letter-v2',

			'!': (experiments.BETTER_KEYBINDINGS ? 'insert-actual-!-at-insertion-point-from-letter' : null),
			'@': (experiments.BETTER_KEYBINDINGS ? 'insert-actual-@-at-insertion-point-from-letter' : null),
			'#': (experiments.BETTER_KEYBINDINGS ? 'insert-actual-#-at-insertion-point-from-letter' : null),
			'$': (experiments.BETTER_KEYBINDINGS ? 'insert-actual-$-at-insertion-point-from-letter' : null),
			'%': (experiments.BETTER_KEYBINDINGS ? 'insert-actual-%-at-insertion-point-from-letter' : null),
			'^': (experiments.BETTER_KEYBINDINGS ? 'insert-actual-^-at-insertion-point-from-letter' : null),
			'&': (experiments.BETTER_KEYBINDINGS ? 'insert-actual-&-at-insertion-point-from-letter' : null),
			'*': (experiments.BETTER_KEYBINDINGS ? 'insert-actual-*-at-insertion-point-from-letter' : null),
			'(': (experiments.BETTER_KEYBINDINGS ? 'insert-actual-(-at-insertion-point-from-letter' : null),
			')': (experiments.BETTER_KEYBINDINGS ? 'insert-actual-)-at-insertion-point-from-letter' : null),
			'[': (experiments.BETTER_KEYBINDINGS ? 'insert-actual-[-at-insertion-point-from-letter' : null),
			'{': (experiments.BETTER_KEYBINDINGS ? 'insert-actual-{-at-insertion-point-from-letter' : null),
			'<': (experiments.BETTER_KEYBINDINGS ? 'insert-actual-<-at-insertion-point-from-letter' : null),
		}
	}
}

export { Letter }

