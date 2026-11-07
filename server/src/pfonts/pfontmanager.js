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

import { Basic } from './basic.js'

const DEFAULT_FONT_NAME = 'basic';

/*
A resolved font is shared by everything it was applied to and never changed
afterwards, so the same string can hand back the same object. That keeps a
static string applied in many places from building and memoizing its glyphs
once per place. Animated strings are a new string every frame, so this stays
small rather than growing without bound.

(comment by Claude)
*/
const MAX_CACHED_FONTS = 64;

class ParametricFontManager {
	constructor() {
		// a new font is a file that subclasses Font, plus a line here
		// (comment by Claude)
		this.fonts = {
			'basic': Basic,
		};
		this.cache = new Map();
		this.defaultFont = null;
	}

	getFont(fontname, pxparams, params) {
		let fontclass = this.fonts[fontname];
		if (!fontclass) {
			fontclass = this.fonts[DEFAULT_FONT_NAME];
		}
		return new fontclass(pxparams, params);
	}

	getDefaultFont() {
		if (!this.defaultFont) {
			this.defaultFont = this.getFont(DEFAULT_FONT_NAME, {}, {});
		}
		return this.defaultFont;
	}

	// font string should be something like this
	// first the pxparams, then the relative params
	/*

	basic##
	basic#fontsize:20#
	basic#fontsize:20,tracking:8#curve:.23

	*/
	// Either section can be missing ("basic" is the same as "basic##"), empty
	// pieces are skipped, and whitespace around names and values is ignored.
	// (comment by Claude)

	parseFontString(fontstring) {
		let params = {};

		let sections = fontstring.split('#');
		params.fontname = sections[0].trim();
		params.pxparams = this.parseSection(sections[1]);
		params.relparams = this.parseSection(sections[2]);
		return params;
	}

	parseSection(section) {
		let r = {};
		if (!section) {
			return r;
		}
		let pieces = section.split(',');
		for (let i = 0; i < pieces.length; i++) {
			let piece = pieces[i].trim();
			if (piece == '') {
				continue;
			}
			let kv = piece.split(':');
			let key = kv[0].trim();
			if (key == '') {
				continue;
			}
			r[key] = (kv.length > 1) ? Number(kv[1].trim()) : NaN;
		}
		return r;
	}

	/*
	What the builtin says is wrong with a font string, or null if nothing is.
	Loading a file never asks this: a string that was saved is shown as well as
	it can be rather than refused.

	(comment by Claude)
	*/
	findProblemWithFontString(fontstring) {
		if (fontstring.indexOf('|') >= 0) {
			return 'a pfont string cannot contain |';
		}
		let sections = fontstring.split('#');
		if (sections.length > 3) {
			return 'a pfont string has at most two # in it: fontname#pxparams#relparams';
		}
		let params = this.parseFontString(fontstring);
		let font = this.getFont(params.fontname, {}, {});
		let pxnames = font.getDefaultPxparams();
		let relnames = font.getDefaultParams();
		let check = (section, here, other, herename, othername) => {
			for (let key in section) {
				if (!(key in here)) {
					if (key in other) {
						return `${key} goes in the ${othername} section of a pfont string, not the ${herename} section`;
					}
					return `${key} is not a param of the ${font.getFontName()} pfont`;
				}
				if (isNaN(section[key])) {
					return `${key} in a pfont string needs a number, like ${key}:0.5`;
				}
			}
			return null;
		};
		return check(params.pxparams, pxnames, relnames, 'pixel (first)', 'relative (second)')
				|| check(params.relparams, relnames, pxnames, 'relative (second)', 'pixel (first)');
	}

	// null for the empty string, which means no pfont
	// (comment by Claude)
	getFontForString(fontstring) {
		if (!fontstring) {
			return null;
		}
		let font = this.cache.get(fontstring);
		if (font) {
			return font;
		}
		let params = this.parseFontString(fontstring);
		font = this.getFont(params.fontname, params.pxparams, params.relparams);
		if (this.cache.size >= MAX_CACHED_FONTS) {
			this.cache.delete(this.cache.keys().next().value);
		}
		this.cache.set(fontstring, font);
		return font;
	}
}

const parametricFontManager = new ParametricFontManager();

export { parametricFontManager }
