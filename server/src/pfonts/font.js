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

// useful tool: https://www.metaflop.com/modulator

import { Pen } from "./pen.js"

import { MoveOp, OP_MOVE,
		 BezierOp, OP_BEZIER,
		 LineOp, OP_LINE,
		 BezierPlotOp, OP_BEZIERPLOT } from "./drawingops.js"


// Here's how these params work.
// 1.0 = the font height
//
// "baseline" is a vector from the top of the nominal glyph
// (the flow element) to the baseline.
//
// All other values are vectors from the baseline, with
// positive values pointing up.
//
// For example, if a glyph exactly matches the nominal font
// size, i.e. zero leading, then if baseline
// is 0.7, then ascender is also 0.7, and
// descender is -0.3.
//
// for some metrics, this is "distance along the bezier"
// so in some cases rather than drawing the entire curve,
// we draw some of it, and the parameter governs how much of
// it we draw (how far along the bezier we go). Example:
// bottom of lowercase e, bottom and top of lowercase c, etc.


const FONT_DEBUG = false;

class Font {
	constructor(pxparams, inparams) {
		this.setParams(pxparams, inparams);
		this.flowElement = null;
		this.previousSlop = -1;
		this.previousFontSize = -1;
		this.letter = null;
		this.glyph = null;
		this.needsRedraw = false;
	}

	setParams(inpxparams, inparams) {
		// A user might want to override something like corpus,
		// and this particular font might have logic such that
		// curve is dependent on corpus.
		// Also, the user might want to separately override curve.
		// That's why we override twice. The first time we override,
		// all the values the user specified get put in. Then
		// the font has a chance to set values based on its own
		// internal logic, and anything the user set previously
		// would be factored in. Finally, the user has a final
		// chance to override those values again.

		let pxparams = this.copyParams(this.getDefaultPxparams());
		this.overrideParams(pxparams, inpxparams);
		this.pxparams = pxparams;

		let params = this.copyParams(this.getDefaultParams());
		this.overrideParams(params, inparams);
		this.setDerivedParams(params, inparams);
		this.params = params;
		if (this.glyph) {
			this.setParamsDerivedFromGlyph();
		}
		this.needsRedraw = true;
	}

	getDefaultPxparams() {
		return {};
	}

	getDefaultParams() {
		return {};
	}

	copyParams(copyFrom) {
		let r = {};
		for (let p in copyFrom) {
			r[p] = copyFrom[p];
		}
		return r;
	}

	overrideParams(params, inparams) {
		for (let p in inparams) {
			if (params[p]) {
				params[p] = inparams[p];
			}
		}
	}

	/**
	 * Some params might be related to others. For example, "bar" might be some
	 * multiple of corpus height. If someone tweaking the font overrides/sets
	 * corpus height but doesn't set bar, we want bar to adjust. Each font should
	 * override this method to perform these tweaks.
	 */
	setDerivedParams(params, inparams) {
		// no op, should override
	}

	setupCanvas(
			flowelement,
			lineheight_px,
			fontsize_px, // aka nominal height
			baselineFromTop_px, // aka "nominal" ascender
			glyphwidth_px,
			kerningleft_px,
			kerningright_px,
			tracking_px,
			slop_px) {

		// see http://www.vodka.church/fonts/ for more info on
		// how I derived these formulas.

		// height
		let canvasheight_px = fontsize_px + slop_px;
		let leading_px = lineheight_px - fontsize_px;
		let flowelementheight_px = fontsize_px + leading_px;
		let canvastop_px = (leading_px / 2) - (slop_px / 2);

		// width
		let canvaswidth_px = glyphwidth_px + slop_px;
		let leftSpacing_px = (tracking_px + kerningleft_px) / 2;
		let canvasleft_px = leftSpacing_px - (slop_px / 2);
		let rightSpacing_px = (tracking_px + kerningright_px) / 2;
		let flowElementWidth_px = glyphwidth_px + leftSpacing_px + rightSpacing_px;

		let canvas = document.createElement('canvas');
		canvas.setAttribute('height', `${canvasheight_px}px;`);
		canvas.setAttribute('width', `${canvaswidth_px}px;`);
		let canvasStyle = 'position:absolute;';
		canvasStyle += `top:${canvastop_px}px;`;
		canvasStyle += `left:${canvasleft_px}px;`;

		flowelement.appendChild(canvas);
		let flowElementStyle = 'position:relative;'
		flowElementStyle += `width:${flowElementWidth_px}px;`;
		flowElementStyle += `height:${fontsize_px}px;`;

		if (FONT_DEBUG) {
			let r1 = Math.round(Math.random() * 7);
			let r2 = Math.round(Math.random() * 7);
			let r3 = Math.round(Math.random() * 7);
			flowElementStyle += `background-color:#${r1}0b${r2}${r3}0;`
		}

		canvas.setAttribute('style', canvasStyle);
		flowelement.setAttribute('style', flowElementStyle);
		return canvas;
	}

	getFontName() {
		return '';
	}

