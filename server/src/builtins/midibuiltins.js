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
import { getMidiPorts, openMidiPort, isPortOpen, sendMidiData, sendMidiNoteOn, sendMidiNoteOff,
		 sendMidiNoteWithDuration } from '../midifunctions.js'
import { convertTimeToSamples, nexToTimebase, getSampleRate } from '../wavetablefunctions.js'
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
							org.addTag(newTagOrThrowOOM('midiport', 'list midi ports builtin'));
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
		'Lists every midi port, in both directions. Each port is tagged |midiport, and its |type says whether it is an input or an output.'
	);



	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -

	/*
	Shared by both send builtins: a port org came from list-midi-ports, so it
	carries the id the browser knows it by, and says which direction it is.
	*/
	function portIdOrError(port, who) {
		if (!port.hasTag(newTagOrThrowOOM('midiport', who + ', is midi port'))) {
			return { error: constructFatalError(who + ': that is not a midi port. Use list-midi-ports.') };
		}
		let type = port.getChildTagged(newTagOrThrowOOM('type', who + ', type'));
		if (type && type.getFullTypedValue() != 'output') {
			return { error: constructFatalError(who + ': that is an input port. Midi is sent to outputs.') };
		}
		let id = port.getChildTagged(newTagOrThrowOOM('id', who + ', id'));
		if (!id) {
			return { error: constructFatalError(who + ': that midi port has no id.') };
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
			if (!port.hasTag(newTagOrThrowOOM('midiport', 'open midi port, is midi port')) || !id) {
				return constructFatalError('open-midi-port: must pass in a midiport object with a valid ID');
			}
			let idstr = id.getFullTypedValue();

			let dv = constructDeferredValue();
			dv.set(new GenericActivationFunctionGenerator(
				'open-midi-port',
				function(callback, exp) {
					openMidiPort(idstr, function(desc) {
						if (!desc) {
							callback(constructFatalError(
									`open-midi-port: there is no port with id ${idstr} any more. `
									+ `It may have been unplugged -- call list-midi-ports to see `
									+ `what is there now.`));
							return;
						}
						let org = convertJSMapToOrg(desc);
						org.setHorizontal();
						org.addTag(newTagOrThrowOOM('midiport', 'open midi port builtin'));
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
					return constructFatalError(
							`send-midi-data: ${b} is not a byte. Midi data is whole numbers from 0 to 255.`);
				}
				bytes.push(b);
			}
			if (bytes.length == 0) {
				return constructFatalError('send-midi-data: nothing to send.');
			}
			sendMidiData(port.id, bytes);
			return data;
		},
		'Sends |data, an org of integers, to the midi port |port exactly as given. For anything the note builtin does not cover -- control changes, program changes, clock, sysex.'
	);

	/*
	The tag on the integer says what kind of message this is, the same way a tag
	on a number says what timebase it is in. `note` is a note with a duration,
	which sends the note on now and schedules the note off; `note-on` and
	`note-off` are the halves on their own, for an instrument where something
	else decides when the note ends.

	Deliberately no converting between a note off and a note on at velocity
	zero. Devices differ, and note off velocity means release velocity on some
	of them, so the two are not interchangeable. Writing `note-on` with a
	velocity of 0 gives the second form if that is what a device wants.
	*/
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
						'send-midi-note: needs an integer tagged note, note-on or note-off.');
			}
			if (notenum < 0 || notenum > 127) {
				return constructFatalError(
						`send-midi-note: ${notenum} is not a midi note. Notes run from 0 to 127.`);
			}

			let velocity = taggedInt(n, 'velocity', 'send-midi-note');
			if (velocity == null) velocity = 127;
			if (velocity < 0 || velocity > 127) {
				return constructFatalError(
						`send-midi-note: velocity ${velocity} is out of range. Velocity runs from 0 to 127.`);
			}

			// 1-16, the way hardware shows them
			let channel = taggedInt(n, 'channel', 'send-midi-note');
			if (channel == null) channel = 1;
			if (channel < 1 || channel > 16) {
				return constructFatalError(
						`send-midi-note: there is no channel ${channel}. Midi channels run from 1 to 16.`);
			}

			if (kind == 'note-on') {
				sendMidiNoteOn(port.id, channel, notenum, velocity);
			} else if (kind == 'note-off') {
				sendMidiNoteOff(port.id, channel, notenum, velocity);
			} else {
				let dur = n.getChildTagged(newTagOrThrowOOM('duration', 'send-midi-note, duration'));
				if (!dur) {
					return constructFatalError(
							'send-midi-note: a note tagged `note` needs a duration. Tag one with note-on '
							+ 'and send a note-off yourself if you do not know how long it lasts.');
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
			let ismidiport = midiport.hasTag(newTagOrThrowOOM('midiport', 'wait for midi builtin, is midi port'))
			let id = midiport.getChildTagged(newTagOrThrowOOM('id', 'wait for midi builtin, id'));
			if (!ismidiport || !id) {
				return constructFatalError('wait-for-midi: must pass in a midiport object with a valid ID');
			}
			// now that both directions are listed, an output can be passed here
			// by mistake, and listening to one just never fires
			let type = midiport.getChildTagged(newTagOrThrowOOM('type', 'wait for midi builtin, type'));
			if (type && type.getFullTypedValue() != 'input') {
				return constructFatalError(
						'wait-for-midi: that is an output port. Only input ports receive midi.');
			}
			if (!isPortOpen(id.getTypedValue())) {
				return constructFatalError(
						'wait-for-midi: that midi port is not open. Pass it to open-midi-port first.');
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
