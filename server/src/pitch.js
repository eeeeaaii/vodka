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
Working out what note a sound is.

The obvious method is to look for the tallest peak in the spectrum, and it is
wrong often enough to be useless: the loudest partial of a note is frequently
not its fundamental, and plenty of instruments have almost no energy at the
pitch you hear. What the ear follows is the period, not the loudest partial, so
this works in the time domain instead.

YIN, which is autocorrelation with the three corrections that make it usable.
Plain autocorrelation loves to answer an octave too low, because a wave that
repeats every period also repeats every two periods, and the longer lag often
scores slightly better. The cumulative mean normalisation below is the fix for
exactly that, and it is why this is worth a hundred lines rather than twenty.

Nothing here knows about vodka. It takes samples and gives back hertz, and the
builtin turns that into a note number.

(comment by Claude)
*/

/*
The search range. Below about 40Hz there is not enough of a period inside a
frame to measure, and above about 2kHz a musical pitch is rare and the shorter
lags get noisy. Both ends are generous rather than exact -- the point is to stop
the search wasting time on lags that could not be a note anyway.
*/
const MIN_HZ = 40;
const MAX_HZ = 2000;

/*
How unlike itself a shifted copy is allowed to be and still count as a period.
0.15 is the value from the paper and it is a reasonable place to stand: lower
and a slightly noisy note reads as unpitched, higher and noise starts reading as
a note.
*/
const THRESHOLD = 0.15;

/*
The most of the wave looked at in one go. A frame has to hold two periods of the
note being looked for, so this is also what sets how low a note can be found:
half a frame of lag at 48kHz reaches down to about 23Hz, below anything musical.

A shorter wave gets a shorter frame rather than no answer, because a single
grain is a perfectly reasonable thing to ask about and a grain is a couple of
thousand samples. The lowest note a frame can find is two sample rates divided
by its length, so a 50ms grain still reaches the whole range; it is only below
about a thousand samples that the floor climbs into the musical register, and
at the minimum below it sits around 190Hz.
*/
const MAX_FRAME = 4096;

// Below this there is not enough wave to find a period in at all.
const MIN_FRAME = 512;

// Quieter than this and there is nothing to measure, so the frame is skipped
// rather than allowed to report whatever the noise floor happens to rhyme with.
const SILENCE_RMS = 0.0005;

// How many places along the wave get looked at. One frame is a guess; several
// and the disagreements can be thrown out.
const MAX_FRAMES = 12;

function rms(data, offset, n) {
	let sum = 0;
	for (let i = 0; i < n; i++) {
		let v = data[offset + i];
		sum += v * v;
	}
	return Math.sqrt(sum / n);
}

/*
d(tau): how different the frame is from itself shifted along by tau. Zero would
mean the shift landed exactly one period along.
*/
function differenceFunction(data, offset, w, tauMax, d) {
	for (let tau = 0; tau < tauMax; tau++) {
		let sum = 0;
		for (let j = 0; j < w; j++) {
			let diff = data[offset + j] - data[offset + j + tau];
			sum += diff * diff;
		}
		d[tau] = sum;
	}
}

/*
The correction that stops the octave errors. Dividing each d(tau) by the average
of everything below it means a lag only wins by being better than the lags
before it, so twice the true period -- which is just as good in absolute terms,
never better -- stops being able to win.
*/
function cumulativeMeanNormalized(d, tauMax, dp) {
	dp[0] = 1;
	let running = 0;
	for (let tau = 1; tau < tauMax; tau++) {
		running += d[tau];
		dp[tau] = (running == 0) ? 1 : (d[tau] * tau / running);
	}
}

/*
The first lag good enough, not the best one: the best is liable to be a multiple
of the period, and the first one under the threshold is the period itself. Once
under, it walks down to the bottom of that dip rather than stopping on its edge.
*/
function absoluteThreshold(dp, tauMin, tauMax) {
	for (let tau = tauMin; tau < tauMax; tau++) {
		if (dp[tau] < THRESHOLD) {
			while (tau + 1 < tauMax && dp[tau + 1] < dp[tau]) {
				tau++;
			}
			return tau;
		}
	}
	return -1;
}

/*
The true minimum falls between two samples. A parabola through the dip and its
two neighbours says where, which matters more than it sounds: one sample of lag
at a short period is a large fraction of a semitone.
*/
function refine(dp, tau, tauMax) {
	if (tau <= 0 || tau >= tauMax - 1) return tau;
	let a = dp[tau - 1];
	let b = dp[tau];
	let c = dp[tau + 1];
	let denom = 2 * (2 * b - a - c);
	if (denom == 0) return tau;
	return tau + (c - a) / denom;
}

/*
One frame. Returns the frequency in hertz, or -1 when the frame has no period
worth reporting.
*/
function pitchOfFrame(data, offset, frame, sampleRate, d, dp) {
	let w = frame / 2;
	let tauMin = Math.max(2, Math.floor(sampleRate / MAX_HZ));
	let tauMax = Math.min(w, Math.ceil(sampleRate / MIN_HZ));
	if (tauMax <= tauMin) return -1;

	differenceFunction(data, offset, w, tauMax, d);
	cumulativeMeanNormalized(d, tauMax, dp);
	let tau = absoluteThreshold(dp, tauMin, tauMax);
	if (tau < 0) return -1;

	let refined = refine(dp, tau, tauMax);
	if (refined <= 0) return -1;
	return sampleRate / refined;
}

function median(values) {
	let sorted = values.slice().sort(function(a, b) { return a - b; });
	let mid = Math.floor(sorted.length / 2);
	if (sorted.length % 2 == 1) return sorted[mid];
	return (sorted[mid - 1] + sorted[mid]) / 2;
}

/*
Several frames spread along the wave, and the middle answer wins.

A single frame is at the mercy of whatever happened to be going on where it
landed -- an attack transient, a gap, a moment of noise -- and the median throws
those out without having to decide in advance which is which. The agreement
check afterwards is what makes an honest -1 possible: if the frames cannot agree
to within a semitone, the thing being measured does not have one pitch, and
saying so is better than picking one of them.

Returns hertz, or -1.
*/
function detectPitchHz(data, length, sampleRate) {
	if (!data || length < MIN_FRAME) return -1;

	// as much wave as a frame can use, but never more than there is
	let frame = Math.min(MAX_FRAME, length);
	frame = frame - (frame % 2);

	let usable = length - frame;
	let count = Math.min(MAX_FRAMES, Math.max(1, Math.floor(usable / frame) + 1));
	let step = (count > 1) ? Math.floor(usable / (count - 1)) : 0;

	let d = new Float64Array(frame / 2);
	let dp = new Float64Array(frame / 2);
	let found = [];

	for (let i = 0; i < count; i++) {
		let offset = i * step;
		if (offset + frame > length) break;
		if (rms(data, offset, frame) < SILENCE_RMS) continue;
		let hz = pitchOfFrame(data, offset, frame, sampleRate, d, dp);
		if (hz > 0) found.push(hz);
	}

	if (found.length == 0) return -1;

	let m = median(found);
	// a semitone either way, in the ratio rather than in note numbers, so this
	// does not depend on anything outside this file
	let lo = m / 1.0293;
	let hi = m * 1.0293;
	let agreeing = 0;
	for (let i = 0; i < found.length; i++) {
		if (found[i] >= lo && found[i] <= hi) agreeing++;
	}
	if (agreeing * 2 < found.length) return -1;

	return m;
}

export { detectPitchHz }
