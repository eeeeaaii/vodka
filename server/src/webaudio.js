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
		/*
		Not `audio: true`, which leaves the webrtc voice processing on. With
		echo cancellation enabled a stereo input is merged to mono and then
		duplicated into two identical channels, so there is no stereo to record
		even from a stereo source. Automatic gain control pumps and noise
		suppression eats transients, neither of which is wanted on anything
		musical.
		*/
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
/*
The merger is built with as many inputs as the output device had when the
context was opened, so asking for a channel past that is an ordinary mistake --
the wrong device is selected, or the patch expects more outputs than are there.
Connecting anyway throws IndexSizeError from deep inside the web audio api,
which says nothing about channels and stops evaluation dead.
*/
function checkChannelExists(channel) {
	let n = channelMergerNode.numberOfInputs;
	if (!Number.isInteger(channel) || channel < 0 || channel >= n) {
		throw constructFatalError(
				`no channel ${channel}, this device has ${n} (0-${n - 1}). Sorry!`);
	}
}

function oneshotPlay(bufferList, channelList) {
	maybeCreateAudioContext();
	channelList.forEach(checkChannelExists);

	let bufferIndex = 0;

	for (let i = 0; i < channelList.length; i++) {
		let channel = channelList[i];
		let buffer = bufferList[bufferIndex];

		if (channelPlayers[channel]) {
			channelPlayers[channel].abortPlay();
		}
		channelPlayers[channel] = new OneshotPlayer(buffer, channel);

		bufferIndex = (bufferIndex + 1) % bufferList.length;
	}
}

function loopPlay(bufferList, channelList) {
	maybeCreateAudioContext();
	channelList.forEach(checkChannelExists);
	// if there is just one wave, fan it out to all the channels.
	// if there are two, alternate...
	// if there are three, you know.

	let bufferIndex = 0;

	for (let i = 0; i < channelList.length; i++) {
		let channelNum = channelList[i];
		let buffer = bufferList[bufferIndex];

		if (channelPlayers[channelNum]) {
			if (channelPlayers[channelNum].canChangeLoopData()) {
				channelPlayers[channelNum].changeLoopData(buffer);
			}
		} else {
			channelPlayers[channelNum] = new LoopingPlayer(buffer, channelNum);
		}

		bufferIndex = (bufferIndex + 1) % bufferList.length;
	}
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


export { getAudioBufferFromData, loadSample, maybeKillSound, getAuditionPositionSamples, isAnySoundPlaying, stopAllSound, startAuditioningBuffer, getFileAsBuffer, oneshotPlay, loopPlay, abortPlayback, startRecordingAudio, stopRecordingAudio }

