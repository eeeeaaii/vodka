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

import { settings } from './globalappflags.js'
import { constructFatalError } from './nex/eerror.js'
import { heap } from './heap.js'


/*
The reason for the channel merger node is that even if there are 16 inputs on your
audio card, the ctx.destination will still just have one input with that number of
channels. So to make it so that there are N inputs, where each of the
N inputs maps to the Nth channel of a single input, you need a channel merger
node.
*/


let ctx = null;
let channelMergerNode = null;
let SAMPLE_RATE = 48000;

let thingAuditioning = null;

let channelPlayers = [];
let auditioningPlayer = null;


// A guardrail, not a real limit -- so a first recording cannot fill the disk
// before anyone knows how to stop it. The `unlimited` tag lifts it.
// (comment by Claude)
const RECORDING_LIMIT_MS = 30000;

class AuditionPlayer {
	// sustained means the sound keeps going after the key comes back up. Holding
	// enter to audition is momentary; toggling playback with space is not.
	// (comment by Claude)
	constructor(buffer, startOffsetSamples, sustained) {
		this.buffer = buffer;
		this.sustained = !!sustained;
		this.startOffsetSamples = startOffsetSamples ? startOffsetSamples : 0;
		this.startedAt = ctx.currentTime;
		this.source = getSourceFromBuffer(buffer, true /* loop */);
		/*
		Both channels. A merger sends each of its inputs to the output channel
		of the same number, so connecting once puts an audition in one ear and
		not the other -- fine for a clip that was routed to a channel on
		purpose, wrong for listening to a wave.

		The second connection only if there is a second channel to make it on,
		since an output can be mono.
		*/
		let ch = settings.AUDIO_AUDITION_CHANNEL;
		this.source.connect(channelMergerNode, 0, ch);
		if (ch + 1 < channelMergerNode.numberOfInputs) {
			this.source.connect(channelMergerNode, 0, ch + 1);
		}
		this.source.start(ctx.currentTime, this.startOffsetSamples / SAMPLE_RATE);
	}

	/*
	Where the playhead is now, in samples from the start of the buffer.

	Read from ctx.currentTime rather than counted in frames: the audio clock is
	the one the sound is actually playing on, so the line cannot drift away from
	what you are hearing even if frames are dropped.

	(comment by Claude)
	*/
	positionInSamples() {
		if (!this.buffer.length) return 0;
		let elapsed = ctx.currentTime - this.startedAt;
		let pos = this.startOffsetSamples + elapsed * SAMPLE_RATE;
		return pos % this.buffer.length;
	}

	canChangeLoopData() {
		return false;
	}

	abortPlay() {
		/*
		stop() raises on a node the browser has already finished with, and if
		that got out of here the player would never be cleared and the sound
		never stopped.
		*/
		try {
			this.source.stop();
			this.source.disconnect(channelMergerNode);
		} catch (e) {
			// already finished; nothing left to stop
		}
		auditioningPlayer = null;
	}
}

class OneshotPlayer {
	constructor(buffer, channel) {
		this.channel = channel;

		this.source = getSourceFromBuffer(buffer, false);
		this.source.connect(channelMergerNode, 0, channel);
		this.source.start();

		let sampleLength = buffer.length / SAMPLE_RATE;

		window.setTimeout(function() {
			this.source.disconnect(channelMergerNode);
			if (channelPlayers[this.channel] == this) {
				channelPlayers[this.channel] = null;
			}
		}.bind(this), sampleLength * 1.05 * 1000)
	}

	canChangeLoopData() {
		return false;
	}

	abortPlay() {
		this.source.stop();
		try {
			this.source.disconnect(channelMergerNode);
		} catch (e) {
			console.log('why is this failing? ' + e);
		}
		if (channelPlayers[this.channel] == this) {
			channelPlayers[this.channel] = null;
		}
	}
}

class LoopingPlayer {
	constructor(buffer, channel) {
		this.channel = channel;
		this.source = getSourceFromBuffer(buffer, true);
		this.source.connect(channelMergerNode, 0, channel);
		this.source.start();
		this.currentlyPlayingSampleStartTime = ctx.currentTime;
		this.currentlyPlayingSampleLength = buffer.length / SAMPLE_RATE;
		this.outputSourceWaitingForDeletion = null;
	}

	abortPlay() {
		this.source.stop();
		this.source.disconnect(channelMergerNode);
		if (channelPlayers[this.channel] == this) {
			channelPlayers[this.channel] = null;
		}
	}

	canChangeLoopData() {
		return (this.outputSourceWaitingForDeletion == null);
	}

