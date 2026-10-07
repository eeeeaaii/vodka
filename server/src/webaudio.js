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
Which audio device vodka uses, on a machine that has more than one. Both are
null until something chooses, which means the system default -- the browser's
own choice, which is what you want nearly all of the time.

Held here rather than passed in. A device is a property of the session, not of
the sound: nobody wants to name their interface again in every play and every
record, and a wavetable that remembered which card it came out of would be
wrong the moment it was opened anywhere else. So these are the devices, and
everything that plays or records uses them. Not saved, for the same reason a
default midi port is not saved -- a device id names hardware on this machine.

(comment by Claude)
*/
let defaultOutputDeviceId = DEFAULT_OUTPUT_KEY;
let defaultOutputName = '';
let inputDeviceId = null;

function getAudioInputDevice() {
	return inputDeviceId;
}

/*
Everything about a device is a string: enumerateDevices answers deviceId,
groupId, kind and label, and none of them is a quantity even when an id happens
to look like one. The kinds are renamed, because 'audioinput' and 'audiooutput'
are the only two kinds here -- everything that is not audio is filtered out
before this -- and input and output is what they are.

(comment by Claude)
*/
/*
Whether this is the one vodka would use: the output a new clip is made with, or
the input recording opens. Absent rather than false on the others, so the one
that matters is the one you can see.

An output that has not been chosen means the device vodka opened on, which is
the system default, which chrome lists as the device with the id 'default' --
so that is the entry that gets the mark. A machine whose output list has no such
entry gets no mark at all, which is honest: nothing here knows which piece of
hardware the system default is.

(comment by Claude)
*/
function isVodkaDefaultDevice(d) {
	if (d.kind == 'audiooutput') {
		return outputKeyFor(d.deviceId) == outputKeyFor(defaultOutputDeviceId);
	}
	if (!inputDeviceId) return d.deviceId == 'default';
	return d.deviceId == inputDeviceId;
}

function describeAudioDevice(d) {
	let r = {
		id: d.deviceId,
		kind: (d.kind == 'audioinput') ? 'input' : 'output',
		name: d.label,
		group: d.groupId
	};
	if (isVodkaDefaultDevice(d)) {
		r['vodka-default'] = true;
	}
	return r;
}

function enumerateAudioDevices() {
	return navigator.mediaDevices.enumerateDevices().then(function(all) {
		return all.filter(function(d) {
			return d.kind == 'audioinput' || d.kind == 'audiooutput';
		});
	});
}

/*
A browser withholds device names until the microphone has been allowed once --
the devices are all there, with empty labels, because a list of the hardware
attached to a machine identifies it. A list of unnamed devices is no use for
choosing one, so if any name is missing this asks for the microphone, lets go
of it immediately, and asks again.

Refusing is fine: you get the list with the names it had. Asking for input
devices is itself a reason to expect the prompt, and the permission is per
site, so this happens once rather than every time.

(comment by Claude)
*/
function askForMicrophoneOnce() {
	return navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
		stream.getTracks().forEach(function(t) { t.stop(); });
	});
}

function listAudioDevices(cb) {
	if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
		cb(null, 'this browser cannot list audio devices');
		return;
	}
	enumerateAudioDevices().then(function(devs) {
		if (!devs.some(function(d) { return !d.label; })) {
			return devs;
		}
		return askForMicrophoneOnce().then(enumerateAudioDevices, function() {
			return devs;
		});
	}).then(function(devs) {
		console.log('vodka: ' + devs.length + ' audio device(s)');
		cb(devs.map(describeAudioDevice));
	}).catch(function(e) {
		cb(null, '' + e);
	});
}

