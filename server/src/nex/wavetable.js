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

import { Nex } from './nex.js'
import { experiments } from '../globalappflags.js'
import { startAuditioningBuffer, getFileAsBuffer, getAuditionPositionSamples, maybeKillSound } from '../webaudio.js'
import { possiblyRecordAction } from '../testrecorder.js'
import { heap } from '../heap.js'
import { constructFatalError, throwOOM } from './eerror.js'


import { setGlobalPixelsPerSample,
		 getGlobalPixelsPerSample,
		 setGlobalHeightPixelsFullScale,
		 getGlobalHeightPixelsFullScale,
		 getSampleRate,
		 convertSamplesToTimebase,
		 getTimebaseSuffix,
		 getDefaultTimebase } from '../wavetablefunctions.js'

import { eventQueueDispatcher } from '../eventqueuedispatcher.js'
import { showManipulator } from '../wtmanip.js'
import { Editor } from '../editors.js'
import { doTutorial } from '../help.js'
import { getAudioBufferFromData, startRecordingAudio, stopRecordingAudio } from '../webaudio.js'
import * as audioStore from '../audiostore.js'


// zoom essentially means a number of pixels equals a number of samples

// sc sample rate is 48k samples/sec
// let's say I want 440 hz
// I want to know how many samples are in one cycle
// it's 48k/440
//
// to get 

/**
 * Nex that represents a wavetable value.
 */
// When false, wavetables serialize as silence instead of their real samples.
// Used by autosave; see serializePrivateData below.
let serializeAudioData = true;

/*
A wavetable's private data is a list of fields:

    [wavetable]"bp:1000,2000,3500;aud:0"

    key:value;key:value

The sample references were already this shape, so nothing had to be invented
for them -- "aud:0" and "idb:<hash>" are just the field that says where the
samples are. Everything else is metadata alongside it.

  bp   breakpoints, ascending sample offsets
  aud  index into this file's own sample list, meaningless outside it
  idb  content hash of the samples in IndexedDB, written by autosave

Metadata goes first and the samples last, because in the inline form the
samples are a megabyte of base64 and anything you have to scroll past is
something you will never read.

A field with no colon is the samples themselves, unkeyed. That is what every
file written before fields existed looks like -- raw base64, or the older
comma-separated decimals -- and neither can be mistaken for a field, since
neither contains a colon or a semicolon.

Unknown keys are ignored rather than refused, so a file written by a later
version loses whatever it knew that this one does not, instead of failing to
load.
*/
const FIELD_SEPARATOR = ';';
const KEY_SEPARATOR = ':';
const BREAKPOINTS_KEY = 'bp';
const AUDIO_INDEX_KEY = 'aud';
const AUDIO_REF_KEY = 'idb';

// Set while a file is being written: wavetables hand their samples over and
// serialize as an index instead of inlining them. Set while a file is being
// read, to turn those indices back into samples. See audiocontainer.js.
let audioCollector = null;
let audioReader = null;

function setSerializeAudioData(v) {
	serializeAudioData = v;
}

function setAudioCollector(c) {
	audioCollector = c;
}

function setAudioReader(r) {
	audioReader = r;
}

/*
Decodes samples stored directly in a document. Two formats have been written
over the years: base64 of the raw Float32 bytes, and before that a list of
decimal numbers separated by commas. Telling them apart is unambiguous because
the base64 alphabet has no comma in it.

Returns null instead of throwing. A wavetable that can't be decoded should cost
you that one wavetable, not the whole document -- atob throws on malformed
input, and a Float32Array needs a byte count divisible by four, so a truncated
file used to take the entire load down with it.
*/
function parseInlineSamples(data) {
	try {
		if (data.indexOf(',') >= 0) {
			let parts = data.split(',');
			let out = new Float32Array(parts.length);
			for (let i = 0; i < parts.length; i++) {
				let n = Number(parts[i]);
				if (!isFinite(n)) return null;
				out[i] = n;
			}
			return out;
		}
		let s = window.atob(data);
		let bytes = new Uint8Array(s.length);
		for (let i = 0; i < s.length; i++) {
			bytes[i] = s.charCodeAt(i);
		}
		if (bytes.length % 4 != 0) return null;
		return new Float32Array(bytes.buffer);
	} catch (e) {
		return null;
	}
}

// A wavetable of DEFAULT_SIZE silent samples, encoded once. Emitting this rather
// than an empty string means a restored wavetable is structurally identical to a
// freshly inserted one, instead of a zero-length oddity the renderer has never
// seen.
const DEFAULT_SIZE = 256;
const SILENT_WAVETABLE_DATA = (function() {
	let bytes = new Uint8Array(new Float32Array(DEFAULT_SIZE).buffer);
	let s = '';
	for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
	return typeof window !== 'undefined' && window.btoa
			? window.btoa(s)
			: Buffer.from(s, 'binary').toString('base64');
})();

class Wavetable extends Nex {
	constructor(initSize) {
		super();
		doTutorial('wavetable');

		// sometimes you get an EnterUp event
		// when you first create a wavetable nex so
		// you need to ignore it if you're not auditioning.
		this.auditioning = false;
		this.windowOriginSample = 0;

		this.sections = [];
		this.cachedBuffer = null;
		this.localPixelsPerSample = -1;
		this.localHeightPixelsFullScale = -1;
		this.centerSample = -1;
		// while a section is auditioning, the buffer being played starts partway
		// into the wave, so positions coming back from it need shifting
		this.playheadOffset = 0;
		this.playheadNode = null;
		this.playheadFrame = null;
		this.doingPan = false;
		// where the line was before playback borrowed it
		this.playbackStartSample = -1;
		this.markers = [];
		this.sectionBeingAuditioned = null;
		this.recording = false;
		this.blobs = [];
		this.currentTimebase = null;
		this.rightIsClipping = false;

		if (!initSize) initSize = 256;
		let d = new Float32Array(initSize);
		d.fill(0);
		this.initWith(d);
	}

	getCurrentTimebase() {
		if (!this.currentTimebase) {
			this.currentTimebase = getDefaultTimebase();
		}
		return this.currentTimebase;
	}

