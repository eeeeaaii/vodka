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

/*
A block of pfont text: a doc, line or word in normal mode that draws all of its
text into one canvas, instead of every letter getting a div and a canvas of its
own.

Normal mode is sealed. A click picks the outermost sealed thing and selection
never goes inside it, so nothing in there needs a hit box or a place for a
cursor, and the whole thing can be drawn as a picture of itself. That is what
makes this possible, and it is also what makes it cheap: animating a param
repaints one canvas and never touches the dom.

Which things qualify. Only plain text, because inside plain text every size is
arithmetic and nothing needs to be measured: a doc that holds nothing but lines,
a line that holds nothing but words, letters and separators, a word that holds
nothing but letters and separators. Every letter has to have a pfont, and
nothing inside can have tags, click handlers, or a style other than a colour,
since those need a dom element of their own. Anything else is drawn the
per-letter way, a canvas per letter, which is slower but draws anything. That
is checked when the text changes, not on every frame.

The owner is the outermost qualifying doc, line or word with a pfont. Nothing
inside it gets a canvas or a dom node. A word inside it with a different pfont
is still painted here, in its own font.

How it draws, in three steps, each done only when something it depends on has
changed:

- build: walk the text into runs. A run is a word, or a letter sitting directly
  in a line, or a space. Punctuation separators are glued onto the run before
  them, so they never start a row. A run's width is the sum of its letters'
  advances, which is arithmetic. Done when the text or a width changes.
- flow: a line is a paragraph, so it wraps. Fill rows greedily up to the width
  the plain text would have wrapped at; spaces are where rows break and are not
  drawn at either end of one. Each line starts a new row. Row height is the
  tallest line height in it, and everything in a row sits on one baseline. Done
  after a build, or when the available width changes.
- paint: walk the rows with a pen and stroke each glyph's memoized path (see
  font.js). Done whenever anything changes, including a shape-only param like
  corpus, which needs nothing else.

Changes arrive two ways. A Vodka render of the owner (its own text changed, or
it was drawn fresh) builds and flows from scratch. Everything else comes from
inside: a font applied to a letter or word, or a nex inside being changed by
code. Those nexes have no render node to be rendered again, so during build the
block stamps itself on everything in the tree, and the nexes report to it (see
setDirtyForRendering and applyResolvedPfont). Reports are coalesced into one
animation frame.

(comment by Claude)
*/

import { RENDER_FLAG_EXPLODED } from '../globalconstants.js'
import { styleAttributeFor } from '../nexstyle.js'

// a stand-in for text that would like to be very wide, see measureAvailableWidth
// (comment by Claude)
const MEASURING_WORDS = 20000;
const UNLIMITED_WIDTH = 50000;
let measuringElement = null;

function isSpace(ch) {
	return ch == ' ' || ch == '\xa0' || ch == '&nbsp;' || ch == '\t';
}

// Style strings inside a block can only be a colour. The answer, per string:
// a colour, null for no style at all, or false for something a canvas can't do.
// (comment by Claude)
const styleColorCache = new Map();
let scratchElement = null;

function colorForStyle(style) {
	if (!style) {
		return null;
	}
	if (styleColorCache.has(style)) {
		return styleColorCache.get(style);
	}
	if (!scratchElement) {
		scratchElement = document.createElement('div');
	}
	scratchElement.style.cssText = styleAttributeFor(style, false);
	let r = null;
	for (let i = 0; i < scratchElement.style.length; i++) {
		if (scratchElement.style[i] != 'color') {
			r = false;
			break;
		}
		r = scratchElement.style.color;
	}
	styleColorCache.set(style, r);
	return r;
}

/*
Whether a nex inside a block can be painted by it, and the colour it gives its
text if it has one. undefined means it can't.

(comment by Claude)
*/
function paintableColor(n, inheritedColor) {
	if (n.hasTags() || n.hasClickHandlers()) {
		return undefined;
	}
	let c = colorForStyle(n.getCurrentStyle());
	if (c === false) {
		return undefined;
	}
	return c ? c : inheritedColor;
}

