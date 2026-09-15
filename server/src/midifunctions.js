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

import { Tag } from './tag.js'
import { constructOrg, convertJSMapToOrg } from './nex/org.js'
import { constructFatalError } from './nex/eerror.js'


var midi = null;
var setupcb = null;

const inputListeners = {};
const inputsBeingListenedTo = {};

// need to start using async function around here!


function playWavetableOnMidiInput(wt, midiInput) {
	
}

function onMIDISuccess(midiAccess) {
	console.log('MIDI ready');
	console.log(midiAccess);
	midi = midiAccess;
	if (setupcb) {
		setupcb();
	}
}

function onMIDIFailure(msg) {
	console.log("failed to do midi " + msg);
	midi = "i failed";
}

function maybeSetupMidi(cb) {
	if (!midi) {
		setupcb = cb;
		navigator.requestMIDIAccess().then( onMIDISuccess, onMIDIFailure );
	} else {
		cb();
	}
}

function addToMap(m, from, name) {
	m[name] = from[name];
}

function addMidiListener(id, f) {
	if (inputListeners[id]) {
		inputListeners[id].push(f);
	} else {
		setupFirstInputListener(id, f);
	}
}

function setupFirstInputListener(id, f) {
	inputListeners[id] = [ f ];
	if (!midi) return;
	for (let entry of midi.inputs) {
		let input = entry[1];
		if (id == input.id) {
			inputsBeingListenedTo[id] = input;
			input.onmidimessage = (msg) => {
				respondToMidiMessage(id, msg);
			}
		}
	}
}

function doNote(msg, type) {
	let channel = msg.data[0] & 0x0F;
	let nn = msg.data[1] & 0x7F;
	let vel = msg.data[2] & 0x7F;
	return convertJSMapToOrg({
		'note': nn,
		'vel': vel,
		'type': type
	})
}

function parseMidiMessage(msg) {
	let status = msg.data[0];
	// channel voice messages
	status = status & 0xF0;
	switch(status) {
		case 0x80:
			return doNote(msg, 'note off');
		case 0x90:
			return doNote(msg, 'note on');
	}
	return constructOrg();

}

function respondToMidiMessage(id, msg) {
	console.log('sending message to midi listeners');
	console.log(msg);
	for (let i = 0; i < inputListeners[id].length; i++) {
		inputListeners[id][i](parseMidiMessage(msg));
	}
}

function describePort(port) {
	let m = {};
	addToMap(m, port, 'id');
	addToMap(m, port, 'manufacturer');
	// already 'input' or 'output' -- MIDIPort.type in the spec
	addToMap(m, port, 'type');
	addToMap(m, port, 'name');
	addToMap(m, port, 'version');
	addToMap(m, port, 'state');
	addToMap(m, port, 'connection');
	return m;
}

// Both directions in one list. Web midi has no notion of a device -- a
// bidirectional box appears as two ports with nothing tying them together --
// so grouping is left to whoever can see the names.
// Beat durations are shortened by this so a note off lands before the next note
// on. Inaudible. Other timebases are left alone -- that length was asked for.
const MIDI_NOTE_GAP_MS = 5;

// Opening is required always, not just after a refresh -- otherwise the same
// code works or doesn't depending on how the session started.
const openedPorts = {};

// (port, channel, note) currently sounding, so they can be turned off again
const soundingNotes = {};

function noteKey(portId, channel, note) {
	return portId + ':' + channel + ':' + note;
}

function isPortOpen(portId) {
	return !!openedPorts[portId];
}

function midiOutputOrThrow(portId) {
	if (!midi || !openedPorts[portId]) {
		throw constructFatalError('you must open the midi port first. Sorry!');
	}
	let out = midi.outputs.get(portId);
	if (!out) {
		throw constructFatalError(`no midi output with id ${portId}. Sorry!`);
	}
	return out;
}

// channels are 1-16 here, as they are on every piece of hardware, and 0-15 on
// the wire
function statusByte(kind, channel) {
	return kind | ((channel - 1) & 0x0F);
}

function sendMidiData(portId, bytes) {
	midiOutputOrThrow(portId).send(bytes);
}

function sendMidiNoteOn(portId, channel, note, velocity) {
	midiOutputOrThrow(portId).send([statusByte(0x90, channel), note, velocity]);
	soundingNotes[noteKey(portId, channel, note)] = {
		portId: portId, channel: channel, note: note
	};
}

function sendMidiNoteOff(portId, channel, note, velocity) {
	midiOutputOrThrow(portId).send([statusByte(0x80, channel), note, velocity]);
	delete soundingNotes[noteKey(portId, channel, note)];
}

// The off is scheduled by the browser, not by a timer of ours -- the event
// queue is setTimeout-driven and too jittery to hold a sequence together. The
// timer here only forgets the note; the message is already on its way.
function sendMidiNoteWithDuration(portId, channel, note, velocity, durationMs, isBeats) {
	let ms = durationMs;
	if (isBeats) {
		ms = ms - MIDI_NOTE_GAP_MS;
	}
	// never schedule the off before the on
	if (ms < 1) ms = 1;

	let out = midiOutputOrThrow(portId);
	out.send([statusByte(0x90, channel), note, velocity]);
	out.send([statusByte(0x80, channel), note, 0], performance.now() + ms);

	let key = noteKey(portId, channel, note);
	soundingNotes[key] = { portId: portId, channel: channel, note: note };
	window.setTimeout(function() {
		delete soundingNotes[key];
	}, ms);
}

function anyMidiNotesSounding() {
	for (let k in soundingNotes) {
		return true;
	}
	return false;
}

// All-notes-off per channel as well, for anything sent as raw data that we
// never tracked.
function midiPanic() {
	if (!midi) return;
	let channelsTouched = {};
	for (let k in soundingNotes) {
		let n = soundingNotes[k];
		channelsTouched[n.portId + ':' + n.channel] = n;
		let out = midi.outputs.get(n.portId);
		if (out) {
			out.send([statusByte(0x80, n.channel), n.note, 0]);
		}
		delete soundingNotes[k];
	}
	for (let k in channelsTouched) {
		let n = channelsTouched[k];
		let out = midi.outputs.get(n.portId);
		// cc 123, all notes off
		if (out) {
			out.send([statusByte(0xB0, n.channel), 123, 0]);
		}
	}
}

// A port org is saved with the document, so after a refresh it comes back as
// just a name and an id. This asks for access again and opens that one port.
function openMidiPort(portId, incb) {
	let cb = function() {
		let port = midi.outputs.get(portId);
		if (!port) {
			port = midi.inputs.get(portId);
		}
		if (!port) {
			incb(null);
			return;
		}
		port.open();
		openedPorts[portId] = true;
		incb(describePort(port));
	}
	maybeSetupMidi(cb);
}

function getMidiPorts(incb) {
	let cb = function() {
		let r = [];
		for (let entry of midi.inputs) {
			r.push(describePort(entry[1]));
		}
		for (let entry of midi.outputs) {
			r.push(describePort(entry[1]));
		}
		incb(r);
	}
	maybeSetupMidi(cb);
}


export { getMidiPorts, openMidiPort, isPortOpen, addMidiListener, sendMidiData, sendMidiNoteOn, sendMidiNoteOff,
		 sendMidiNoteWithDuration, anyMidiNotesSounding, midiPanic }