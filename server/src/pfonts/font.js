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

import { MoveOp, BezierOp, LineOp, BezierPlotOp } from "./drawingops.js"


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
		this.domnode = null;
		this.previousSlop = -1;
		this.previousFontSize = -1;
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

	getNominalCorpus() {
		return .4;
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
				  letter,
				  lineheight_px,
				  left_kerning_px,
				  right_kerning_px,
				  tracking_px) {

		this.pen = new Pen(pt_px, baseline_from_top, slop_px);

		this.glyph = this.getGlyphs()[letter];
		if (!this.glyph) {
			this.glyph = this.getGlyphs()['a'];
		}

		let width = this.glyph.getWidth() * this.getNominalCorpus();

		this.flowElement = document.createElement('div');

		this.canvas = this.setupCanvas(
			this.flowElement,
			lineheight_px,
			pt_px,           /* fontsize_px */
			baseline_from_top * pt_px,  /* baselineFromTop_px */
			width * pt_px,    /* glyphwidth_px */
			left_kerning_px,
			right_kerning_px,
			tracking_px,
			slop_px);		
	}

	drawIntoDomNode(letter) {

		let pt_px = this.pxparams.fontsize; // font height in pixels
		let left_kerning_px = this.pxparams.left_kerning;
		let right_kerning_px = this.pxparams.right_kerning;
		let lineheight_px = pt_px + pt_px * this.params.leading;
		let tracking_px = pt_px * this.params.tracking;

		// all params
		// values are in units relative to font size, so 1.0 for
		// one of these values means it's the same as the font size
		// in pixels

		let linethickness = this.params.linethickness;

		// below we need to define all the variables that
		// are in the font expressions

		let baseline_from_top = this.params.baseline;

		let cap = this.params.cap; // capital letter (like M)
		let asc = this.params.asc; // ascender (lowercase l)
		let desc = this.params.desc; // desc (bottom of y)
		let corpus = this.params.corpus; // aka x-height
		let bar = this.params.bar; // middle bar in lowercase e
		let curve = this.params.curve; // used for control points
		let aperture = this.params.aperture; // opening in c, e

		let slop_px = this.calculateSlop(asc, desc, pt_px);

		let shouldRebuildCanvas = false;

		if (this.domnode == null) {
			shouldRebuildCanvas = true;
		}

		if (slop_px != this.previousSlop) {
			shouldRebuildCanvas = true;
			this.previousSlop = pt_px;
		}

		if (pt_px != this.previousFontSize) {
			shouldRebuildCanvas = true;
			this.previousFontSize = pt_px;
		}

		if (shouldRebuildCanvas) {
			this.rebuildCanvas(pt_px,
							   baseline_from_top,
							   slop_px,
							   letter,
							   lineheight_px,
							   left_kerning_px,
							   right_kerning_px,
							   tracking_px);

		}



		// let pen = new Pen(pt_px, baseline_from_top, slop_px);

		// let glyph = this.getGlyphs()[letter];
		// if (!glyph) {
		// 	glyph = this.getGlyphs()['a'];
		// }

		// let width = glyph.getWidth() * this.getNominalCorpus();

		// let flowElement = document.createElement('div');
		// let canvas = this.setupCanvas(
		// 	flowElement,
		// 	lineheight_px,
		// 	pt_px,           /* fontsize_px */
		// 	baseline_from_top * pt_px,  /* baselineFromTop_px */
		// 	width * pt_px,    /* glyphwidth_px */
		// 	left_kerning_px,
		// 	right_kerning_px,
		// 	tracking_px,
		// 	slop_px);

		let width = this.glyph.getWidth() * this.getNominalCorpus();
		let ctx = this.canvas.getContext("2d");
		ctx.lineWidth = linethickness * pt_px;
		ctx.beginPath();
		let instructions = this.glyph.getInstructions();

		// we set up some convenience variables that will
		// make it easier to search-and-replace in the letter
		// specs later. Otherwise 0 could be both the baseline
		// and the left side (for example)
		let left = 0;
		let right = width;
		let mid = width / 2;
		// when the letters refer to "baseline" it's this
		let baseline = 0;		


		// following line is so that eval statements
		// can access non-standard params that a
		// font might add
		let p = this.params;
		for (let i = 0; i < instructions.length; i++) {
			let op = instructions[i];
			switch(op.type) {
				case 'bezier':
					ctx.bezierCurveTo(this.pen.xToPx(eval(op.cp1x)),
									  this.pen.yToPx(eval(op.cp1y)),
									  this.pen.xToPx(eval(op.cp2x)),
									  this.pen.yToPx(eval(op.cp2y)),
									  this.pen.xToPx(eval(op.endx)),
									  this.pen.yToPx(eval(op.endy)));
					break;
				case 'move':
					ctx.moveTo(this.pen.xToPx(eval(op.x)), this.pen.yToPx(eval(op.y)));
					break;
				case 'line':
					ctx.lineTo(this.pen.xToPx(eval(op.x)), this.pen.yToPx(eval(op.y)));
					break;
				case 'bezierplot':
					new Bezier(this.pen.xToPx(eval(op.p1x)),
							   this.pen.yToPx(eval(op.p1y)),
							   this.pen.xToPx(eval(op.cp1x)),
							   this.pen.yToPx(eval(op.cp1y)),
							   this.pen.xToPx(eval(op.cp2x)),
							   this.pen.yToPx(eval(op.cp2y)),
							   this.pen.xToPx(eval(op.p2x)),
							   this.pen.yToPx(eval(op.p2y))).plot(ctx, aperture);
					break;
				default:
					// new thing?
					let opobj = this.createOp(op.op);
					let params = [];
					for (let i = 0; i < op.d.length; i++) {
						let p = op.d[i];
						params[i] = {};
						if (p.x) params[i].x = this.pen.xToPx(eval(p.x));
						if (p.y) params[i].y = this.pen.yToPx(eval(p.y));
						if (p.val) params[i].val = eval(p.val);
					}
					opobj.setParams(params);
					opobj.draw(ctx);


			}
		}
		ctx.stroke();
		return this.flowElement;
	}

	createOp(opstr) {
		switch(opstr) {
			case 'move':
				return new MoveOp();
			case 'bezier':
				return new BezierOp();
			case 'bezierplot':
				return new BezierPlotOp();
			case 'line':
				return new LineOp();
		}
	}
}

export { Font }

