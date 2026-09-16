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

import { Builtin } from '../nex/builtin.js'; 
import { getMidiPorts, openMidiPort, isPortOpen, addMidiSequence, setDefaultMidiPort, getDefaultMidiPort,
		 sendMidiData, sendMidiNoteOn, sendMidiNoteOff,
		 sendMidiNoteWithDuration } from '../midifunctions.js'
import { convertTimeToSamples, nexToTimebase, getSampleRate } from '../wavetablefunctions.js'
import { constructClip } from '../nex/clip.js'
import * as Utils from '../utils.js'
import { endLoops, clipStartedPlaying } from '../webaudio.js'
import { UNBOUND } from '../environment.js'
import { constructOrg } from '../nex/org.js'; 
import { constructDeferredValue } from '../nex/deferredvalue.js'; 
import { constructFatalError, constructInfo, newTagOrThrowOOM } from '../nex/eerror.js'
import { convertJSMapToOrg } from '../nex/org.js'
import { Tag } from '../tag.js'
import {
	MidiActivationFunctionGenerator,
	GenericActivationFunctionGenerator
} from '../asyncfunctions.js'


function createMidiBuiltins() {
	Builtin.createBuiltin(
		'list-midi-ports',
		[ ],
		function $listMidiInputs(env, executionEnvironment) {
			let dv = constructDeferredValue();
			dv.set(new GenericActivationFunctionGenerator(
				'list-midi-ports', 
				function(callback, exp) {
					getMidiPorts(function(devs) {
						// devices will just be a string
						// convert to nice estrings
						let r = constructOrg();
						for (let i = 0; i < devs.length ; i++) {
							let org = convertJSMapToOrg(devs[i]);
							org.setHorizontal();
							r.appendChild(org);
						}
						callback(r);
					})
				}
			));
			let waitmessage = constructInfo(`listing midi ports`);
			dv.appendChild(waitmessage)
			// without this the activation function never runs: the deferred sits
			// showing its wait message forever, never having asked for anything
			dv.activate();
			return dv;
		},
		'Lists every midi port, in both directions. The |type of each says whether it is an input or an output.'
	);



	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -

	function portIdOrError(port, who) {
		if (port == UNBOUND) {
			let id = getDefaultMidiPort();
			if (!id) {
				return { error: constructFatalError(
						who + ': no port given and no default set. Sorry!') };
			}
			return { id: id };
		}
		// play-midi takes this argument untyped, so it can be handed anything
		if (!Utils.isNexContainer(port)) {
			return { error: constructFatalError(who + ': that is not a midi port. Sorry!') };
		}
		let type = port.getChildTagged(newTagOrThrowOOM('type', who + ', type'));
		if (type && type.getFullTypedValue() != 'output') {
			return { error: constructFatalError(who + ': that is an input port. Sorry!') };
		}
		let id = port.getChildTagged(newTagOrThrowOOM('id', who + ', id'));
		if (!id) {
			return { error: constructFatalError(who + ': midi port has no id. Sorry!') };
		}
		return { id: id.getFullTypedValue() };
	}

	function taggedInt(org, name, who) {
		let c = org.getChildTagged(newTagOrThrowOOM(name, who + ', ' + name));
		return c ? c.getTypedValue() : null;
	}

	Builtin.createBuiltin(
		'open-midi-port',
		[ 'port()' ],
		function $openMidiPort(env, executionEnvironment) {
			let port = env.lb('port');
			let id = port.getChildTagged(newTagOrThrowOOM('id', 'open midi port, id'));
			if (!id) {
				return constructFatalError('open-midi-port: not a midi port. Sorry!');
			}
			let idstr = id.getFullTypedValue();

			let dv = constructDeferredValue();
			dv.set(new GenericActivationFunctionGenerator(
				'open-midi-port',
				function(callback, exp) {
					openMidiPort(idstr, function(desc) {
						if (!desc) {
							callback(constructFatalError(
									`open-midi-port: no port with id ${idstr}. Sorry!`));
							return;
						}
						let org = convertJSMapToOrg(desc);
						org.setHorizontal();
						callback(org);
					})
				}
			));
			let waitmessage = constructInfo(`opening midi port`);
			dv.appendChild(waitmessage)
			dv.activate();
			return dv;
		},
		'Reconnects the midi port |port and returns it with its state as it is now. A port remembered from a previous session is only its name and id until this is called; list-midi-ports does the same thing for every port at once.'
	);

	Builtin.createBuiltin(
		'set-default-port',
		[ 'port()' ],
		function $setDefaultPort(env, executionEnvironment) {
			let port = env.lb('port');
			let found = portIdOrError(port, 'set-default-port');
			if (found.error) return found.error;
			setDefaultMidiPort(found.id);
			return port;
		},
		'Sets the midi port that send-midi-note, send-midi-data and play-midi use when they are not given one, and hands |port back so it can be set and used in the same breath. Lasts for this session only: a port id belongs to this machine, so saving one into a document would name a port that may not be there next time.'
	);


	/*
	Reads one entry out of a play-midi list. Same shape send-midi-note takes,
	plus an optional float tagged `time` saying where in the sequence it goes.

	Without a time it starts where the entry before it ended, so a list of notes
	carrying nothing but durations plays one after another. Without a note number
	it is a rest: it takes up its duration and sounds nothing.
	*/
	function readSequenceEntry(n, atSeconds) {
		let kind = null;
		let notenum = null;
		for (let k of ['note', 'note-on', 'note-off']) {
			let v = taggedInt(n, k, 'play-midi');
			if (v !== null) { kind = k; notenum = v; break; }
		}
		let durnex = n.getChildTagged(newTagOrThrowOOM('duration', 'play midi, duration'));

		/*
		A rest is a duration with no note number. Something with neither is still an
		error rather than a rest of the default length, so that a mistyped note tag
		says so instead of quietly turning into silence.
		*/
		if (kind == null && !durnex) {
			return { error: 'play-midi: an entry needs a note number or a duration. Sorry!' };
		}
		if (kind != null && kind != 'note') {
			return { error: 'play-midi: every note needs a duration, so tag it note. Sorry!' };
		}
		if (kind != null && (notenum < 0 || notenum > 127)) {
			return { error: `play-midi: ${notenum} is not a note (0-127). Sorry!` };
		}

		// a time of its own overrides where the entry before it left off, and the
		// entries after it then follow from here
		let timenex = n.getChildTagged(newTagOrThrowOOM('time', 'play midi, time'));
		if (timenex) {
			atSeconds = convertTimeToSamples(timenex) / getSampleRate();
		}

		// velocity and channel already have defaults, so a duration has one too
		let durTimebase = durnex ? nexToTimebase(durnex) : 'BEATS';
		let durSamples = durnex
				? convertTimeToSamples(durnex)
				: convertTimeToSamples(1, 'BEATS');
		let durationSeconds = durSamples / getSampleRate();
		let endsAtSeconds = atSeconds + durationSeconds;

		if (kind == null) {
			return { event: null, endsAtSeconds: endsAtSeconds };
		}

		let velocity = taggedInt(n, 'velocity', 'play-midi');
		if (velocity == null) velocity = 127;
		let channel = taggedInt(n, 'channel', 'play-midi');
		if (channel == null) channel = 1;
		if (channel < 1 || channel > 16) {
			return { error: `play-midi: no channel ${channel} (1-16). Sorry!` };
		}
		return {
			event: {
				atSeconds: atSeconds,
				durationSeconds: durationSeconds,
				// only beats are shortened; anything else asked for that length
				shortenable: durTimebase == 'BEATS',
				note: notenum,
				velocity: velocity,
				channel: channel
			},
			endsAtSeconds: endsAtSeconds
		};
	}

	Builtin.createBuiltin(
		'play-midi',
		[ 'seq()', 'portorclip?' ],
		function $playMidi(env, executionEnvironment) {
			let list = env.lb('seq');

			/*
			Port and clip share one argument because they can never both mean
			anything: handed a clip, the replacement stays on the port that clip
			is already playing on, so there is nothing left for a port to say.
			Optional arguments bind by position and not by type, so two of them
			would put a clip where the port belongs.
			*/
			let arg = env.lb('portorclip');
			let clip = null;
			let portNex = UNBOUND;
			if (arg != UNBOUND) {
				if (Utils.isClip(arg)) {
					if (arg.getKind() != 'midi loop') {
						return constructFatalError('play-midi: that is not a midi clip. Sorry!');
					}
					clip = arg;
				} else {
					portNex = arg;
				}
			}
			let portId;
			if (clip) {
				portId = clip.getPort();
				// a copy of a clip does not remember its port
				if (!portId) {
					let found = portIdOrError(UNBOUND, 'play-midi');
					if (found.error) return found.error;
					portId = found.id;
				}
			} else {
				let found = portIdOrError(portNex, 'play-midi');
				if (found.error) return found.error;
				portId = found.id;
			}

			let events = [];
			// where the next entry starts if it does not say, and how long the
			// sequence has got to so far
			let cursorSeconds = 0;
			let nominalEnd = 0;
			let n = list.numChildren();
			for (let i = 0; i < n; i++) {
				let c = list.getChildAt(i);
				if (!c.isNexContainer()) {
					return constructFatalError(
							'play-midi: every entry has to be an org. Sorry!');
				}
				let e = readSequenceEntry(c, cursorSeconds);
				if (e.error) return constructFatalError(e.error);
				// a rest has no event, but it still takes up its time
				if (e.event) events.push(e.event);
				cursorSeconds = e.endsAtSeconds;
				if (e.endsAtSeconds > nominalEnd) nominalEnd = e.endsAtSeconds;
			}
			// The sequence is as long as its last entry nominally ends. Nominally:
			// shortening a note to keep it clear of the next one is a note off
			// sent early, not a shorter sequence. A rest at the end counts, which
			// is how you put space before the repeat.
			let lengthSeconds = nominalEnd;

			// the clip already says it is midi, so this says what is in it
			let what = events.length == 0
					? 'empty'
					: events.length + ' note' + (events.length == 1 ? '' : 's');

			if (clip) {
				// Out at the boundary and back in at the same one, the way an
				// audio loop is replaced. Stopping the old sequence now instead
				// would send its note offs early and cut a note that is sounding.
				endLoops(clip.getIds(), true /* at the cycle end */);
			}

			let id = addMidiSequence(portId, events, lengthSeconds);
			if (clip) {
				clip.setIds([ id ], what);
			} else {
				clip = constructClip('midi loop', what, [ id ], endLoops, null, portId);
			}
			// the midi system owns it while it plays, and how long that lasts is
			// decided by whether anything else owns it too
			clipStartedPlaying(clip, [ id ]);
			return clip;
		},
		'Plays a list of midi notes in a loop, joining the global cycle at its next boundary, and returns a clip naming it. Each note is what send-midi-note takes, and may carry a float tagged time saying where in the sequence it falls. Without a time it starts where the entry before it ended, so a list of notes carrying nothing but durations plays one after another. An entry with a duration and no note number is a rest: it takes up its time and sounds nothing, and a rest at the end is how you put space before the sequence repeats. An empty list gives you an empty clip, which sounds nothing and holds its place until you pass it back in |portorclip with something to play. The loop plays for as long as something holds the clip: keep the clip and it loops, throw it away and it plays once, delete it and it stops at the end of the pass it is in. |portorclip is either the port to play on, or a clip from an earlier play-midi -- given a clip, what it is playing is replaced at the next boundary, staying on the port it is already on, and you get the same clip back. Given neither, it plays on the port set by set-default-port.'
	);

	Builtin.aliasBuiltin('loop-midi on', 'play-midi');
	Builtin.aliasBuiltin('play-midi on', 'play-midi');

	Builtin.createBuiltin(
		'send-midi-data',
		[ 'data()', 'port()?' ],
		function $sendMidiData(env, executionEnvironment) {
			let data = env.lb('data');
			let port = portIdOrError(env.lb('port'), 'send-midi-data');
			if (port.error) return port.error;

			let bytes = [];
			for (let i = 0; i < data.numChildren(); i++) {
				let b = data.getChildAt(i).getTypedValue();
				if (!Number.isInteger(b) || b < 0 || b > 255) {
					return constructFatalError(`send-midi-data: ${b} is not a byte (0-255). Sorry!`);
				}
				bytes.push(b);
			}
			if (bytes.length == 0) {
				return constructFatalError('send-midi-data: nothing to send. Sorry!');
			}
			sendMidiData(port.id, bytes);
			return data;
		},
		'Sends |data, an org of integers, to the midi port |port exactly as given, or to the one set by set-default-port if you do not name one. For anything the note builtin does not cover -- control changes, program changes, clock, sysex.'
	);

	Builtin.aliasBuiltin('send-midi-data on', 'send-midi-data');

	// The tag on the int picks the message, like a timebase tag picks a unit.
	// No converting note-off to note-on-at-zero: note off velocity is release
	// velocity on some devices, so they aren't interchangeable.
	Builtin.createBuiltin(
		'send-midi-note',
		[ 'note()', 'port()?' ],
		function $sendMidiNote(env, executionEnvironment) {
			let n = env.lb('note');
			let port = portIdOrError(env.lb('port'), 'send-midi-note');
			if (port.error) return port.error;

			let kind = null;
			let notenum = null;
			for (let k of ['note', 'note-on', 'note-off']) {
				let v = taggedInt(n, k, 'send-midi-note');
				if (v !== null) {
					kind = k;
					notenum = v;
					break;
				}
			}
			if (kind == null) {
				return constructFatalError(
						'send-midi-note: needs an int tagged note, note-on or note-off. Sorry!');
			}
			if (notenum < 0 || notenum > 127) {
				return constructFatalError(`send-midi-note: ${notenum} is not a note (0-127). Sorry!`);
			}

			let velocity = taggedInt(n, 'velocity', 'send-midi-note');
			if (velocity == null) velocity = 127;
			if (velocity < 0 || velocity > 127) {
				return constructFatalError(`send-midi-note: velocity ${velocity} is out of range (0-127). Sorry!`);
			}

			// 1-16, the way hardware shows them
			let channel = taggedInt(n, 'channel', 'send-midi-note');
			if (channel == null) channel = 1;
			if (channel < 1 || channel > 16) {
				return constructFatalError(`send-midi-note: no channel ${channel} (1-16). Sorry!`);
			}

			if (kind == 'note-on') {
				sendMidiNoteOn(port.id, channel, notenum, velocity);
			} else if (kind == 'note-off') {
				sendMidiNoteOff(port.id, channel, notenum, velocity);
			} else {
				// no duration means one beat, the way no velocity means 127
				let dur = n.getChildTagged(newTagOrThrowOOM('duration', 'send-midi-note, duration'));
				let timebase = dur ? nexToTimebase(dur) : 'BEATS';
				let samples = dur
						? convertTimeToSamples(dur, timebase)
						: convertTimeToSamples(1, 'BEATS');
				let ms = (samples / getSampleRate()) * 1000;
				sendMidiNoteWithDuration(port.id, channel, notenum, velocity, ms, timebase == 'BEATS');
			}
			return n;
		},
		'Sends a midi note to the port |port, or to the one set by set-default-port if you do not name one. |note is an org holding an integer tagged note, note-on or note-off. A note tagged |note may also carry a float tagged duration, which takes a timebase tag like any other length. Duration defaults to one beat, velocity to 127 and channel to 1.'
	);

	Builtin.aliasBuiltin('send-midi-note on', 'send-midi-note');

	Builtin.createBuiltin(
		'wait-for-midi',
		[ 'midiport()' ],
		function $setMidi(env, executionEnvironment) {
			let midiport = env.lb('midiport');
			let id = midiport.getChildTagged(newTagOrThrowOOM('id', 'wait for midi builtin, id'));
			if (!id) {
				return constructFatalError('wait-for-midi: not a midi port. Sorry!');
			}
			// now that both directions are listed, an output can be passed here
			// by mistake, and listening to one just never fires
			let type = midiport.getChildTagged(newTagOrThrowOOM('type', 'wait for midi builtin, type'));
			if (type && type.getFullTypedValue() != 'input') {
				return constructFatalError('wait-for-midi: that is an output port. Sorry!');
			}
			if (!isPortOpen(id.getTypedValue())) {
				return constructFatalError('wait-for-midi: you must open the midi port first. Sorry!');
			}
			let dv = constructDeferredValue();
			dv.setAutoreset(true);
			let afg = new MidiActivationFunctionGenerator(id.getTypedValue());
			dv.set(afg);
			dv.activate();
			return dv;
		},
		'Returns a deferred value that updates any time a midi event is received on |midiport.'
	);
	
}

export { createMidiBuiltins }