	advanceToNextTimebase() {
		switch(this.currentTimebase) {
			case 'NOTE':
				this.currentTimebase ='SECONDS';
				return;
			case 'SECONDS':
				this.currentTimebase ='HZ';
				return;
			case 'HZ':
				this.currentTimebase ='BEATS';
				return;
			case 'BEATS':
				this.currentTimebase ='SAMPLES';
				return;
			case 'SAMPLES':
				this.currentTimebase ='NOTE';
				return;
		}
	}

	addBlob(blob) {
		this.blobs.push(blob);
	}

	getBlobsAsOneBlob(blob) {
		return new Blob(this.blobs);
	}

	resetBlobs() {
		this.blobs = [];
	}

	isRecording() {
		return this.recording;
	}

	startRecording() {
		this.data = new Float32Array();
		this.resetBlobs();
		this.recording = true;
	}

	stopRecording() {
		this.recording = false;
		this.setDirtyForRendering(true);
		eventQueueDispatcher.enqueueTopLevelRender();			
	}

	setRecordedData(buf) {
		this.data = Float32Array.from(buf);
		this.cacheValues();
		this.setDirtyForRendering(true);
		eventQueueDispatcher.enqueueTopLevelRender();			
	}

	startEditing() {
		this.centerSample = 0;
		this.localPixelsPerSample = getGlobalPixelsPerSample();
		this.localHeightPixelsFullScale = getGlobalHeightPixelsFullScale();

	}

	stopEditing() {
		if (this.auditioning) {
			maybeKillSound(true /* force -- editing is over, so playback is too */);
		}
		this.stopPlayheadAnimation();
		this.centerSample = -1;
		this.localPixelsPerSample = -1;
		this.localHeightPixelsFullScale = -1;
		this.windowOriginSample = 0;
	}

	addMarker() {
		// we don't want markers at the extreme ends, because then when you slice
		// you get empty wavetables.
		if (this.centerSample < 1 || this.centerSample > this.data.length - 1) {
			return;
		}
		this.markers.push(this.centerSample);
		this.markers = this.markers.sort((a, b) => { return a - b; })
		this.cacheSections();
		eventQueueDispatcher.enqueueTopLevelRender();			
	}

	deleteMarker(i) {
		this.markers.splice(i, 1);
		eventQueueDispatcher.enqueueTopLevelRender();			
	}

	getData() {
		return this.data;
	}

	getCachedBuffer() {
		return this.cachedBuffer;
	}

	getPixelsPerSample() {
		if (this.localPixelsPerSample > -1) {
			return this.localPixelsPerSample;
		} else {
			return getGlobalPixelsPerSample();
		}
	}

	setPixelsPerSample(val) {
		if (this.localPixelsPerSample > -1) {
			this.localPixelsPerSample = val;
		} else {
			setGlobalPixelsPerSample(val);
		}
	}

	getHeightPixelsFullScale() {
		if (this.localHeightPixelsFullScale > -1) {
			return this.localHeightPixelsFullScale;
		} else {
			return getGlobalHeightPixelsFullScale();
		}
	}

	setHeightPixelsFullScale(val) {
		if (this.localHeightPixelsFullScale > -1) {
			this.localHeightPixelsFullScale = val;
		} else {
			setGlobalHeightPixelsFullScale(val);
		}
	}

	windowWidth() {
		let width = this.data.length * this.getPixelsPerSample();
		if (width > screen.width * 0.65) {
			width = screen.width * 0.65;
			this.rightIsClipping = true;
		} else {
			this.rightIsClipping = false;
		}
		return width;
	}

	getDuration() {
		return this.data.length;
	}

	windowHeight() {
		let maxamp = Math.max(this.amp, 1);
		// we just don't want a window larger than 1000 pixels, it'll crash things
		return Math.min(2 * maxamp * this.getHeightPixelsFullScale(), 1000);
	}

	setDataAt(d, i) {
		this.data[i] = d;
	}

	setData(d) {
		this.data = d;
		this.setDirtyForRendering(true);
	}

	// this makes sure you don't set the window origin to be less than zero
	// or large enough that empty space appears to the right of the sample
	setWindowOriginSample(n) {
		let samplesInWindow = this.windowWidth() / this.getPixelsPerSample();
		let minOrigin = 0;
		let maxOrigin = this.data.length - 1 - samplesInWindow;
		this.windowOriginSample = Math.max(minOrigin, Math.min(n, maxOrigin))
	}

	// still needed for cases like for example loading data from a file
	initWith(newdata) {
		// basically if newdata is too huge we could crash
		this.data = new Float32Array(newdata.length);
		for (let i = 0; i < newdata.length; i++) {
			this.data[i] = newdata[i];
		}
		this.cacheValues();
	}

	init() {
		this.cacheValues();		
	}

	// loadFromFile(fname) {
	// 	let t = this;
	// 	getFileAsBuffer(fname).then(function(result) {
	// 		// getChannelData returns a float32 array but it still works
	// 		// TODO: this class stores an audio buffer
	// 		t.initWith(result.getChannelData(0));
	// 		eventQueueDispatcher.enqueueTopLevelRender();
	// 	})

	// }

	cacheValues() {
		let mm = this.getMinMaxInDataRange(0, this.data.length);
		let absMin = Math.abs(mm.min);
		this.setAmp(Math.max(absMin, mm.max));
		this.cachedBuffer = getAudioBufferFromData(this.data);
	}

	getMinMaxInDataRange(start, end) {
		let min = this.data[start];
		let max = this.data[start];
		for (let i = start ; i < end; i++) {
			let data = this.data[i];
			if (data > max) {
				max = data;
			}
			if (data < min) {
				min = data;
			}
		}
		return {
			min: min,
			max: max
		};
	}

	valueAtSample(t) {
		return this.data[t % this.data.length];
	}

