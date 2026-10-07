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
import {
	anyLoopsPlaying,
	atNextCycleStart,
	currentCycleStart,
	cycleLengthSeconds,
	endAllLoops,
	muteLoops,
	addLoop,
	queueBreak,
	getLoopPositionSamples,
	loopExists,
	loopsAreQueued,
	clipStartedPlaying,
	pauseLoops,
	togglePauseLoops,
	loopsArePlaying,
	addCycleMember,
	endLoops,
	nextCycleBoundary,
	loopPlay,
	abortPlayback
} from './transport.js'


/*
The reason for the channel merger node is that even if there are 16 inputs on your
audio card, the ctx.destination will still just have one input with that number of
channels. So to make it so that there are N inputs, where each of the
N inputs maps to the Nth channel of a single input, you need a channel merger
node.
*/



let thingAuditioning = null;

let auditioningPlayer = null;


// A guardrail, not a real limit -- so a first recording cannot fill the disk
// before anyone knows how to stop it. The `unlimited` tag lifts it.
// (comment by Claude)
const RECORDING_LIMIT_MS = 30000;

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

/*
Everything one take is using: the stream, the worklet, and one wave per channel
being recorded. Stopping is per rig rather than per wave, because the waves of
one take share a stream -- stopping half of it would leave the microphone open
and the other half running.

(comment by Claude)
*/
function stopRecordingAudio(wt) {
	let rig = recordingRigFor(wt);
	if (!rig) {
		// not ours, but it still has to stop thinking it is recording
		// (comment by Claude)
		if (wt && wt.stopRecording) wt.stopRecording();
		return;
	}
	for (let i = 0; i < rig.waves.length; i++) {
		rig.waves[i].stopRecording();
	}
	if (rig.timer) window.clearTimeout(rig.timer);
	rig.node.port.onmessage = null;
	rig.source.disconnect();
	rig.node.disconnect();
	rig.silence.disconnect();
	// let go of the microphone, or the browser keeps showing it as in use
	// (comment by Claude)
	rig.stream.getTracks().forEach(function(t) { t.stop(); });
	// and the clip that was being recorded into, which vodka was holding only
	// for as long as the take lasted
	// (comment by Claude)
	rig.clip = null;
	rig.stopped = true;
	recordingRigs = recordingRigs.filter(function(r) { return r != rig; });
}

/*
A batch of captured blocks, kept from the sample the take starts on to the sample
it ends on.

Per block rather than per batch, because a batch is 4096 frames and the two
edges of a punched take are exact: the downbeat is a moment in the cycle's clock
and the end is a round trip after the next one. The worklet says when each batch
was captured, so every block's own time is that plus the frames before it, and
the block the edge falls inside is cut at the sample.

(comment by Claude)
*/
function takeBatch(rig, message) {
	if (rig.stopped || rig.startTime === null) return;
	let blocks = message.blocks;
	let rate = ctx.sampleRate;
	let frames = 0;
	for (let i = 0; i < blocks.length; i++) {
		let blk = blocks[i];
		let len = (blk && blk[0]) ? blk[0].length : 0;
		if (!len) continue;
		let blockStart = message.at + frames / rate;
		let blockEnd = blockStart + len / rate;
		frames += len;
		// before the downbeat
		if (blockEnd <= rig.startTime) continue;
		let from = (blockStart < rig.startTime)
				? Math.round((rig.startTime - blockStart) * rate)
				: 0;
		let to = len;
		let finish = false;
		if (rig.stopTime !== null) {
			if (blockStart >= rig.stopTime) {
				finish = true;
				to = from;
			} else if (blockEnd > rig.stopTime) {
				to = Math.round((rig.stopTime - blockStart) * rate);
				finish = true;
			}
		}
		if (to > from) {
			for (let w = 0; w < rig.waves.length; w++) {
				// a wavetable holds one channel, so each one takes its own out
				// of the block
				// (comment by Claude)
				if (!rig.waves[w].isRecording()) continue;
				let ch = blk[rig.channels[w]];
				if (!ch) continue;
				rig.waves[w].appendRecordedData(
						(from == 0 && to == len) ? ch : ch.subarray(from, to));
			}
			markDelayedStart(rig);
		}
		if (finish) {
			markCycleEnd(rig);
			stopRecordingAudio(rig.waves[0]);
			return;
		}
	}
}