/*
Where the sound goes. setSinkId moves the whole context, so everything already
playing moves with it rather than only the next thing started.

The channel merger is built once, as wide as the device that was attached when
the context opened (see maybeCreateAudioContext), and a merger cannot be
resized -- so moving from a two channel device to a sixteen channel one does
not get you fourteen more outputs until a reload, and moving the other way
would ask the destination for more channels than it has, which throws. Hence
the clamp, and the note in the log: play goes on working either way, and
audio-channels keeps telling you what it told you before, which the builtin
says is fixed until reload.

(comment by Claude)
*/
/*
THE OUTPUTS

An AudioContext plays to one device. So playing on two at once -- the modular
rig and the speakers, say -- means one context per device, each with its own
sink and its own channel merger, and the merger is built after the sink is set,
so it is exactly as wide as that device. Which is also what fixed audio-channels:
there is no single number any more, there is a number per device.

The one made first is the master. It is the system default device, it is where
recording and decoding happen, and it is the clock: the cycle is scheduled in
its time, and every other output converts.

Converting is why this works at all. Two devices run off two crystals and drift
apart by tens of parts per million, but getOutputTimestamp pairs each context's
own time with performance.now(), so a moment in the master's time can be named
in wall clock time and then asked for in the other context's time. Nothing
accumulates, because the cycle restarts every member at every boundary -- so the
error is whatever the pairing was worth on that pass, not the sum of every pass
since you started.

(comment by Claude)
*/
const DEFAULT_OUTPUT_KEY = '';

let outputs = {};

/*
The system default is the master, under whatever name it is asked for. Chrome
lists it twice -- once as itself and once as the device with the id 'default' --
and opening a second context on the same hardware would be a second clock to
keep in step with the first for no reason at all.

(comment by Claude)
*/
function outputKeyFor(id) {
	if (!id || id == 'default') return DEFAULT_OUTPUT_KEY;
	return id;
}

function getOpenOutput(id) {
	return outputs[outputKeyFor(id)] || null;
}

/*
Opens a device, or hands back the one already open for it. The callback is
called with the output, or with null and a reason.

Not synchronous, because setSinkId is a promise and the merger cannot be built
until it has settled -- the whole point is that the merger is the width of the
device the context ended up on.

(comment by Claude)
*/
function openOutput(id, cb) {
	maybeCreateAudioContext();
	let key = outputKeyFor(id);
	if (outputs[key]) {
		cb(outputs[key]);
		return;
	}
	let AudioContextCtor = window.AudioContext || window.webkitAudioContext;
	let c = null;
	try {
		c = new AudioContextCtor({ sampleRate: SAMPLE_RATE });
	} catch (e) {
		c = new AudioContextCtor();
	}
	if (!c.setSinkId) {
		try { c.close(); } catch (e) {}
		cb(null, 'this browser cannot choose an audio output');
		return;
	}
	c.setSinkId(key).then(function() {
		if (c.state == 'suspended') c.resume();
		c.destination.channelCount = c.destination.maxChannelCount;
		let merger = c.createChannelMerger(c.destination.maxChannelCount);
		merger.connect(c.destination);
		let o = { key: key, ctx: c, merger: merger };
		outputs[key] = o;
		// getOutputTimestamp answers zeros until a context has produced output,
		// and this one's timestamps are how it is kept in step with the master
		// (comment by Claude)
		startSilentKeepAlive(o);
		console.log('vodka: opened an audio output with ' + merger.numberOfInputs
				+ ' channel(s)');
		cb(o);
	}).catch(function(e) {
		try { c.close(); } catch (e2) {}
		cb(null, '' + e);
	});
}

/*
Chrome writes the system default entry as "Default - <the real name>", so the
same box has two labels depending on which entry you are looking at. Compared
without that, and without surrounding space.

(comment by Claude)
*/
function normalizeDeviceLabel(s) {
	return ('' + s).replace(/^Default\s*-\s*/i, '').trim();
}

/*
The device with this name, if it is here. Used when an id does not resolve --
see openOutputFor.

The alias is skipped, because "the system default" is not a box and the name is
being used to find a particular box. The first match wins: a name is not unique,
and two identical interfaces have the same one, which is the price of a name
that survives being carried to another machine.

(comment by Claude)
*/
function findOutputIdByName(name, cb) {
	if (!name || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
		cb(null);
		return;
	}
	let want = normalizeDeviceLabel(name);
	enumerateAudioDevices().then(function(devs) {
		for (let i = 0; i < devs.length; i++) {
			let d = devs[i];
			if (d.kind != 'audiooutput') continue;
			if (d.deviceId == 'default') continue;
			if (normalizeDeviceLabel(d.label) == want) {
				cb(d.deviceId);
				return;
			}
		}
		cb(null);
	}).catch(function() {
		cb(null);
	});
}