	interpolatedValueAtSample(t) {
		if (Math.round(t) == t) {
			while(t < 0) t += this.data.length;
			return this.data[t % this.data.length];
		} else {
			let t1 = Math.floor(t);
			let t2 = Math.ceil(t);
			let t0 = t1 - 1;
			let t3 = t2 + 1;

			// js doesn't really take the modulus of negative values the way we need it to
			while (t0 < 0) t0 += this.data.length;
			while (t1 < 0) t1 += this.data.length;
			while (t2 < 0) t2 += this.data.length;
			while (t3 < 0) t3 += this.data.length;

			let x0 = this.data[t0 % this.data.length]
			let x1 = this.data[t1 % this.data.length]
			let x2 = this.data[t2 % this.data.length]
			let x3 = this.data[t3 % this.data.length]

			let a0 = x3 - x2 - x0 + x1;
			let a1 = x0 - x1 - a0;
			let a2 = x2 - x0;
			let a3 = x1;

			let pos = t - t1;

			return a0 * Math.pow(pos, 3) + a1 * Math.pow(pos, 2) + a2 * pos + a3;
		}
	}

	yPositionOfWaveValue(v) {
		let scaled = v * this.getHeightPixelsFullScale();
		// window height is >= 2*HEIGHT_PIXELS_FULL_SCALE
		// zero is always in the middle
		let wh = this.windowHeight();
		// also  y values are flipped (zero is upper left)
		return (-scaled) + wh/2;
	}

	xPositionOfSampleNumber(n) {
		let sampInWindow = n - this.windowOriginSample;
		return sampInWindow * this.getPixelsPerSample();
	}

	getTypeName() {
		return '-wavetable-';
	}

	setAmp(n) {
		this.amp = n;
	}

	getAmp() {
		return this.amp;
	}

	makeCopy() {
		let r = constructWavetable(this.data.length);
		this.copyFieldsTo(r);
		return r;
	}

	copyFieldsTo(nex) {
		super.copyFieldsTo(nex);
		nex.initWith(this.data);
		nex.currentTimebase = this.currentTimebase;
		for (let i = 0; i < this.markers.length; i++) {
			nex.markers[i] = this.markers[i];
		}
		nex.cacheSections();
	}

	toString(version) {
		if (version == 'v2') {
			return this.toStringV2();
		}
		return '_[wavetable]';
	}

	toStringV2() {
		return `[${this.toStringV2Literal()}wavetable]${this.toStringV2PrivateDataSection()}${this.toStringV2TagList()}`

	}

	// Referenced audio can be missing: storage cleared, quota evicted, a file
	// truncated. Coming back as silence beats failing to restore the document at
	// all. Length matters as well as presence -- a zero-length buffer is truthy,
	// and a wavetable with no samples can't build an AudioBuffer, so it would
	// throw on the way out of here.
	setSamplesOrSilence(samples) {
		if (!samples || samples.length == 0) {
			samples = new Float32Array(DEFAULT_SIZE);
		}
		this.data = samples;
		heap.requestMem(this.data.length * heap.incrementalSizeWavetable());
		this.init();
	}

	deserializePrivateData(data) {
		let fields = {};
		let unkeyed = null;
		let parts = data.split(FIELD_SEPARATOR);
		for (let i = 0; i < parts.length; i++) {
			let c = parts[i].indexOf(KEY_SEPARATOR);
			if (c < 0) {
				unkeyed = parts[i];
			} else {
				fields[parts[i].substring(0, c)] = parts[i].substring(c + 1);
			}
		}
		this.deserializeSamples(fields, unkeyed);
		this.restoreMarkers(fields[BREAKPOINTS_KEY]);
	}

	deserializeSamples(fields, unkeyed) {
		// Written by autosave. The lookup is synchronous because every record
		// was read into memory during startup, before any document was built --
		// see audiostore.js.
		if (AUDIO_REF_KEY in fields) {
			this.setSamplesOrSilence(audioStore.get(fields[AUDIO_REF_KEY]));
			return;
		}
		// Samples from elsewhere in this same file. audioReader is only set
		// while a container is being read, so a document that refers to one
		// outside that -- pasted somewhere, loaded by something that doesn't
		// know about containers -- falls through to silence rather than to a
		// stray lookup in whatever happens to be loaded.
		if (AUDIO_INDEX_KEY in fields) {
			let i = Number(fields[AUDIO_INDEX_KEY]);
			this.setSamplesOrSilence(audioReader ? audioReader(i) : null);
			return;
		}
		// The samples themselves, unkeyed. Every file saved before containers
		// looks like this, and autosave still writes it for the silence
		// fallback when IndexedDB isn't available.
		this.setSamplesOrSilence(unkeyed ? parseInlineSamples(unkeyed) : null);
	}

	/*
	Markers are dropped rather than clamped if they do not land inside the wave
	that actually arrived. That is the same range addMarker enforces -- a marker
	at either end makes an empty section -- and it is what keeps a wave that came
	back as silence, because its samples were not there to restore, from also
	coming back covered in markers pointing into nothing.
	*/
	restoreMarkers(value) {
		let out = [];
		let raw = value ? value.split(',') : [];
		for (let i = 0; i < raw.length; i++) {
			let n = Number(raw[i]);
			if (Number.isInteger(n) && n >= 1 && n <= this.data.length - 1) {
				out.push(n);
			}
		}
		this.markers = out.sort((a, b) => a - b);
		if (this.markers.length == 0) return;
		try {
			this.cacheSections();
		} catch (e) {
			// Sectioning copies the whole wave again, so it can run out of
			// memory where merely loading it did not. Keep the markers -- they
			// draw, and they are saved again on the way out -- and leave the
			// sections empty, which auditionSection already handles.
			this.sections = [];
		}
	}

	serializePrivateData() {
		let fields = [];
		if (this.markers.length > 0) {
			fields.push(BREAKPOINTS_KEY + KEY_SEPARATOR + this.markers.join(','));
		}
		// last, and the only field that may arrive without a key
		fields.push(this.serializeSamples());
		return fields.join(FIELD_SEPARATOR);
	}

