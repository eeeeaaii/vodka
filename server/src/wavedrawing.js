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
Drawing samples into a canvas, apart from any wavetable, so that everything
that shows audio shows it the same way: a wave in the document and the wave in
the top panel are the same picture at different sizes.

A view says what part of what data goes where:

	data             the samples
	width, height    the canvas, in pixels
	origin           the sample at the left edge, which can be fractional
	pps              pixels per sample
	heightFullScale  pixels from the centre line to full scale
	colors           regular, intense, solid, audition
	audition         optional { start, end } to highlight
	exactColumns     when zoomed out, find the real loudest and quietest
	                 sample behind each column rather than sampling three

(comment by Claude)
*/

function yOf(view, v) {
	return -v * view.heightFullScale + view.height / 2;
}

function xOf(view, s) {
	return (s - view.origin) * view.pps;
}

function samplesBehindPixel(view, p) {
	let samplesPerPixel = 1 / view.pps;
	let start = Math.floor(view.origin + p * samplesPerPixel);
	let end = Math.min(view.data.length - 1,
			Math.floor(view.origin + (p + 1) * samplesPerPixel));
	return { start: start, end: end };
}

function samplesBehindPixels(view, p, endp) {
	let r = samplesBehindPixel(view, p);
	for (let i = p + 1; i < endp; i++) {
		let z = samplesBehindPixel(view, i);
		if (z.start < r.start) r.start = z.start;
		if (z.end > r.end) r.end = z.end;
	}
	return r;
}

function minMaxIn(data, start, end) {
	let min = data[start];
	let max = data[start];
	for (let i = start; i < end; i++) {
		let d = data[i];
		if (d > max) max = d;
		if (d < min) min = d;
	}
	return { min: min, max: max };
}

function minMaxBehindPixel(view, p) {
	let data = view.data;
	let range = samplesBehindPixel(view, p);
	if (range.start == range.end) {
		let v = data[range.start];
		return { min: v, max: v };
	} else if (range.end - range.start < 4 || view.exactColumns) {
		return minMaxIn(data, range.start, range.end);
	} else {
		let diff = range.end - range.start;
		// pick three random points, not at exact intervals to reduce chance of aliasing
		let midSample1 = Math.floor(range.start + .3 * diff);
		let midSample2 = Math.floor(range.start + .7 * diff);
		let d0 = data[range.start];
		let d1 = data[midSample1];
		let d2 = data[midSample2];
		let min = Math.min(d0, Math.min(d1, d2));
		let max = Math.max(d0, Math.max(d1, d2));
		return { min: min, max: max };
	}
}

function vertLine(ctx, view, x, color) {
	ctx.beginPath();
	ctx.moveTo(x, 0);
	ctx.strokeStyle = color;
	ctx.lineTo(x, view.height);
	ctx.stroke();
}

/*
Zoomed in far enough that each sample is a box, the boxes go where the samples
are: from the pixel of sample s to the pixel of s+1. Stepping across the canvas
a whole box at a time from pixel zero put them on a grid of their own, which
drifted from the edit line and split points whenever the window started partway
into a sample or the zoom was not a whole number of pixels -- the line could
land in the middle of a box when it is always really between two.

(comment by Claude)
*/
function drawBoxes(ctx, view, stroked, clips) {
	let data = view.data;
	let c = view.colors;
	let first = Math.max(0, Math.floor(view.origin));
	let last = Math.min(data.length - 1, Math.ceil(view.origin + view.width / view.pps));
	let center = yOf(view, 0);
	for (let s = first; s <= last; s++) {
		let v = data[s];
		if (v > 1) clips.top = true;
		if (v < -1) clips.bottom = true;
		let x = Math.round(xOf(view, s));
		let width = Math.round(xOf(view, s + 1)) - x;
		let y = yOf(view, v);
		let start = Math.min(y, center);
		let height = Math.abs(y - center);
		if (view.audition && s >= view.audition.start && s < view.audition.end) {
			ctx.beginPath();
			ctx.fillStyle = c.audition;
			ctx.fillRect(x, 0, width, view.height);
		}
		if (stroked) {
			ctx.beginPath();
			ctx.strokeStyle = c.regular;
			ctx.strokeRect(x, start, width, height);
		} else {
			ctx.beginPath();
			ctx.fillStyle = c.solid;
			ctx.fillRect(x, start, width, height);
		}
	}
}

function drawColumns(ctx, view, clips) {
	let c = view.colors;
	let increment = Math.ceil(view.pps);
	let center = yOf(view, 0);
	for (let i = 0 ; i < view.width; i += increment) {
		let range = samplesBehindPixels(view, i, i + increment);
		let v = minMaxBehindPixel(view, i);
		if (v.max > 1) clips.top = true;
		if (v.min < -1) clips.bottom = true;
		let top = yOf(view, v.max);
		let bottom = yOf(view, v.min);
		if (view.audition && range.start >= view.audition.start
				&& range.start < view.audition.end) {
			vertLine(ctx, view, i, c.audition);
		}
		if (top < center && bottom < center) {
			ctx.beginPath();
			ctx.strokeStyle = c.intense;
			ctx.moveTo(i, top);
			ctx.lineTo(i, bottom);
			ctx.stroke();

			ctx.beginPath();
			ctx.strokeStyle = c.regular;
			ctx.moveTo(i, bottom);
			ctx.lineTo(i, center);
			ctx.stroke();
		} else if (top > center && bottom > center) {
			ctx.beginPath();
			ctx.strokeStyle = c.regular;
			ctx.moveTo(i, center);
			ctx.lineTo(i, top);
			ctx.stroke();

			ctx.beginPath();
			ctx.strokeStyle = c.intense;
			ctx.moveTo(i, top);
			ctx.lineTo(i, bottom);
			ctx.stroke();
		} else {
			ctx.beginPath();
			ctx.moveTo(i, top);
			ctx.strokeStyle = c.regular;
			ctx.lineTo(i, bottom);
			ctx.stroke();
		}
	}
}

/*
Draws the samples and says whether any went past full scale, as
{ top, bottom }. The dashed lines at full scale are left to the caller, which
may have more to draw first that they should go over.
*/
function drawWaveSamples(ctx, view) {
	let clips = { top: false, bottom: false };
	if (view.data.length == 0) return clips;
	ctx.lineWidth = 1;
	if (view.pps >= 2) {
		drawBoxes(ctx, view, true, clips);
	} else if (view.pps >= 1) {
		drawBoxes(ctx, view, false, clips);
	} else {
		drawColumns(ctx, view, clips);
	}
	return clips;
}

function drawFullScaleLine(ctx, view, atY, color) {
	let y = yOf(view, atY);
	ctx.beginPath();
	ctx.moveTo(0, y);
	ctx.strokeStyle = color;
	ctx.setLineDash([10, 5]);
	ctx.lineTo(view.width, y);
	ctx.stroke();
	ctx.setLineDash([]);
}

function drawClippingLines(ctx, view, clips, color) {
	if (clips.top) drawFullScaleLine(ctx, view, 1, color);
	if (clips.bottom) drawFullScaleLine(ctx, view, -1, color);
}

export { drawWaveSamples, drawClippingLines }
