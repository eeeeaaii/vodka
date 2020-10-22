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
import { WeirdHelvetica } from './weirdhelvetica.js'

class ParametricFontManager {
	constructor() {
		this.fonts = {
			'basic': new Basic({}, {}),
			'weirdhelvetica': new WeirdHelvetica({}, {}),
		};
	}

	getFont(fontname, pxparams, params) {
		if (this.fonts[fontname]) {
			return this.fonts[fontname].createWithParams(pxparams, params);
		}
		return this.fonts['basic'].createWithParams(pxparams, params);
	}

	// font string should be something like this
	// first the pxparams, then the relative params
	/*

	basic##
	basic#fontsize:20#
	basic#fontsize:20,tracking:8#curve:.23

	*/

	parseFontString(fontstring) {
		let params = {};

		let sections = fontstring.split('#');
		params.fontname = sections[0];
		let pxparams1 = sections[1];
		let relparams1 = sections[2];

		params.pxparams = {};
		let pxparams2 = pxparams1.split(',');
		for (let i = 0; i < pxparams2.length; i++) {
			let pxparams3 = pxparams2[i].split(':');
			params.pxparams[pxparams3[0]] = Number(pxparams3[1]);
		}

		params.relparams = {};
		let relparams2 = relparams1.split(',');
		for (let i = 0; i < relparams2.length; i++) {
			let relparams3 = relparams2[i].split(':');
			params.relparams[relparams3[0]] = Number(relparams3[1]);
		}
		return params;
	}

	getFontForFontString(fontstring) {
		let params = this.parseFontString(fontstring);
		return this.getFont(params.fontname, params.pxparams, params.relparams);
	}

	isSameFont(font, fontstring) {
		let params = this.parseFontString(fontstring);
		return (font.getFontName() == params.fontname);
	}

	redrawFontStringInFont(font, fontstring) {
		let params = this.parseFontString(fontstring);
		font.setParams(params.pxparams, params.relparams);
	}
}

const parametricFontManager = new ParametricFontManager();

export { parametricFontManager }