/*
Called from the renderInto of a doc, line or word. Decides whether this render
is a block, and if it is, puts the canvas in and tells the render node not to
render children.

(comment by Claude)
*/
function renderPfontBlock(nex, renderNode, renderFlags) {
	let block = nex.pfontBlock;
	let wanted = !(renderFlags & RENDER_FLAG_EXPLODED) && nex.getPfstring() != '';
	if (wanted) {
		if (!block) {
			block = new PfontBlock(nex);
		}
		if (block.attach(renderNode)) {
			nex.pfontBlock = block;
			renderNode.paintsChildren = true;
			return;
		}
	}
	if (block) {
		block.detach(renderNode);
	}
	renderNode.paintsChildren = false;
}

class PfontBlock {
	constructor(owner) {
		this.owner = owner;
		this.views = [];
		this.active = false;

		// which build a stamp on a nex belongs to, see owns
		this.generation = 0;
		this.stamps = new WeakMap();
		// a run cached on a word is good while this is unchanged
		this.cacheGeneration = 0;

		this.lines = null;
		this.maxSlop = 0;
		this.needsBuild = true;
		this.needsFlow = true;
		this.needsPaint = true;
		this.frameRequested = false;
		this.microtaskRequested = false;
		this.resizeObserver = null;
	}

	isActive() {
		return this.active;
	}

	owns(n) {
		return this.active && this.stamps.get(n) === this.generation;
	}

	stamp(n) {
		this.stamps.set(n, this.generation);
		if (!n.pfontOwners) {
			n.pfontOwners = [ this ];
		} else if (n.pfontOwners.indexOf(this) < 0) {
			n.pfontOwners.push(this);
		}
	}

	// true if the owner can be drawn as a block, false to draw it the usual way
	// (comment by Claude)
	attach(renderNode) {
		if (!this.build()) {
			return false;
		}
		let view = this.viewFor(renderNode);
		if (!view) {
			let canvas = document.createElement('canvas');
			canvas.classList.add('pfontblock');
			canvas.setAttribute('role', 'img');
			view = {
				renderNode: renderNode,
				canvas: canvas,
				availableWidth: -1,
				rows: null,
			};
			this.views.push(view);
		}
		// the render node's dom node was emptied just before renderInto
		renderNode.getDomNode().appendChild(view.canvas);
		view.canvas.setAttribute('aria-label', this.plainText());
		// measured again, since this render may be because the space changed
		view.availableWidth = -1;
		this.active = true;
		this.needsFlow = true;
		this.needsPaint = true;
		this.observeResize(renderNode);
		// After the render pass, so everything around it is in the dom and
		// styled, but before the frame is drawn, so it is never seen empty.
		if (!this.microtaskRequested) {
			this.microtaskRequested = true;
			queueMicrotask(() => {
				this.microtaskRequested = false;
				this.flush();
			});
		}
		return true;
	}

	detach(renderNode) {
		let view = this.viewFor(renderNode);
		if (view) {
			this.views.splice(this.views.indexOf(view), 1);
		}
		if (this.views.length == 0) {
			this.deactivate();
		}
	}

