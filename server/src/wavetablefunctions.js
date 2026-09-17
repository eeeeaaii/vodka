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

import { Tag } from './tag.js'
import { newTagOrThrowOOM } from './nex/eerror.js'
import { constructWavetable } from './nex/wavetable.js'; 
import { hannWindow } from './fft.js'


// sc sample rate is 48k samples/sec
// let's say I want 440 hz
// I want to know how many samples are in one cycle
// it's 48k/440
//
// Let's use a scale where 0 means middle C, 2 is D above middle C,
// -1 is b below middle C, etc. This is similar to Foxdot but not
// really the same.
// For the formula to work, we need to make A-440 be zero, not middle C.
// Because A-440 is the A above middle C, we subtract 9.
// Then:
//
// fn = f0 * (a)^n
// 
// fn the frequency of the note we are trying to find
// n is the note number
// f0 is 440
// a is 1.059463094359 (the 12th root of 2)

let PIXELS_PER_SAMPLE = 1;
let HEIGHT_PIXELS_FULL_SCALE = 50;

let SAMPLE_RATE = 48000.0;
let BPM = 120;
let DEFAULT_TIMEBASE = 'BEATS';

// our reference note will be A-440 (A4)
let REFERENCE_NOTE = 57;
let REFERENCE_NOTE_FREQ = 440;

function getSampleRate() {
	return SAMPLE_RATE;
}

function setBpm(b) {
	BPM = b;
}

function getBpm() {
	return BPM;
}

function setGlobalPixelsPerSample(n) {
	PIXELS_PER_SAMPLE = n;
}

function getGlobalPixelsPerSample() {
	return PIXELS_PER_SAMPLE;
}

function setGlobalHeightPixelsFullScale(n) {
	HEIGHT_PIXELS_FULL_SCALE = n;
}

function getGlobalHeightPixelsFullScale() {
	return HEIGHT_PIXELS_FULL_SCALE;
}

function getReferenceFrequency() {
	return REFERENCE_NOTE_FREQ;
}


/*
Every tag is checked, not just the first. A value can carry more than one -- a
midi note's duration is tagged `duration` as well as with its timebase -- and
which came first should not decide whether the timebase is seen. Anything with
a single tag behaves exactly as before.

(comment by Claude)
*/
// null for a tag that does not name a timebase, so callers can tell a tag they
// understand from one meant for something else
function timebaseForTagString(t) {
	if (t == 'note' || t == 'nn') return 'NOTE';
	if (t == 'seconds' || t == 'second' || t == 'secs' || t == 'sec') return 'SECONDS';
	if (t == 'hz' || t == 'Hz' || t == 'HZ' || t == 'cps') return 'HZ';
	if (t == 'b' || t == 'beats' || t == 'beat') return 'BEATS';
	if (t == 'samples' || t == 'samps' || t == 'samp') return 'SAMPLES';
	return null;
}

/*
Tags written on the command itself rather than on one of its arguments, as in
~(_<`nocycle`>+ @a @b_). Lives here because both the wavetable builtins and the
wave math builtins ask the same question of them.

(comment by Claude)
*/
function hasCommandTag(commandTags, name) {
	for (let i = 0; commandTags && i < commandTags.length; i++) {
		if (commandTags[i].getTagString() == name) return true;
	}
	return false;
}

// tags on a command rather than on one of its arguments
function timebaseFromTags(tags) {
	for (let i = 0; tags && i < tags.length; i++) {
		let type = timebaseForTagString(tags[i].getTagString());
		if (type) return type;
	}
	return null;
}

function nexToTimebase(input) {
	for (let i = 0; i < input.numTags(); i++) {
		let type = timebaseForTagString(input.getTag(i).getTagString());
		if (type) return type;
	}
	return DEFAULT_TIMEBASE;
}

function setDefaultTimebase(input) {
	DEFAULT_TIMEBASE = nexToTimebase(input);
}

// takes the constant directly, for restoring saved state
// (comment by Claude)
function setDefaultTimebaseValue(t) {
	DEFAULT_TIMEBASE = t;
}


