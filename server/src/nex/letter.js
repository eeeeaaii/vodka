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
import { RENDER_FLAG_INSERT_AFTER, RENDER_FLAG_EXPLODED } from '../globalconstants.js'
import { parametricFontManager } from '../pfonts/pfontmanager.js'
import { restorePfontFromFile } from '../pfonts/pfontnex.js'
import { experiments } from '../globalappflags.js'
import { heap } from '../heap.js'
import { constructFatalError } from './eerror.js'

class Letter extends Nex {
	constructor(letter) {
		super();
		this.letterValue = letter;
		// The string, so it can be saved, and the Font it resolved to, which
		// is shared with everything else the same string was applied to.
		// A plain string rather than a HeapString like a word's: there are a
		// lot of letters, and this is nearly always the same string object as
		// their word's.
		// (comment by Claude)
		this.pfstring = '';
		this.pfont = null;
		if (letter == '') {
			throw new Error('cannot have an empty letter');
		}
	}

	rendersInsertionClasses() {
		return true;
	}

	getTypeName() {
		return '-letter-';
	}

	makeCopy() {
		let r = constructLetter(this.letterValue);
		this.copyFieldsTo(r);
		return r;
	}

	copyFieldsTo(nex) {
		super.copyFieldsTo(nex);
		nex.pfstring = this.pfstring;
		nex.pfont = this.pfont;
	}

	setPfont(pfstring) {
		this.applyResolvedPfont(pfstring, parametricFontManager.getFontForString(pfstring));
	}

	getPfstring() {
		return this.pfstring;
	}

	applyResolvedPfont(pfstring, font) {
		this.pfstring = pfstring;
		this.pfont = font;
		this.setDirtyForRendering(true);
	}

	fillPfontFromParent(pfstring, font) {
		this.pfstring = pfstring;
		this.pfont = font;
	}

	// The font this letter is drawn in, in normal mode: its own, or the
	// default if DEFAULT_TO_PARAMETRIC_FONTS is on.
	// (comment by Claude)
	getEffectivePfont() {
		if (this.pfont) {
			return this.pfont;
		}
		if (otherflags.DEFAULT_TO_PARAMETRIC_FONTS) {
			return parametricFontManager.getDefaultFont();
		}
		return null;
	}

	toString(version, ctx) {
		if (version == 'v2') {
			return this.toStringV2(ctx);
		}
		return '|(' + this.letterValue + ')|';
	}

	toStringV2(ctx) {
		return `[${this.toStringV2Literal()}letter]${this.toStringV2PrivateDataSection(ctx)}${this.toStringV2TagList()}`
	}

	// letter|style, or letter|style|pfstring when it has a pfont its parent
	// does not; see pfonts/pfontnex.js
	// (comment by Claude)
	serializePrivateData(ctx) {
		let style = this.getCurrentStyle();
		if (ctx && ctx.getParentPfstring && this.pfstring != ctx.getParentPfstring()) {
			return `${this.letterValue}|${style ? style : ''}|${this.pfstring}`;
		}
		if (style) {
			return `${this.letterValue}|${this.getCurrentStyle()}`;
		} else {
			return `${this.letterValue}`;
		}
	}

	/*
	The letter is everything before the first |, except that the letter can
	itself be a |, and then it is the first character and the | after it
	starts the rest. Splitting on every | used to load a | as an empty letter,
	which throws, so a document with one in it could not be opened.

	(comment by Claude)
	*/
	deserializePrivateData(data) {
		let rest = null;
		if (data.charAt(0) == '|') {
			this.letterValue = '|';
			if (data.length > 1) {
				rest = data.substring(2);
			}
		} else {
			let i = data.indexOf('|');
			if (i < 0) {
				this.letterValue = data;
			} else {
				this.letterValue = data.substring(0, i);
				rest = data.substring(i + 1);
			}
		}
		if (rest === null) {
			return;
		}
		let a = rest.split('|');
		this.setCurrentStyle(a[0]);
		if (a.length > 1) {
			restorePfontFromFile(this, a[1]);
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
		// a pfont is part of how the finished thing looks, so it is drawn in
		// normal mode only; exploded, a letter is plain text like any other
		// (comment by Claude)
		let pfont = (renderFlags & RENDER_FLAG_EXPLODED) ? null : this.getEffectivePfont();
		if (pfont) {
			domNode.appendChild(pfont.drawIntoDomNode(this.letterValue));
		} else {
			let contents = (this.letterValue == " " || this.letterValue == "&nbsp;") ? "\xa0" : this.letterValue;
			domNode.appendChild(document.createTextNode(contents));
		}
	}

	getText() {
		return this.letterValue;
	}

	getDefaultHandler() {
		return 'letterDefault';
	}

	getEventTable(context) {
		return {
			'Tab': 'move-to-next-leaf',
			'ArrowUp': 'move-to-corresponding-letter-in-previous-line',
			'ArrowDown': 'move-to-corresponding-letter-in-next-line',
			'ArrowLeft': 'move-to-previous-leaf',
			'ArrowRight': 'move-to-next-leaf',
			'Backspace' : 'delete-letter',
			'ShiftBackspace' : 'delete-letter',
			'Enter': 'do-line-break-for-letter',

			'!': 'insert-actual-!-at-insertion-point-from-letter',
			'@': 'insert-actual-@-at-insertion-point-from-letter',
			'#': 'insert-actual-#-at-insertion-point-from-letter',
			'$': 'insert-actual-$-at-insertion-point-from-letter',
			'%': 'insert-actual-%-at-insertion-point-from-letter',
			'^': 'insert-actual-^-at-insertion-point-from-letter',
			'&': 'insert-actual-&-at-insertion-point-from-letter',
			'*': 'insert-actual-*-at-insertion-point-from-letter',
			'(': 'insert-actual-(-at-insertion-point-from-letter',
			')': 'insert-actual-)-at-insertion-point-from-letter',
			'[': 'insert-actual-[-at-insertion-point-from-letter',
			'{': 'insert-actual-{-at-insertion-point-from-letter',
			'<': 'insert-actual-<-at-insertion-point-from-letter',
		}
	}


	memUsed() {
		return super.memUsed() + heap.sizeLetter();
	}
}

function constructLetter(letter) {
	if (!heap.requestMem(heap.sizeLetter())) {
		throw constructFatalError(`OUT OF MEMORY: cannot allocate Letter.
stats: ${heap.stats()}`)
	}
	return heap.register(new Letter(letter));
}


export { Letter, constructLetter }

