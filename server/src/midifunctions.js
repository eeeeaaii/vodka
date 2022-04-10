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
import { Org } from './nex/org.js'
import { Integer } from './nex/integer.js'


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
	let r = new Org();
	let rnn = new Integer(nn);
	let rvel = new Integer(vel);
	rnn.addTag(new Tag('note'));
	rvel.addTag(new Tag('vel'));
	r.addTag(new Tag(type))
	r.appendChild(rnn);
	r.appendChild(rvel);
	return r;
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
	return new Org();

}

function respondToMidiMessage(id, msg) {
	console.log('sending message to midi listeners');
	console.log(msg);
	for (let i = 0; i < inputListeners[id].length; i++) {
		inputListeners[id][i](parseMidiMessage(msg));
	}
}

function getMidiDevices(incb) {
	let cb = function() {
		let r = [];
		for (let entry of midi.inputs) {
			var input = entry[1];
			let m = {};
			addToMap(m, input, 'id');
			addToMap(m, input, 'manufacturer');
			addToMap(m, input, 'name');
			addToMap(m, input, 'type');
			addToMap(m, input, 'version');
			addToMap(m, input, 'state');
			addToMap(m, input, 'connection');

			r.push(m);
		}
		incb(r);
	}
	maybeSetupMidi(cb);
}


export { getMidiDevices, addMidiListener }