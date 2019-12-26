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

var recording = false;
var firstKeyUp = true; // ignore first key up of recorded session because it's the esc key
var recorded_session = `
var harness = require('../testharness');

var testactions = [];

`

var session_end = `
harness.runTest(testactions, 'direct');
`
var shorthand = '';

function captureRecording() {
	let session_output = `
	// ${shorthand}
	` + recorded_session + session_end;
	navigator.clipboard.writeText(session_output);
}

var key_funnel_active = true;

function deactivateKeyFunnel() {
	key_funnel_active = false;
}

function activateKeyFunnel() {
	key_funnel_active = true;
}

const EXPECTING_FIRST_DOWN  = 0;
const EXPECTING_FIRST_UP    = 1;
const EXPECTING_SECOND_DOWN = 2;
const EXPECTING_SECOND_UP   = 3;
const EXPECTING_THIRD_DOWN  = 4;
const EXPECTING_THIRD_UP    = 5;
const WILL_NOT_RECORD       = 6;
const RECORDING             = 7;
const RECORDING_DONE_EXPECTING_UP    = 8;
const RECORDING_DONE    = 9;

var state = EXPECTING_FIRST_DOWN;

function checkRecordState(event, type) {
	let kc = event.code;
	switch(state) {
		case EXPECTING_FIRST_DOWN:
			if (kc == 'Escape' && type == 'down') {
				state = EXPECTING_FIRST_UP;
			} else {
				state = WILL_NOT_RECORD;
			}
			break;
		case EXPECTING_FIRST_UP:
			if (kc == 'Escape' && type == 'up') {
				state = EXPECTING_SECOND_DOWN;
			} else {
				state = WILL_NOT_RECORD;
			}
			break;
		case EXPECTING_SECOND_DOWN:
			if (kc == 'Escape' && type == 'down') {
				state = EXPECTING_SECOND_UP;
			} else {
				state = WILL_NOT_RECORD;
			}
			break;
		case EXPECTING_SECOND_UP:
			if (kc == 'Escape' && type == 'up') {
				state = EXPECTING_THIRD_DOWN;
			} else {
				state = WILL_NOT_RECORD;
			}
			break;
		case EXPECTING_THIRD_DOWN:
			if (kc == 'Escape' && type == 'down') {
				state = EXPECTING_THIRD_UP;
			} else {
				state = WILL_NOT_RECORD;
			}
			break;
		case EXPECTING_THIRD_UP:
			if (kc == 'Escape' && type == 'up') {
				state = RECORDING;
			} else {
				state = WILL_NOT_RECORD;
			}
			break;
		case WILL_NOT_RECORD:
			break;
		case RECORDING:
			if (kc == 'Escape' && type == 'down') {
				state = RECORDING_DONE_EXPECTING_UP;
				break;
			}
			switch(type) {
			case 'up':
				logKeyUpEvent(event);
				break;
			case 'down':
				logKeyDownEvent(event);
				break;
			case 'mouse':
				logMouseEvent(event);
				break;
			}
			break;
		case RECORDING_DONE_EXPECTING_UP:
			if (kc == 'Escape' && type == 'up') {
				state = RECORDING_DONE;
				captureRecording();
			} else {
				state = WILL_NOT_RECORD;
			}
			break;
		case RECORDING_DONE:
			break;
	}
}


function logMouseEvent(e) {
	recorded_session += `testactions.push({
		type:'click',
		x:'${e.x}',
		y:'${e.y}'
	});
`;	
}
function logKeyDownEvent(e) {
	shorthand += '|' + e.key;
	recorded_session += `testactions.push({
		type:'keydown',
		code:'${e.code}'
	});
`;	
}
function logKeyUpEvent(e) {
	recorded_session += `testactions.push({
		type:'keyup',
		code:'${e.code}'
	});
`;	
}