	serializeSamples() {
		// Saving to a file: the samples go after the document and the document
		// refers to them by index. Deduped on content, so the same sample used
		// in twenty places is stored once.
		if (audioCollector) {
			return AUDIO_INDEX_KEY + KEY_SEPARATOR
					+ audioCollector.add(this.data, audioStore.hashSamples(this.data));
		}
		// Autosave turns inline serialization off: sample data is far too large
		// for localStorage (roughly 250KB of base64 per second of audio). The
		// samples go to IndexedDB instead and what lands in the document is a
		// reference to them. Saving to the server is unaffected and still writes
		// the real audio inline.
		if (!serializeAudioData) {
			if (audioStore.isUnavailable()) {
				// No IndexedDB -- a private window, blocked site data. Fall back
				// to the old behaviour: structure survives, audio doesn't.
				return SILENT_WAVETABLE_DATA;
			}
			let hash = audioStore.hashSamples(this.data);
			audioStore.put(hash, this.data);
			return AUDIO_REF_KEY + KEY_SEPARATOR + hash;
		}
		let s = '';
		let bytes = new Uint8Array(this.data.buffer);
		let len = bytes.byteLength;
		for (let i = 0; i < len; i++) {
			s += String.fromCharCode(bytes[i]);
		}
		return window.btoa(s);
		// let s = '';
		// for (let i = 0; i < this.data.length; i++) {
		// 	if (s != '') {
		// 		s += ',';
		// 	}
		// 	s += this.data[i];
		// }
		// return s;
	}

	getDefaultHandler() {
		return 'standardDefault';
	}

	auditionSection(n) {
		if ('' + n === '0') {
			this.auditionWave();
			return;
		}
		if (this.markers.length == 0) {
			return;
		}
		n = Number(n);
		// internally section numbers are zero based
		// even though users use one-based numbering to audition them
		n--;
		let sd = this.getSectionData(n);
		if (sd) {
			if (!this.auditioning) {
				this.auditioning = true;
				this.sectionBeingAuditioned = sd;
				// the section's buffer starts at zero, but the wave it is drawn
				// over does not
				this.playheadOffset = sd.start;
				this.playbackStartSample = this.centerSample;
				startAuditioningBuffer(sd.cachedBuffer, this, 0, false /* momentary */);
				this.setDirtyForRendering(true);
				eventQueueDispatcher.enqueueTopLevelRender();
				this.startPlayheadAnimation();
			}
		}
	}

	numSections() {
		return this.markers.length + 1;
	}

	getSectionData(n) {
		// this is off by one city

		// if (n > this.markers.length) {
		// 	return null;
		// }

		// let start = 0;
		// let end = this.data.length;

		// if (n > 0) {
		// 	start = this.markers[n - 1];
		// }
		// if (n < this.markers.length) {
		// 	end = this.markers[n];
		// }

		// let sectiondata = [];
		// for (let i = start ; i < end ; i++) {
		// 	sectiondata[i - start] = this.data[i];
		// }
		return this.sections[n];
		// return {
		// 	start: start,
		// 	end: end,
		// 	data: this.sectiondata[n]
		// }
	}

	cacheSections() {
		for (let i = 0; i < this.sections.length; i++) {
			heap.freeMem(this.sections[i].data.length * heap.incrementalSizeWavetable());
		}
		this.sections = [];
		for (let i = 0; i <= this.markers.length; i++) {
			let start = (i == 0) ? 0 : this.markers[i - 1];
			let end = (i == this.markers.length) ? this.data.length : this.markers[i];
			let k = 0;
			this.sections[i] = {
				start: start,
				end: end,
				data: []
			};
			let sizeReq = (end - start) * heap.incrementalSizeWavetable();
			if (!heap.requestMem(sizeReq)) {
				throwOOM(sizeReq);
			}
			for (let j = start; j < end ; j++) {
				this.sections[i].data[k] = this.data[j];
				k++;
			}
			this.sections[i].cachedBuffer = getAudioBufferFromData(this.sections[i].data);
		}
	}


	auditionWave() {
		if (!this.auditioning) {
			this.auditioning = true;
			this.playheadOffset = 0;
			// Always from the beginning. You are not editing when you get here
			// -- Enter terminates the editor -- so there is no selection point,
			// and the line is only here to show how far in you are.
			startAuditioningBuffer(this.cachedBuffer, this, 0, false /* momentary */);
			// outside the editor there is no playhead layer yet -- this is the
			// render that adds one
			this.setDirtyForRendering(true);
			eventQueueDispatcher.enqueueTopLevelRender();
			this.startPlayheadAnimation();
		}
	}

	/*
	Space, while editing. Unlike holding enter this survives the keyup, so it
	plays until you press space again.

	Playback starts from the green line, which is the selection point, and the
	same line then becomes the playhead and moves. With nothing selected the
	line has not been placed yet, so it starts at the beginning.
	*/
	togglePlayback() {
		if (this.auditioning) {
			maybeKillSound(true /* force -- a toggle is an explicit stop */);
			return;
		}
		if (this.centerSample < 0 || this.centerSample >= this.data.length) {
			this.centerSample = 0;
		}
		this.auditioning = true;
		this.playheadOffset = 0;
		this.playbackStartSample = this.centerSample;
		startAuditioningBuffer(this.cachedBuffer, this, this.centerSample, true /* sustained */);
		this.startPlayheadAnimation();
	}

	stopAuditioningWave() {
		if (this.auditioning) {
			this.auditioning = false;
			this.sectionBeingAuditioned = null;
			this.stopPlayheadAnimation();
			// The line goes back to where playback started. It is the selection
			// point as well as the playhead, so leaving it wherever the sound
			// happened to stop would mean auditioning quietly moved your
			// selection somewhere you did not put it. Play, stop, play again
			// replays the same thing. Outside the editor there is no selection
			// point to give back, so it goes away.
			if (!this.isEditing) {
				this.centerSample = -1;
			} else if (this.playbackStartSample >= 0) {
				this.centerSample = this.playbackStartSample;
			}
			this.playbackStartSample = -1;
			this.updatePlayhead();
			this.setDirtyForRendering(true);
			eventQueueDispatcher.enqueueTopLevelRender();			
		}
	}

