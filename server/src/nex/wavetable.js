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
import { constructFatalError } from './eerror.js'


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
import { getAudioBufferFromData, getSilentAudioBuffer, stopRecordingAudio } from '../webaudio.js'
import * as audioStore from '../audiostore.js'
import { newShortId } from '../utils.js'
import { systemState } from '../systemstate.js'


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
/*
A wavetable's private data is a list of fields:

    [wavetable]"bp:1000,2000,3500;aud:0"

    key:value;key:value

The sample references were already this shape, so nothing had to be invented
for them -- "aud:0" and "idb:<hash>" are just the field that says where the
samples are. Everything else is metadata alongside it.

  bp   split points, ascending sample offsets (the key stays bp,
       which is what already-saved files say)
  aud  index into this file's own sample list, meaningless outside it
  idb  content hash of the samples in IndexedDB, written by autosave

Metadata goes first and the samples last, because in the inline form the
samples are a megabyte of base64 and anything you have to scroll past is
something you will never read.

No audio field at all means silence: a wavetable that says nothing about its
samples comes back as DEFAULT_SIZE of them at zero, so "there was nothing to
store" costs nothing to store.

A field with no colon is the samples themselves, unkeyed. That is what every
file written before fields existed looks like -- raw base64, or the older
comma-separated decimals -- and neither can be mistaken for a field, since
neither contains a colon or a semicolon.

Unknown keys are ignored rather than refused, so a file written by a later
version loses whatever it knew that this one does not, instead of failing to
load.

(comment by Claude)
*/
const FIELD_SEPARATOR = ';';
const KEY_SEPARATOR = ':';
const SPLIT_POINTS_KEY = 'bp'; // the name on disk, kept so old files still read

/*
Every wavetable has an id, and its samples are found by that id wherever they
are kept -- in this file, or in indexeddb. One name, so a third place to keep
them would not need a fourth way of naming them.

It names the wavetable, not its contents: editing the samples keeps the id, so
the stored copy is overwritten rather than orphaned.

(comment by Claude)
*/
const WAVETABLE_ID_KEY = 'wid';

/*
A wavetable can be zoomed down vertically until there is nothing to see and,
worse, nothing to take hold of -- and the gesture for zooming back up is a drag
on the wavetable itself, so getting there means being stuck there. Hence a
floor.

One floor, not two. Flooring the box and the scale separately meant that
between the two the wave went on shrinking inside a box that had already
stopped, and the drawing drifted out of the space it was drawn in. The scale
floor is worked out from the box floor instead, so they arrive together: at the
bottom the samples stop shrinking at the same moment the box does, and
windowHeight needs no clamp of its own because it can no longer go under.

A wave counts as at least full scale (windowHeight uses max(amp, 1)), so half
the smallest box is the smallest scale that can fill it.
*/
const MIN_WINDOW_HEIGHT_PIXELS = 7;
const MIN_HEIGHT_PIXELS_FULL_SCALE = MIN_WINDOW_HEIGHT_PIXELS / 2;

/*
Decodes samples stored directly in a document. Two formats have been written
over the years: base64 of the raw Float32 bytes, and before that a list of
decimal numbers separated by commas. Telling them apart is unambiguous because
the base64 alphabet has no comma in it.

Throws on data it cannot read, like the rest of the file-reading code. Data that
is there and wrong is a different thing from data that is missing -- a reference
to samples that are not there comes back as silence, because storage being
cleared is expected, but a wavetable whose own bytes are malformed means the
document is damaged and should say so.

(comment by Claude)
*/
function parseInlineSamples(data) {
	if (data.indexOf(',') >= 0) {
		let parts = data.split(',');
		let out = new Float32Array(parts.length);
		for (let i = 0; i < parts.length; i++) {
			let n = Number(parts[i]);
			if (!isFinite(n)) {
				throw constructFatalError(`wavetable sample list has a value that is not a number: ${parts[i]}`);
			}
			out[i] = n;
		}
		return out;
	} else {
		let s;
		try {
			s = window.atob(data);
		} catch (e) {
			throw constructFatalError('wavetable data is not valid base64');
		}
		let bytes = new Uint8Array(s.length);
		for (let i = 0; i < s.length; i++) {
			bytes[i] = s.charCodeAt(i);
		}
		// four bytes to a sample; anything else means the data was truncated
		// (comment by Claude)
		if (bytes.length % 4 != 0) {
			throw constructFatalError('wavetable data is not a whole number of samples');
		}
		return new Float32Array(bytes.buffer);
	}
}

const DEFAULT_SIZE = 256;

