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

import { MoveOp, BezierOp, LineOp, BezierPlotOp } from './drawingops.js'
import { Bezier } from './bezier.js'


class Glyph {
	constructor(unitwidth, drawinstructions) {
		// a unitwidth of 1.0 would mean that the
		// glyph was perfectly square, assuming its height
		// is the same as the nominal font height.
		this.unitwidth = unitwidth;
		this.drawinstructions = drawinstructions;
	}

	getWidth() {
		return this.unitwidth;
	}

	getInstructions() {
		return this.drawinstructions;
	}
}

const GLYPHS = {
	'a': new Glyph(0.5, [
		// new MoveOp('0', '0'),
		// new LineOp('0', 'corpus'),
		// new LineOp('width', 'corpus'),
		// new LineOp('width', '0'),
		// new LineOp('0', '0'),

		new MoveOp( '0', 'corpus / 2'),
		new BezierOp('0', 'corpus / 2 + curve',
					 '(width / 2) - curve', 'corpus',
					 '(width / 2)', 'corpus'),

		new BezierOp('(width / 2) + curve', 'corpus',
					 'width', 'corpus / 2 + curve',
					 'width', 'corpus / 2'),

		new BezierOp('width', 'corpus / 2 - curve',
					 '(width / 2) + curve', '0',
					 '(width / 2)',  '0'),

		new BezierOp('(width / 2) - curve', '0',
			 		 '0', 'corpus / 2 - curve',
	  				 '0', 'corpus / 2'),
		new MoveOp('width', 'corpus'),
		new LineOp('width', '0'),
	]),

	'b': new Glyph(0.7, [
		new MoveOp('lstart', 'asctop'),
		new LineOp('lstart', 'baseline'),
		new MoveOp('lstart', 'baseline - (corpussize / 2)'),
		new BezierOp('lstart', 'baseline - (corpussize / 2) - curve',
			'hcenter - curve', 'corpustop',
			'hcenter', 'corpustop'),
		new BezierOp('hcenter + curve', 'corpustop',
			'rend', 'corpustop + corpussize / 2 - curve',
			'rend', 'corpustop + corpussize / 2'),
		new BezierOp('rend', 'corpustop + corpussize / 2 + curve',
			'hcenter + curve', 'baseline',
			'hcenter', 'baseline'),
		new BezierOp('hcenter - curve', 'baseline',
			'lstart', 'corpustop + corpussize / 2 + curve',
			'lstart', 'corpustop + corpussize / 2'),
	]),

	'c': new Glyph(0.7, [
		new MoveOp('hcenter', 'corpustop'),
		new BezierOp('hcenter - curve', 'corpustop',
		 			 'lstart', 'baseline - (corpussize / 2) - curve',
		 			 'lstart', 'baseline - (corpussize / 2)'),
		new BezierOp('lstart', 'baseline - (corpussize / 2) + curve',
		 			 'hcenter - curve', 'baseline',
		 			 'hcenter', 'baseline'),
		new BezierPlotOp('hcenter', 'corpustop',
						 'hcenter + curve', 'corpustop',
						 'rend', 'baseline - (corpussize / 2) - curve',
						 'rend', 'baseline - (corpussize / 2)'),
		new BezierPlotOp('hcenter', 'baseline',
						 'hcenter + curve', 'baseline',
						 'rend', 'baseline - (corpussize / 2) + curve',
						 'rend', 'baseline - (corpussize / 2)'),
	]),

	'd': new Glyph(0.7, [
		new MoveOp('hcenter', 'corpustop'),
		new BezierOp('hcenter - curve', 'corpustop',
		 			 'lstart', 'baseline - (corpussize / 2) - curve',
		 			 'lstart', 'baseline - (corpussize / 2)'),
		new BezierOp('lstart', 'baseline - (corpussize / 2) + curve',
		 			 'hcenter - curve', 'baseline',
		 			 'hcenter', 'baseline'),
		new BezierOp('hcenter + curve', 'baseline',
		 			 'rend', 'baseline - (corpussize / 2) + curve',
		 			 'rend', 'baseline - (corpussize / 2)'),
		new BezierOp('rend', 'baseline - (corpussize / 2) - curve',
		 			 'hcenter + curve', 'corpustop',
		 			 'hcenter', 'corpustop'),
		new MoveOp('rend', 'asctop'),
		new LineOp('rend', 'baseline'),
	])
}

	// There is space in the glyph above or below
	// the baseline. For now, for heights, a value of 1.0
	// means it occupies the entire space above (or below)
	// the baseline. A value less than that indicates a smaller portion.
	// The only height that is below the baseline is the
	// descender. Fonts where the descenders overlap with the ascenders
	// are possible with real fonts but not with these fonts (yet).
	// To do it, I would essentially have to have an empty div that is set to
	// position=relative and then have the canvas inside that with position=absolute.
	// html font rendering of course doesn't need to worry about this, it can draw
	// outside of the legal bounds of the HTML element (and does this when a font
	// has a weird lineheight set)


