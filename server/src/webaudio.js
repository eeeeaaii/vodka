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

const AudioContext = window.AudioContext || window.webkitAudioContext;

let ctx = null;
let channelMergerNode = null;
let SAMPLE_RATE = 48000;

let auditioningSource = null;

let currentlyPlayingSampleStartTime = 0;
let currentlyPlayingSampleLength; // has to be in seconds
let currentOutputSource = null;

let outputSourceWaitingForDeletion = null;

let thingAuditioning = null;

let playingSounds = [];

function maybeCreateAudioContext() {
	if (ctx == null) {
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

function channelPlay(data, channel) {
	maybeCreateAudioContext();	

	let source = getSourceFromBuffer(data, false);

	source.connect(channelMergerNode, 0, channel);
	source.start();

	let sampleLength = data.length / SAMPLE_RATE;

	window.setTimeout(function() {
		source.disconnect(channelMergerNode);
	}, sampleLength * 1.05 * 1000)

}

function loopPlay(data) {
	maybeCreateAudioContext();	

	if (currentOutputSource == null) {
		let source = getSourceFromBuffer(data, true);

		source.connect(ctx.destination);
		source.start();
		currentlyPlayingSampleStartTime = ctx.currentTime;
		currentlyPlayingSampleLength = data.length / SAMPLE_RATE;
		currentOutputSource = source;

	} else if (outputSourceWaitingForDeletion != null) {
		// we can't schedule this sound, we are waiting for another one to start playing

	} else {
		let source = getSourceFromBuffer(data, true);

		let startTime = 0;
		let currentTime = ctx.currentTime;

		let howLongBeenPlaying = currentTime - currentlyPlayingSampleStartTime;
		let howManyRepetitions = Math.floor(howLongBeenPlaying / currentlyPlayingSampleLength);
		startTime = (howManyRepetitions + 1) * currentlyPlayingSampleLength + currentlyPlayingSampleStartTime;
		let timeUntilChange = startTime - currentTime;

		currentOutputSource.stop(startTime);
		source.start(startTime);
		// we can connect the source now but we can't disconnect the previous one until after it stops playing.
		source.connect(ctx.destination);

		outputSourceWaitingForDeletion = currentOutputSource;
		currentOutputSource = source;
		currentlyPlayingSampleStartTime = startTime;
 		currentlyPlayingSampleLength = data.length / SAMPLE_RATE;

		window.setTimeout(function() {
			outputSourceWaitingForDeletion.disconnect(ctx.destination);
			outputSourceWaitingForDeletion = null;
		}, timeUntilChange * 1.05 * 1000)
	}
}

function startAuditioningBuffer(data, nex) {
	maybeCreateAudioContext();

	auditioningSource = getSourceFromBuffer(data, true /* loop */);

	auditioningSource.connect(ctx.destination);
	auditioningSource.start();

	thingAuditioning = nex;
}

function stopAuditioningBuffer() {
	auditioningSource.stop();
	auditioningSource = null;
}

function maybeKillSound() {
	if (thingAuditioning) {
		thingAuditioning.stopAuditioningWave();
		thingAuditioning = null;
	}
}

async function getFileAsBuffer(filepath) {
  maybeCreateAudioContext();
  const response = await fetch("sounds/" + filepath);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  return audioBuffer;
}


export { maybeKillSound, startAuditioningBuffer, stopAuditioningBuffer, getFileAsBuffer, channelPlay, loopPlay }