/*
The device a clip names: by id, and failing that by name.

Two identifiers because they fail in opposite directions. The id is exact and
names this box and no other, but it is a hash salted per origin, so it is
meaningless in another browser profile, on another machine, after site data is
cleared, or even on another port -- an origin is scheme, host and port. The name
is the label the hardware reports, which for a usb interface carries its
vendor and product code ("ES-9 (2485:50e0)"), so it is the same string
everywhere; it is just not unique if you own two of the same box.

So: the id when it works, which is the same session or the same machine, and
the name when it does not, which is everywhere else. A document carried to
another machine finds the right interface by the name written on it.

(comment by Claude)
*/
function openOutputFor(id, name, cb) {
	openOutput(id, function(o, err) {
		if (o || !name) {
			cb(o, err);
			return;
		}
		findOutputIdByName(name, function(foundId) {
			if (!foundId) {
				cb(null, err);
				return;
			}
			console.log('vodka: that device id is not from this browser, found "'
					+ name + '" by name instead');
			openOutput(foundId, cb);
		});
	});
}

/*
A moment in the master's clock, named in another output's clock.

Through performance.now(), which both contexts can speak about: the master says
what wall clock time its moment is, and the other says what its own time is at a
wall clock time it has measured. Falls back to the difference between the two
currentTimes, which is the same answer without the output latency in it, for a
context too young to have a timestamp yet.

(comment by Claude)
*/
function outputTimeFor(o, masterTime) {
	if (!o || o.ctx == ctx) return masterTime;
	let perf = contextTimeToPerformanceTime(masterTime);
	let ts = o.ctx.getOutputTimestamp();
	if (ts && ts.contextTime != undefined && ts.performanceTime > 0) {
		return ts.contextTime + (perf - ts.performanceTime) / 1000;
	}
	return o.ctx.currentTime + (masterTime - ctx.currentTime);
}

/*
How many channels a device has, which is a question only its own context can
answer: nothing in enumerateDevices says. Opening it is the asking, and the
device stays open, which is what you wanted anyway if you are asking how many
channels it has.

(comment by Claude)
*/
function getDeviceChannelCount(id, cb) {
	openOutput(id, function(o, err) {
		if (!o) {
			cb(-1, err);
			return;
		}
		cb(o.merger.numberOfInputs);
	});
}

/*
The device a clip gets when it is made without one. It moves nothing that is
already playing: a clip names the device it plays on, so what is sounding now
goes on sounding where it is.

Opened here rather than at the first play, so that the context exists, the
channel count is known, and the clock has had time to start before anything is
scheduled against it.

(comment by Claude)
*/
/*
How many channels an input has, which is a different question asked a different
way: an output is opened by pointing a context at it, and an input by asking for
a stream from it. The stream is let go immediately -- this is a question, not a
take -- so the browser's recording indicator may blink while it is answered.

You have to ask for a lot to be told there is a lot. Both of the things that
could answer this describe the stream that was opened rather than the hardware:
getSettings says what this stream was granted, and chrome's getCapabilities
reports what the capture it negotiated can be constrained to. Opening with no
channelCount at all gets the default, which is two, and then both of them say
two however many inputs the interface has.

So the stream is asked for more channels than anything has, and whatever comes
back is what the device would give. The processing is off, which matters for
more than fidelity: echo cancellation and the rest are mono or stereo, so a
stream that goes through them cannot be anything else.

The larger of the two numbers, because they disagree on some drivers, and one
channel as the floor -- a device that opened at all has one. Both are logged,
since a device that reports less than it has is the kind of thing you want the
numbers for rather than the conclusion.

(comment by Claude)
*/
const MORE_CHANNELS_THAN_ANYTHING_HAS = 64;

