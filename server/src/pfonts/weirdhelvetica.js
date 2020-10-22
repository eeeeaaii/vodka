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

import { MoveOp, BezierOp, LineOp, BezierPlotOp } from './drawingops.js'
import { Glyph } from "./glyph.js"
import { Font } from "./font.js"

const GLYPHS = {
	' ': new Glyph(1.0, []),
	'a': new Glyph(0.8, [
		new MoveOp( 'left', 'p.corpmidtop'),
		new BezierOp('left', 'p.corpmidtop + curve',
					 'mid - curve', 'corpus',
					 'mid', 'corpus'),
		new BezierOp('mid + curve', 'corpus',
					 'right', 'p.corpmidtop + curve',
					 'right', 'p.corpmidtop'),
		new BezierOp('right', 'p.corpmidtop - curve',
					 'mid + curve', 'p.corpmid',
					 'mid', 'p.corpmid'),
		new BezierOp('mid - curve', 'p.corpmid',
					 'left', 'p.corpmidbottom + curve',
					 'left', 'p.corpmidbottom'),
		new BezierOp('left', 'p.corpmidbottom - curve',
					 'mid - curve', 'baseline',
					 'mid', 'baseline'),
		new BezierOp('mid + curve', 'baseline',
					 'right', 'p.corpmidbottom - curve',
					 'right', 'p.corpmidbottom'),
		new MoveOp('right', 'p.corpmidtop'),
		new LineOp('right', 'p.corpmidbottom'),
		new BezierOp('right', 'p.corpmidbottom - curve',
					 'right * 1.2 - curve', 'baseline',
					 'right * 1.2', 'baseline'),
	]),
}


const DEFAULT_PARAMS = {
	'baseline': 0.7, // measured from the top
	'cap': 0.6, // a capital letter (like M)
	'asc': 0.7, // ascender (lowercase l)
	'desc': -0.3, // descender (bottom of a lowercase g or y)
	'corpus': 0.3, // aka x-height, height of a lowercase x
	'bar': 0.1, // middle bar in a lowercase e
	'linethickness': .05, // thickness of drawing pen
	'curve': 0.08, // governs curve control points
	'aperture': 0.7, // gaps in lowercase c, bottom of lowercase e
	'leading': .1,
	'tracking': .1,
	'corpmidtop': 0.3 * .75,
	'corpmid': 0.3 * .5,
	'corpmidbottom': 0.3 * .25,
}

const DEFAULT_PXPARAMS = {
	'fontsize': 90,
	'left_kerning': 0,
	'right_kerning': 0,
	'slop': 0,
}

let defaultParamsHaveBeenSet = false;
let defaultParams = {};

class WeirdHelvetica extends Font {
	constructor(pxparams, inparams) {
		super(pxparams, inparams);
		if (!defaultParamsHaveBeenSet) {
			defaultParams = this.setDerivedParams(DEFAULT_PARAMS, {});
			defaultParamsHaveBeenSet = true;
		}
	}

	getDefaultParams() {
		return defaultParams;
	}

	getDefaultPxparams() {
		return DEFAULT_PXPARAMS;
	}

	createWithParams(pxparams, inparams) {
		return new WeirdHelvetica(pxparams, inparams);
	}

	getFontName() {
		return 'weirdhelvetica';
	}

	setDerivedParams(params, inparams) {
		if (!inparams.corpmidtop) {
			params.corpmidtop = params.corpus * .75
		}
		if (!inparams.corpmid) {
			params.corpmid = params.corpus * .5
		}
		if (!inparams.corpmidbottom) {
			params.corpmidbottom = params.corpus * .25
		}
		return params; // no additional params or changes to defaults
	}

	getGlyphs() {
		return GLYPHS;
	}
}

export { WeirdHelvetica }