/*
Where the sound you were playing at the downbeat actually came back: a round trip
after the take began, which is the latency you set. The mark to trim to, and the
mark to judge the setting by -- if the transient is not sitting on it, the number
is wrong.

Placed as soon as the take is long enough to hold it, so you can see it while it
records.

(comment by Claude)
*/
function markDelayedStart(rig) {
	if (!rig.punchIn || rig.markedStart) return;
	let at = Math.round(getAudioLatency() * SAMPLE_RATE);
	if (at < 1) return;
	for (let i = 0; i < rig.waves.length; i++) {
		if (rig.waves[i].getDuration() <= at) return;
	}
	for (let i = 0; i < rig.waves.length; i++) {
		rig.waves[i].addNamedMarkerAt(at, 'ds');
	}
	rig.markedStart = true;
}

// where the cycle ended, which is a round trip before the take does
// (comment by Claude)
function markCycleEnd(rig) {
	if (!rig.punchOut || rig.cycleEndTime === null) return;
	let at = Math.round((rig.cycleEndTime - rig.startTime) * SAMPLE_RATE);
	for (let i = 0; i < rig.waves.length; i++) {
		rig.waves[i].addNamedMarkerAt(at, 'ce');
	}
}

function recordingRigFor(wt) {
	for (let i = 0; i < recordingRigs.length; i++) {
		if (recordingRigs[i].waves.indexOf(wt) >= 0) return recordingRigs[i];
	}
	return null;
}

function anythingIsRecording() {
	return recordingRigs.length > 0;
}