	changeLoopData(buffer) {
		let newsource = getSourceFromBuffer(buffer, true);

		let startTime = 0;
		let currentTime = ctx.currentTime;

		let howLongBeenPlaying = currentTime - this.currentlyPlayingSampleStartTime;
		let howManyRepetitions = Math.floor(howLongBeenPlaying / this.currentlyPlayingSampleLength);
		startTime = (howManyRepetitions + 1) * this.currentlyPlayingSampleLength + this.currentlyPlayingSampleStartTime;
		let timeUntilChange = startTime - currentTime;

		this.source.stop(startTime);
		newsource.start(startTime);
		// we can connect the source now but we can't disconnect the previous one until after it stops playing.
		newsource.connect(channelMergerNode, 0, this.channel);

		this.outputSourceWaitingForDeletion = this.source;
		this.source = newsource;
		this.currentlyPlayingSampleStartTime = startTime;
 		this.currentlyPlayingSampleLength = buffer.length / SAMPLE_RATE;

		window.setTimeout(function() {
			this.outputSourceWaitingForDeletion.disconnect(channelMergerNode);
			this.outputSourceWaitingForDeletion = null;
		}.bind(this), timeUntilChange * 1.05 * 1000)
	}

}

function stopRecordingAudio(wt) {
	wt.stopRecording();
	if (!recordingRig || recordingRig.wt != wt) return;
	if (recordingRig.timer) window.clearTimeout(recordingRig.timer);
	recordingRig.node.port.onmessage = null;
	recordingRig.source.disconnect();
	recordingRig.node.disconnect();
	recordingRig.silence.disconnect();
	// let go of the microphone, or the browser keeps showing it as in use
	// (comment by Claude)
	recordingRig.stream.getTracks().forEach(function(t) { t.stop(); });
	recordingRig = null;
}

function startRecordingAudio(wt, channel, unlimited) {
	maybeCreateAudioContext();
	if (!channel) channel = 0;
	if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
		console.log('vodka: this browser has no audio input');
		return;
	}
	navigator.mediaDevices.getUserMedia({
		audio: {
			echoCancellation: false,
			noiseSuppression: false,
			autoGainControl: false,
			channelCount: 2
		}
	}).then(function(stream) {
		let track = stream.getAudioTracks()[0];
		if (track) {
			let st = track.getSettings();
			console.log('vodka: recording from "' + track.label + '" -- '
					+ (st.channelCount ? st.channelCount : '?') + ' channel(s) at '
					+ (st.sampleRate ? st.sampleRate : '?') + 'Hz');
		}
		return maybeLoadRecorderWorklet().then(function() {
			let source = ctx.createMediaStreamSource(stream);
			let node = new AudioWorkletNode(ctx, 'vodka-recorder');
			// A worklet only runs while it is connected to the graph, and this
			// one listens rather than making a sound, so it goes to a silent
			// gain node.
			// (comment by Claude)
			let silence = ctx.createGain();
			silence.gain.value = 0;
			source.connect(node);
			node.connect(silence);
			silence.connect(ctx.destination);

			wt.startRecording();
			node.port.onmessage = function(e) {
				if (!wt.isRecording()) return;
				let batch = e.data;
				for (let i = 0; i < batch.length; i++) {
					let blk = batch[i];
					// a wavetable holds one channel, so a stereo input is
					// recorded one side at a time
					// (comment by Claude)
					wt.appendRecordedData(blk[channel] ? blk[channel] : blk[0]);
				}
			};

			recordingRig = { wt: wt, stream: stream, node: node,
					source: source, silence: silence, timer: null };
			if (!unlimited) {
				recordingRig.timer = window.setTimeout(function() {
					if (wt.isRecording()) {
						stopRecordingAudio(wt);
						console.log('vodka: stopped at the 30 second limit. Tag '
								+ 'start-recording with `unlimited` to record for longer.');
					}
				}, RECORDING_LIMIT_MS);
			}
		});
	}).catch(function(err) {
		console.log('vodka: could not open the audio input: '
				+ err.name + ': ' + err.message
				+ (err.constraint ? ' (constraint: ' + err.constraint + ')' : ''));
	});
}

/*
RECORDING

Samples are captured with an audio worklet rather than a MediaRecorder. A
MediaRecorder hands back an encoded blob whose chunks are not independently
decodable, so showing the waveform as it arrived meant decoding the whole take
again on every chunk -- work that grew with the length of the recording. A
worklet hands over raw floats, which is what a wavetable holds anyway, so
nothing is decoded and the waveform can grow as you record.

The processor is a string loaded from a blob url. A worklet module has to be
fetched by url, and keeping it in the bundle rather than as a separately served
file means there is nothing to get out of step.

(comment by Claude)
*/
const RECORDER_WORKLET = `
class VodkaRecorder extends AudioWorkletProcessor {
	constructor() {
		super();
		this.batch = [];
		this.batched = 0;
	}
	process(inputs) {
		let input = inputs[0];
		if (input && input.length > 0 && input[0]) {
			let copy = [];
			for (let c = 0; c < input.length; c++) {
				copy.push(new Float32Array(input[c]));
			}
			this.batch.push(copy);
			this.batched += input[0].length;
			// a block is 128 frames; batching keeps the message rate sane
			if (this.batched >= 4096) {
				this.port.postMessage(this.batch);
				this.batch = [];
				this.batched = 0;
			}
		}
		return true;
	}
}
registerProcessor('vodka-recorder', VodkaRecorder);
`;

