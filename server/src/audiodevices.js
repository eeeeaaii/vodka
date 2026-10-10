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
THE AUDIO DEVICES, AND THE CONTEXTS THAT PLAY TO THEM

An AudioContext plays to exactly one device, so a context is a property of a
device rather than something in its own right -- which is why the two live
together here rather than in two modules that would each have to reach into the
other. The first context made is the master: the system default device, where
recording and decoding happen, and the clock every other output is converted to.

What is exported is mostly live bindings rather than getters -- ctx, outputs,
SAMPLE_RATE. An imported binding in a module is a view of the exporter's
variable, so everything that used to say ctx still says ctx, and assigning to it
stays the business of the one function here that is allowed to.

(comment by Claude)
*/

let ctx = null;
let channelMergerNode = null;
let SAMPLE_RATE = 48000;
let warnedAboutMissingAudioClock = false;

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
/*
Whether somebody said which device, as opposed to vodka using whatever the
machine was pointed at.

Separate from the id because the two answers are not the same question.
Choosing the entry the browser calls 'default' sets the id to the same empty
key an unchosen output has, and choosing is choosing: the point of this flag is
to know whether anybody has, and playing or recording without having chosen is
what it is for.

(comment by Claude)
*/
let outputDeviceChosen = false;

function anOutputDeviceWasChosen() {
	return outputDeviceChosen;
}

function anInputDeviceWasChosen() {
	return inputDeviceId !== null;
}

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
		outputDeviceChosen = true;
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


export {
	ctx,
	channelMergerNode,
	SAMPLE_RATE,
	outputs,
	inputDeviceId,
	DEFAULT_OUTPUT_KEY,
	maybeCreateAudioContext,
	startSilentKeepAlive,
	cycleLog,
	audioClockIsReady,
	whenAudioClockIsReady,
	contextTimeToPerformanceTime,
	channelExistsOn,
	outputKeyFor,
	getOpenOutput,
	openOutput,
	openOutputFor,
	outputTimeFor,
	anOutputDeviceWasChosen,
	anInputDeviceWasChosen,
	listAudioDevices,
	getDeviceChannelCount,
	getInputDeviceChannelCount,
	setAudioOutputDevice,
	getDefaultOutputDevice,
	getDefaultOutputName,
	setAudioInputDevice,
	getAudioInputDevice,
	setAudioLatency,
	getAudioLatency,
	isVodkaDefaultDevice,
	describeAudioDevice,
	enumerateAudioDevices,
	askForMicrophoneOnce,
	normalizeDeviceLabel,
	findOutputIdByName
}
