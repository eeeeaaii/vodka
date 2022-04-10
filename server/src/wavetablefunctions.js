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

import { Tag } from '../tag.js'
import { Wavetable } from '../nex/wavetable.js'; 


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
let SAMPLE_RATE = 48000.0;
let BPM = 120;
let DEFAULT_TIMEBASE = 'BEATS';

// our reference note will be A-220 (A3)
let REFERENCE_NOTE = 57;
let REFERENCE_NOTE_FREQ = 220;

function getSampleRate() {
	return SAMPLE_RATE;
}

function setBpm(b) {
	BPM = b;
}

function setGlobalPixelsPerSample(n) {
	PIXELS_PER_SAMPLE = n;
}

function getGlobalPixelsPerSample() {
	return PIXELS_PER_SAMPLE;
}


function getReferenceFrequency() {
	return REFERENCE_NOTE_FREQ;
}


function nexToTimebase(input) {
	let type = DEFAULT_TIMEBASE;
	if (input.numTags() > 0) {
		let t = input.getTag(0).getName();
		if (t == 'note' || t == 'nn') {
			type = 'NOTE';
		} else if (t == 'seconds' || t == 'second' || t == 'secs' || t == 'sec') {
			type = 'SECONDS';
		} else if (t == 'hz' || t == 'Hz' || t == 'HZ' || t == 'cps') {
			type = 'HZ';
		} else if (t == 'b' || t == 'beats' || t == 'beat') {
			type = 'BEATS';
		} else if (t == 'samples' || t == 'samps' || t == 'samp') {
			type = 'SAMPLES';
		}
	}
	return type;
}

function setDefaultTimebase(input) {
	DEFAULT_TIMEBASE = nexToTimebase(input);
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

function getTimebaseSuffix(tb) {
	switch(tb) {
		case 'HZ': return 'hz';
		case 'NOTE': return 'n';
		case 'SECONDS': return 's';
		case 'SAMPLES': return 'smp';
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

function nexToValuebase(input) {
	let onebase = input.hasTag(new Tag('onebase')) || input.hasTag(new Tag('1'))
	let note = input.hasTag(new Tag('n')) || input.hasTag(new Tag('note'));

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
	let data = [];
	for (let i = 0; i < dur; i++) {
		data[i] = val;
	}
	let r = new Wavetable();
	r.initWith(data);
	return r;	
}


export { getSampleRate,
		 convertTimeToSamples,
		 convertSamplesToTimebase,
		 getTimebaseSuffix,
		 setGlobalPixelsPerSample,
		 getGlobalPixelsPerSample,
		 setBpm,
		 nexToTimebase,
		 setDefaultTimebase,
		 getDefaultTimebase,
		 convertValueFromTag,
		 getConstantSignalFromValue,
		 getReferenceFrequency
		}