let recorderWorkletReady = null;
// what is recording now, so stopRecordingAudio can end it
// (comment by Claude)
let recordingRig = null;

function maybeLoadRecorderWorklet() {
	if (!recorderWorkletReady) {
		let url = URL.createObjectURL(
				new Blob([RECORDER_WORKLET], { type: 'application/javascript' }));
		recorderWorkletReady = ctx.audioWorklet.addModule(url);
	}
	return recorderWorkletReady;
}

function maybeCreateAudioContext() {
	if (ctx == null) {
		let AudioContext = window.AudioContext || window.webkitAudioContext;
		/*
		Asked for at the rate everything else already assumes. SAMPLE_RATE is a
		constant here and another one in wavetablefunctions.js, and every
		wavetable ever saved holds samples at that rate and no record of it --
		so the context has to be the thing that bends.

		Letting the browser pick meant captured audio was wrong while generated
		audio was right: a wave computed at 48000 a second and then declared to
		be 48000 a second agrees with itself whatever the device is doing, but
		audio arriving from a microphone or out of decodeAudioData arrives at
		the context's rate, and got labelled 48000 regardless. Recording on a
		44100 machine played back a semitone and a half sharp.

		The browser resamples the device for us. If it refuses the rate
		outright, fall back rather than have no audio at all -- the mismatch is
		better than silence, and the console says so.
		*/
		try {
			ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
		} catch (e) {
			ctx = new AudioContext();
		}
		if (ctx.sampleRate != SAMPLE_RATE) {
			console.log('vodka: asked for ' + SAMPLE_RATE + 'Hz audio but got '
					+ ctx.sampleRate + 'Hz. Recorded and loaded audio will play back '
					+ (SAMPLE_RATE / ctx.sampleRate).toFixed(3) + ' times too fast.');
		}
		ctx.destination.channelCount = ctx.destination.maxChannelCount;
		channelMergerNode = ctx.createChannelMerger(ctx.destination.maxChannelCount);
		channelMergerNode.connect(ctx.destination);
	}
	// a suspended context's clock does not advance, and everything in the cycle
	// is scheduled against that clock
	// (comment by Claude)
	if (ctx.state == 'suspended') {
		ctx.resume();
	}
}

let silentKeepAlive = null;
let warnedAboutMissingAudioClock = false;

// getOutputTimestamp answers zeros until the context has produced output, so the
// midi clock needs something playing whenever anything is in the cycle.
// (comment by Claude)
function startSilentKeepAlive() {
	maybeCreateAudioContext();
	if (silentKeepAlive) return;
	let buffer = ctx.createBuffer(1, Math.round(ctx.sampleRate), ctx.sampleRate);
	let source = ctx.createBufferSource();
	source.buffer = buffer;
	source.loop = true;
	let gain = ctx.createGain();
	gain.gain.value = 0;
	source.connect(gain);
	gain.connect(ctx.destination);
	source.start();
	silentKeepAlive = source;
}

function audioClockIsReady() {
	if (!ctx || ctx.state != 'running') return false;
	let ts = ctx.getOutputTimestamp();
	return !!(ts && ts.performanceTime > 0 && ts.contextTime != undefined);
}

// The first cycle waits for a clock to exist rather than starting against a
// context time of zero, which would put every midi message in the past.
// (comment by Claude)
function whenAudioClockIsReady(f) {
	startSilentKeepAlive();
	if (audioClockIsReady()) {
		Promise.resolve().then(f);
		return;
	}
	let tries = 0;
	let check = function() {
		if (audioClockIsReady() || ++tries > 200) {
			f();
			return;
		}
		window.setTimeout(check, 5);
	};
	window.setTimeout(check, 5);
}

function getAudioBufferFromData(data) {
  maybeCreateAudioContext();
	// createBuffer throws on nothing at all, and one silent frame sounds like
	// what a wave with no samples should sound like
	// (comment by Claude)
	let frames = data.length > 0 ? data.length : 1;
	let buffer = ctx.createBuffer(1, frames, SAMPLE_RATE);
	let chan = buffer.getChannelData(0);
	chan.set(data);	
	return buffer;
}

function getSourceFromBuffer(buffer, loop) {
	let source = ctx.createBufferSource();
	source.buffer = buffer;
	source.loop = loop;
	source.loopEnd = buffer.length * (1 / SAMPLE_RATE);

	return source;
}