/**
 * This function converts an input float or int into some number of samples.
 * Depending on the tags on that input value, the conversion will happen in
 * different ways.
 * 
 * - if there are no tags, the input is assumed to be just a raw number of samples.
 * tags:
 * - seconds, sec, second, secs
 * -- will return the number of samples in that many seconds
 * - hz, Hz, HZ, cps
 * -- will return the number of samples in one cycle at that frequency
 * - note, nn
 * -- will interpret the input as a note number, find the frequency of that note,
 * -- and return the number of samples in one cycle at that frequency
 */
function convertTimeToSamples(value, timebase) {
	if (!timebase) {
		timebase = nexToTimebase(value);
	}
	let sampleRate = getSampleRate(); // samples per second
	if (value.getTypedValue) {
		value = value.getTypedValue();
	}
	switch(timebase) {
		case 'HZ':
			// we are doing one cycle, so
			// number of seconds is 1/HZ
			return Math.floor((1.0 / value) * sampleRate);

		case 'NOTE':
			return numSamplesForNoteNum(Math.floor(value));

		case 'SECONDS':
			return Math.floor(sampleRate * value);

		case 'SAMPLES':
			return Math.floor(value);

		case 'BEATS':
			return Math.floor(value * (1/BPM) * (60) * sampleRate);
	}
}

function convertSamplesToTimebase(timebase, samples) {
	let sampleRate = getSampleRate(); // samples per second
	switch(timebase) {
		case 'HZ':
			return sampleRate / samples;

		case 'NOTE':
			return 1; // no ones going to want to do this

		case 'SECONDS':
			return samples / sampleRate;

		case 'SAMPLES':
			return samples;

		case 'BEATS':
			return samples / ((1/BPM) * 60 * sampleRate); // mathing great here
	}
}

/*
Short, because this goes in the wave's own time label, which sits in a row of
controls the width of the wave and is read at a glance rather than parsed. The
word it is short for is never in doubt: the label is a number and its unit, and
tapping it cycles through the five.

(comment by Claude)
*/
function getTimebaseSuffix(tb) {
	switch(tb) {
		case 'HZ': return 'hz';
		case 'NOTE': return 'nn';
		case 'SECONDS': return 'sec';
		case 'SAMPLES': return 'samp';
		case 'BEATS': return 'b';
	}	
}

function numSamplesForNoteNum(n) {
	// for this to work right at all the reference pitch has to be the pitch we use here

	n = n - REFERENCE_NOTE;
	let fn = REFERENCE_NOTE_FREQ * Math.pow(1.059463094359, n);
	// okay so fn is the frequency, but we want samples
	return Math.round(getSampleRate() / fn);
}

/*
The pitch a note number names, worked out from the same reference the rest of
the timebase maths uses. The note table in the help reads this rather than
keeping its own copy of the numbers, so the two cannot drift apart.

(comment by Claude)
*/
function frequencyForNoteNum(n) {
	return REFERENCE_NOTE_FREQ * Math.pow(1.059463094359, n - REFERENCE_NOTE);
}

function noteNumForA440() {
	return REFERENCE_NOTE;
}

function frequencyToNoteNum(f) {
	if (f <= 0) return 0;
	return REFERENCE_NOTE + (Math.log(f / REFERENCE_NOTE_FREQ) / Math.log(1.059463094359));
}

function nexToValuebase(input) {
	let onebase = input.hasTag(newTagOrThrowOOM('onebase', 'changing wavetable timebase')) || input.hasTag(newTagOrThrowOOM('1', 'changing wavetable timebase'))
	let note = input.hasTag(newTagOrThrowOOM('n', 'changing wavetable timebase')) || input.hasTag(newTagOrThrowOOM('note', 'changing wavetable timebase'));

	return {
		onebase: onebase,
		note: note
	}
}

function convertValueFromTag(nex) {
	let vb = nexToValuebase(nex);
	let v = nex.getTypedValue();
	let value = 0;
	if (vb.note) {
		// midi note a is #69
		// if user passes in 0 that should be note zero
		let freq = 440.0 * Math.pow(1.059463094359, v - 69);
		value = freq/440;
	} else {
		value = v;
	}
	if (vb.onebase) {
		value += 1;
	}
	return value;
}

function getDefaultTimebase() {
	return DEFAULT_TIMEBASE;
}

// val is val, dur is in samples
function getConstantSignalFromValue(val, dur) {
	if (!dur) {
		dur = 1;
	}
	let r = constructWavetable(dur);
	let data = r.getData();
	for (let i = 0; i < dur; i++) {
		data[i] = val;
	}
	r.init();
	return r;
}