	calculateSlop(asc, desc, pt_px) {
		let requestedSlop = this.pxparams.slop;
		// hard-coded slop, ignore required slop and previous slop.
		if (requestedSlop != 0) {
			return requestedSlop;
		}
		// ok we will calculate slop.

		let requiredSlop = 0;
		let totalheight = asc + (- desc);
		let extraheight = totalheight - 1.0;
		if (extraheight > 0) {
			requiredSlop = pt_px * extraheight * 1.1;
		} else {
			requiredSlop = pt_px * .2; // idk
		}

		// now that we have required slop, we look to see
		// whether we've already exceeded that slop.
		if (this.previousSlop >= requiredSlop) {
			return this.previousSlop;
		} else {
			// don't change previous slop yet.
			return requiredSlop + 20; // change in increments of 20
		}
	}

	rebuildCanvas(pt_px,
				  baseline_from_top,
				  slop_px,
				  lineheight_px,
				  left_kerning_px,
				  right_kerning_px,
				  tracking_px) {

		this.pen = new Pen(pt_px, baseline_from_top, slop_px);

		this.flowElement = document.createElement('div');

		this.canvas = this.setupCanvas(
			this.flowElement,
			lineheight_px,
			pt_px,           /* fontsize_px */
			baseline_from_top * pt_px,  /* baselineFromTop_px */
			this.params.width * pt_px,    /* glyphwidth_px */
			left_kerning_px,
			right_kerning_px,
			tracking_px,
			slop_px);		
	}

	maybeEval(x) {
		let cap = this.params.cap; // capital letter (like M)
		let asc = this.params.asc; // ascender (lowercase l)
		let desc = this.params.desc; // desc (bottom of y)
		let corpus = this.params.corpus; // aka x-height
		let bar = this.params.bar; // middle bar in lowercase e
		let curve = this.params.curve; // used for control points
		let aperture = this.params.aperture; // opening in c, e

		let left = this.params.left;
		let right = this.params.right;
		let baseline = this.params.baseline;
		let mid = this.params.mid;

		let width = this.params.width;

		if (typeof x == 'string') {
			return eval(x);
		} else {
			return x(this.params);
		}
	}

	// this will at some point be expanded to also set the context,
	// i.e. letter before or after
	setLetter(letter) {
		if (this.letter == letter) {
			return;
		}
		this.needsRedraw = true;
		this.letter = letter;
		this.glyph = this.getGlyphs()[letter];
		if (!this.glyph) {
			this.glyph = this.getGlyphs()['a'];
		}
		this.setParamsDerivedFromGlyph();
	}

	setParamsDerivedFromGlyph() {
		this.params.width = this.glyph.getWidth() * this.params.nominalwidth;
		this.params.right = this.params.width;
		this.params.mid = this.params.width / 2;
	}

	drawIntoDomNode() {
		let pt_px = this.pxparams.fontsize; // font height in pixels
		let left_kerning_px = this.pxparams.left_kerning;
		let right_kerning_px = this.pxparams.right_kerning;
		let lineheight_px = pt_px + pt_px * this.params.leading;
		let tracking_px = pt_px * this.params.tracking;
		let linethickness = this.params.linethickness;
		let baseline_from_top = this.params.baseline_from_top;
		let cap = this.params.cap;
		let asc = this.params.asc;
		let desc = this.params.desc;
		let corpus = this.params.corpus;
		let bar = this.params.bar;
		let curve = this.params.curve;
		let aperture = this.params.aperture;

		let slop_px = this.calculateSlop(asc, desc, pt_px);

		let shouldRebuildCanvas = false;

		if (this.flowElement == null) {
			shouldRebuildCanvas = true;
		}

		if (slop_px != this.previousSlop) {
			shouldRebuildCanvas = true;
			this.previousSlop = slop_px;
		}

		if (pt_px != this.previousFontSize) {
			shouldRebuildCanvas = true;
			this.previousFontSize = pt_px;
		}

		if (shouldRebuildCanvas) {
			this.needsRedraw = true;
			this.rebuildCanvas(pt_px,
							   baseline_from_top,
							   slop_px,
							   lineheight_px,
							   left_kerning_px,
							   right_kerning_px,
							   tracking_px);

		}

		if (this.needsRedraw) {
			let ctx = this.canvas.getContext("2d");
			ctx.lineWidth = linethickness * pt_px;
			ctx.beginPath();
			ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
			let instructions = this.glyph.getInstructions();

			for (let i = 0; i < instructions.length; i++) {
				let oprecord = instructions[i];
				let opobj = this.createOp(oprecord.op);
				let params = [];
				for (let i = 0; i < oprecord.d.length; i++) {
					let p = oprecord.d[i];
					params[i] = {};
					if (p.x) params[i].x = this.pen.xToPx(this.maybeEval(p.x));
					if (p.y) params[i].y = this.pen.yToPx(this.maybeEval(p.y));
					if (p.val) params[i].val = this.maybeEval(p.val);
				}
				opobj.setParams(params);
				opobj.draw(ctx);
			}
			ctx.stroke();
			this.needsRedraw = false;
		}
		return this.flowElement;
	}

	createOp(opstr) {
		switch(opstr) {
			case OP_MOVE:
				return new MoveOp();
			case OP_BEZIER:
				return new BezierOp();
			case OP_BEZIERPLOT:
				return new BezierPlotOp();
			case OP_LINE:
				return new LineOp();
		}
	}
}

export { Font }