// this plays immediately
// How many outputs the device has, which is what the merger was built with.
// Asking opens an audio device if nothing has yet.
// (comment by Claude)
function getAudioChannelCount() {
	maybeCreateAudioContext();
	return channelMergerNode.numberOfInputs;
}

// Connecting past the merger's last input throws IndexSizeError from inside the
// web audio api, which says nothing about channels.
// (comment by Claude)
function checkChannelExists(channel) {
	let n = channelMergerNode.numberOfInputs;
	if (!Number.isInteger(channel) || channel < 0 || channel >= n) {
		throw constructFatalError('Unknown audio channel number. Sorry!');
	}
}
/*
THE GLOBAL CYCLE

Every loop shares one cycle, whose length is the longest loop in it. Adding a
loop waits for the current cycle to finish, then the cycle becomes as long as it
needs to be and everything starts together.

That is what `mix` already does, made to happen live rather than in advance:
mixing a four beat wave with a six beat one gives six beats, with the short one
playing through and then its first half again, because valueAtSample wraps. Here
each loop is its own source node set to repeat, and all of them are cut and
restarted at the cycle boundary, which comes to the same thing while leaving
each loop separately removable.

The boundary is scheduled on ctx.currentTime, so it is exact. setTimeout is only
used to wake up early enough to do the scheduling.

(comment by Claude)
*/

// how far ahead of a boundary we wake up to schedule it
// (comment by Claude)
const CYCLE_LOOKAHEAD_SECONDS = 0.15;

let cycleLoops = {};        // id -> { buffer, channel, lengthSeconds, node, endAfterCycle }
let cyclePending = {};      // loops that join at the next boundary
/*
A break: everything stops, one sample plays alone, and whatever you start while
it plays comes in when it ends.

Queued rather than done, because the point of a break is where it lands. It
waits for the boundary the same as anything else joining the cycle, so the
music finishes the bar it is in.

Once it has the floor the cycle is the break and nothing else, which is what
makes the rest of it work without any new machinery: the cycle is as long as
its longest member, so for one pass the cycle is exactly the break; anything
started meanwhile waits for the next boundary, which is the end of the break,
and then they all begin together from the top, in phase, the way they would
after any other boundary. If nothing was started, the cycle has no members
left, and a cycle with nothing in it stops.

(comment by Claude)
*/
let pendingBreak = null;    // { buffers, channels } waiting for the next boundary
let breakIds = [];          // what the break is playing on, while it plays
/*
Things to do at the moment the next cycle begins, which is the moment whatever
is waiting to join it starts sounding. A tempo change belongs here: what makes
it right is not when you asked for it but where it lands, and where it lands is
the downbeat of the passage it is the tempo of.

(comment by Claude)
*/
let doAtNextCycleStart = [];
let nextCycleLoopId = 1;
let cycleTimer = null;
let cycleRunning = false;
let cycleNextBoundaryTime = 0;
// when the pass now playing began, which is what every loop's own repeats are
// measured from -- they all start together at the top of the cycle
let cycleStartedAt = 0;

function cycleLengthSeconds() {
	let longest = 0;
	for (let id in cycleLoops) {
		if (cycleLoops[id].lengthSeconds > longest) {
			longest = cycleLoops[id].lengthSeconds;
		}
	}
	return longest;
}

function anyLoopsPlaying() {
	for (let id in cycleLoops) return true;
	for (let id in cyclePending) return true;
	return false;
}

/*
While a clip is playing, the audio system owns it. That is what decides how
long it plays for: at every boundary each playing clip is asked whether anyone
else still holds it, and one that nobody else holds has just played its last
pass. Nothing can stop it, replace it or even name it any more, so there is
nothing to schedule it for.

That is where the one-shot comes from. Shift-enter throws the clip away, so the
audio system is its only owner and it plays once. Press enter instead and the
clip lands in the document, which holds it, so it loops. Delete it and the
document lets go, and it stops at the end of the pass it is in rather than
being cut off. None of those are special cases.

A clip is spared on the pass that starts it, since the document has not taken
hold of it yet when the first cycle is scheduled.
*/
let playingClips = [];

function clipStartedPlaying(clip, ids) {
	for (let i = 0; i < playingClips.length; i++) {
		if (playingClips[i].clip == clip) {
			playingClips[i].ids = ids;
			return;
		}
	}
	heap.addReference(clip);
	playingClips.push({ clip: clip, ids: ids, passes: 0 });
}

function releaseClip(i) {
	let clip = playingClips[i].clip;
	playingClips.splice(i, 1);
	heap.removeReference(clip);
}

function retireUnownedClips() {
	for (let i = playingClips.length - 1; i >= 0; i--) {
		let p = playingClips[i];
		if (p.passes == 0) continue;
		if (p.clip.references <= 1) {
			// at the end of this pass, not now -- the pass it is in was
			// scheduled to run to the boundary and should get there
			p.clip.end(true);
			releaseClip(i);
		}
	}
}