/*
The arithmetic behind the sound builtins, kept out of the file that registers
them. A builtin is a name, an argument spec and a docstring; how a biquad works
out its coefficients or how a stretch picks its next grain is not that, and
having them in the same file made the registrations hard to find among them.
*/

/*
A cutoff can be a wave so that it can be swept, and a wave has nowhere to put
a timebase tag, so it keeps the scale singlepole has always used: 1 means
20kHz. A plain number means the same thing. A number that carries a timebase
tag means what it says, so %2000 hz is two thousand hertz.

(comment by Claude)
*/
const CUTOFF_AT_ONE = 20000;
const CUTOFF_AT_ZERO = 20;
const STRETCH_FRAME = 2048;

// reflect back off the limit, as many times as it takes
function foldInto(v) {
  while (v > 1 || v < -1) {
    if (v > 1) v = 1 - (v - 1);
    if (v < -1) v = -1 + -(v + 1);
  }
  return v;
}

function cutoffToHz(v) {
  return CUTOFF_AT_ZERO * Math.pow(CUTOFF_AT_ONE / CUTOFF_AT_ZERO, v);
}

function resonanceToQ(r) {
  if (r < 0) r = 0;
  if (r > 1) r = 1;
  return 0.707 / (1 - 0.98 * r);
}

// the usual cookbook biquad, written into a reused array so a swept cutoff
// does not allocate once per sample
// (comment by Claude)
function biquadInto(c, kind, hz, q, gainDb, sampleRate) {
  let nyquist = sampleRate / 2;
  if (hz < 1) hz = 1;
  if (hz > nyquist * 0.99) hz = nyquist * 0.99;
  if (q < 0.01) q = 0.01;
  let w0 = (2 * Math.PI * hz) / sampleRate;
  let cosw = Math.cos(w0);
  let sinw = Math.sin(w0);
  let alpha = sinw / (2 * q);
  // half of gainDb, because a peak or a shelf gets it on the way in and
  // again on the way out
  // (comment by Claude)
  let A = Math.pow(10, gainDb / 40);
  let sqrtA2 = 2 * Math.sqrt(A) * alpha;
  let a0, a1, a2, b0, b1, b2;
  a0 = 1 + alpha;
  a1 = -2 * cosw;
  a2 = 1 - alpha;
  switch (kind) {
    case "low":
      b0 = (1 - cosw) / 2;
      b1 = 1 - cosw;
      b2 = (1 - cosw) / 2;
      break;
    case "high":
      b0 = (1 + cosw) / 2;
      b1 = -(1 + cosw);
      b2 = (1 + cosw) / 2;
      break;
    case "band":
      b0 = alpha;
      b1 = 0;
      b2 = -alpha;
      break;
    case "notch":
      b0 = 1;
      b1 = -2 * cosw;
      b2 = 1;
      break;
    case "peak":
      b0 = 1 + alpha * A;
      b1 = -2 * cosw;
      b2 = 1 - alpha * A;
      a0 = 1 + alpha / A;
      a1 = -2 * cosw;
      a2 = 1 - alpha / A;
      break;
    case "lowshelf":
      b0 = A * (A + 1 - (A - 1) * cosw + sqrtA2);
      b1 = 2 * A * (A - 1 - (A + 1) * cosw);
      b2 = A * (A + 1 - (A - 1) * cosw - sqrtA2);
      a0 = A + 1 + (A - 1) * cosw + sqrtA2;
      a1 = -2 * (A - 1 + (A + 1) * cosw);
      a2 = A + 1 + (A - 1) * cosw - sqrtA2;
      break;
    case "highshelf":
      b0 = A * (A + 1 + (A - 1) * cosw + sqrtA2);
      b1 = -2 * A * (A - 1 + (A + 1) * cosw);
      b2 = A * (A + 1 + (A - 1) * cosw - sqrtA2);
      a0 = A + 1 - (A - 1) * cosw + sqrtA2;
      a1 = 2 * (A - 1 - (A + 1) * cosw);
      a2 = A + 1 - (A - 1) * cosw - sqrtA2;
      break;
  }
  c[0] = b0 / a0;
  c[1] = b1 / a0;
  c[2] = b2 / a0;
  c[3] = a1 / a0;
  c[4] = a2 / a0;
}