/*
Zooming while not editing sets the global scale that every non-editing
wavetable draws at, so all of them have to repaint together or the document
shows waves at unrelated scales.

(comment by Claude)
*/
function renderAllWavetables() {
	let root = systemState.getRoot();
	if (!root) return;
	dirtyWavetablesUnder(root);
	eventQueueDispatcher.enqueueRenderOnlyDirty();
}

function dirtyWavetablesUnder(renderNode) {
	if (renderNode.getNex() instanceof Wavetable) {
		renderNode.setRenderNodeDirtyForRendering(true);
	}
	for (let i = 0; i < renderNode.numChildren(); i++) {
		dirtyWavetablesUnder(renderNode.getChildAt(i));
	}
}

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

		this.mutedCached = null;
		this.silentData = null;
		this.localPixelsPerSample = -1;
		this.localHeightPixelsFullScale = -1;
		this.centerSample = -1;
		// while a section is auditioning, the buffer being played starts partway
		// into the wave, so positions coming back from it need shifting
		// (comment by Claude)
		this.playheadOffset = 0;
		this.playheadNode = null;
		this.playheadFrame = null;
		this.doingPan = false;
		// where the line was before playback borrowed it
		// (comment by Claude)
		this.playbackStartSample = -1;
		this.wavetableId = newShortId();
		this.markers = [];
		// position -> name, for the split points that have one
		this.markerNames = {};
		this.sectionBeingAuditioned = null;
		this.recording = false;
		this.recordingBuffer = null;
		this.recordedLength = 0;
		this.currentTimebase = null;
		this.rightIsClipping = false;

		if (initSize == undefined) initSize = 256;
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

	isRecording() {
		return this.recording;
	}

	startRecording() {
		this.data = new Float32Array();
		// same as setData: nothing should be left looking at the take before
		// this one
		// (comment by Claude)
		this.cacheSections();
		// a second of samples to start with, doubled whenever it runs out
		// (comment by Claude)
		this.recordingBuffer = new Float32Array(getSampleRate());
		this.recordedLength = 0;
		this.recording = true;
		this.enterEditorForRecording();
		this.renderOnlyThisNex();
	}

	/*
	Recording a wave means working on that wave, so vodka goes to it and opens
	its editor. Not only for the look of it: without this the keyboard is still
	wherever it was, and the keys that are harmless there are not harmless on a
	wave that is being written into -- you can be inserting nexes next to it, or
	evaluating something, while the samples arrive. In the editor the keys that
	mean something are the wave's own, and a wave's editor is also where the
	stop button is.

	A reduced editor, because some of it cannot work on a wave that is still
	growing: no zoom, no pan, no markers, no moving the selection point. Those
	ask a question about a wave of a certain length and the length is changing
	under them. Each of those reads isRecording rather than being switched off
	here, and they come back by themselves when it stops.

	The editor stays open afterwards. You have just recorded something and the
	next thing you do with it -- audition it, trim it, mark it up -- is in the
	editor anyway.

	An immutable wave has no editor to open, and so does a wave that nothing has
	rendered. Those still have to look like what they are doing, so the flag the
	renderer reads is set by hand, and taken back when recording stops.

	(comment by Claude)
	*/
	enterEditorForRecording() {
		this.fakeEditingForRecording = false;
		let nodes = this.getRenderNodes();
		let node = (nodes && nodes.length > 0) ? nodes[0] : null;
		if (node && !node.getCurrentEditor()) {
			node.setSelected();
			node.possiblyStartMainEditor();
		}
		if (!this.isEditing) {
			this.isEditing = true;
			this.fakeEditingForRecording = true;
		}
	}

	/*
	Samples as they arrive, while recording.

	Written into a buffer that is grown by doubling, and this.data is a view of
	the part of it that has been filled -- so a block costs a copy of itself and
	nothing else, and the wave reads at its true length the whole way through.

	It used to keep every block and rebuild the whole wave out of them each time
	one arrived. That is quadratic: a thirty second take arrives in about eleven
	thousand blocks and block n copies n blocks' worth, which comes to tens of
	gigabytes of allocation for one take. The live set stayed small, so it never
	looked like a leak -- it is a garbage collector asked to keep up with an
	allocation rate nothing needs to have.

	cacheValues is deliberately not called: it walks the whole buffer for the
	amplitude, which is not wanted several times a second and which the waveform
	display does not need. stopRecording does it once at the end.

	(comment by Claude)
	*/
	appendRecordedData(block) {
		if (!this.recordingBuffer) return;
		if (this.recordedLength + block.length > this.recordingBuffer.length) {
			let want = this.recordingBuffer.length * 2;
			while (want < this.recordedLength + block.length) want *= 2;
			let bigger = new Float32Array(want);
			bigger.set(this.recordingBuffer.subarray(0, this.recordedLength));
			this.recordingBuffer = bigger;
		}
		this.recordingBuffer.set(block, this.recordedLength);
		this.recordedLength += block.length;
		this.data = this.recordingBuffer.subarray(0, this.recordedLength);
		this.renderOnlyThisNex();
	}

	stopRecording() {
		this.recording = false;
		/*
		Trimmed to what was recorded, as its own array: the buffer underneath is
		up to twice as long as the take, and a view of the first half of it
		holds all of it up for as long as the wave exists.

		(comment by Claude)
		*/
		if (this.recordingBuffer) {
			this.data = this.recordingBuffer.slice(0, this.recordedLength);
			this.recordingBuffer = null;
		}
		if (this.fakeEditingForRecording) {
			this.isEditing = false;
			this.fakeEditingForRecording = false;
		}
		if (this.data.length == 0) {
			// nothing arrived; a wavetable cannot be zero samples long
			// (comment by Claude)
			this.data = new Float32Array(DEFAULT_SIZE);
		}
		// the amplitude and the playback buffer, once, now that it is over
		// (comment by Claude)
		this.cacheValues();
		this.renderOnlyThisNex();
	}

	setRecordedData(buf) {
		this.data = Float32Array.from(buf);
		this.cacheValues();
		this.renderOnlyThisNex();
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
		this.renderOnlyThisNex();
	}

	deleteMarker(i) {
		delete this.markerNames[this.markers[i]];
		this.markers.splice(i, 1);
		// the sections are what you audition, and there is one fewer of them
		// now -- every other thing that moves a marker recuts them, and this
		// one did not, so the regions went on being the ones either side of a
		// split that is no longer there
		// (comment by Claude)
		this.cacheSections();
		this.renderOnlyThisNex();
	}

	/*
	A wave tagged mute reads as silence wherever its samples are read, and keeps
	its length. Silenced here rather than at the speaker, so a muted wave laid
	into a seq still takes up the time it always did, and anything built out of
	it is silent too. Mute is a property of the sound, not of the playing of it.

	The samples are still there. Taking the tag off brings them back.

	Remembered rather than asked, because valueAtSample is the innermost loop of
	every builtin here and walking a tag list per sample is not affordable.
	tagsChanged drops the answer.

	(comment by Claude)
	*/
	tagsChanged() {
		this.mutedCached = null;
	}

	isMuted() {
		if (this.mutedCached === null) {
			this.mutedCached = this.hasTagWithString('mute');
		}
		return this.mutedCached;
	}

	// one array of zeros, kept, because a muted wave usually stays muted a while
	// (comment by Claude)
	getSilentData() {
		if (!this.silentData || this.silentData.length != this.data.length) {
			this.silentData = new Float32Array(this.data.length);
		}
		return this.silentData;
	}

	getData() {
		return this.isMuted() ? this.getSilentData() : this.data;
	}

	/*
	The samples as the audio system wants them, built here and not kept.

	A wavetable used to hold its AudioBuffer for the life of the wave, which is
	the same samples a second time -- an AudioBuffer is its own copy -- so every
	wave in a document cost twice what it is. Most waves in a document are not
	playing. Now the copy exists while something is playing or auditioning it,
	because that is who holds the buffer, and a wave at rest is one array of
	samples and nothing else.

	The copy is made here, when you play or audition, rather than on the audio
	timer, so nothing long-winded happens anywhere with a deadline.

	It also fixes something by accident: the buffer used to be made when the
	wave last cached, so playing a wave that had been written into since then
	played what it used to be.

	(comment by Claude)
	*/
	getCachedBuffer() {
		if (this.isMuted()) {
			return getSilentAudioBuffer(this.data.length);
		}
		return getAudioBufferFromData(this.data);
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
			renderAllWavetables();
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
		if (!(val >= MIN_HEIGHT_PIXELS_FULL_SCALE)) {
			val = MIN_HEIGHT_PIXELS_FULL_SCALE;
		}
		if (this.localHeightPixelsFullScale > -1) {
			this.localHeightPixelsFullScale = val;
		} else {
			setGlobalHeightPixelsFullScale(val);
			renderAllWavetables();
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
		// we just don't want a window larger than 1000 pixels, it'll crash things.
		// No floor here: the scale cannot go below what fills the smallest box,
		// so this cannot come out under it, and a floor here would be the thing
		// that let the box and the wave disagree.
		return Math.min(2 * maxamp * this.getHeightPixelsFullScale(), 1000);
	}

	setDataAt(d, i) {
		this.data[i] = d;
	}

	setData(d) {
		this.data = d;
		// the section views are windows onto the array that was just replaced,
		// so they would be showing the old samples -- and holding the old array
		// up as well, which for a wave that has just been undone is the whole
		// of it
		// (comment by Claude)
		this.cacheSections();
		this.setDirtyForRendering(true);
	}

	/*
	This makes sure you don't set the window origin to be less than zero or
	large enough that empty space appears to the right of the sample. The far
	end is data.length - samplesInWindow: the window covers origin .. origin +
	samplesInWindow, so that is the origin whose window ends exactly where the
	wave does.

	It used to be one less than that, which left the final sample one column
	past the right edge and unreachable. A single sample sounds like nothing,
	but zoomed in far enough one sample is a wide stripe, and it is the stripe
	at the end of the wave.

	(comment by Claude)
	*/
	setWindowOriginSample(n) {
		let samplesInWindow = this.windowWidth() / this.getPixelsPerSample();
		let minOrigin = 0;
		let maxOrigin = this.data.length - samplesInWindow;
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

	/*
	What is worth working out once about the samples: the amplitude, which is
	what the drawing is scaled to. No buffer any more -- see getCachedBuffer --
	and the sections, which are only views now, are refreshed here because this
	is where a wave says its samples have changed.

	(comment by Claude)
	*/
	cacheValues() {
		let mm = this.getMinMaxInDataRange(0, this.data.length);
		let absMin = Math.abs(mm.min);
		this.setAmp(Math.max(absMin, mm.max));
		this.cacheSections();
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
		if (this.isMuted()) return 0;
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

	// the loudest sample of a muted wave is zero, which is also what stops it
	// being reported as clipping
	// (comment by Claude)
	getAmp() {
		return this.isMuted() ? 0 : this.amp;
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
		nex.markerNames = {};
		for (let at in this.markerNames) {
			nex.markerNames[at] = this.markerNames[at];
		}
		nex.wavetableId = newShortId();
		nex.cacheSections();
	}

	toString(version, ctx) {
		if (version == 'v2') {
			return this.toStringV2(ctx);
		}
		return '_[wavetable]';
	}

	toStringV2(ctx) {
		return `[${this.toStringV2Literal()}wavetable]${this.toStringV2PrivateDataSection(ctx)}${this.toStringV2TagList()}`

	}

	// Referenced audio can be missing: storage cleared, quota evicted, a file
	// truncated. Coming back as silence beats failing to restore the document at
	// all. Length matters as well as presence -- a zero-length buffer is truthy,
	// and a wavetable with no samples can't build an AudioBuffer, so it would
	// throw on the way out of here.
	// (comment by Claude)
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
		this.restoreMarkers(fields[SPLIT_POINTS_KEY]);
	}

	deserializeSamples(fields, unkeyed) {
		// Written by autosave. The lookup is synchronous because every record
		// was read into memory during startup, before any document was built --
		// see audiostore.js.
		// (comment by Claude)
		if (WAVETABLE_ID_KEY in fields) {
			this.wavetableId = fields[WAVETABLE_ID_KEY];
			// A file being read brings its own samples; otherwise they are in
			// indexeddb, read into memory at startup so this is synchronous.
			// (comment by Claude)
			let resolver = systemState.getAudioSampleResolver();
			let samples = resolver ? resolver(this.wavetableId) : null;
			if (!samples) {
				samples = audioStore.get(this.wavetableId);
			}
			this.setSamplesOrSilence(samples);
			return;
		}
		// The samples themselves, unkeyed. Every file saved before containers
		// looks like this, and autosave still writes it for the silence
		// fallback when IndexedDB isn't available.
		// (comment by Claude)
		this.setSamplesOrSilence(unkeyed ? parseInlineSamples(unkeyed) : null);
	}

	/*
	Markers are dropped rather than clamped if they do not land inside the wave
	that actually arrived. That is the same range addMarker enforces -- a marker
	at either end makes an empty section -- and it is what keeps a wave that came
	back as silence, because its samples were not there to restore, from also
	coming back covered in markers pointing into nothing.

	(comment by Claude)
	*/
	restoreMarkers(value) {
		let out = [];
		let names = {};
		let raw = value ? value.split(',') : [];
		for (let i = 0; i < raw.length; i++) {
			let eq = raw[i].indexOf('=');
			let n = Number(eq < 0 ? raw[i] : raw[i].substring(0, eq));
			if (Number.isInteger(n) && n >= 1 && n <= this.data.length - 1) {
				out.push(n);
				if (eq >= 0) {
					names[n] = decodeURIComponent(raw[i].substring(eq + 1));
				}
			}
		}
		this.markers = out.sort((a, b) => a - b);
		this.markerNames = names;
		if (this.markers.length == 0) return;
		// sections are views now and cost nothing to make, so there is no
		// longer anything here that can run out of memory
		// (comment by Claude)
		this.cacheSections();
	}

	serializePrivateData(ctx) {
		let fields = [];
		if (this.markers.length > 0) {
			// a named point is written pos=name, the name uri-encoded so it
			// cannot collide with any separator
			let written = this.markers.map(m => {
				let name = this.markerNames[m];
				return name ? m + '=' + encodeURIComponent(name) : '' + m;
			});
			fields.push(SPLIT_POINTS_KEY + KEY_SEPARATOR + written.join(','));
		}
		// last, and the only field that may arrive without a key. Empty when
		// there was nowhere to put the samples, in which case no field is
		// written at all and reading it back gives silence.
		// (comment by Claude)
		let samples = this.serializeSamples(ctx);
		if (samples != '') {
			fields.push(samples);
		}
		return fields.join(FIELD_SEPARATOR);
	}

	serializeSamples(ctx) {
		if (ctx.isFile()) {
			// into the file's own resource section, under this id
			// (comment by Claude)
			ctx.audioCollector.add(this.wavetableId, this.data);
			return WAVETABLE_ID_KEY + KEY_SEPARATOR + this.wavetableId;
		}
		if (ctx.isBrowserStorage()) {
			// Samples are far too large for localStorage -- roughly 250KB of
			// base64 per second of audio, against about five megabytes for
			// everything -- so they go to indexeddb and the document keeps only
			// the id.
			// (comment by Claude)
			if (audioStore.isUnavailable()) {
				// no indexeddb: a private window, or blocked site data
				// (comment by Claude)
				return '';
			}
			audioStore.put(this.wavetableId, this.data);
			return WAVETABLE_ID_KEY + KEY_SEPARATOR + this.wavetableId;
		}
		// Display: printing, a debug string, the text of an error message.
		// Nothing that reads those wants a megabyte of base64, and there is
		// nowhere to put the samples anyway.
		// (comment by Claude)
		return '';
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
				// (comment by Claude)
				this.playheadOffset = sd.start;
				this.playbackStartSample = this.centerSample;
				startAuditioningBuffer(getAudioBufferFromData(sd.data), this, 0,
						false /* momentary */);
				this.renderOnlyThisNex();
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

	/*
	A section is a start, an end, and a view of the samples between them -- a
	subarray, which is a window onto the one array rather than a copy of part of
	it. Nothing is allocated here and there is nothing to charge for.

	It used to copy each section out, into a plain javascript array, which is
	eight bytes a sample rather than four, and then give each section an
	AudioBuffer of its own as well. A wave cut into sections cost about five
	times what the wave is. A section's buffer is built when you audition it,
	like any other.

	Views go stale when the samples are replaced rather than written into, so
	this is called from cacheValues, which is what every such replacement ends
	with.

	(comment by Claude)
	*/
	cacheSections() {
		this.sections = [];
		for (let i = 0; i <= this.markers.length; i++) {
			let start = (i == 0) ? 0 : this.markers[i - 1];
			let end = (i == this.markers.length) ? this.data.length : this.markers[i];
			if (end < start) end = start;
			this.sections[i] = {
				start: start,
				end: end,
				data: this.data.subarray(start, end)
			};
		}
	}


	auditionWave() {
		if (!this.auditioning) {
			this.auditioning = true;
			this.playheadOffset = 0;
			// Always from the beginning. You are not editing when you get here
			// -- Enter terminates the editor -- so there is no selection point,
			// and the line is only here to show how far in you are.
			// (comment by Claude)
			startAuditioningBuffer(this.getCachedBuffer(), this, 0, false /* momentary */,
				this.loopStartSeconds());
			// outside the editor there is no playhead layer yet -- this is the
			// render that adds one
			// (comment by Claude)
			this.renderOnlyThisNex();
			this.startPlayheadAnimation();
		}
	}

	/*
	Space, while editing. Unlike holding enter this survives the keyup, so it
	plays until you press space again.

	Playback starts from the green line, which is the selection point, and the
	same line then becomes the playhead and moves. With nothing selected the
	line has not been placed yet, so it starts at the beginning.

	(comment by Claude)
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
		startAuditioningBuffer(this.getCachedBuffer(), this, this.centerSample, true /* sustained */,
			this.loopStartSeconds());
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
			// (comment by Claude)
			if (!this.isEditing) {
				this.centerSample = -1;
			} else if (this.playbackStartSample >= 0) {
				this.centerSample = this.playbackStartSample;
			}
			this.playbackStartSample = -1;
			this.updatePlayhead();
			this.renderOnlyThisNex();
		}
	}

	/*
	The playhead is a positioned div over the canvas rather than something drawn
	into it, so moving it is one style write. Redrawing the waveform every frame
	would mean rescanning the samples behind every pixel column sixty times a
	second, which is far too much work to be doing during a set.

	(comment by Claude)
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
	// (comment by Claude)
	pixelPositionOfSample(sample) {
		return (sample - this.windowOriginSample) * this.getPixelsPerSample();
	}

	updatePlayhead() {
		if (!this.playheadNode) return;
		let ctx = this.playheadNode.getContext('2d');
		// An empty overlay is an invisible one, so there is no separate hidden
		// state to keep in step with anything.
		// (comment by Claude)
		ctx.clearRect(0, 0, this.windowWidth(), this.windowHeight());
		if (this.centerSample < 0) return;
		if (!this.isEditing && !this.auditioning) return;
		let x = Math.round(this.pixelPositionOfSample(this.centerSample));
		if (x < 0 || x > this.windowWidth()) return;
		ctx.lineWidth = 1;
		// half a pixel over, or a one-pixel line straddles two columns and comes
		// out two pixels wide and half strength
		// (comment by Claude)
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
		// (comment by Claude)
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
			// (comment by Claude)
			this.doingPan = (event.ctrlKey || event.metaKey) && this.isEditing
					&& !this.recording;
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
			// (comment by Claude)
			dragged = false;
			downOffsetX = event.offsetX;
			// what zooming holds still: the sample under the cursor, so the
			// thing you grabbed stays where you grabbed it
			// (comment by Claude)
			anchorSample = this.samplesRepresentedByPixel(event.offsetX).start;
			initialZoom = this.getPixelsPerSample();
			initialAmpZoom = this.getHeightPixelsFullScale();
			initialWindowOrigin = this.windowOriginSample;
			// enqueue a redraw for the center line
			this.renderOnlyThisNex();
		}
		let movefunction = (e) => {
			// Nothing to drag on a wave that is recording. Zoom holds the sample
			// under the cursor still, and that sample is a fraction of a length
			// that is growing a few times a second, so the wave would crawl out
			// from under the gesture
			// (comment by Claude)
			if (this.recording) return;
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
				// (comment by Claude)
				this.setWindowOriginSample(
						initialWindowOrigin - (x - startx) / this.getPixelsPerSample());
				this.updatePlayhead();
				this.renderOnlyThisNex();
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
				// (comment by Claude)
				let positionOfClickInWindow = downOffsetX / t.windowWidth();
				let samplesInWindow = t.windowWidth() / this.getPixelsPerSample();
				t.setWindowOriginSample(anchorSample - (samplesInWindow * positionOfClickInWindow));
			}
			this.renderOnlyThisNex();
		}
		/*
		A click places the playhead; a drag zooms and leaves it alone. Deciding
		on the way up rather than the way down is what makes that possible --
		on the way down there is no way to know yet which one you are doing.

		Only while editing, and only when nothing is playing: during playback
		the line is the playhead and clicking must not move it, which is the
		same rule as before.

		(comment by Claude)
		*/
		let endfunction = () => {
			if (!dragged && !this.doingPan && this.isEditing && !this.auditioning
					&& !this.recording) {
				this.changeCenterSample(downOffsetX);
				this.updatePlayhead();
				this.renderOnlyThisNex();
			}
			this.doingPan = false;
		}
		this.setupMouseDragHandler(renderNode, startfunction, movefunction, endfunction);
	}

	/*
	A press with a modifier held is a zoom or a pan, not a press of whatever it
	landed on. The controls along the top of a wavetable would otherwise eat it,
	and that matters more than it sounds: the way out of a wave zoomed so flat
	you cannot see it is to zoom it back up, and if the only place that gesture
	works is the waveform itself, there is nothing left to take hold of. Letting
	a modified press through means the whole wavetable is a handle, controls
	included.

	Unmodified presses still belong to the control, so the buttons and the time
	label go on working the way they did.
	*/
	pressIsAGesture(event) {
		return event.shiftKey || event.ctrlKey || event.metaKey;
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

	/*
	Condensed mode lays a wave out differently rather than just hiding things.
	Above the wave, everything costs height: a row of controls and a row of tags
	is two rows of not-wave between every pair of waves you are trying to
	compare, which is the whole reason for the mode. Over the wave it costs
	nothing, and a waveform has plenty of room in it -- the metadata sits in the
	top left corner, where there is quiet space in most waves and where the
	start of the sound is anyway.

	A wave too short for its own metadata ends up in a box wider than itself,
	with a field beside it saying so, exactly as it does in the full layout.
	The row is a grid cell rather than an overlay for that reason -- see the
	stacking rules in wavetable.css.

	Which wave is selected is left to css (see the :not(.newselected) rules):
	both versions of the row are built, because selecting a nex only changes a
	class on its dom node -- nothing re-renders -- so a structure that depended
	on which wave was selected would be the structure from whenever it last
	rendered.

	Editing is different, and is decided here. A wave is re-rendered when it
	starts and stops being edited, so the structure can follow it, and it has
	to: editing is working on one wave rather than looking at a stack of them,
	and it wants the markers, the timebase and the tags out where they can be
	read and clicked rather than cropped to the length of the sound. So an
	editing wave gets the full layout and its neighbours stay condensed.

	(comment by Claude)
	*/
	/*
	Recording looks like editing whether or not the editor is open. It normally
	is -- see enterEditorForRecording -- but a wave with no editor to open
	records anyway, and so does one whose editor you closed with the samples
	still arriving, and in both of those the stop button and the growing
	waveform have to stay where they were rather than the wave quietly
	condensing mid-take.

	(comment by Claude)
	*/
	showsAsEditing() {
		return this.isEditing || this.recording;
	}

	wavesAreCondensed() {
		if (this.showsAsEditing()) {
			return false;
		}
		return typeof document != 'undefined'
				&& !!document.body
				&& !document.body.classList.contains('fullwaves');
	}

	/*
	The tags go in the row with the duration rather than in a row of their own,
	so this hands the tag renderer the overlay. RenderNode asks for this after
	renderInto has run, which is where the overlay is made.

	(comment by Claude)
	*/
	getTagHolder(domNode) {
		if (this.metaOverlayNode) {
			return this.metaOverlayNode;
		}
		return super.getTagHolder(domNode);
	}

	renderInto(renderNode, renderFlags, withEditor) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags, withEditor);
		domNode.classList.add('wavetable');
		domNode.classList.add('data');

		let condensed = this.wavesAreCondensed();
		this.metaOverlayNode = null;

		let topcontrols = document.createElement('div');
		topcontrols.classList.add(condensed ? 'wavemeta' : 'wavecontrols')
		if (condensed) {
			// stacked on the waveform, so it is put in the viewport below,
			// after the canvases, rather than above the wave here
			// (comment by Claude)
			this.metaOverlayNode = topcontrols;
		} else {
			domNode.appendChild(topcontrols);
		}
		topcontrols.appendChild(this.createTimelabel())
		/*
		Stop, but no start. A button that begins recording sits among controls
		you press all the time, so it gets pressed by accident, and the accident
		is expensive: it starts overwriting the wave you were working on. There
		are other ways in -- start-recording, tagged unlimited if you want more
		than thirty seconds -- and those are deliberate in a way a button next
		to the timebase label is not.

		Stop stays, and only while recording. Whatever started it, this is how
		you end it without having to go and write a command to do so.

		(comment by Claude)
		*/
		if (this.recording) {
			topcontrols.appendChild(this.createStopRecordingLabel())
		}
		// the spacer pushes the marker controls to the far end of a row that is
		// as wide as the wave. The overlay row is only as wide as what is in it,
		// and an editing wave is never condensed, so neither is ever in it
		// (comment by Claude)
		if (!condensed) {
			topcontrols.appendChild(this.createSpacer())
			// not while recording: a marker is a position in a wave of a
			// certain length, and the length is still arriving
			// (comment by Claude)
			if (this.isEditing && !this.recording) {
				topcontrols.appendChild(this.createMarkerNums())
				topcontrols.appendChild(this.createAddMarker())
			}
		}

		let viewport = document.createElement('div');
		viewport.classList.add('waveviewport');
		viewport.appendChild(this.createWaveformCanvas());
		// Only when there is something to put on it: the selection point exists
		// while editing, and the playhead while a sound is running. The rest of
		// the time there is no second canvas at all.
		// (comment by Claude)
		this.playheadNode = null;
		if (this.isEditing || this.auditioning) {
			// Same width and height as the waveform, stacked on it, so the
			// playhead is placed in samples-to-pixels exactly like everything
			// drawn underneath it.
			// (comment by Claude)
			this.playheadNode = document.createElement('canvas');
			this.playheadNode.classList.add('waveplayhead');
			this.playheadNode.setAttribute('width', this.windowWidth());
			this.playheadNode.setAttribute('height', this.windowHeight());
			// cached because updatePlayhead runs every frame, and reading a
			// computed style forces a style recalculation
			// (comment by Claude)
			this.playheadColor = getComputedStyle(document.documentElement)
					.getPropertyValue('--wave-playhead').trim();
			viewport.appendChild(this.playheadNode);
		}
		// last, so it is over both canvases rather than under them
		// (comment by Claude)
		if (condensed) {
			viewport.appendChild(topcontrols);
		}
		domNode.appendChild(viewport);
		this.updatePlayhead();

		if (this.showsAsEditing()) {
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
			if (this.pressIsAGesture(event)) {
				return true;
			}
			this.advanceToNextTimebase();
			this.renderOnlyThisNex();
			event.stopPropagation();
			event.preventDefault();
			return false;
		}
		return timelabel;
	}

	createStopRecordingLabel() {
		let recordButtonLabel = document.createElement('div');
		recordButtonLabel.classList.add('wavecontrol');
		recordButtonLabel.innerText = '[] stop';
		recordButtonLabel.onmousedown = (event) => {
			if (this.pressIsAGesture(event)) {
				return true;
			}
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
			if (this.pressIsAGesture(event)) {
				return true;
			}
			this.addMarker();
			event.stopPropagation();
			event.preventDefault();
			return false;
		}
		return addMarkerButton;
	}

	// the start-loop split point in seconds, or zero, which means loop the
	// whole wave -- the same reading play gives it
	loopStartSeconds() {
		let at = this.namedSplitPoint('start-loop');
		return at > 0 ? at / getSampleRate() : 0;
	}

	// the position of the split point with this name, or -1
	namedSplitPoint(name) {
		for (let at in this.markerNames) {
			if (this.markerNames[at] == name) return Number(at);
		}
		return -1;
	}

	// a-z, then a1-z1, a2-z2, and so on
	autoMarkerName(k) {
		let letter = String.fromCharCode("a".charCodeAt(0) + (k % 26));
		let round = Math.floor(k / 26);
		return round == 0 ? letter : letter + round;
	}

	getMarkerName(n) {
		let name = this.markerNames[this.markers[n]];
		if (name) return name;
		// named split points do not use up letters
		let k = 0;
		for (let i = 0; i < n; i++) {
			if (!this.markerNames[this.markers[i]]) k++;
		}
		return this.autoMarkerName(k);
	}

	createMarkerNum(n) {
		let markerNum = document.createElement('div');
		markerNum.classList.add('wavecontrol');
		markerNum.innerText = this.getMarkerName(n);
		markerNum.onmousedown = (event) => {
			if (this.pressIsAGesture(event)) {
				return true;
			}
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
		// (comment by Claude)
		let themeColor = (name) => getComputedStyle(document.documentElement)
				.getPropertyValue(name).trim();

		let regularColor = themeColor('--wave-regular');
		let intenseColor = themeColor('--wave-intense');
		let auditionColor = themeColor('--wave-audition');
		let solidRectColor = themeColor('--wave-solid');

		if (this.showsAsEditing()) {
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
			let boxwidth = Math.max(boxsize, Math.ceil(ctx.measureText(n).width) + 2 * nameind);
			ctx.fillRect(xpos, boxy, boxwidth, boxsize);
			ctx.strokeRect(xpos, boxy, boxwidth, boxsize);
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

	// A deleted wavetable is not recording any more, whatever the undo buffer
	// is doing with it. Otherwise it goes on filling up out of sight, and undo
	// hands you back something still running.
	// (comment by Claude)
	stopFunctioning() {
		if (this.recording) {
			stopRecordingAudio(this);
		}
	}

	// Refcounting means this is the moment the wavetable is really gone, so its
	// samples go with it. Not a moment sooner: undo is holding it precisely so
	// that you can have it back, and back without its samples is no use.
	// (comment by Claude)
	cleanupOnMemoryFree() {
		audioStore.remove(this.wavetableId);
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
			// the reduced editor a recording wave is in: see
			// enterEditorForRecording
			// (comment by Claude)
			if (!this.nex.isRecording()) {
				this.nex.addMarker();
			}
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
	// an explicit zero is a computed length, not a request for the default
	if (initSize == undefined) {
		initSize = 256;
	}
	/*
	Float32Array truncates a fractional length rather than refusing it, so a
	size below one becomes a wave with no samples -- and nothing below one is
	falsy, so the test above lets it through. That wave cannot be given an
	audio buffer, which is where it finally fails, a long way from whoever
	asked for it.

	(comment by Claude)
	*/
	initSize = Math.floor(initSize);
	if (initSize < 1) {
		initSize = 1;
	}
	let sizeRequired = heap.sizeWavetable() + initSize * heap.incrementalSizeWavetable();
	if (!heap.requestMem(sizeRequired)) {
		throw constructFatalError(`OUT OF MEMORY: cannot allocate Wavetable.
stats: ${heap.stats()}`)
	}
	return heap.register(new Wavetable(initSize));
}


export { Wavetable, WavetableEditor, constructWavetable }