	/*
	The playhead is a positioned div over the canvas rather than something drawn
	into it, so moving it is one style write. Redrawing the waveform every frame
	would mean rescanning the samples behind every pixel column sixty times a
	second, which is far too much work to be doing during a set.
	*/
	startPlayheadAnimation() {
		if (this.playheadFrame) return;
		let step = () => {
			if (!this.auditioning) {
				this.playheadFrame = null;
				return;
			}
			let pos = getAuditionPositionSamples();
			if (pos >= 0) {
				this.centerSample = Math.floor(this.playheadOffset + pos);
				this.updatePlayhead();
			}
			this.playheadFrame = window.requestAnimationFrame(step);
		};
		this.playheadFrame = window.requestAnimationFrame(step);
	}

	stopPlayheadAnimation() {
		if (this.playheadFrame) {
			window.cancelAnimationFrame(this.playheadFrame);
			this.playheadFrame = null;
		}
	}

	// pixel column showing this sample, the inverse of samplesRepresentedByPixel
	pixelPositionOfSample(sample) {
		return (sample - this.windowOriginSample) * this.getPixelsPerSample();
	}

	updatePlayhead() {
		if (!this.playheadNode) return;
		let ctx = this.playheadNode.getContext('2d');
		// An empty overlay is an invisible one, so there is no separate hidden
		// state to keep in step with anything.
		ctx.clearRect(0, 0, this.windowWidth(), this.windowHeight());
		if (this.centerSample < 0) return;
		if (!this.isEditing && !this.auditioning) return;
		let x = Math.round(this.pixelPositionOfSample(this.centerSample));
		if (x < 0 || x > this.windowWidth()) return;
		ctx.lineWidth = 1;
		// half a pixel over, or a one-pixel line straddles two columns and comes
		// out two pixels wide and half strength
		this.drawVertLine(ctx, x + 0.5, false, this.playheadColor);
	}

	_setClickHandler(renderNode) {
		let starty = 0;
		let startx = 0;
		let initialZoom = 0;
		let initialAmpZoom = 0;
		let initialWindowOrigin = 0;
		let dragged = false;
		let downOffsetX = 0;
		let anchorSample = 0;
		// far enough that you meant it -- a click with a shaky hand still moves
		// a pixel or two, and losing the playhead to that would be worse than
		// needing a deliberate gesture to zoom
		const DRAG_THRESHOLD_PIXELS = 4;
		let y = 0;
		let x = 0;
		let t = this;
		let startedBelow = false;
		let ampnegative = 1;
		let startfunction = (event) => {
			// ctrl or command pans, shift zooms amplitude, neither zooms time.
			// Command as well as ctrl because on a mac ctrl-click is right
			// click, so ctrl-drag there is fighting the context menu.
			//
			// Panning is editing-only because outside the editor there is no
			// window to pan. windowWidth sizes the canvas to the wave, so a
			// short one is entirely on screen with nothing to move to, and only
			// a wave long enough to hit the 65%-of-screen cap has anything
			// hidden -- see rightIsClipping. Ctrl-drag out there would do
			// nothing at all on some waveforms and move on others, with nothing
			// on screen to say which you were looking at.
			this.doingPan = (event.ctrlKey || event.metaKey) && this.isEditing;
			if (event.shiftKey) {
				this.doingAmplitudeZoom = true;
			} else {
				this.doingAmplitudeZoom = false;
			}
			starty = event.clientY;
			startx = event.clientX;
			// the wavecontrols section at the top of the rendered wavetable
			// is about 18px at normal scale but what about zoom? idk.
			let yPositionInWaveDisplay = starty + 18;
			if (starty > this.windowHeight() / 2) {
				startedBelow = true;
			}
			if (this.windowHeight() == 1000) {
				ampnegative = startedBelow ? 1 : -1;
			}
			// Not while playing: the click is how you zoom, and moving the
			// playhead every time you grabbed the wave to zoom would make it
			// impossible to zoom in on something while listening to it.
			// The playhead moves on mouseup, not here -- see endfunction. Where
			// you pressed is what it moves to, which is the same thing as where
			// you released for anything that counted as a click rather than a
			// drag.
			dragged = false;
			downOffsetX = event.offsetX;
			// what zooming holds still: the sample under the cursor, so the
			// thing you grabbed stays where you grabbed it
			anchorSample = this.samplesRepresentedByPixel(event.offsetX).start;
			initialZoom = this.getPixelsPerSample();
			initialAmpZoom = this.getHeightPixelsFullScale();
			initialWindowOrigin = this.windowOriginSample;
			// enqueue a redraw for the center line
			eventQueueDispatcher.enqueueTopLevelRender();			
		}
		let movefunction = (e) => {
			let y = e.clientY;
			let x = e.clientX;
			let deltaY = y - starty;
			let deltaX = -(x - startx);
			if (Math.abs(x - startx) > DRAG_THRESHOLD_PIXELS
					|| Math.abs(y - starty) > DRAG_THRESHOLD_PIXELS) {
				dragged = true;
			}
			if (this.doingPan) {
				// Drag right and the wave goes right, because what you have hold
				// of is the wave, not the window onto it. Zoom is untouched, and
				// so is the selection point -- panning is a way to look
				// somewhere else, not to choose somewhere else.
				this.setWindowOriginSample(
						initialWindowOrigin - (x - startx) / this.getPixelsPerSample());
				this.updatePlayhead();
				eventQueueDispatcher.enqueueTopLevelRender();
				return;
			}
			let delta = (Math.abs(deltaX) > Math.abs(deltaY)) ? deltaX : deltaY;
			let factor = Math.pow(2, -(delta * 0.01));
			let ampfactor = Math.pow(2, ampnegative * (deltaY * 0.01));
			if (this.doingAmplitudeZoom) {
				this.setHeightPixelsFullScale(initialAmpZoom * ampfactor);
			} else {
				this.setPixelsPerSample(initialZoom * factor);
			}

			if (this.isEditing) {
				// Zoom around the point under the cursor, not around the
				// playhead. It used to be the playhead because pressing the
				// mouse put the playhead where you pressed, so they were the
				// same point; now that a drag deliberately leaves the playhead
				// alone, using it here would throw the wave somewhere else the
				// moment you started zooming.
				//
				// offsetX, not clientX -- clientX is measured from the viewport,
				// so it carried however far the wavetable happens to sit from
				// the left edge of the window into a fraction that should only
				// ever be where in the wave you clicked.
				let positionOfClickInWindow = downOffsetX / t.windowWidth();
				let samplesInWindow = t.windowWidth() / this.getPixelsPerSample();
				t.setWindowOriginSample(anchorSample - (samplesInWindow * positionOfClickInWindow));
			}
			eventQueueDispatcher.enqueueTopLevelRender();			
		}
		/*
		A click places the playhead; a drag zooms and leaves it alone. Deciding
		on the way up rather than the way down is what makes that possible --
		on the way down there is no way to know yet which one you are doing.

		Only while editing, and only when nothing is playing: during playback
		the line is the playhead and clicking must not move it, which is the
		same rule as before.
		*/
		let endfunction = () => {
			if (!dragged && !this.doingPan && this.isEditing && !this.auditioning) {
				this.changeCenterSample(downOffsetX);
				this.updatePlayhead();
				eventQueueDispatcher.enqueueTopLevelRender();
			}
			this.doingPan = false;
		}
		this.setupMouseDragHandler(renderNode, startfunction, movefunction, endfunction);
	}