// Starts every loop at the boundary and cuts it at the end of the cycle, so a
// loop shorter than the cycle repeats inside it and is truncated.
// (comment by Claude)
function startCycleAt(startTime) {
	if (pendingBreak) {
		beginBreak();
	} else if (breakIds.length > 0) {
		// it has had its one pass. Whatever was started while it played is
		// waiting in cyclePending and is about to begin; if nothing was, there
		// is nothing left and the cycle stops below.
		// (comment by Claude)
		endLoops(breakIds, false);
		breakIds = [];
	}
	retireUnownedClips();
	for (let id in cyclePending) {
		cycleLoops[id] = cyclePending[id];
		delete cyclePending[id];
	}
	for (let id in cycleLoops) {
		if (cycleLoops[id].endAfterCycle) {
			retireMember(cycleLoops[id]);
			delete cycleLoops[id];
		}
	}
	/*
	Counted before the length check, so that a clip holding nothing still gets
	a pass and can be retired when nobody else wants it. An empty clip makes
	the cycle length zero and stops the cycle, and a clip that never counts a
	pass is never retired.

	(comment by Claude)
	*/
	for (let i = 0; i < playingClips.length; i++) {
		playingClips[i].passes++;
	}
	let len = cycleLengthSeconds();
	if (len <= 0) {
		cycleRunning = false;
		cycleTimer = null;
		return;
	}
	for (let id in cycleLoops) {
		let loop = cycleLoops[id];
		// A member that brings its own way of starting -- midi does, and
		// schedules messages rather than making a sound.
		// (comment by Claude)
		if (loop.start) {
			if (!loop.paused && !loop.muted) loop.start(startTime, len);
			continue;
		}
		// Muting is not pausing. A loop can be both, and comes back only when
		// neither says so, so un-pausing must not undo a mute.
		if (loop.paused || loop.muted) continue;
		let node = getSourceFromBuffer(loop.buffer, true);
		node.connect(channelMergerNode, 0, loop.channel);
		node.start(startTime);
		node.stop(startTime + len);
		loop.node = node;
	}
	cycleStartedAt = startTime;
	/*
	After the loops for this pass are scheduled, so that anything doing this is
	taking effect alongside the sound rather than ahead of it, and cleared
	first so that something added by one of them waits for the next cycle
	rather than running twice in this one.

	(comment by Claude)
	*/
	if (doAtNextCycleStart.length > 0) {
		let todo = doAtNextCycleStart;
		doAtNextCycleStart = [];
		for (let i = 0; i < todo.length; i++) {
			todo[i]();
		}
	}
	let nextBoundary = startTime + len;
	cycleNextBoundaryTime = nextBoundary;
	let wakeIn = (nextBoundary - CYCLE_LOOKAHEAD_SECONDS - ctx.currentTime) * 1000;
	cycleTimer = window.setTimeout(function() {
		startCycleAt(nextBoundary);
	}, wakeIn > 0 ? wakeIn : 0);
}

/*
Runs fn when the next cycle starts -- the same boundary at which anything
queued right now begins to sound. With nothing playing there is no boundary to
wait for and the caller is about to start one, so this still lands on the first
beat of what it starts.

(comment by Claude)
*/
function atNextCycleStart(fn) {
	doAtNextCycleStart.push(fn);
}

/*
Takes the floor. Everything playing stops here rather than at some later
boundary -- a break that let the old loop finish underneath it would not be a
break -- and the clips are ended, so the document shows what you can hear.

The break is put straight into cycleLoops rather than into cyclePending,
because it is starting now, at this boundary, not at the next one.

(comment by Claude)
*/
function beginBreak() {
	let ids = [];
	for (let id in cycleLoops) ids.push(id);
	for (let id in cyclePending) ids.push(id);
	endLoops(ids, false);
	while (playingClips.length > 0) {
		playingClips[0].clip.end(false);
		releaseClip(0);
	}
	breakIds = [];
	// one wave fans out to every channel, two alternate, and so on -- the same
	// rule play uses
	// (comment by Claude)
	let bufferIndex = 0;
	for (let i = 0; i < pendingBreak.channels.length; i++) {
		let buffer = pendingBreak.buffers[bufferIndex];
		bufferIndex = (bufferIndex + 1) % pendingBreak.buffers.length;
		let id = nextCycleLoopId++;
		cycleLoops[id] = {
			buffer: buffer,
			channel: pendingBreak.channels[i],
			lengthSeconds: buffer.length / SAMPLE_RATE,
			node: null,
			endAfterCycle: false
		};
		breakIds.push(id);
	}
	pendingBreak = null;
}