// the raw samples rather than valueAtSample, because this runs a few million
// times and valueAtSample takes a modulus on every one of them
// (comment by Claude)
function bestMatchOffset(src, dur, ideal, wanted, search, compare) {
  let best = ideal;
  let bestScore = -Infinity;
  for (let k = ideal - search; k <= ideal + search; k++) {
    if (k < 0 || k + compare >= dur) continue;
    let score = 0;
    for (let i = 0; i < compare; i++) {
      score += src[k + i] * wanted[i];
    }
    if (score > bestScore) {
      bestScore = score;
      best = k;
    }
  }
  return best;
}

// writes into whatever array it is handed, so pitch-shift can stretch into
// scratch space rather than making a wavetable it is only going to throw away
// (comment by Claude)
function stretchInto(wt, factor, data, outDur) {
  let dur = wt.getDuration();

  let frame = Math.min(STRETCH_FRAME, dur);
  let hopOut = Math.floor(frame / 2);
  if (hopOut < 1) {
    // too short to cut into pieces at all
    // (comment by Claude)
    for (let i = 0; i < outDur; i++) {
      data[i] = wt.valueAtSample(Math.floor(i / factor));
    }
    return;
  }
  let hopIn = hopOut / factor;
  let search = Math.floor(hopOut / 2);
  // half a hop is enough to say whether two places line up, and the search
  // costs the length of this times the width of it on every frame
  // (comment by Claude)
  let compare = Math.max(1, Math.floor(hopOut / 2));
  let src = wt.getData();

  let window = hannWindow(frame);
  // hann at half a frame sums to one, but not at the two ends, so the window
  // is added up as well and divided out
  // (comment by Claude)
  let weight = new Float64Array(outDur);
  let wanted = new Float64Array(compare);
  let previousEnd = 0;

  for (let m = 0; ; m++) {
    let outAt = m * hopOut;
    if (outAt >= outDur) break;
    let ideal = Math.round(m * hopIn);
    let from = ideal;
    if (m > 0) {
      for (let i = 0; i < compare; i++) {
        let at = previousEnd + i;
        wanted[i] = at < dur ? src[at] : 0;
      }
      from = bestMatchOffset(src, dur, ideal, wanted, search, compare);
    }
    if (from < 0) from = 0;
    if (from > dur - 1) from = dur - 1;
    for (let i = 0; i < frame; i++) {
      let o = outAt + i;
      if (o >= outDur) break;
      let at = from + i;
      if (at >= dur) break;
      data[o] += src[at] * window[i];
      weight[o] += window[i];
    }
    previousEnd = from + hopOut;
  }
  /*
  Dividing by the window sum puts the level right where the windows overlap
  properly. Where they do not -- the very ends -- the sum goes to nothing,
  and dividing by nothing turns the last few samples into a bang. Below half
  a window the sum is left alone, so the ends fade instead.

  (comment by Claude)
  */
  for (let i = 0; i < outDur; i++) {
    data[i] /= weight[i] > 0.5 ? weight[i] : 0.5;
  }
}

// how long the tail takes to fall to -60dB, capped so a feedback close to 1
// cannot ask for a wave that never ends
// (comment by Claude)
function decayTailSamples(g, delaySamples) {
  let a = Math.abs(g);
  if (a < 0.0001) return 0;
  let repeats = Math.ceil(Math.log(0.001) / Math.log(a));
  return Math.min(repeats * delaySamples, Math.round(10 * getSampleRate()));
}

function chargePasses(g, delaySamples, dur) {
  let a = Math.abs(g);
  if (a < 0.0001 || delaySamples < 1) return 1;
  let perPass = Math.pow(a, dur / delaySamples);
  if (perPass < 0.001) return 2;
  return Math.min(1 + Math.ceil(Math.log(0.001) / Math.log(perPass)), 256);
}