	setupMouseDragHandler(renderNode, startf, movef, endf) {
		let body = null;
		let t = this;
		let mousemove = function(e) {
			movef(e);
			// wow you really have to do all this?
			e.stopPropagation();
			e.preventDefault();
		};
		let mouseup = (event) => {
			body.onmousemove = null;
			body.onmouseup = null;
			if (endf) endf(event);
			event.stopPropagation();
		};

		renderNode.getDomNode().onmousedown = (event) => {
			possiblyRecordAction(event, 'mouse');
			eventQueueDispatcher.enqueueDoClickHandlerAction(this, renderNode, true, event)
			startf(event);
			body = document.getElementsByTagName('body')[0];
			body.onmousemove = mousemove;
			body.onmouseup = mouseup;
			event.stopPropagation();
		};
	}

	minMaxSoundLevelInsidePixel(p) {
		let range = this.samplesRepresentedByPixel(p);
		if (range.start == range.end) {
			let v = this.data[range.start];
			return { min: v, max: v };
		} else if (range.end - range.start < 4) {
			return this.getMinMaxInDataRange(range.start, range.end);
		} else {
			let diff = range.end - range.start;
			// pick three random points, not at exact intervals to reduce chance of aliasing
			let midSample1 = Math.floor(range.start + .3 * diff);
			let midSample2 = Math.floor(range.start + .7 * diff);
			let d0 = this.data[range.start];
			let d1 = this.data[midSample1];
			let d2 = this.data[midSample2];
			let min = Math.min(d0, Math.min(d1, d2));
			let max = Math.max(d0, Math.max(d1, d2));
			return { min: min, max: max };
		}
	}