/*
Queues a break for the next boundary. With nothing playing there is no boundary
to wait for, so it starts one, and the break is simply a sample played once.

(comment by Claude)
*/
function queueBreak(buffers, channels) {
	maybeCreateAudioContext();
	channels.forEach(checkChannelExists);
	pendingBreak = { buffers: buffers, channels: channels };
	if (!cycleRunning) {
		cycleRunning = true;
		whenAudioClockIsReady(function() {
			startCycleAt(ctx.currentTime);
		});
	}
}

/*
Joins the cycle. Returns an id.

The first loop starts immediately, since there is no cycle to wait for. Later
ones wait for the boundary, which is what keeps everything in phase.

(comment by Claude)
*/
function addLoop(buffer, channel) {
	maybeCreateAudioContext();
	checkChannelExists(channel);
	return addCycleMember({
		buffer: buffer,
		channel: channel,
		lengthSeconds: buffer.length / SAMPLE_RATE,
		node: null
	});
}

/*
Anything with a length can join the cycle. An audio loop brings a buffer and a
channel; a midi sequence brings start and stop functions instead, and schedules
messages rather than making a sound.

(comment by Claude)
*/
function addCycleMember(loop) {
	maybeCreateAudioContext();
	let id = nextCycleLoopId++;
	loop.endAfterCycle = false;
	cyclePending[id] = loop;
	/*
	Starting is deferred by a microtask so that everything added in one go
	starts together.

	play adds one loop per channel, one at a time. Starting the cycle as
	soon as the first arrived meant the second was already too late for it and
	waited for the next boundary -- so a stereo pair played left only for its
	first time round, then both from then on.

	(comment by Claude)
	*/
	if (!cycleRunning) {
		cycleRunning = true;
		whenAudioClockIsReady(function() {
			startCycleAt(ctx.currentTime);
		});
	}
	return id;
}

/*
Where a running loop is, for the counter on a clip. Reckoned the same way the
audition player does it, and like that one it is a readout rather than anything
to synchronise against. -1 when the loop is not running.
*/
/*
Whether a loop is still one of ours, which is not the same question as where it
is. A loop waiting for the next boundary has no position yet but has not gone
anywhere, and a clip that could not tell those apart would give up watching a
loop that has not started.

(comment by Claude)
*/
function loopExists(id) {
	return !!(cycleLoops[id] || cyclePending[id]);
}

function getLoopPositionSamples(id) {
	if (!ctx) return -1;
	let loop = cycleLoops[id];
	if (!loop || !loop.lengthSeconds) return -1;
	let elapsed = ctx.currentTime - (cycleNextBoundaryTime - cycleLengthSeconds());
	if (elapsed < 0) return -1;
	return Math.floor((elapsed * SAMPLE_RATE) % (loop.lengthSeconds * SAMPLE_RATE));
}

/*
A paused loop keeps its place in the cycle and its length, so it is still what
the cycle is measured against and it comes back in phase rather than starting a
new bar of its own. It simply is not scheduled while it is paused.
*/
function pauseLoops(ids, paused) {
	let found = false;
	for (let i = 0; i < ids.length; i++) {
		let loop = cycleLoops[ids[i]] || cyclePending[ids[i]];
		if (!loop) continue;
		found = true;
		loop.paused = paused;
		if (paused) {
			if (loop.stop) loop.stop();
			if (loop.node) {
				try { loop.node.stop(); } catch (e) {}
				loop.node.disconnect();
				loop.node = null;
			}
		}
	}
	return found;
}

// playing means in the cycle and not paused -- a clip whose loops have gone is
// not playing either
/*
Silences the loops a clip owns without taking them out of the cycle, so they
come back in phase. Independent of pausing on purpose: a clip can be both, and
stops being silent only when neither says so.

Muting cuts the sound off where it is. Unmuting waits for the loop to come back
round to its own beginning, the same as unpausing: a loop that started again in
the middle of a bar would be out of time with everything else.
*/
/*
When a loop next comes back round to its own beginning.

The cycle is as long as the longest loop, and a shorter one repeats inside that
-- a four count loop in a six count cycle starts again at four. Its own
boundaries are what matter for muting it: a four count loop told to stop should
stop after four, not wait for the six. They are measured from the top of the
cycle, because that is where every loop is started.

Never returns the moment it is asked about, so a loop is always allowed to
finish the repeat it is in the middle of.

The answer can land past the end of the cycle, and for a loop whose length does
not divide the cycle it usually does -- the four count loop's next own boundary
after count five is eight, and the cycle ends at six. The caller compares
against the cycle boundary; the node stops there regardless.
*/
function nextOwnBoundary(loop, after) {
	let len = loop.lengthSeconds;
	if (!(len > 0)) {
		return cycleNextBoundaryTime;
	}
	let elapsed = after - cycleStartedAt;
	let n = Math.floor(elapsed / len) + 1;
	return cycleStartedAt + n * len;
}

