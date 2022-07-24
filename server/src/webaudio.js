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

let ctx = null;
let channelMergerNode = null;
let SAMPLE_RATE = 48000;

let thingAuditioning = null;

let channelPlayers = [];

let mediaRecorder = null;

class AuditionPlayer {
	constructor(data, channel, nex) {
		this.source = getSourceFromBuffer(data, true /* loop */);
		this.source.connect(channelMergerNode, 0, channel);
		this.source.start();

		this.channel = channel;
	}

	canChangeLoopData() {
		return false;
	}

	abortPlay() {
		this.source.stop();
		this.source.disconnect(channelMergerNode);
		if (channelPlayers[this.channel] == this) {
			channelPlayers[this.channel] = null;
		}
	}
}

class OneshotPlayer {
	constructor(data, channel) {
		this.channel = channel;

		this.source = getSourceFromBuffer(data, false);
		this.source.connect(channelMergerNode, 0, channel);
		this.source.start();

		let sampleLength = data.length / SAMPLE_RATE;

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
		this.source.disconnect(channelMergerNode);
		if (channelPlayers[this.channel] == this) {
			channelPlayers[this.channel] = null;
		}
	}
}

class LoopingPlayer {
	constructor(data, channel) {
		this.channel = channel;
		this.source = getSourceFromBuffer(data, true);
		this.source.connect(channelMergerNode, 0, channel);
		this.source.start();
		this.currentlyPlayingSampleStartTime = ctx.currentTime;
		this.currentlyPlayingSampleLength = data.length / SAMPLE_RATE;
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

	changeLoopData(data) {
		let newsource = getSourceFromBuffer(data, true);

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
 		this.currentlyPlayingSampleLength = data.length / SAMPLE_RATE;

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

function startRecordingAudio(wt) {
	maybeCreateAudioContext();	
	if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
		navigator.mediaDevices.getUserMedia({
			audio:true
		}).then(function(stream) {
			wt.startRecording();
			mediaRecorder = new MediaRecorder(stream);
			mediaRecorder.ondataavailable = function(e) {
				let blob = e.data;
				wt.addBlob(blob);
				let allblobs = wt.getBlobsAsOneBlob();
				allblobs.arrayBuffer().then(function(ab) {
					ctx.decodeAudioData(ab, function(buffer) {
						// now have an audio buffer of the data
						wt.setRecordedData(buffer.getChannelData(0));
					}, function(err) {
						console.log('oh well');
					})
				})
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

function getSourceFromBuffer(data, loop) {
	let buffer = ctx.createBuffer(1, data.length, SAMPLE_RATE);
	let chan = buffer.getChannelData(0);
	for (let i = 0; i < data.length; i++) {
		chan[i] = data[i];
	}

	let source = ctx.createBufferSource();
	source.buffer = buffer;
	source.loop = loop;
	source.loopEnd = data.length * (1 / SAMPLE_RATE);

	return source;
}

// this plays immediately
function oneshotPlay(data, channel) {
	maybeCreateAudioContext();	
	if (!channel) {
		channel = 0;
	}

	if (channelPlayers[channel]) {
		channelPlayers[channel].abortPlay();
	}

	channelPlayers[channel] = new OneshotPlayer(data, channel);

}

// we don't need to stop nicely at end of loop
// because user can do that by putting in a gain(0, ...) or something
// this is for abort/free resources/etc.
function abortPlayback(channel) {
	if (channelPlayers[channel]) {
		channelPlayers[channel].abortPlay();
	}
}

function loopPlay(data, channel) {
	maybeCreateAudioContext();
	if (!channel) {
		channel = 0;
	}

	if (channelPlayers[channel]) {
		if (channelPlayers[channel].canChangeLoopData()) {
			channelPlayers[channel].changeLoopData(data);
		}
	} else {
		channelPlayers[channel] = new LoopingPlayer(data, channel);
	}
}

function startAuditioningBuffer(data, nex) {
	maybeCreateAudioContext();
	// channel is always 1
	if (channelPlayers[1]) {
		channelPlayers[1].abortPlay();
	}
	channelPlayers[1] = new AuditionPlayer(data, 1);
	thingAuditioning = nex;
}

function maybeKillSound() {
	if (thingAuditioning) {
		thingAuditioning.stopAuditioningWave();
		channelPlayers[1].abortPlay();
		thingAuditioning = null;
	}
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


export { loadSample, maybeKillSound, startAuditioningBuffer, getFileAsBuffer, oneshotPlay, loopPlay, abortPlayback, startRecordingAudio, stopRecordingAudio }

