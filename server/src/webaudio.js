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

let mediaRecorder = null;

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
	mediaRecorder.stop();
	wt.stopRecording();
}

function startRecordingAudio(wt, channel) {
	maybeCreateAudioContext();	
	if (!channel) channel = 0;
	if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
		navigator.mediaDevices.getUserMedia({
			// Echo cancellation merges a stereo input to mono and duplicates it, so
			// it must be off for channelCount: 2 to give two real channels.
			audio: {
				echoCancellation: false,
				noiseSuppression: false,
				autoGainControl: false,
				channelCount: 2
			}
		}).then(function(stream) {
			wt.startRecording();
			mediaRecorder = new MediaRecorder(stream);
			mediaRecorder.ondataavailable = function(e) {
				let blob = e.data;
				wt.addBlob(blob);
				let allblobs = wt.getBlobsAsOneBlob();
				allblobs.arrayBuffer().then(function(ab) {
					ctx.decodeAudioData(ab, function(buffer) {
						// A wavetable holds one channel, so a stereo input is
						// recorded one side at a time.
						if (channel >= buffer.numberOfChannels) {
							throw constructFatalError(
									`cannot record channel ${channel}: this input has `
									+ `${buffer.numberOfChannels} channel`
									+ `${buffer.numberOfChannels == 1 ? '' : 's'}.`);
						}
						wt.setRecordedData(buffer.getChannelData(channel));
					}, function(err) {
						console.log('oh well');
					})
				})
			}
			// what the device actually gave us, which is not always what was asked
			let track = stream.getAudioTracks()[0];
			if (track) {
				let st = track.getSettings();
				console.log('vodka: recording from "' + track.label + '" -- '
						+ (st.channelCount ? st.channelCount : '?') + ' channel(s) at '
						+ (st.sampleRate ? st.sampleRate : '?') + 'Hz');
			}
			mediaRecorder.start(500);
			window.setTimeout(function() {
				if (wt.isRecording()) {
					stopRecordingAudio(wt);
				}
			}, 30000)
		}).catch(function(err) {
			console.log('couldnt open audio stream');
		})
	} else {
		console.log('no user media');
	}
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
// Connecting past the merger's last input throws IndexSizeError from inside the
// web audio api, which says nothing about channels.
function checkChannelExists(channel) {
	let n = channelMergerNode.numberOfInputs;
	if (!Number.isInteger(channel) || channel < 0 || channel >= n) {
		throw constructFatalError('Unknown audio channel number. Sorry!');
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