function muteLoops(ids, muted) {
	let found = false;
	for (let i = 0; i < ids.length; i++) {
		let loop = cycleLoops[ids[i]] || cyclePending[ids[i]];
		if (!loop) continue;
		found = true;
		let was = loop.muted;
		loop.muted = muted;

		// Not skipped when the flag was already set: asking again still has to
		// cut off whatever is sounding.
		// (comment by Claude)
		if (muted) {
			if (loop.stop) loop.stop();
			if (loop.node) {
				try { loop.node.stop(); } catch (e) {}
				loop.node.disconnect();
				loop.node = null;
			}
			continue;
		}
		/*
		Unmuting, and the same boundary decides when: the loop comes back where
		it would have come back anyway, in phase with itself. If that is still
		inside this pass it is started for the rest of the pass; if not, the
		next pass starts it in the ordinary way.
		*/
		if (!was) continue;
		if (!loop.start && !loop.node && cycleRunning) {
			let at = nextOwnBoundary(loop, ctx.currentTime);
			if (at < cycleNextBoundaryTime) {
				let node = getSourceFromBuffer(loop.buffer, true);
				node.connect(channelMergerNode, 0, loop.channel);
				node.start(at);
				node.stop(cycleNextBoundaryTime);
				loop.node = node;
			}
		}
	}
	return found;
}

function loopsArePlaying(ids) {
	for (let i = 0; i < ids.length; i++) {
		let loop = cycleLoops[ids[i]] || cyclePending[ids[i]];
		if (loop && !loop.paused) return true;
	}
	return false;
}

function togglePauseLoops(ids) {
	return pauseLoops(ids, loopsArePlaying(ids));
}

// A member that keeps its own records -- midi does -- gets told when it leaves
// the cycle, so nothing has to hold on to it after that.
// (comment by Claude)
function retireMember(loop) {
	if (loop && loop.retired) loop.retired();
}

function endLoops(ids, atCycleEnd) {
	for (let i = 0; i < ids.length; i++) {
		let id = ids[i];
		let loop = cycleLoops[id] || cyclePending[id];
		if (!loop) continue;
		if (atCycleEnd) {
			loop.endAfterCycle = true;
		} else {
			if (loop.stop) loop.stop();
			if (loop.node) {
				try { loop.node.stop(); } catch (e) {}
				loop.node.disconnect();
			}
			retireMember(loop);
			delete cycleLoops[id];
			delete cyclePending[id];
		}
	}
}

function endAllLoops() {
	let ids = [];
	for (let id in cycleLoops) ids.push(id);
	for (let id in cyclePending) ids.push(id);
	endLoops(ids, false);
	// nothing is going to reach another boundary, so let go of the clips here
	// rather than leaving the audio system owning them forever
	while (playingClips.length > 0) {
		playingClips[0].clip.end(false);
		releaseClip(0);
	}
	if (cycleTimer) {
		window.clearTimeout(cycleTimer);
		cycleTimer = null;
	}
	cycleRunning = false;
	// a break that was queued or playing is over too -- stopping everything
	// means everything, and leaving either of these set would have the next
	// cycle open by tidying up after a break that is long gone
	// (comment by Claude)
	pendingBreak = null;
	breakIds = [];
	// and anything that was waiting for a downbeat that is not going to come
	// (comment by Claude)
	doAtNextCycleStart = [];
}

/*
Audio time to the wall clock time midi wants, read fresh each time. The two run
off different oscillators and drift apart by tens of parts per million, but
getOutputTimestamp pairs a reading of both, so converting per event re-anchors
every time and nothing accumulates.

Its contextTime is the frame reaching the output, not the frame being computed,
so the output buffer delay is already in the answer.

(comment by Claude)
*/
function contextTimeToPerformanceTime(contextTime) {
	let ts = ctx.getOutputTimestamp();
	// A context that has not produced output answers with zeros, not with nothing.
	// (comment by Claude)
	if (ts && ts.contextTime != undefined && ts.performanceTime > 0) {
		return ts.performanceTime + (contextTime - ts.contextTime) * 1000;
	}
	if (!warnedAboutMissingAudioClock) {
		warnedAboutMissingAudioClock = true;
		console.log('vodka: no audio clock, midi timing will drift from audio');
	}
	return performance.now() + (contextTime - ctx.currentTime) * 1000;
}

// When the next cycle begins, in ctx.currentTime, and how long a cycle is.
// This is what midi aligns to.
// (comment by Claude)
function nextCycleBoundary() {
	return { at: cycleNextBoundaryTime, lengthSeconds: cycleLengthSeconds() };
}

function loopPlay(bufferList, channelList) {
	maybeCreateAudioContext();
	channelList.forEach(checkChannelExists);
	// one wave fans out to every channel, two alternate, and so on
	// (comment by Claude)
	let bufferIndex = 0;
	let ids = [];
	for (let i = 0; i < channelList.length; i++) {
		ids.push(addLoop(bufferList[bufferIndex], channelList[i]));
		bufferIndex = (bufferIndex + 1) % bufferList.length;
	}
	return ids;
}

