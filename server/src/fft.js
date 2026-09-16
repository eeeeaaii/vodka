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
Not exposed as a builtin -- there are open questions about what a user-facing
fft should hand back. This is here so builtins that need a spectrum internally
can have one.
*/

function nextPowerOfTwo(n) {
	let p = 1;
	while (p < n) p *= 2;
	return p;
}

// in place, radix-2, length must be a power of two
function fft(re, im) {
	let n = re.length;
	for (let i = 1, j = 0; i < n; i++) {
		let bit = n >> 1;
		for (; j & bit; bit >>= 1) {
			j ^= bit;
		}
		j ^= bit;
		if (i < j) {
			let t = re[i]; re[i] = re[j]; re[j] = t;
			t = im[i]; im[i] = im[j]; im[j] = t;
		}
	}
	for (let len = 2; len <= n; len <<= 1) {
		let step = -2 * Math.PI / len;
		for (let i = 0; i < n; i += len) {
			for (let k = 0; k < len / 2; k++) {
				let ang = step * k;
				let wr = Math.cos(ang);
				let wi = Math.sin(ang);
				let ar = re[i + k];
				let ai = im[i + k];
				let br = re[i + k + len / 2];
				let bi = im[i + k + len / 2];
				let tr = br * wr - bi * wi;
				let ti = br * wi + bi * wr;
				re[i + k] = ar + tr;
				im[i + k] = ai + ti;
				re[i + k + len / 2] = ar - tr;
				im[i + k + len / 2] = ai - ti;
			}
		}
	}
}

function hannWindow(n) {
	let w = new Float64Array(n);
	for (let i = 0; i < n; i++) {
		w[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / n);
	}
	return w;
}

/*
Walks a wave in overlapping frames and hands each one's magnitude spectrum to
the callback, along with how many bins are real. Frames past the end of the
wave are zero filled rather than skipped, so a wave shorter than one frame
still gets looked at.
*/
function forEachSpectrum(wt, frameSize, hop, callback) {
	let dur = wt.getDuration();
	/*
	A wave shorter than a frame is windowed over its own length rather than
	over the frame. Windowing it over the frame would cut it off part way up
	the window's own ramp, and that truncation smears across the whole
	spectrum -- a short sine comes back reading as noise.
	*/
	let span = Math.min(frameSize, dur);
	let n = nextPowerOfTwo(span);
	let window = hannWindow(span);
	let re = new Float64Array(n);
	let im = new Float64Array(n);
	let mags = new Float64Array(n / 2 + 1);
	for (let start = 0; start == 0 || start + span <= dur; start += hop) {
		for (let i = 0; i < n; i++) {
			let at = start + i;
			re[i] = (i < span && at < dur) ? wt.valueAtSample(at) * window[i] : 0;
			im[i] = 0;
		}
		fft(re, im);
		for (let b = 0; b <= n / 2; b++) {
			mags[b] = Math.sqrt(re[b] * re[b] + im[b] * im[b]);
		}
		callback(mags, n);
	}
}

export { fft, nextPowerOfTwo, hannWindow, forEachSpectrum }