// TODO: fix the fact that these calculations assume ascender is always > capheight.
// this is usually the case with real typefaces but...



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

const PARAMS = {
	'baseline': 0.8, // measured from the top

	'cap': 0.8, // a capital letter (like M)
	'asc': 0.8, // ascender (lowercase l)
	'desc': -0.2, // descender (bottom of a lowercase g or y)
	'corpus': 0.3, // aka x-height, height of a lowercase x
	'bar': 0.15, // middle bar in a lowercase e

	'linethickness': .05, // thickness of drawing pen
	'curve': 0.10, // governs curve control points
	'aperture': 0.7, // gaps in lowercase c, bottom of lowercase e

}


class Pen {
	constructor(fontSizeInPixels, defaultBaselineFloat) {
		this.fontSizeInPixels = fontSizeInPixels;
		this.defaultBaselineFloat = defaultBaselineFloat;
	}

	xToPx(val) {
		return this.fontSizeInPixels * val;
	}

	yToPx(val) {
		return this.fontSizeInPixels * ((-val) + this.defaultBaselineFloat); 
	}
}

class Basic {
	constructor(inparams) {
		this.setParams(inparams);
	}

	createWithParams(inparams) {
		return new Basic(inparams);
	}

	setParams(inparams) {
		this.params = {};
		for (let p in PARAMS) {
			if (inparams[p]) {
				this.params[p] = inparams[p];
			} else {
				this.params[p] = PARAMS[p];
			}
		}
	}

	setupCanvas(
			flowelement,

			ascenderheight_px,
			descenderheight_px,
			lineheight_px,
			fontsize_px, // aka nominal height
			baselineFromTop_px, // aka "nominal" ascender

			glyphwidth_px,
			kerningleft_px,
			kerningright_px,
			tracking_px) {

		// height
		let canvasheight_px = ascenderheight_px + descenderheight_px;
		let leading_px = fontsize_px - lineheight_px;
		let flowelementheight_px = fontsize_px + leading_px;
		let topprotrusion_px = ascenderheight_px - baselineFromTop_px;
		let canvastop_px = ( - topprotrusion_px) + leading_px / 2;

		// width
		let canvaswidth_px = glyphwidth_px;
		let leftSpacing_px = (tracking_px + kerningleft_px) / 2;
		let rightSpacing_px = (tracking_px + kerningright_px) / 2;
		let flowElementWidth_px = glyphwidth_px + leftSpacing_px + rightSpacing_px;

		let canvas = document.createElement('canvas');
		canvas.setAttribute('height', `${canvasheight_px}px;`);
		canvas.setAttribute('width', `${canvaswidth_px}px;`);
		let canvasStyle = 'position:absolute;';
		canvasStyle += `top:${canvastop_px}px;`;
		canvasStyle += `left:${leftSpacing_px};`;

		flowelement.appendChild(canvas);
		let flowElementStyle = 'position:relative;'
		flowElementStyle += `width:${flowElementWidth_px}px;`;
		flowElementStyle += `height:${fontsize_px}px;`;

		canvas.setAttribute('style', canvasStyle);
		flowelement.setAttribute('style', flowElementStyle);
		return canvas;
	}

