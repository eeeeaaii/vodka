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

//https://www.npmjs.com/package/osc-js

let isSetup = false;
var osc = null;  //erm does it have to be var why did I do this

let messages = [];

let bufIsPlaying = false;

function setup() {
	osc = new OSC();
	osc.on('error', e => {
		doError(e);
	});
	osc.on('open', e => {
		continueMessages();
	});
	osc.on('*', e => {
		if (e.address == '/done') {
			console.log('rcd msg, continuing');
			console.log(e);
			continueMessages();
		} else {
			console.log('osc error (see following object)')
			console.log(e);
		}
	})
	osc.open();
	isSetup = true;
}

function doError(e) {
	console.log(e);
}

function sendMessage(msg) {
	console.log('sending osc message');
	console.log(msg);
	osc.send(msg.oscmsg);
	if (msg.useTimeout) {
		window.setTimeout(function() {
			continueMessages();
		}, 1)
	}
}

function continueMessages() {
	if (messages.length > 0) {
		let msg = messages.shift();
		sendMessage(msg);
	}
}

function enqueueMessage(msg, useTimeout) {
	// some messages don't get a "done" message afterward
	// in those cases, I just need to send it, assume it was
	// received, and send the next one.
	messages.push({
		oscmsg: msg,
		useTimeout: !!useTimeout
	});

}

function doIt() {
	if (!isSetup) {
		setup();
	} else {
		continueMessages();
	}	
}

function stopPlayingBuffer() {
	console.log('stop playing buffer');
	enqueueMessage(new OSC.Message('/n_free', 678));
	doIt();
	bufIsPlaying = false;
}

// it's a wavetable nex
function sendBufferAndPlay(wt) {
	console.log('send buffer and play');
	// if (bufIsPlaying) {
	// 	enqueueMessage(new OSC.Message('/n_free', -1));
	// }

	let data = wt.data;
	let size = data.length;
	let rate = size / wt.getDuration();

	enqueueMessage(new OSC.Message('/b_free', 0));
	enqueueMessage(new OSC.Message('/b_alloc', 0, size, 1));
	let d = ['/b_setn', 0, 0, size];
	for (let i = 0 ; i < size; i++) {
		d.push(data[i]);
	}
	enqueueMessage(new OSC.Message(...d), true /*useTimeout*/);
	enqueueMessage(new OSC.Message('/s_new', 'bufplayer', 678, 0, 0, 'rate', rate));
	bufIsPlaying = false;
	doIt();
}

export { sendBufferAndPlay, stopPlayingBuffer }