function getInputDeviceChannelCount(id, cb) {
	if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
		cb(-1, 'this browser has no audio input');
		return;
	}
	let constraints = {
		echoCancellation: false,
		noiseSuppression: false,
		autoGainControl: false,
		channelCount: { ideal: MORE_CHANNELS_THAN_ANYTHING_HAS }
	};
	if (id && id != 'default') {
		constraints.deviceId = { exact: id };
	}
	navigator.mediaDevices.getUserMedia({ audio: constraints }).then(function(stream) {
		let track = stream.getAudioTracks()[0];
		let capMax = 0;
		let granted = 0;
		if (track) {
			let caps = track.getCapabilities ? track.getCapabilities() : null;
			if (caps && caps.channelCount && caps.channelCount.max) {
				capMax = caps.channelCount.max;
			}
			let st = track.getSettings();
			granted = st.channelCount ? st.channelCount : 0;
			console.log('vodka: input "' + track.label + '" -- asked for '
					+ MORE_CHANNELS_THAN_ANYTHING_HAS + ', capabilities say max '
					+ (capMax ? capMax : '?') + ', the stream gave '
					+ (granted ? granted : '?'));
		}
		stream.getTracks().forEach(function(t) { t.stop(); });
		let n = Math.max(capMax, granted);
		cb(n > 0 ? n : 1);
	}).catch(function(e) {
		cb(-1, '' + e);
	});
}

function setAudioOutputDevice(id, name, cb) {
	openOutput(id, function(o, err) {
		if (!o) {
			cb(err);
			return;
		}
		defaultOutputDeviceId = o.key;
		// kept so a clip made on this device has something to show besides a
		// hash
		// (comment by Claude)
		defaultOutputName = o.key ? (name ? name : '') : '';
		cb(null);
	});
}

function getDefaultOutputDevice() {
	return defaultOutputDeviceId;
}

function getDefaultOutputName() {
	return defaultOutputName;
}

/*
Where recorded sound comes from. Nothing to do now: a stream is asked for each
time recording starts, so this is read then (see startRecordingAudio). Recording
already running stays on the device it opened.

(comment by Claude)
*/
function setAudioInputDevice(id) {
	inputDeviceId = id;
}

/*
How long a sound takes to go out of vodka, through whatever it is going through,
and back in: the round trip of the loopback, in seconds. Set by hand, because
nothing in the browser knows it -- it is the output device plus your patch plus
the input device -- and because trying different numbers and looking at where
the sound lands is quicker than any measurement vodka could make for you.

It is what a punch-in recording uses to say where the downbeat ended up. See
startRecordingAudio.

Starts at 2400 samples, which is 50ms at the rate vodka runs at. Not a
measurement -- a place to start bisecting from that is the right order of
magnitude for a browser, where the output alone is usually 20 to 40ms. Zero
would be worse than a wrong guess: the ds mark would land on sample 0, where a
split point cannot go, so the take would come back with no mark at all and
nothing to correct from.

(comment by Claude)
*/
let audioLatencySeconds = 2400 / SAMPLE_RATE;

function setAudioLatency(seconds) {
	audioLatencySeconds = seconds > 0 ? seconds : 0;
}

function getAudioLatency() {
	return audioLatencySeconds;
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
	let at = Math.round(audioLatencySeconds * SAMPLE_RATE);
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
					rig.startTime = cycleStartedAt;
					if (rig.punchOut) {
						rig.cycleEndTime = cycleStartedAt + cycleLengthSeconds();
						// the last sample of the cycle arrives a round trip
						// after the cycle ends, and not before
						// (comment by Claude)
						rig.stopTime = rig.cycleEndTime + audioLatencySeconds;
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
		// the master is an output like any other, and the one every other
		// output's clock is converted to
		// (comment by Claude)
		outputs[DEFAULT_OUTPUT_KEY] = {
			key: DEFAULT_OUTPUT_KEY,
			ctx: ctx,
			merger: channelMergerNode
		};
	}
	// a suspended context's clock does not advance, and everything in the cycle
	// is scheduled against that clock
	// (comment by Claude)
	if (ctx.state == 'suspended') {
		ctx.resume();
	}
}

let warnedAboutMissingAudioClock = false;