	deactivate() {
		this.active = false;
		this.views = [];
		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
			this.resizeObserver = null;
		}
	}

	viewFor(renderNode) {
		for (let i = 0; i < this.views.length; i++) {
			if (this.views[i].renderNode == renderNode) {
				return this.views[i];
			}
		}
		return null;
	}

	plainText() {
		try {
			return this.owner.getValueAsString();
		} catch (e) {
			return '';
		}
	}

	/*
	The width the plain text would have wrapped at. That is not something the
	canvas can be asked, because a canvas is one unbreakable box and text is
	not: in a flex row, text lets its container shrink to fit and a wide box
	pushes it wider. So for a moment the canvas is taken out and replaced by a
	stand-in that sizes the way text does, a long run of short words, and the
	owner's content width with that in it is the answer. If it would rather be
	wider than any text could reach, nothing is limiting it, and lines don't
	wrap, which is what flex-wrap does in that case. Measuring this way also
	means the canvas's own size never feeds back into the width it is laid out
	at.

	(comment by Claude)
	*/
	measureAvailableWidth(view) {
		let dom = view.renderNode.getDomNode();
		if (!dom.isConnected) {
			return Infinity;
		}
		if (!measuringElement) {
			measuringElement = document.createElement('div');
			measuringElement.setAttribute('style', 'display:block;white-space:normal;font:10px monospace;height:0;overflow:hidden;');
			measuringElement.appendChild(document.createTextNode('x '.repeat(MEASURING_WORDS)));
		}
		let canvas = view.canvas;
		let savedDisplay = canvas.style.display;
		canvas.style.display = 'none';
		dom.appendChild(measuringElement);
		let cs = window.getComputedStyle(dom);
		let w = dom.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
		dom.removeChild(measuringElement);
		canvas.style.display = savedDisplay;
		if (w >= UNLIMITED_WIDTH) {
			return Infinity;
		}
		return w;
	}

	observeResize(renderNode) {
		if (typeof ResizeObserver == 'undefined') {
			return;
		}
		let parent = renderNode.getDomNode().parentElement;
		if (!parent) {
			return;
		}
		if (!this.resizeObserver) {
			this.resizeObserver = new ResizeObserver(() => {
				for (let i = 0; i < this.views.length; i++) {
					let view = this.views[i];
					if (view.availableWidth >= 0
							&& this.measureAvailableWidth(view) != view.availableWidth) {
						view.availableWidth = -1;
						this.needsFlow = true;
						this.needsPaint = true;
						this.requestFrame();
					}
				}
			});
		}
		this.resizeObserver.observe(parent);
	}

	// a nex inside changed: its text, its style, its children
	// (comment by Claude)
	descendantChanged(n) {
		let type = n.getTypeName();
		if (type == '-word-') {
			n.pfontRunCache = null;
		} else if (type != '-line-' && type != '-doc-') {
			// a letter doesn't know its word, so every word's run goes
			this.cacheGeneration++;
		}
		this.needsBuild = true;
		this.needsPaint = true;
		this.requestFrame();
	}

	// a font inside changed; if it moves letters, lay out again
	// (comment by Claude)
	fontChanged(layoutChanged) {
		if (layoutChanged) {
			this.cacheGeneration++;
			this.needsBuild = true;
		}
		this.needsPaint = true;
		this.requestFrame();
	}

	requestFrame() {
		if (this.frameRequested || !this.active) {
			return;
		}
		this.frameRequested = true;
		window.requestAnimationFrame(() => {
			this.frameRequested = false;
			this.flush();
		});
	}

	flush() {
		for (let i = this.views.length - 1; i >= 0; i--) {
			if (!this.views[i].canvas.isConnected) {
				this.views.splice(i, 1);
			}
		}
		if (this.views.length == 0) {
			this.deactivate();
			return;
		}
		if (this.needsBuild) {
			if (!this.build()) {
				// no longer plain text: draw it the usual way
				this.deactivate();
				this.owner.renderOnlyThisNex();
				return;
			}
			let text = this.plainText();
			for (let i = 0; i < this.views.length; i++) {
				this.views[i].canvas.setAttribute('aria-label', text);
			}
		}
		for (let i = 0; i < this.views.length; i++) {
			let view = this.views[i];
			if (view.availableWidth < 0) {
				view.availableWidth = this.measureAvailableWidth(view);
				view.rows = null;
			}
			if (this.needsFlow || !view.rows) {
				this.flow(view);
			}
			if (this.needsPaint) {
				this.paint(view);
			}
		}
		this.needsFlow = false;
		this.needsPaint = false;
	}

	// ---- build ----

	/*
	Walks the owner into lines of runs, checking that it qualifies on the way.
	Stamps everything it passes so changes inside find their way back here.
	Returns false if it doesn't qualify.

	(comment by Claude)
	*/
	build() {
		this.generation++;
		this.maxSlop = 0;
		let owner = this.owner;
		let lines = [];
		let ok = true;
		switch(owner.getTypeName()) {
			case '-doc-':
				owner.doForEachChild(c => {
					if (!ok) return;
					if (c.getTypeName() != '-line-') {
						ok = false;
						return;
					}
					let color = paintableColor(c, null);
					if (color === undefined) {
						ok = false;
						return;
					}
					this.stamp(c);
					let line = this.buildLine(c, color);
					if (!line) {
						ok = false;
						return;
					}
					lines.push(line);
				});
				break;
			case '-line-': {
				let line = this.buildLine(owner, null);
				if (!line) {
					ok = false;
				}
				lines.push(line);
				break;
			}
			case '-word-': {
				let run = this.buildWord(owner, null);
				if (!run) {
					ok = false;
				}
				lines.push({ font: owner.pfont, runs: [ run ] });
				break;
			}
			default:
				ok = false;
		}
		if (!ok) {
			this.lines = null;
			return false;
		}
		this.lines = lines;
		this.needsBuild = false;
		this.needsFlow = true;
		return true;
	}

	buildLine(line, color) {
		let runs = [];
		let ok = true;
		line.doForEachChild(c => {
			if (!ok) return;
			let type = c.getTypeName();
			if (type == '-word-') {
				let run = this.buildWord(c, color);
				if (!run) {
					ok = false;
					return;
				}
				runs.push(run);
			} else if (type == '-letter-' || type == '-separator-') {
				let glyph = this.glyphFor(c, color);
				if (!glyph) {
					ok = false;
					return;
				}
				let ch = c.getText();
				let previous = runs.length > 0 ? runs[runs.length - 1] : null;
				if (isSpace(ch)) {
					runs.push(this.newRun([ glyph ], true));
				} else if (type == '-separator-' && previous && !previous.space) {
					// punctuation goes with what is before it; a new run,
					// since the one before may be a word's cached one
					runs[runs.length - 1] = this.newRun(previous.glyphs.concat([ glyph ]), false);
				} else {
					runs.push(this.newRun([ glyph ], false));
				}
			} else {
				ok = false;
			}
		});
		if (!ok) {
			return null;
		}
		let font = line.pfont ? line.pfont : this.owner.pfont;
		return { font: font, runs: runs };
	}

	// A word's run is cached on the word until the word or a font in it changes.
	// (comment by Claude)
	buildWord(word, color) {
		let color2 = paintableColor(word, color);
		if (color2 === undefined) {
			return null;
		}
		this.stamp(word);
		let cache = word.pfontRunCache;
		if (cache && cache.generation == this.cacheGeneration && cache.color === color2) {
			for (let i = 0; i < cache.run.glyphs.length; i++) {
				this.stamp(cache.run.glyphs[i].nex);
			}
			this.noteSlop(cache.run);
			return cache.run;
		}
		let glyphs = [];
		let ok = true;
		word.doForEachChild(c => {
			if (!ok) return;
			let type = c.getTypeName();
			if (type != '-letter-' && type != '-separator-') {
				ok = false;
				return;
			}
			let glyph = this.glyphFor(c, color2);
			if (!glyph) {
				ok = false;
				return;
			}
			glyphs.push(glyph);
		});
		if (!ok) {
			return null;
		}
		let run = this.newRun(glyphs, false);
		word.pfontRunCache = {
			generation: this.cacheGeneration,
			color: color2,
			run: run,
		};
		return run;
	}

	glyphFor(letter, color) {
		let color2 = paintableColor(letter, color);
		if (color2 === undefined || !letter.getEffectivePfont()) {
			return null;
		}
		this.stamp(letter);
		return { nex: letter, ch: letter.getText(), color: color2 };
	}

	newRun(glyphs, space) {
		let run = { glyphs: [], space: space, width: 0, ascent: 0, descent: 0, slop: 0 };
		for (let i = 0; i < glyphs.length; i++) {
			this.addToRun(run, glyphs[i]);
		}
		return run;
	}

	addToRun(run, glyph) {
		let font = glyph.nex.getEffectivePfont();
		run.glyphs.push(glyph);
		run.width += font.advance(glyph.ch);
		run.ascent = Math.max(run.ascent, font.getAscent());
		run.descent = Math.max(run.descent, font.getLineHeight() - font.getAscent());
		run.slop = Math.max(run.slop, font.getSlop());
		this.noteSlop(run);
	}

	noteSlop(run) {
		this.maxSlop = Math.max(this.maxSlop, run.slop);
	}

	// ---- flow ----

	flow(view) {
		let maxWidth = view.availableWidth;
		let rows = [];
		let width = 0;
		let height = 0;
		for (let i = 0; i < this.lines.length; i++) {
			let line = this.lines[i];
			let row = this.newRow();
			let pending = [];
			let pendingWidth = 0;
			for (let j = 0; j < line.runs.length; j++) {
				let run = line.runs[j];
				if (run.space) {
					if (row.items.length > 0) {
						pending.push(run);
						pendingWidth += run.width;
					}
					continue;
				}
				if (row.items.length > 0 && row.width + pendingWidth + run.width > maxWidth) {
					rows.push(row);
					row = this.newRow();
				} else {
					for (let k = 0; k < pending.length; k++) {
						this.place(row, pending[k]);
					}
				}
				pending = [];
				pendingWidth = 0;
				this.place(row, run);
			}
			rows.push(row);
			// a line with nothing in it is still a line tall
			if (row.items.length == 0 && line.font) {
				row.ascent = line.font.getAscent();
				row.descent = line.font.getLineHeight() - line.font.getAscent();
			}
		}
		for (let i = 0; i < rows.length; i++) {
			width = Math.max(width, rows[i].width);
			height += rows[i].ascent + rows[i].descent;
		}
		view.rows = rows;
		this.sizeCanvas(view, width, height);
	}

	newRow() {
		return { items: [], width: 0, ascent: 0, descent: 0 };
	}

	place(row, run) {
		row.items.push({ run: run, x: row.width });
		row.width += run.width;
		row.ascent = Math.max(row.ascent, run.ascent);
		row.descent = Math.max(row.descent, run.descent);
	}

	/*
	The canvas is bigger than the text by the slop on every side, and pulled
	back by a negative margin of the same, so it takes up exactly the room the
	text does while strokes that leave their glyph box are not cut off.

	(comment by Claude)
	*/
	sizeCanvas(view, width, height) {
		let pad = Math.ceil(this.maxSlop / 2);
		let dpr = window.devicePixelRatio || 1;
		let cssWidth = Math.ceil(width) + 2 * pad;
		let cssHeight = Math.ceil(height) + 2 * pad;
		view.pad = pad;
		view.dpr = dpr;
		let canvas = view.canvas;
		// resizing a canvas clears it, so only when it is a different size
		let w = Math.ceil(cssWidth * dpr);
		let h = Math.ceil(cssHeight * dpr);
		if (canvas.width != w) canvas.width = w;
		if (canvas.height != h) canvas.height = h;
		canvas.style.display = 'block';
		canvas.style.flexShrink = '0';
		canvas.style.width = `${cssWidth}px`;
		canvas.style.height = `${cssHeight}px`;
		canvas.style.margin = `-${pad}px`;
	}

	// ---- paint ----

	paint(view) {
		let canvas = view.canvas;
		let ctx = canvas.getContext('2d');
		let dpr = view.dpr;
		let pad = view.pad;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		// the owner's colour, so the theme and set-style apply
		let baseColor = window.getComputedStyle(canvas).color;
		let lastColor = null;
		let lastFont = null;
		let y = pad;
		let rows = view.rows;
		for (let i = 0; i < rows.length; i++) {
			let row = rows[i];
			let baseline = y + row.ascent;
			for (let j = 0; j < row.items.length; j++) {
				let item = row.items[j];
				let x = pad + item.x;
				let glyphs = item.run.glyphs;
				for (let k = 0; k < glyphs.length; k++) {
					let g = glyphs[k];
					let font = g.nex.getEffectivePfont();
					let info = font.glyphInfo(g.ch);
					if (!item.run.space) {
						if (font !== lastFont) {
							ctx.lineWidth = font.getLineWidth();
							lastFont = font;
						}
						let color = g.color ? g.color : baseColor;
						if (color !== lastColor) {
							ctx.strokeStyle = color;
							lastColor = color;
						}
						let gx = x + info.leftSpacing_px;
						let gy = baseline - font.params.baseline_from_top * font.getFontSize();
						ctx.setTransform(dpr, 0, 0, dpr, dpr * gx, dpr * gy);
						ctx.stroke(font.glyphPath(g.ch));
					}
					x += info.advance_px;
				}
			}
			y += row.ascent + row.descent;
		}
	}
}

export { renderPfontBlock }
