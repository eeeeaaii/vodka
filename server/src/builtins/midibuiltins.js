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
import { getMidiPorts, openMidiPort, isPortOpen, addMidiSequence, replaceMidiSequence, sendMidiData, sendMidiNoteOn, sendMidiNoteOff,
		 sendMidiNoteWithDuration } from '../midifunctions.js'
import { convertTimeToSamples, nexToTimebase, getSampleRate } from '../wavetablefunctions.js'
import { constructResourceHandle } from '../nex/handle.js'
import { endLoops } from '../webaudio.js'
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


	/*
	Reads one note out of a loop-midi list. Same shape send-midi-note takes,
	plus a float tagged `time` saying where in the sequence it goes.
	*/
	function readSequenceNote(n) {
		let kind = null;
		let notenum = null;
		for (let k of ['note', 'note-on', 'note-off']) {
			let v = taggedInt(n, k, 'loop-midi');
			if (v !== null) { kind = k; notenum = v; break; }
		}
		if (kind == null) {
			return { error: 'loop-midi: needs an int tagged note, note-on or note-off. Sorry!' };
		}
		if (kind != 'note') {
			return { error: 'loop-midi: every note needs a duration, so tag it note. Sorry!' };
		}
		if (notenum < 0 || notenum > 127) {
			return { error: `loop-midi: ${notenum} is not a note (0-127). Sorry!` };
		}
		let timenex = n.getChildTagged(newTagOrThrowOOM('time', 'loop midi, time'));
		if (!timenex) {
			return { error: 'loop-midi: every note needs a float tagged time. Sorry!' };
		}
		let durnex = n.getChildTagged(newTagOrThrowOOM('duration', 'loop midi, duration'));
		if (!durnex) {
			return { error: 'loop-midi: every note needs a duration. Sorry!' };
		}
		let velocity = taggedInt(n, 'velocity', 'loop-midi');
		if (velocity == null) velocity = 127;
		let channel = taggedInt(n, 'channel', 'loop-midi');
		if (channel == null) channel = 1;
		if (channel < 1 || channel > 16) {
			return { error: `loop-midi: no channel ${channel} (1-16). Sorry!` };
		}
		let durTimebase = nexToTimebase(durnex);
		return {
			atSeconds: convertTimeToSamples(timenex) / getSampleRate(),
			durationSeconds: convertTimeToSamples(durnex) / getSampleRate(),
			// only beats are shortened; anything else asked for that length
			shortenable: durTimebase == 'BEATS',
			note: notenum,
			velocity: velocity,
			channel: channel
		};
	}

	Builtin.createBuiltin(
		'loop-midi on',
		[ 'seq()', 'port()', 'handle?' ],
		function $loopMidi(env, executionEnvironment) {
			let list = env.lb('seq');
			let port = portIdOrError(env.lb('port'), 'loop-midi');
			if (port.error) return port.error;

			let events = [];
			let spacerSeconds = 0;
			let n = list.numChildren();
			for (let i = 0; i < n; i++) {
				let c = list.getChildAt(i);
				// a bare number last is the gap before the sequence repeats
				if (i == n - 1 && !c.isNexContainer()) {
					spacerSeconds = convertTimeToSamples(c) / getSampleRate();
					break;
				}
				let e = readSequenceNote(c);
				if (e.error) return constructFatalError(e.error);
				events.push(e);
			}
			if (events.length == 0) {
				return constructFatalError('loop-midi: nothing to play. Sorry!');
			}

			// The sequence is as long as its last note nominally ends, plus the
			// gap. Nominally: shortening a note to keep it clear of the next one
			// gives the time back to the gap, so it never changes the length.
			let nominalEnd = 0;
			for (let i = 0; i < events.length; i++) {
				let end = events[i].atSeconds + events[i].durationSeconds;
				if (end > nominalEnd) nominalEnd = end;
			}
			let lengthSeconds = nominalEnd + spacerSeconds;

			let what = 'midi loop, ' + events.length + ' note' + (events.length == 1 ? '' : 's');

			// Handed a handle, replace what it names rather than starting a
			// second loop alongside it.
			let handle = env.lb('handle');
			if (handle != UNBOUND) {
				if (handle.getTypeName() != '-handle-' || handle.getKind() != 'midi loop') {
					return constructFatalError('loop-midi: that is not a midi loop handle. Sorry!');
				}
				let ids = handle.getIds();
				if (ids.length != 1
						|| !replaceMidiSequence(ids[0], port.id, events, lengthSeconds)) {
					return constructFatalError('loop-midi: that loop is not running any more. Sorry!');
				}
				handle.setIds(ids, what);
				return handle;
			}

			let id = addMidiSequence(port.id, events, lengthSeconds);
			return constructResourceHandle('midi loop', what, [ id ], endLoops);
		},
		'Plays a list of midi notes in a loop on |port, joining the global cycle at its next boundary. Each note is what send-midi-note takes, with a float tagged time saying where in the sequence it falls. A bare number at the end of the list is the gap before the sequence repeats. Returns a sequence, which ends the loop when it is deleted, or at the next boundary if passed to end-seq.'
	);

	Builtin.createBuiltin(
		'send-midi-data on',
		[ 'data()', 'port()' ],
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
		'Sends |data, an org of integers, to the midi port |port exactly as given. For anything the note builtin does not cover -- control changes, program changes, clock, sysex.'
	);

	// The tag on the int picks the message, like a timebase tag picks a unit.
	// No converting note-off to note-on-at-zero: note off velocity is release
	// velocity on some devices, so they aren't interchangeable.
	Builtin.createBuiltin(
		'send-midi-note on',
		[ 'note()', 'port()' ],
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
				let dur = n.getChildTagged(newTagOrThrowOOM('duration', 'send-midi-note, duration'));
				if (!dur) {
					return constructFatalError('send-midi-note: a note needs a duration. Sorry!');
				}
				let timebase = nexToTimebase(dur);
				let ms = (convertTimeToSamples(dur, timebase) / getSampleRate()) * 1000;
				sendMidiNoteWithDuration(port.id, channel, notenum, velocity, ms, timebase == 'BEATS');
			}
			return n;
		},
		'Sends a midi note to the port |port. |note is an org holding an integer tagged note, note-on or note-off. A note tagged |note also needs a float tagged duration, which takes a timebase tag like any other length. Velocity defaults to 127 and channel to 1.'
	);

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
