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
import { heap } from './heap.js'
import {
	ctx,
	channelMergerNode,
	SAMPLE_RATE,
	outputs,
	inputDeviceId,
	DEFAULT_OUTPUT_KEY,
	maybeCreateAudioContext,
	startSilentKeepAlive,
	cycleLog,
	whenAudioClockIsReady,
	contextTimeToPerformanceTime,
	channelExistsOn,
	outputKeyFor,
	openOutput,
	openOutputFor,
	outputTimeFor,
	listAudioDevices,
	getDeviceChannelCount,
	getInputDeviceChannelCount,
	setAudioOutputDevice,
	getDefaultOutputDevice,
	getDefaultOutputName,
	setAudioInputDevice,
	getAudioInputDevice,
	setAudioLatency,
	getAudioLatency
} from './audiodevices.js'
import { getAudioBufferFromData, getSilentAudioBuffer, getSourceFromBuffer } from './audiobuffers.js'
import { anyLoopsPlaying, atNextCycleStart, currentCycleStart, cycleLengthSeconds, endAllLoops, abortPlayback, queueBreak } from './transport.js'
import { startRecordingAudio, stopRecordingAudio, anythingIsRecording } from './audiorecording.js'


/*
The reason for the channel merger node is that even if there are 16 inputs on your
audio card, the ctx.destination will still just have one input with that number of
channels. So to make it so that there are N inputs, where each of the
N inputs maps to the Nth channel of a single input, you need a channel merger
node.
*/



let thingAuditioning = null;

let auditioningPlayer = null;



class AuditionPlayer {
	// sustained means the sound keeps going after the key comes back up. Holding
	// enter to audition is momentary; toggling playback with space is not.
	// (comment by Claude)
	// Auditioning is listening to a wave while you work on it, so it goes to
	// the device vodka was opened on, never to a clip's device. A machine whose
	// default output does not have the audition channel gets the first one.
	// (comment by Claude)
	static channel() {
		let ch = settings.AUDIO_AUDITION_CHANNEL;
		return channelExistsOn(outputs[DEFAULT_OUTPUT_KEY], ch) ? ch : 0;
	}

	constructor(buffer, startOffsetSamples, sustained, loopStartSeconds) {
		this.buffer = buffer;
		this.sustained = !!sustained;
		this.startOffsetSamples = startOffsetSamples ? startOffsetSamples : 0;
		this.loopStartSamples = loopStartSeconds ? loopStartSeconds * SAMPLE_RATE : 0;
		this.startedAt = ctx.currentTime;
		this.source = getSourceFromBuffer(buffer, true /* loop */, loopStartSeconds);
		/*
		Both channels. A merger sends each of its inputs to the output channel
		of the same number, so connecting once puts an audition in one ear and
		not the other -- fine for a clip that was routed to a channel on
		purpose, wrong for listening to a wave.

		The second connection only if there is a second channel to make it on,
		since an output can be mono.
		*/
		let ch = AuditionPlayer.channel();
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
		let full = this.buffer.length;
		// after the first pass the source wraps to the loop point, not zero
		if (pos < full || !(this.loopStartSamples > 0)) {
			return pos % full;
		}
		return this.loopStartSamples + ((pos - full) % (full - this.loopStartSamples));
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










function startAuditioningBuffer(buffer, nex, startOffsetSamples, sustained, loopStartSeconds) {
	maybeCreateAudioContext();

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

	auditioningPlayer = new AuditionPlayer(buffer, startOffsetSamples, sustained, loopStartSeconds);
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
	return anyLoopsPlaying();
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


export {
	getAudioBufferFromData, getSilentAudioBuffer, loadAudio, getFileAsBuffer,
	maybeKillSound, getAuditionPositionSamples, isAnySoundPlaying, stopAllSound,
	startAuditioningBuffer, contextTimeToPerformanceTime, anyLoopsPlaying,
	startRecordingAudio, stopRecordingAudio, anythingIsRecording,
	listAudioDevices, setAudioOutputDevice, setAudioInputDevice,
	getAudioInputDevice, getDefaultOutputDevice, getDefaultOutputName,
	getDeviceChannelCount, getInputDeviceChannelCount,
	setAudioLatency, getAudioLatency
}