	toPx(pointsize_px, val) {
		return pointsize_px * val;
	}

	getDomNodeFor(letter) {

		// font metrics - pixels

		let pt_px = 80; // font height in pixels
		let lineheight_px = 84; // line height in pixels

		let pen = new Pen(pt_px, this.params.baseline);


		// all params
		// values are in units relative to font size, so 1.0 for
		// one of these values means it's the same as the font size
		// in pixels

		let linethickness = this.params.linethickness;

		// below we need to define all the variables that
		// are in the font expressions

		let baseline = this.params.baseline; // from top

		let cap = this.params.cap; // capital letter (like M)
		let asc = this.params.asc; // ascender (lowercase l)
		let desc = this.params.desc; // desc (bottom of y)
		let corpus = this.params.corpus; // aka x-height
		let bar = this.params.bar; // middle bar in lowercase e
		let curve = this.params.curve; // used for control points
		let aperture = this.params.aperture; // opening in c, e

		let glyph = GLYPHS[letter];
		if (!glyph) {
			glyph = GLYPHS['a'];
		}

		let width = glyph.getWidth();

		let flowElement = document.createElement('div');
		let canvas = this.setupCanvas(
			flowElement,
			pt_px * asc,
			pt_px * (- desc),
			lineheight_px,
			pt_px,
			baseline * pt_px,
			glyph.getWidth() * pt_px,
			0, // kerning
			0, // kerning
			4); // tracking

		let ctx = canvas.getContext("2d");
		ctx.lineWidth = linethickness * pt_px;
		ctx.beginPath();
		let instructions = glyph.getInstructions();
		for (let i = 0; i < instructions.length; i++) {
			let a = instructions[i];
			switch(a.type) {
				case 'bezier':
					ctx.bezierCurveTo(pen.xToPx(eval(a.cp1x)),
									  pen.yToPx(eval(a.cp1y)),
									  pen.xToPx(eval(a.cp2x)),
									  pen.yToPx(eval(a.cp2y)),
									  pen.xToPx(eval(a.endx)),
									  pen.yToPx(eval(a.endy)));
					break;
				case 'move':
					ctx.moveTo(pen.xToPx(eval(a.x)), pen.yToPx(eval(a.y)));
					break;
				case 'line':
					ctx.lineTo(pen.xToPx(eval(a.x)), pen.yToPx(eval(a.y)));
					break;
				case 'bezierplot':
					new Bezier(pen.xToPx(eval(a.p1x)),
							   pen.yToPx(eval(a.p1y)),
							   pen.xToPx(eval(a.cp1x)),
							   pen.yToPx(eval(a.cp1y)),
							   pen.xToPx(eval(a.cp2x)),
							   pen.yToPx(eval(a.cp2y)),
							   pen.xToPx(eval(a.p2x)),
							   pen.yToPx(eval(a.p2y))).plot(ctx, aperture);
					break;

			}
		}
		ctx.stroke();
		return flowElement;
	}
}

export { Basic }


		/*

		// all these points are measured from the top
		let baseline = (this.params.baseline) * canvasheight;
		let bottom = canvasheight;
		let top = 0;

		// actual pixel heights of the various regions
		let ascheight = this.params.ascheight * (baseline - top);
		let capheight = this.params.capheight * (baseline - top);
		let corpussize = (this.params.corpussize) * (baseline - top);
		let barheight = this.params.barheight * (baseline - top);
		let descheight = this.params.descheight * (bottom - baseline);

		// bottoms of all these regions are the baseline
		let asctop = baseline - ascheight;
		let captop = baseline - capheight;
		let corpustop = baseline - corpussize;
		let bartop = baseline - barheight;
		// descender top is baseline
		let descbottom = baseline + descheight;


		// idk
		let curve = this.params.curve * pt_px;
		let lstart = this.params.lmargin * canvaswidth;
		let rend = (1.0 - this.params.rmargin) * canvaswidth;
		let hcenter = canvaswidth / 2;

		let aperture = this.params.aperture;
		*/