// we don't need to stop nicely at end of loop
// because user can do that by putting in a gain(0, ...) or something
// this is for abort/free resources/etc.
function abortPlayback(channel) {
	if (channel == -1) {
		for (let i = 0; i < channelPlayers.length; i++) {
			if (channelPlayers[i]) {
				channelPlayers[i].abortPlay();
			}
		}
	} else if (channelPlayers[channel]) {
		channelPlayers[channel].abortPlay();
	}
}


function startAuditioningBuffer(buffer, nex, startOffsetSamples, sustained) {
	maybeCreateAudioContext();
	checkChannelExists(settings.AUDIO_AUDITION_CHANNEL);

	/*
	Whatever was auditioning ends here, because there is only one of each of
	these to point at it with.

	Starting a second audition used to overwrite both, and the first player was
	then playing with nothing referring to it. The audition source loops, so it
	did not run out on its own, and maybeKillSound could only ever reach the
	newest one -- so the sound went on for good, and pressing the key again only
	started and stopped another player while the stuck one carried on. The
	guards on the callers are per wavetable, so two different waves both get
	through: audition one, select another, audition that, and the first is
	stranded.

	The old nex is told to stop as well, so it drops its playhead, but only when
	it is a different one: the caller has already set its own flags by the time
	it gets here, and clearing them would stop the animation it is about to
	start.
	*/
	if (thingAuditioning && thingAuditioning != nex) {
		thingAuditioning.stopAuditioningWave();
	}
	if (auditioningPlayer) {
		auditioningPlayer.abortPlay();
	}

	auditioningPlayer = new AuditionPlayer(buffer, startOffsetSamples, sustained);
	thingAuditioning = nex;
}

// -1 when nothing is auditioning, so callers can tell "at the start" from "not
// playing" without a second question.
// (comment by Claude)
function getAuditionPositionSamples() {
	return auditioningPlayer ? auditioningPlayer.positionInSamples() : -1;
}

function isAnySoundPlaying() {
	if (auditioningPlayer) return true;
	for (let i = 0; i < channelPlayers.length; i++) {
		if (channelPlayers[i]) return true;
	}
	return false;
}

function stopAllSound() {
	endAllLoops();
	maybeKillSound(true /* force -- this is the stop button, nothing survives it */);
	abortPlayback(-1);
}

/*
Called on every keyup, which is what makes auditioning momentary -- you hold the
key and the sound stops when you let go. A sustained audition (space toggling
playback) has to survive that, so it is only stopped when force says so, which
is what stop-all-sound and an explicit toggle pass.

(comment by Claude)
*/
function maybeKillSound(force) {
	if (!thingAuditioning) return;
	if (auditioningPlayer && auditioningPlayer.sustained && !force) return;
	thingAuditioning.stopAuditioningWave();
	if (auditioningPlayer) auditioningPlayer.abortPlay();
	thingAuditioning = null;
}

// The two audio libraries are two directories; a single-cycle wave is read
// exactly the way a drum hit is. Anything not in this table is not a library.
const AUDIO_LIBRARY_DIRS = {
	sample: 'sounds/',
	wave: 'waves/',
};

function loadAudio(fname, library, callback, errback) {
		let dir = AUDIO_LIBRARY_DIRS[library ? library : 'sample'];
		if (!dir) {
			errback(`no audio library called ${library}`);
			return;
		}
		getFileAsBuffer(fname, dir).then(function(result) {
			// getChannelData returns a float32 array but it still works
			// TODO: this class stores an audio buffer
			callback(result.getChannelData(0));
		}).catch(function(e) {
			// a missing file comes back as a 404 page, which is not audio, so
			// the decode is usually what fails rather than the fetch
			errback(`could not load ${dir}${fname}`);
		})
}

async function getFileAsBuffer(filepath, dir) {
  maybeCreateAudioContext();
  const response = await fetch((dir ? dir : "sounds/") + filepath);
  if (!response.ok) throw new Error('not found');
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  return audioBuffer;
}


export { getAudioBufferFromData, loadAudio, muteLoops, addLoop, queueBreak, atNextCycleStart, getAudioChannelCount, getLoopPositionSamples, loopExists, clipStartedPlaying, pauseLoops, togglePauseLoops, loopsArePlaying, addCycleMember, contextTimeToPerformanceTime, endLoops, endAllLoops, anyLoopsPlaying, nextCycleBoundary, maybeKillSound, getAuditionPositionSamples, isAnySoundPlaying, stopAllSound, startAuditioningBuffer, getFileAsBuffer, loopPlay, abortPlayback, startRecordingAudio, stopRecordingAudio }