/*
Records one wave per channel, from one device, off one stream.

The channels are the ones asked for, in the order they were asked for, and one
that the device does not have is simply not recorded -- the same rule playback
has, and for the same reason: a clip is a routing, and a routing that half fits
a device should do the half that fits.

Multi-channel needs saying three times over, because every layer downmixes to
stereo if you let it: the track is asked for exactly as many channels as the
highest one wanted, the worklet node is told explicitly how many it has and that
they are discrete rather than a surround layout to be folded down, and the
processor copies them all out (it always did -- it was the consumer that threw
them away).

(comment by Claude)
*/
function startRecordingAudio(waves, channels, deviceId, unlimited, clip, punchIn, punchOut) {
	maybeCreateAudioContext();
	if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
		console.log('vodka: this browser has no audio input');
		return;
	}
	let want = 1;
	for (let i = 0; i < channels.length; i++) {
		if (channels[i] + 1 > want) want = channels[i] + 1;
	}
	/*
	ideal rather than a bare number, which means the same thing to the
	constraints algorithm but says so: a device with fewer channels than this
	gives what it has rather than refusing. exact would refuse, and a take that
	does not happen is worse than a take missing its top channels.

	(comment by Claude)
	*/
	let constraints = {
		echoCancellation: false,
		noiseSuppression: false,
		autoGainControl: false,
		channelCount: { ideal: want }
	};
	/*
	exact, so a device that has gone away is an error rather than silently
	recording from whatever the browser would rather use: you asked for that
	input, and a take off the wrong microphone is worse than no take.

	(comment by Claude)
	*/
	let useDevice = deviceId ? deviceId : inputDeviceId;
	if (useDevice) {
		constraints.deviceId = { exact: useDevice };
	}
	navigator.mediaDevices.getUserMedia({ audio: constraints }).then(function(stream) {
		let got = want;
		let track = stream.getAudioTracks()[0];
		if (track) {
			let st = track.getSettings();
			if (st.channelCount) got = st.channelCount;
			console.log('vodka: recording from "' + track.label + '" -- asked for '
					+ want + ' channel(s), got ' + (st.channelCount ? st.channelCount : '?')
					+ ' at ' + (st.sampleRate ? st.sampleRate : '?') + 'Hz');
		}
		return maybeLoadRecorderWorklet().then(function() {
			let source = ctx.createMediaStreamSource(stream);
			let node = new AudioWorkletNode(ctx, 'vodka-recorder', {
				channelCount: got,
				channelCountMode: 'explicit',
				channelInterpretation: 'discrete'
			});
			// A worklet only runs while it is connected to the graph, and this
			// one listens rather than making a sound, so it goes to a silent
			// gain node.
			// (comment by Claude)
			let silence = ctx.createGain();
			silence.gain.value = 0;
			source.connect(node);
			node.connect(silence);
			silence.connect(ctx.destination);

			/*
			A wave with no channel coming is stopped now rather than left
			recording silence until the time limit. Chrome gives at most two
			channels from any input -- the cap is hardcoded in chromium, see
			crbug 40403559 -- so a clip asking for four comes back with two
			waves that have something in them and two that are empty and
			finished, which is at least the truth about what arrived.

			(comment by Claude)
			*/
			for (let i = 0; i < waves.length; i++) {
				if (channels[i] < got) {
					waves[i].startRecording();
				} else {
					if (waves[i].isRecording()) waves[i].stopRecording();
					console.log('vodka: nothing is coming on channel ' + (channels[i] + 1)
							+ ' -- this input gave ' + got + ' channel(s)');
				}
			}
			let rig = { waves: waves, channels: channels, clip: clip, stream: stream,
					node: node, source: source, silence: silence, timer: null,
					/*
					When to start keeping samples and when to stop, in the
					context's clock. Zero is "from the beginning", which is every
					recording that is not punched in -- context time zero is in
					the past, so nothing is ever before it. Null is armed and
					waiting for a downbeat that has not come yet.

					(comment by Claude)
					*/
					startTime: punchIn ? null : 0,
					stopTime: null,
					cycleEndTime: null,
					punchIn: !!punchIn,
					punchOut: !!punchOut,
					markedStart: false,
					stopped: false };
			node.port.onmessage = function(e) {
				takeBatch(rig, e.data);
			};
			recordingRigs.push(rig);
			/*
			Armed. The stream is open and running and its samples are being
			thrown away -- a device takes a hundred-odd milliseconds to open,
			which would be a worse error than the latency this is all about, so
			it is opened now and punched later.

			atNextCycleStart queues this until a cycle begins, which may be after
			lunch: with nothing playing there is no boundary, and the callback
			waits for one rather than running.

			(comment by Claude)
			*/
			if (punchIn) {
				atNextCycleStart(function() {
					if (rig.stopped) return;
					rig.startTime = currentCycleStart();
					if (rig.punchOut) {
						rig.cycleEndTime = rig.startTime + cycleLengthSeconds();
						// the last sample of the cycle arrives a round trip
						// after the cycle ends, and not before
						// (comment by Claude)
						rig.stopTime = rig.cycleEndTime + getAudioLatency();
					}
				});
			}
			if (!unlimited) {
				rig.timer = window.setTimeout(function() {
					if (waves.length > 0 && waves[0].isRecording()) {
						stopRecordingAudio(waves[0]);
						console.log('vodka: stopped at the 30 second limit. Tag '
								+ 'start-recording with `unlimited` to record for longer.');
					}
				}, RECORDING_LIMIT_MS);
			}
		});
	}).catch(function(err) {
		for (let i = 0; i < waves.length; i++) {
			if (waves[i].isRecording()) waves[i].stopRecording();
		}
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
			// when the first block of this batch was captured, in the context's
			// own clock. Punching in and out needs to land on a sample rather
			// than on a batch, and a batch is 4096 frames -- most of a tenth of
			// a second to be wrong by
			if (this.batch.length == 0) {
				this.at = currentTime;
			}
			let copy = [];
			for (let c = 0; c < input.length; c++) {
				copy.push(new Float32Array(input[c]));
			}
			this.batch.push(copy);
			this.batched += input[0].length;
			// a block is 128 frames; batching keeps the message rate sane
			if (this.batched >= 4096) {
				this.port.postMessage({ at: this.at, blocks: this.batch });
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
// the takes running now, so stopRecordingAudio can find the one a wave belongs
// to -- more than one, because two takes can be running on two devices
// (comment by Claude)
let recordingRigs = [];

function maybeLoadRecorderWorklet() {
	if (!recorderWorkletReady) {
		let url = URL.createObjectURL(
				new Blob([RECORDER_WORKLET], { type: 'application/javascript' }));
		recorderWorkletReady = ctx.audioWorklet.addModule(url);
	}
	return recorderWorkletReady;
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


export { getAudioBufferFromData, getSilentAudioBuffer, loadAudio, muteLoops, addLoop, queueBreak, atNextCycleStart, getLoopPositionSamples, loopExists, loopsAreQueued, clipStartedPlaying, pauseLoops, togglePauseLoops, loopsArePlaying, addCycleMember, contextTimeToPerformanceTime, endLoops, endAllLoops, anyLoopsPlaying, nextCycleBoundary, maybeKillSound, getAuditionPositionSamples, isAnySoundPlaying, stopAllSound, startAuditioningBuffer, getFileAsBuffer, loopPlay, abortPlayback, startRecordingAudio, stopRecordingAudio, anythingIsRecording,
		 listAudioDevices, setAudioOutputDevice, setAudioInputDevice,
		 getAudioInputDevice, getDefaultOutputDevice, getDefaultOutputName, getDeviceChannelCount, getInputDeviceChannelCount,
		 setAudioLatency, getAudioLatency }

