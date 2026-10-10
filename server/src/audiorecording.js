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

/*
RECORDING

Samples are captured with an audio worklet rather than a MediaRecorder. A
MediaRecorder hands back an encoded blob whose chunks are not independently
decodable, so showing the waveform as it arrived meant decoding the whole take
again on every chunk -- work that grew with the length of the recording. A
worklet hands over raw floats, which is what a wavetable holds anyway, so
nothing is decoded and the waveform can grow as you record.

Recording knows about the transport but not the other way round: a take can be
punched in against the cycle, and nothing in the cycle cares that anything is
being recorded.

(comment by Claude)
*/

import {
	ctx,
	SAMPLE_RATE,
	inputDeviceId,
	maybeCreateAudioContext,
	getAudioLatency
} from './audiodevices.js'
import { atNextCycleStart, currentCycleStart, cycleLengthSeconds } from './transport.js'

// A guardrail, not a real limit -- so a first recording cannot fill the disk
// before anyone knows how to stop it. The `unlimited` tag lifts it.
// (comment by Claude)
const RECORDING_LIMIT_MS = 30000;

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
Every take, ended where it is.

For the stop button, which is the one place in vodka that means stop whatever
is going on without having to say what. A take is as much a thing going on as a
loop is -- more so, because it is holding the microphone open and filling a
wave -- so leaving it running after you pressed stop would be a surprise.

A copy of the list, because stopping a take takes it out of the one being
walked.

(comment by Claude)
*/
function stopAllRecording() {
	let rigs = recordingRigs.slice();
	for (let i = 0; i < rigs.length; i++) {
		if (rigs[i].waves.length > 0) stopRecordingAudio(rigs[i].waves[0]);
	}
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
			/*
			Only the ones with nothing coming. The waves were started by whoever
			asked for the take, before the device was opened, so that what came
			back was already recording -- starting them again here is what put a
			real editor on the last of them.

			startRecording asks its wave to go into its editor, and a wave that
			is not in the document yet has no render node to do that with, so it
			only sets the flag. By the time this promise resolves the waves have
			been rendered, so the second call found render nodes, selected each
			wave in turn and opened an editor on the last one -- which then
			stayed open, because an editor somebody really opened is not the flag
			that stopRecording takes back.

			(comment by Claude)
			*/
			for (let i = 0; i < waves.length; i++) {
				if (channels[i] >= got) {
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

export {
	startRecordingAudio,
	stopRecordingAudio,
	anythingIsRecording,
	stopAllRecording
}