	renderInto(renderNode, renderFlags, withEditor) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags, withEditor);
		domNode.classList.add('wavetable');
		domNode.classList.add('data');

		let topcontrols = document.createElement('div');
		topcontrols.classList.add('wavecontrols')
		domNode.appendChild(topcontrols);
		topcontrols.appendChild(this.createTimelabel())
		if (this.recording) {
			topcontrols.appendChild(this.createStopRecordingLabel())
		} else {
			topcontrols.appendChild(this.createStartRecordingLabel())
		}
		topcontrols.appendChild(this.createSpacer())
		if (this.isEditing) {
			topcontrols.appendChild(this.createMarkerNums())
			topcontrols.appendChild(this.createAddMarker())
		}

		let viewport = document.createElement('div');
		viewport.classList.add('waveviewport');
		viewport.appendChild(this.createWaveformCanvas());
		// Only when there is something to put on it: the selection point exists
		// while editing, and the playhead while a sound is running. The rest of
		// the time there is no second canvas at all.
		this.playheadNode = null;
		if (this.isEditing || this.auditioning) {
			// Same width and height as the waveform, stacked on it, so the
			// playhead is placed in samples-to-pixels exactly like everything
			// drawn underneath it.
			this.playheadNode = document.createElement('canvas');
			this.playheadNode.classList.add('waveplayhead');
			this.playheadNode.setAttribute('width', this.windowWidth());
			this.playheadNode.setAttribute('height', this.windowHeight());
			// cached because updatePlayhead runs every frame, and reading a
			// computed style forces a style recalculation
			this.playheadColor = getComputedStyle(document.documentElement)
					.getPropertyValue('--wave-playhead').trim();
			viewport.appendChild(this.playheadNode);
		}
		domNode.appendChild(viewport);
		this.updatePlayhead();

		if (this.isEditing) {
			domNode.classList.add('editing');
		} else {
			domNode.classList.remove('editing');
		}
	}

	createSpacer() {
		let spacer = document.createElement('div');
		spacer.classList.add('wavecontrolspacer');
		spacer.innerText = ' ';
		return spacer;
	}

	createTimelabel() {
		let timelabel = document.createElement('div');
		timelabel.classList.add('wavecontrol');
		let n = convertSamplesToTimebase(this.getCurrentTimebase(), this.data.length);
		n = Math.round(n * 1000) / 1000;
		let suffix = getTimebaseSuffix(this.getCurrentTimebase());
		timelabel.innerText = '' + n + ' ' + suffix;
		timelabel.onmousedown = (event) => {
			this.advanceToNextTimebase();
			this.setDirtyForRendering(true);
			eventQueueDispatcher.enqueueTopLevelRender();			
			event.stopPropagation();
			event.preventDefault();
			return false;
		}
		return timelabel;
	}

	createStartRecordingLabel() {
		let recordButtonLabel = document.createElement('div');
		recordButtonLabel.classList.add('wavecontrol');
		recordButtonLabel.innerText = '* rec';
		recordButtonLabel.onmousedown = (event) => {
			startRecordingAudio(this);
			event.stopPropagation();
			event.preventDefault();
			return false;
		}
		return recordButtonLabel;
	}

	createStopRecordingLabel() {
		let recordButtonLabel = document.createElement('div');
		recordButtonLabel.classList.add('wavecontrol');
		recordButtonLabel.innerText = '[] stop';
		recordButtonLabel.onmousedown = (event) => {
			stopRecordingAudio(this);
			event.stopPropagation();
			event.preventDefault();
			return false;
		}
		return recordButtonLabel;
	}

	// createRecordinglabel() {
	// 	let recordinglabel = document.createElement('div');
	// 	recordinglabel.classList.add('wavecontrol');
	// 	recordinglabel.innerText = 'RECORDING'
	// 	return recordinglabel;		
	// }


	createAddMarker() {
		let addMarkerButton = document.createElement('div');
		addMarkerButton.classList.add('wavecontrol');
		addMarkerButton.innerText = 'v';
		addMarkerButton.onmousedown = (event) => {
			this.addMarker();
			event.stopPropagation();
			event.preventDefault();
			return false;
		}
		return addMarkerButton;
	}

	getMarkerName(n) {
		let startnum = "a".charCodeAt(0);
		let thenum = startnum + n;
		let thechar = String.fromCharCode(thenum);
		return thechar;		
	}

	createMarkerNum(n) {
		let markerNum = document.createElement('div');
		markerNum.classList.add('wavecontrol');
		markerNum.innerText = this.getMarkerName(n);
		markerNum.onmousedown = (event) => {
			this.deleteMarker(n);
			event.stopPropagation();
			event.preventDefault();
			return false;
		}
		return markerNum;
	}

	createMarkerNums() {
		let markerList = document.createElement('div');
		markerList.classList.add('markerlist');
		if (this.markers.length > 0) {
			for (let i = 0 ; i < this.markers.length; i++) {
				markerList.appendChild(this.createMarkerNum(i));
			}
		}
		return markerList;
	}

	samplesRepresentedByMultiplePixels(p, endp) {
		let z = [];
		for (let i = p; i < endp; i++) {
			z.push(this.samplesRepresentedByPixel(i));
		}
		let r = z[0];
		for (let i = 1; i < z.length; i++) {
			if (z[i].start < r.start) r.start = z[i].start;
			if (z[i].end > r.end) r.end = z[i].end;
		}
		return r;
	}

	samplesRepresentedByPixel(p) {
		let samplesPerPixel = 1 / this.getPixelsPerSample();
		let startSample = Math.floor(this.windowOriginSample + p * samplesPerPixel);
		let endSample = Math.min(this.data.length - 1, Math.floor(this.windowOriginSample + (p + 1) * samplesPerPixel));
		return {
			start: startSample,
			end: endSample
		}
	}

	// xval is a pixel position in the window
	changeCenterSample(xval) {
		let samps = this.samplesRepresentedByPixel(xval);
		if (samps.start == samps.end) {
			this.centerSample = samps.start;
		} else {
			this.centerSample = Math.floor(samps.start + (samps.end - samps.start))
		}
	}

	createWaveformCanvas() {

		let canvas = document.createElement('canvas');
		canvas.classList.add('wavecanvas');
		canvas.setAttribute('height', this.windowHeight());
		canvas.setAttribute('width', this.windowWidth());
		let ctx = canvas.getContext("2d");

		let pps = this.getPixelsPerSample();
		let increment = Math.ceil(pps);
		let doRect = (pps >= 2);
		let solidRect = (pps >= 1 && pps < 2);
		ctx.lineWidth = 1;
		let drawTopClippingLine = false;
		let drawBottomClippingLine = false;
		// from the stylesheet, so the canvas and the dom can't drift apart
		let themeColor = (name) => getComputedStyle(document.documentElement)
				.getPropertyValue(name).trim();

		let regularColor = themeColor('--wave-regular');
		let intenseColor = themeColor('--wave-intense');
		let auditionColor = themeColor('--wave-audition');
		let solidRectColor = themeColor('--wave-solid');

		if (this.isEditing) {
			regularColor = intenseColor = themeColor('--wave-editing');
			solidRectColor = themeColor('--wave-solid-editing');
		}

		let markerColor = themeColor('--wave-marker');
		let lightMarkerColor = themeColor('--wave-marker-light');
		let clippingColor = themeColor('--wave-clipping');

		let zeroColor = themeColor('--wave-zero');
		for (let i = 0 ; i < this.windowWidth(); i += increment) {
			let range = this.samplesRepresentedByMultiplePixels(i, i + increment);
			let v = this.minMaxSoundLevelInsidePixel(i);
			if (v.max > 1) drawTopClippingLine = true;
			if (v.min < -1) drawBottomClippingLine = true;
			let top = this.yPositionOfWaveValue(v.max);
			let bottom = this.yPositionOfWaveValue(v.min);
			let doAudition = (this.sectionBeingAuditioned &&
				range.start >= this.sectionBeingAuditioned.start &&
				range.start < this.sectionBeingAuditioned.end);
			if (doRect || solidRect) {
				let center = this.yPositionOfWaveValue(0);
				let start = top;
				let end = center;
				if (top > center) {
					start = center;
					end = bottom;
				}
				let height = end - start;
				let width = increment;

				if (doAudition) {
					ctx.beginPath();
					ctx.fillStyle = auditionColor;
					ctx.fillRect(i, 0, width, this.windowHeight());
				}
				if (doRect) {
					ctx.beginPath();
					ctx.strokeStyle = regularColor;
					ctx.strokeRect(i, start, width, height);
				} else {
					ctx.beginPath();
					ctx.fillStyle = solidRectColor;
					ctx.fillRect(i, start, width, height);
				}
			} else {
				if (doAudition) {
					this.drawVertLine(ctx, i, false, auditionColor);					
				}
				let center = this.yPositionOfWaveValue(0);
				let start = top;
				let end = bottom;
				if (top < center && bottom < center) {
					ctx.beginPath();
					ctx.strokeStyle = intenseColor;
					ctx.moveTo(i, top);
					ctx.lineTo(i, bottom);					
					ctx.stroke();

					ctx.beginPath();
					ctx.strokeStyle = regularColor;
					ctx.moveTo(i, bottom);					
					ctx.lineTo(i, center);					
					ctx.stroke();

				} else if (top > center && bottom > center) {
					ctx.beginPath();
					ctx.strokeStyle = regularColor;
					ctx.moveTo(i, center);
					ctx.lineTo(i, top);					
					ctx.stroke();

					ctx.beginPath();
					ctx.strokeStyle = intenseColor;
					ctx.moveTo(i, top);					
					ctx.lineTo(i, bottom);					
					ctx.stroke();
				} else {
					ctx.beginPath();
					ctx.moveTo(i, top);
					ctx.strokeStyle = regularColor;
					ctx.lineTo(i, bottom);					
					ctx.stroke();					
				}
			}
			// do lines here if necessary
			if (this.isEditing) {
				for (let j = 0; j < this.markers.length; j++) {
					let marker = this.markers[j];
					if (this.shouldDoLine(marker, range)) {
						this.drawVertLine(ctx, i, false, markerColor);
					}
				}
			} else {
				for (let j = 0; j < this.markers.length; j++) {
					let marker = this.markers[j];
					if (this.shouldDoLine(marker, range)) {
						this.drawVertLine(ctx, i, false, lightMarkerColor);
					}
				}
			}

		}
		// draw marker names
		for (let i = 0; i < this.markers.length; i++) {
			let n = this.getMarkerName(i);
			let xpos = this.xPositionOfSampleNumber(this.markers[i]);
			let boxy = 0;
			let namey = boxy + 10;
			let nameind = 3;
			let boxsize = 13;
			ctx.beginPath();
			ctx.fillStyle = '#ffffff';
			ctx.strokeStyle = '#000000';
			ctx.font = "11px Courier";
			ctx.fillRect(xpos, boxy, boxsize, boxsize);
			ctx.strokeRect(xpos, boxy, boxsize, boxsize);
			ctx.fillStyle = '#000000';
			ctx.fillText(n, xpos + nameind, namey);
		}
		if (drawTopClippingLine) {
			this.drawHorizLine(ctx, 1, true, clippingColor);
		}
		if (drawBottomClippingLine) {
			this.drawHorizLine(ctx, -1, true, clippingColor);
		}
		if (this.rightIsClipping) {
			this.drawEndCap(ctx);
			// this.drawVertLine(ctx, this.windowWidth() - 10, false, zeroColor)
			// this.drawVertLine(ctx, this.windowWidth() - 20, false, zeroColor)
			// this.drawVertLine(ctx, this.windowWidth() - 30, false, zeroColor)
		}

		return canvas;
	}

	shouldDoLine(lineSample, range) {
		return (range.start == range.end && lineSample == range.start)
				||
				(lineSample >= range.start && lineSample < range.end);
	}

	debugString() {
		return "<not impl>"
	}

	drawEndCap(ctx) {
		let themeColor = (name) => getComputedStyle(document.documentElement)
				.getPropertyValue(name).trim();
		let color1 = themeColor('--wave-endcap-1');
		let color2 = themeColor('--wave-endcap-2');
		let color3 = themeColor('--wave-endcap-3');
		let color4 = themeColor('--wave-endcap-4');
		let stripwidth = 10;
		ctx.beginPath();
		ctx.fillStyle = color1;
		ctx.fillRect(this.windowWidth() - 4 * stripwidth, 0, stripwidth, this.windowHeight());
		ctx.beginPath();
		ctx.fillStyle = color2;
		ctx.fillRect(this.windowWidth() - 3 * stripwidth, 0, stripwidth, this.windowHeight());
		ctx.beginPath();
		ctx.fillStyle = color3;
		ctx.fillRect(this.windowWidth() - 2 * stripwidth, 0, stripwidth, this.windowHeight());
		ctx.beginPath();
		ctx.fillStyle = color4;
		ctx.fillRect(this.windowWidth() - 1 * stripwidth, 0, stripwidth, this.windowHeight());
	}


	drawVertLine(ctx, x, dash, color) {
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.strokeStyle = color;
		if (dash) {
			ctx.setLineDash([10, 5])
		}
		ctx.lineTo(x, this.windowHeight());
		ctx.stroke();
		ctx.setLineDash([]);		
	}


	drawHorizLine(ctx, atY, dash, color) {
		let lineY = this.yPositionOfWaveValue(atY);
		ctx.beginPath();
		ctx.moveTo(0, lineY);
		ctx.strokeStyle = color;
		if (dash) {
			ctx.setLineDash([10, 5])
		}
		ctx.lineTo(this.windowWidth(), lineY);
		ctx.stroke();
		ctx.setLineDash([]);		
	}

	getEventTable(context) {
		return {
			'Enter': 'audition-wave',
		}
	}

	cleanupOnMemoryFree() {
		if (this.recording) {
			stopRecordingAudio(this);
		}
	}

}