/*
Cutting a wave into grains: short overlapping pieces that granular synthesis
treats as the unit of sound instead of the sample.

|size is how long each grain is and |hop is how far along the next one starts,
so hop smaller than size overlaps them and hop larger than size leaves gaps.
Both are in samples here; the builtin does the timebase conversion.

Grains are cut while a whole one still fits, so the last few samples of a wave
may not appear in any grain. Cutting a short final grain instead would give
something that sounds different from every other grain in the collection, which
is worse than losing a few milliseconds off the end.

A window is worth applying and is the caller's decision. Without one each grain
starts and stops at whatever value the wave happened to be at, and a hard edge
is a click; with one every grain fades in and out and they sum back into
something smooth.
*/
function cutIntoGrains(wt, sizeSamples, hopSamples, windowed) {
	let dur = wt.getDuration();
	let grains = [];
	if (sizeSamples < 1 || hopSamples < 1) {
		return grains;
	}
	let window = windowed ? hannWindow(sizeSamples) : null;
	for (let start = 0; start + sizeSamples <= dur; start += hopSamples) {
		let g = constructWavetable(sizeSamples);
		let data = g.getData();
		for (let i = 0; i < sizeSamples; i++) {
			let v = wt.valueAtSample(start + i);
			data[i] = window ? v * window[i] : v;
		}
		g.init();
		grains.push(g);
	}
	return grains;
}

/*
Vowels, as the resonances that make one. A voice is a buzz from the vocal folds
shaped by the tube above them, and the tube's resonances -- formants -- are what
the ear reads as a vowel rather than as a pitch. Three of them is enough to be
recognisable; the first two carry nearly all of it.

Each row is one formant: centre frequency in hertz, bandwidth in hertz, and how
loud it is relative to the first in decibels. These are the usual measured
values for a male voice, which is where every table of these comes from.

Bandwidth rather than Q because that is how formants are measured and published,
and because it is the honest unit: a formant is a bump of a certain width in
hertz, and its Q depends on where it sits.
*/
const VOWEL_FORMANTS = {
	a: [[730, 80, 0], [1090, 90, -6], [2440, 120, -13]],
	e: [[530, 70, 0], [1840, 100, -12], [2480, 120, -22]],
	i: [[270, 60, 0], [2290, 90, -24], [3010, 100, -32]],
	o: [[570, 70, 0], [840, 80, -8], [2410, 100, -15]],
	u: [[300, 50, 0], [870, 70, -14], [2240, 110, -20]],
};

function vowelNames() {
	return Object.keys(VOWEL_FORMANTS);
}

/*
Runs the wave through one bandpass per formant and adds the results up. In
parallel rather than in series: formants are separate resonances of the same
tube, all of them present at once, and chaining them would leave only what they
all pass, which is nothing.

|strength scales how far each formant's bandwidth is squeezed. At 1 they are the
published widths; higher is narrower and more vocal, to the point of sounding
like it is being sung through a tube.
*/
function applyFormants(wt, vowel, strength, sampleRate) {
	let rows = VOWEL_FORMANTS[vowel];
	let dur = wt.getDuration();
	let r = constructWavetable(dur);
	let data = r.getData();
	let c = [0, 0, 0, 0, 0];
	for (let f = 0; f < rows.length; f++) {
		let hz = rows[f][0];
		let bw = rows[f][1] / strength;
		let amp = Math.pow(10, rows[f][2] / 20);
		biquadInto(c, "band", hz, hz / bw, 0, sampleRate);
		let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
		for (let i = 0; i < dur; i++) {
			let x = wt.valueAtSample(i);
			let y = c[0] * x + c[1] * x1 + c[2] * x2 - c[3] * y1 - c[4] * y2;
			x2 = x1; x1 = x;
			y2 = y1; y1 = y;
			data[i] += y * amp;
		}
	}
	r.init();
	return r;
}

export { applyFormants,
		 vowelNames,
		 cutIntoGrains,
		 foldInto,
		 cutoffToHz,
		 resonanceToQ,
		 biquadInto,
		 bestMatchOffset,
		 stretchInto,
		 decayTailSamples,
		 chargePasses,
		 getSampleRate,
		 convertTimeToSamples,
		 convertSamplesToTimebase,
		 getTimebaseSuffix,
		 setGlobalPixelsPerSample,
		 getGlobalPixelsPerSample,
		 setGlobalHeightPixelsFullScale,
		 getGlobalHeightPixelsFullScale,
		 setBpm,
		 getBpm,
		 nexToTimebase,
		 timebaseForTagString,
		 timebaseFromTags,
		 setDefaultTimebase,
		 setDefaultTimebaseValue,
		 getDefaultTimebase,
		 convertValueFromTag,
		 getConstantSignalFromValue,
		 getReferenceFrequency,
		 frequencyForNoteNum,
		 noteNumForA440,
		 frequencyToNoteNum,
		 hasCommandTag
}



