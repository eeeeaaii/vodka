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

/*
Every port, both directions, in one list. Web midi has no notion of a device --
a MIDIPort says nothing about which box it belongs to, and a bidirectional
device appears as two separate ports, one in each map. Grouping them would mean
matching on manufacturer and name, which is a guess, so the names are handed
over as they are and anything that wants to group can do it where the strings
are visible.
*/
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


export { getMidiPorts, addMidiListener }