class WavetableEditor extends Editor {

	constructor(nex) {
		super(nex, 'WavetableEditor');
	}

	getStateForUndo() {
		return this.nex.getData();
	}

	setStateForUndo(val) {
		this.nex.setData(val);
	}


	shouldIgnore(text) {
		if (/^[0-9v ]$/.test(text)) return false;
		return text != 'Enter'
	}

	doAppendEdit(text) {
		if (text == ' ') {
			this.nex.togglePlayback();
		} else if (text == 'v') {
			this.nex.addMarker();
		} else {
			this.nex.auditionSection(text);
		}
	}

	shouldAppend(text) {
		if (/^[0-9v ]$/.test(text)) return true;
		return false;
	}


	memUsed() {
		return super.memUsed() + heap.sizeWavetable();
	}
}

function constructWavetableWithFileData(data) {

}

function constructWavetable(initSize) {
	if (!initSize) {
		initSize = 256;
	}
	let sizeRequired = heap.sizeWavetable() + initSize * heap.incrementalSizeWavetable();
	if (!heap.requestMem(sizeRequired)) {
		throw constructFatalError(`OUT OF MEMORY: cannot allocate Wavetable.
stats: ${heap.stats()}`)
	}
	return heap.register(new Wavetable(initSize));
}


export { Wavetable, WavetableEditor, constructWavetable, setSerializeAudioData, setAudioCollector, setAudioReader }
