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

import { Glyph } from "./glyph.js"

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

/*
A Font is a set of params, resolved once, plus what has been worked out from
them. It belongs to nothing in particular: one string applied to a whole doc
makes one Font that every letter in the doc points at, so nothing in here may
know which letter it is drawing. Params never change after construction --
different params are a different Font -- which is what makes it safe to
remember things about them.

What it remembers is each character's geometry: evaluating a glyph's
instructions turns into a Path2D the first time that character is asked for,
and every later 'e' in this Font reuses it. Params are continuous, so this is
not a table of shapes worked out in advance; it is only that within one set of
params an 'e' is the same 'e' wherever it appears.

Coordinates in a path are pixels, with the origin at the top left of the
nominal glyph box: x grows to the right from the glyph's left edge, y grows
down from the top of the font size, and the baseline is at
baseline_from_top * fontsize.

(comment by Claude)
*/
class Font {
	constructor(pxparams, inparams) {
		this.memo = {};
		this.setParams(pxparams, inparams);
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

		this.memo = {};
		this.layoutKey = this.computeLayoutKey();
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

	// Only names the font already has, so a misspelled param does not end up
	// in the params; checked by key, so a 0 is a value like any other.
	// (comment by Claude)
	overrideParams(params, inparams) {
		for (let p in inparams) {
			if (p in params && !isNaN(inparams[p])) {
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

	getFontName() {
		return '';
	}

	getGlyphs() {
		return {};
	}

	// fonts never change, so a copy is the same font
	// (comment by Claude)
	copy() {
		return this;
	}

	/*
	Everything that changes where a letter goes rather than what it looks like.
	Two fonts with the same key lay text out identically, so going from one to
	the other only needs a repaint.

	(comment by Claude)
	*/
	computeLayoutKey() {
		let px = this.pxparams;
		let p = this.params;
		return `${px.fontsize}/${px.left_kerning}/${px.right_kerning}/${px.slop}/${p.nominalwidth}/${p.tracking}/${p.leading}/${p.baseline_from_top}`;
	}

	// a box the width of a typical glyph, so a character the font has no
	// glyph for shows up as missing rather than as some other letter
	// (comment by Claude)
	getFallbackGlyph() {
		return FALLBACK_GLYPH;
	}

	// what this font knows about one character, worked out the first time
	// (comment by Claude)
	glyphInfo(ch) {
		let info = this.memo[ch];
		if (info) {
			return info;
		}
		// a space separator can be stored either way
		let glyph = this.getGlyphs()[(ch == '&nbsp;' || ch == '\xa0') ? ' ' : ch];
		if (!glyph) {
			glyph = this.getFallbackGlyph();
		}
		let fontsize = this.pxparams.fontsize;
		let width = glyph.getWidth() * this.params.nominalwidth;
		let tracking_px = fontsize * this.params.tracking;
		let leftSpacing_px = (tracking_px + this.pxparams.left_kerning) / 2;
		let rightSpacing_px = (tracking_px + this.pxparams.right_kerning) / 2;
		info = {
			glyph: glyph,
			width: width,
			glyphwidth_px: width * fontsize,
			leftSpacing_px: leftSpacing_px,
			advance_px: width * fontsize + leftSpacing_px + rightSpacing_px,
			path: null,
		};
		this.memo[ch] = info;
		return info;
	}

	// how far the pen moves for this character; no drawing
	// (comment by Claude)
	advance(ch) {
		return this.glyphInfo(ch).advance_px;
	}

	getFontSize() {
		return this.pxparams.fontsize;
	}

	getLineHeight() {
		return this.pxparams.fontsize * (1 + this.params.leading);
	}

	// from the top of a line to its baseline
	// (comment by Claude)
	getAscent() {
		let fontsize = this.pxparams.fontsize;
		return (fontsize * this.params.leading / 2) + (fontsize * this.params.baseline_from_top);
	}

	getLineWidth() {
		return this.params.linethickness * this.pxparams.fontsize;
	}

	// The params a glyph's instructions see: the font's, plus the ones that
	// depend on how wide this glyph is.
	// (comment by Claude)
	paramsForGlyph(info) {
		let p = this.copyParams(this.params);
		p.width = info.width;
		p.right = info.width;
		p.mid = info.width / 2;
		return p;
	}

	glyphPath(ch) {
		let info = this.glyphInfo(ch);
		if (!info.path) {
			info.path = this.buildPath(info);
		}
		return info.path;
	}

	buildPath(info) {
		let fontsize = this.pxparams.fontsize;
		let baseline_from_top = this.params.baseline_from_top;
		let xToPx = (val) => fontsize * val;
		let yToPx = (val) => fontsize * (baseline_from_top - val);
		let p = this.paramsForGlyph(info);
		let path = new Path2D();
		let instructions = info.glyph.getInstructions();
		for (let i = 0; i < instructions.length; i++) {
			let oprecord = instructions[i];
			let opobj = this.createOp(oprecord.op);
			let params = [];
			for (let j = 0; j < oprecord.d.length; j++) {
				let d = oprecord.d[j];
				params[j] = {};
				if (d.x) params[j].x = xToPx(d.x(p));
				if (d.y) params[j].y = yToPx(d.y(p));
				if (d.val) params[j].val = d.val(p);
			}
			opobj.setParams(params);
			opobj.draw(path);
		}
		return path;
	}

	/*
	How much room a glyph's own canvas needs past its nominal box, so strokes
	that leave the box (a descender, a wide pen, a corpus pushed past 1) are
	not cut off. slop:N in the font string sets it in pixels; 0, the default,
	means work it out. Worked out, it moves in steps of 20 pixels, so animating
	a param does not resize the canvas on every frame.

	(comment by Claude)
	*/
	getSlop() {
		let requestedSlop = this.pxparams.slop;
		if (requestedSlop != 0) {
			return requestedSlop;
		}
		let pt_px = this.pxparams.fontsize;
		let totalheight = this.params.asc + (- this.params.desc);
		let extraheight = totalheight - 1.0;
		let requiredSlop = (extraheight > 0) ? (pt_px * extraheight * 1.1) : (pt_px * .2);
		requiredSlop += this.params.linethickness * pt_px;
		return Math.ceil(requiredSlop / 20) * 20;
	}

	/*
	Draws one character's own canvas inside a flow element and returns the flow
	element. This is the per-letter way of drawing, used when a letter is not
	painted as part of a whole block of text (see pfontblock.js).

	see http://www.vodka.church/fonts/ for more info on how I derived the
	sizes and positions here.

	(comment by Claude)
	*/
	drawIntoDomNode(ch) {
		let info = this.glyphInfo(ch);
		let fontsize_px = this.pxparams.fontsize;
		let leading_px = fontsize_px * this.params.leading;
		let slop_px = this.getSlop();

		let canvasheight_px = fontsize_px + slop_px;
		let canvastop_px = (leading_px / 2) - (slop_px / 2);
		let canvaswidth_px = info.glyphwidth_px + slop_px;
		let canvasleft_px = info.leftSpacing_px - (slop_px / 2);

		let flowElement = document.createElement('div');
		let canvas = document.createElement('canvas');
		let dpr = window.devicePixelRatio || 1;
		canvas.width = Math.ceil(canvaswidth_px * dpr);
		canvas.height = Math.ceil(canvasheight_px * dpr);
		let canvasStyle = 'position:absolute;';
		canvasStyle += `top:${canvastop_px}px;`;
		canvasStyle += `left:${canvasleft_px}px;`;
		canvasStyle += `width:${canvaswidth_px}px;`;
		canvasStyle += `height:${canvasheight_px}px;`;
		canvas.setAttribute('style', canvasStyle);
		flowElement.appendChild(canvas);

		let flowElementStyle = 'position:relative;'
		flowElementStyle += `width:${info.advance_px}px;`;
		flowElementStyle += `height:${fontsize_px + leading_px}px;`;
		if (FONT_DEBUG) {
			let r1 = Math.round(Math.random() * 7);
			let r2 = Math.round(Math.random() * 7);
			let r3 = Math.round(Math.random() * 7);
			flowElementStyle += `background-color:#${r1}0b${r2}${r3}0;`
		}
		flowElement.setAttribute('style', flowElementStyle);

		let ctx = canvas.getContext('2d');
		ctx.setTransform(dpr, 0, 0, dpr, dpr * slop_px / 2, dpr * slop_px / 2);
		// the colour of the text this letter is in, theme and styles included
		// (comment by Claude)
		ctx.strokeStyle = 'currentcolor';
		ctx.lineWidth = this.getLineWidth();
		ctx.stroke(this.glyphPath(ch));
		return flowElement;
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

const FALLBACK_GLYPH = new Glyph(1.0, [
	{ op: OP_MOVE, d:[
		{ x:p => (p.left), y:p => (p.baseline) },
	]},
	{ op: OP_LINE, d:[
		{ x:p => (p.right), y:p => (p.baseline) },
	]},
	{ op: OP_LINE, d:[
		{ x:p => (p.right), y:p => (p.cap) },
	]},
	{ op: OP_LINE, d:[
		{ x:p => (p.left), y:p => (p.cap) },
	]},
	{ op: OP_LINE, d:[
		{ x:p => (p.left), y:p => (p.baseline) },
	]},
]);

export { Font }