// getOutputTimestamp answers zeros until the context has produced output, so the
// midi clock needs something playing whenever anything is in the cycle.
// (comment by Claude)
function startSilentKeepAlive(o) {
	if (!o) {
		maybeCreateAudioContext();
		o = outputs[DEFAULT_OUTPUT_KEY];
	}
	if (!o || o.keepAlive) return;
	let c = o.ctx;
	let buffer = c.createBuffer(1, Math.round(c.sampleRate), c.sampleRate);
	let source = c.createBufferSource();
	source.buffer = buffer;
	source.loop = true;
	let gain = c.createGain();
	gain.gain.value = 0;
	source.connect(gain);
	gain.connect(c.destination);
	source.start();
	o.keepAlive = source;
}

/*
Temporary, for the first-play-after-a-reload restart. Off unless you turn it on
from the console -- a global rather than a build flag so it can be turned on
between a reload and the first play, which is the only moment the bug happens
in:

	VODKA_DEBUG_CYCLE = true

(comment by Claude)
*/
function cycleLog(msg) {
	if (typeof window == 'undefined' || !window.VODKA_DEBUG_CYCLE) return;
	let now = ctx ? ctx.currentTime.toFixed(4) : '-';
	console.log('cycle[' + now + '] ' + msg);
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
		cycleLog('clock already ready, state=' + ctx.state
				+ ' baseLatency=' + ctx.baseLatency
				+ ' outputLatency=' + ctx.outputLatency);
		Promise.resolve().then(f);
		return;
	}
	let askedAt = ctx.currentTime;
	let askedAtWall = performance.now();
	cycleLog('waiting for the audio clock, state=' + ctx.state);
	let tries = 0;
	let check = function() {
		if (audioClockIsReady() || ++tries > 200) {
			cycleLog('clock after ' + tries + ' tries, '
					+ (performance.now() - askedAtWall).toFixed(1) + 'ms wall, '
					+ ((ctx.currentTime - askedAt) * 1000).toFixed(1) + 'ms context, '
					+ 'ready=' + audioClockIsReady() + ' state=' + ctx.state
					+ ' baseLatency=' + ctx.baseLatency
					+ ' outputLatency=' + ctx.outputLatency);
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

/*
Silence of a given length. createBuffer hands back a buffer that is already
zero, so a muted wave does not need an array of zeros to copy from -- which for
a long wave is megabytes whose only purpose was to be copied into this.

(comment by Claude)
*/
function getSilentAudioBuffer(frames) {
	maybeCreateAudioContext();
	return ctx.createBuffer(1, frames > 0 ? frames : 1, SAMPLE_RATE);
}

/*
An AudioBuffer is not tied to the context that made it, so one wave can be
playing on three devices at once off the same samples -- which is the whole
point of the outputs, and would be three copies of the audio otherwise.

(comment by Claude)
*/
function getSourceFromBuffer(buffer, loop, loopStartSeconds, output) {
	let source = (output ? output.ctx : ctx).createBufferSource();
	source.buffer = buffer;
	source.loop = loop;
	source.loopStart = loopStartSeconds || 0;
	source.loopEnd = buffer.length * (1 / SAMPLE_RATE);

	return source;
}

/*
A channel this device does not have is not played and is not complained about.

Which is the only thing that can work now that a clip names its own device: the
same expression played on the modular rig and on the speakers asks for channels
that exist on one of them and not on the other, and that is the point of it
rather than a mistake to report. Channel 7 of a two channel device is silence.

Connecting past the merger's last input would throw IndexSizeError from inside
the web audio api, which says nothing about channels, so the test is here.

(comment by Claude)
*/
function channelExistsOn(output, channel) {
	if (!output) return false;
	return Number.isInteger(channel)
			&& channel >= 0
			&& channel < output.merger.numberOfInputs;
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

/*
How long this member's next pass is. A member with a start-loop split point
plays the whole wave once and the loop region from then on, so its length is
a question about state, not a constant.
*/
function memberLengthSeconds(loop) {
	if (loop.introDone && loop.loopStartSeconds > 0) {
		return loop.lengthSeconds - loop.loopStartSeconds;
	}
	return loop.lengthSeconds;
}

function cycleLengthSeconds() {
	let longest = 0;
	for (let id in cycleLoops) {
		let len = memberLengthSeconds(cycleLoops[id]);
		if (len > longest) {
			longest = len;
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
			cycleLog('  retiring a clip nobody holds, passes=' + p.passes);
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
	/*
	startTime is where this pass is meant to begin. Late means the sources are
	started in the past, which the web audio api honours by playing them from
	the top immediately -- but their stop time is startTime + len regardless, so
	a late pass is a short pass, and the next boundary cuts it off wherever it
	has got to. That is the shape of the bug being chased here.

	(comment by Claude)
	*/
	cycleLog('startCycleAt(' + startTime.toFixed(4) + ') late by '
			+ ((ctx.currentTime - startTime) * 1000).toFixed(1) + 'ms'
			+ ' members=' + Object.keys(cycleLoops).length
			+ ' pending=' + Object.keys(cyclePending).length
			+ ' clips=' + playingClips.length);
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
	/*
	The intro flag advances here, at the boundary, not when the intro pass was
	scheduled -- lengths must hold still for the whole pass they were computed
	for, or anything reconstructing the running cycle from them is wrong.
	*/
	for (let id in cycleLoops) {
		if (cycleLoops[id].introScheduled) {
			cycleLoops[id].introDone = true;
		}
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
		// still opening its device, or the device would not open. Either way
		// there is nowhere to play it this pass
		// (comment by Claude)
		if (!loop.output) continue;
		if (!channelExistsOn(loop.output, loop.channel)) continue;
		// the same moment, said in this device's own clock
		// (comment by Claude)
		let at = outputTimeFor(loop.output, startTime);
		let node = getSourceFromBuffer(loop.buffer, true, loop.loopStartSeconds,
				loop.output);
		node.connect(loop.output.merger, 0, loop.channel);
		// the pass after the intro has played starts at the loop point, and
		// every pass wraps back to it
		node.start(at, loop.introDone ? loop.loopStartSeconds || 0 : 0);
		node.stop(at + len);
		if (!loop.introDone) loop.introScheduled = true;
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
	cycleLog('  len=' + len.toFixed(4) + ' nextBoundary=' + nextBoundary.toFixed(4)
			+ ' wakeIn=' + wakeIn.toFixed(1) + 'ms'
			+ (cycleTimer ? ' (a timer was already pending!)' : ''));
	cycleTimer = window.setTimeout(function() {
		cycleLog('timer fired for boundary ' + nextBoundary.toFixed(4));
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
	for (let i = 0; i < pendingBreak.channels.length; i++) {
		let id = nextCycleLoopId++;
		cycleLoops[id] = {
			buffer: pendingBreak.buffer,
			channel: pendingBreak.channels[i],
			lengthSeconds: pendingBreak.buffer.length / SAMPLE_RATE,
			loopStartSeconds: pendingBreak.loopStartSeconds || 0,
			introDone: false,
			node: null,
			endAfterCycle: false,
			outputKey: pendingBreak.outputKey,
			output: outputs[pendingBreak.outputKey] || outputs[DEFAULT_OUTPUT_KEY]
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
function queueBreak(buffer, channels, loopStartSeconds, deviceId) {
	maybeCreateAudioContext();
	pendingBreak = {
		buffer: buffer,
		channels: channels,
		loopStartSeconds: loopStartSeconds || 0,
		outputKey: outputKeyFor(deviceId === undefined ? defaultOutputDeviceId : deviceId)
	};
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
function addLoop(buffer, channel, loopStartSeconds, deviceId, deviceName) {
	maybeCreateAudioContext();
	return addCycleMember({
		buffer: buffer,
		channel: channel,
		lengthSeconds: buffer.length / SAMPLE_RATE,
		loopStartSeconds: loopStartSeconds || 0,
		introDone: false,
		node: null,
		outputKey: outputKeyFor(deviceId),
		outputName: deviceName || ''
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
	/*
	Which device this one plays on. Already open nearly always -- choosing a
	device opens it -- and when it is not, the member sits in the cycle without
	an output until it is, and starts at the first boundary after that. Being
	one boundary late the very first time you play on a device you have not
	named before is better than making play wait for a device to open.

	(comment by Claude)
	*/
	if (loop.outputKey !== undefined) {
		let open = outputs[loop.outputKey];
		if (open) {
			loop.output = open;
		} else {
			openOutputFor(loop.outputKey, loop.outputName, function(o, err) {
				if (o) {
					loop.output = o;
					return;
				}
				/*
				No such device -- a document saved on another machine, or an
				interface that is not plugged in. Taken out of the cycle rather
				than left in it: a member with no output is never played, but it
				still has a length, and the cycle is as long as its longest
				member. A clip from somewhere else would silently decide how long
				every bar was.

				(comment by Claude)
				*/
				console.log('vodka: could not open that audio output: ' + err);
				delete cyclePending[id];
				delete cycleLoops[id];
			});
		}
	} else {
		loop.output = outputs[DEFAULT_OUTPUT_KEY];
	}
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

/*
Waiting for the boundary: joined the cycle, not yet sounding. Everything added
in one go joins in one go, so the first id answers for all of them.

(comment by Claude)
*/
function loopsAreQueued(ids) {
	for (let i = 0; i < ids.length; i++) {
		if (cycleLoops[ids[i]]) return false;
		if (cyclePending[ids[i]]) return true;
	}
	return false;
}

function getLoopPositionSamples(id) {
	if (!ctx) return -1;
	let loop = cycleLoops[id];
	if (!loop || !loop.lengthSeconds) return -1;
	/*
	From when this pass began, which is remembered, rather than worked back from
	the next boundary minus the cycle length. Those agree only while a boundary
	cannot move, which is about to stop being true -- and the subtraction was
	already wrong for the pass in which a member joins or leaves, since the
	length is recomputed at the boundary.

	(comment by Claude)
	*/
	let elapsed = ctx.currentTime - cycleStartedAt;
	if (elapsed < 0) return -1;
	let len = memberLengthSeconds(loop);
	// after the intro every pass lives in the loop region, so the readout
	// points there
	let offset = (loop.introDone && loop.loopStartSeconds > 0) ? loop.loopStartSeconds : 0;
	return Math.floor((offset + (elapsed % len)) * SAMPLE_RATE);
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
	let len = memberLengthSeconds(loop);
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
		if (!loop.start && !loop.node && cycleRunning
				&& channelExistsOn(loop.output, loop.channel)) {
			let at = nextOwnBoundary(loop, ctx.currentTime);
			if (at < cycleNextBoundaryTime) {
				let node = getSourceFromBuffer(loop.buffer, true, loop.loopStartSeconds,
						loop.output);
				node.connect(loop.output.merger, 0, loop.channel);
				node.start(outputTimeFor(loop.output, at),
						loop.introDone ? loop.loopStartSeconds || 0 : 0);
				node.stop(outputTimeFor(loop.output, cycleNextBoundaryTime));
				if (!loop.introDone) loop.introScheduled = true;
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

function loopPlay(buffer, channelList, loopStartSeconds, deviceId, deviceName) {
	maybeCreateAudioContext();
	let ids = [];
	for (let i = 0; i < channelList.length; i++) {
		ids.push(addLoop(buffer, channelList[i], loopStartSeconds, deviceId, deviceName));
	}
	return ids;
}

// we don't need to stop nicely at end of loop
// because user can do that by putting in a gain(0, ...) or something
// this is for abort/free resources/etc.
/*
Stops what is playing on a channel, now rather than at a boundary.

It used to look in channelPlayers, which was a list of OneshotPlayer and
LoopingPlayer objects -- classes nothing had constructed since playback moved
into the cycle. So the list was always empty and this builtin had quietly done
nothing at all for however long that has been true. The classes are gone and
this asks the cycle, which is where the sound is.

(comment by Claude)
*/
function abortPlayback(channel) {
	let ids = [];
	for (let id in cycleLoops) {
		if (channel == -1 || cycleLoops[id].channel == channel) ids.push(id);
	}
	for (let id in cyclePending) {
		if (channel == -1 || cyclePending[id].channel == channel) ids.push(id);
	}
	endLoops(ids, false);
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

