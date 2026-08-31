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
const RECORDING_LIMIT_MS = 30000;

class AuditionPlayer {
	// sustained means the sound keeps going after the key comes back up. Holding
	// enter to audition is momentary; toggling playback with space is not.
	constructor(buffer, startOffsetSamples, sustained) {
		this.buffer = buffer;
		this.sustained = !!sustained;
		this.startOffsetSamples = startOffsetSamples ? startOffsetSamples : 0;
		this.startedAt = ctx.currentTime;
		this.source = getSourceFromBuffer(buffer, true /* loop */);
		this.source.connect(channelMergerNode, 0, settings.AUDIO_AUDITION_CHANNEL);
		this.source.start(ctx.currentTime, this.startOffsetSamples / SAMPLE_RATE);
	}

	/*
	Where the playhead is now, in samples from the start of the buffer.

	Read from ctx.currentTime rather than counted in frames: the audio clock is
	the one the sound is actually playing on, so the line cannot drift away from
	what you are hearing even if frames are dropped.
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
		this.source.stop();
		this.source.disconnect(channelMergerNode);
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
		ctx = new AudioContext();
		ctx.destination.channelCount = ctx.destination.maxChannelCount;
		channelMergerNode = ctx.createChannelMerger(ctx.destination.maxChannelCount);
		channelMergerNode.connect(ctx.destination);
	}
}

function getAudioBufferFromData(data) {
  maybeCreateAudioContext();
	let buffer = ctx.createBuffer(1, data.length, SAMPLE_RATE);
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
function getAudioChannelCount() {
	maybeCreateAudioContext();
	return channelMergerNode.numberOfInputs;
}

// Connecting past the merger's last input throws IndexSizeError from inside the
// web audio api, which says nothing about channels.
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
*/

// how far ahead of a boundary we wake up to schedule it
const CYCLE_LOOKAHEAD_SECONDS = 0.15;

let cycleLoops = {};        // id -> { buffer, channel, lengthSeconds, node, endAfterCycle }
let cyclePending = {};      // loops that join at the next boundary
let nextCycleLoopId = 1;
let cycleTimer = null;
let cycleRunning = false;
let cycleNextBoundaryTime = 0;

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
function startCycleAt(startTime) {
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
		if (loop.start) {
			if (!loop.paused) loop.start(startTime, len);
			continue;
		}
		if (loop.paused) continue;
		let node = getSourceFromBuffer(loop.buffer, true);
		node.connect(channelMergerNode, 0, loop.channel);
		node.start(startTime);
		node.stop(startTime + len);
		loop.node = node;
	}
	let nextBoundary = startTime + len;
	cycleNextBoundaryTime = nextBoundary;
	let wakeIn = (nextBoundary - CYCLE_LOOKAHEAD_SECONDS - ctx.currentTime) * 1000;
	cycleTimer = window.setTimeout(function() {
		startCycleAt(nextBoundary);
	}, wakeIn > 0 ? wakeIn : 0);
}

/*
Joins the cycle. Returns an id.

The first loop starts immediately, since there is no cycle to wait for. Later
ones wait for the boundary, which is what keeps everything in phase.
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
	*/
	if (!cycleRunning) {
		cycleRunning = true;
		Promise.resolve().then(function() {
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
}

/*
Audio time to the wall clock time midi wants, read fresh each time. The two run
off different oscillators and drift apart by tens of parts per million, but
getOutputTimestamp pairs a reading of both, so converting per event re-anchors
every time and nothing accumulates.

Its contextTime is the frame reaching the output, not the frame being computed,
so the output buffer delay is already in the answer.
*/
function contextTimeToPerformanceTime(contextTime) {
	let ts = ctx.getOutputTimestamp();
	if (ts && ts.contextTime != undefined && ts.performanceTime != undefined) {
		return ts.performanceTime + (contextTime - ts.contextTime) * 1000;
	}
	// no timestamp available: fall back to the current time plus the gap
	return performance.now() + (contextTime - ctx.currentTime) * 1000;
}

// When the next cycle begins, in ctx.currentTime, and how long a cycle is.
// This is what midi aligns to.
function nextCycleBoundary() {
	return { at: cycleNextBoundaryTime, lengthSeconds: cycleLengthSeconds() };
}

function loopPlay(bufferList, channelList) {
	maybeCreateAudioContext();
	channelList.forEach(checkChannelExists);
	// one wave fans out to every channel, two alternate, and so on
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
	auditioningPlayer = new AuditionPlayer(buffer, startOffsetSamples, sustained);
	thingAuditioning = nex;
}

// -1 when nothing is auditioning, so callers can tell "at the start" from "not
// playing" without a second question.
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
*/
function maybeKillSound(force) {
	if (!thingAuditioning) return;
	if (auditioningPlayer && auditioningPlayer.sustained && !force) return;
	thingAuditioning.stopAuditioningWave();
	if (auditioningPlayer) auditioningPlayer.abortPlay();
	thingAuditioning = null;
}

function loadSample(fname, callback) {
		getFileAsBuffer(fname).then(function(result) {
			// getChannelData returns a float32 array but it still works
			// TODO: this class stores an audio buffer
			callback(result.getChannelData(0));
		})
}

async function getFileAsBuffer(filepath) {
  maybeCreateAudioContext();
  const response = await fetch("sounds/" + filepath);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  return audioBuffer;
}


export { getAudioBufferFromData, loadSample, addLoop, getAudioChannelCount, getLoopPositionSamples, loopExists, clipStartedPlaying, pauseLoops, togglePauseLoops, loopsArePlaying, addCycleMember, contextTimeToPerformanceTime, endLoops, endAllLoops, anyLoopsPlaying, nextCycleBoundary, maybeKillSound, getAuditionPositionSamples, isAnySoundPlaying, stopAllSound, startAuditioningBuffer, getFileAsBuffer, loopPlay, abortPlayback, startRecordingAudio, stopRecordingAudio }

