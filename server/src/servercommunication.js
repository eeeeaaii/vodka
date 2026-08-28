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

import * as Utils from './utils.js';

import { BINDINGS } from './environment.js'
import { constructFatalError } from './nex/eerror.js'
import { evaluateNexSafely } from './evaluator.js'
import { parse } from './nexparser2.js';
import { AudioCollector, encode as encodeContainer, decode as decodeContainer } from './audiocontainer.js';
import { setAudioReader } from './nex/wavetable.js'
import { SerializationContext, SERIALIZE_FILE } from './serializationcontext.js'
import { systemState } from './systemstate.js'

// polled by the test harness, which can't drive a request, only wait for it
let outstandingRequests = 0;

function getOutstandingRequestCount() {
	return outstandingRequests;
}

function sendToServer(payload, cb, errcb) {
	let xhr = new XMLHttpRequest();
	outstandingRequests++;
	// onload and onerror can both land; only the first one counts
	let settled = false;
	let settle = function() {
		if (settled) return false;
		settled = true;
		outstandingRequests--;
		return true;
	};
	xhr.onreadystatechange = function() {};
	// session goes on the request, not in a cookie -- cookies are shared
	// between tabs, so two tabs in two sessions would write to whichever one
	// loaded last
	let sessionId = systemState.getSessionId();
	xhr.open('POST', 'api?sessionId=' + encodeURIComponent(sessionId ? sessionId : ''))
	xhr.send(payload);
	xhr.onload = function() {
		if (!settle()) return;
		if (xhr.readyState === xhr.DONE && xhr.status === 200) {
			cb(xhr.response);
		} else {
			errcb();
		}
	};
	xhr.onerror = function() {
		if (!settle()) return;
		errcb();
	}
}

function listFiles(callback) {
	let payload = `listfiles`;

	sendToServer(payload, function(data) {
		parseReturnPayload(data, callback);
	}, function() {
		callback(serverError());
	});
}

function listAudio(callback) {
	let payload = `listaudio`;

	sendToServer(payload, function(data) {
		parseReturnPayload(data, callback);
	}, function() {
		callback(serverError());
	});
}


function listStandardFunctionFiles(callback) {
	let payload = `liststandardfunctionfiles`;

	sendToServer(payload, function(data) {
		parseReturnPayload(data, callback);
	}, function() {
		callback(serverError());
	});
}


function loadNex(name, callback) {
	let payload = `load\t${name}`;

	sendToServer(payload, function(data) {
		document.title = name;
		systemState.setDefaultFileName(name);
		parseReturnPayload(data, callback);
	}, function() {
		callback(serverError());
	});
}

function loadRaw(name, callback) {
	let payload = `loadraw\t${name}`;

	sendToServer(payload, function(data) {
		callback(data);
	}, function() {
		callback(serverError());
	});
}

function saveNex(name, nex, callback) {
	// The collector rides along with the walk: wavetables hand their samples to
	// it as they're reached, and it's the walk finishing that tells us which
	// samples the document actually refers to.
	let collector = new AudioCollector();
	let docText = 'v2:' + nex.toString('v2', new SerializationContext(SERIALIZE_FILE, collector));
	let payload = `save\t${name}\t${encodeContainer(docText, collector)}`;

	sendToServer(payload, function(data) {
		parseReturnPayload(data, callback);
	}, function() {
		callback(serverError());
	});
}

function saveRaw(name, data, callback) {
	let payload = `saveraw\t${name}\t${data}`;

	sendToServer(payload, function(data) {
		parseReturnPayload(data, callback);
	}, function() {
		callback(serverError());
	});
}

function importNex(name, callback) {
	let payload = `load\t${name}`;

	sendToServer(payload, function(data) {
		parseReturnPayload(data, function(nex) {
			callback(evaluatePackage(nex));
		})
	}, function() {
		callback(serverError());
	});
}

function loadAndRun(name, callback) {
	let payload = `load\t${name}`;

	sendToServer(payload, function(data) {
		parseReturnPayload(data, function(parsed) {
			let result = evaluateNexSafely(parsed, BINDINGS);
			callback(result);
		});
	}, function() {
		callback(serverError());
	});
}

function serverError() {
	let r = constructFatalError("Server error.");
	return r;
}


/*
Everything that comes back from the server lands here: files, but also the small
v2: replies to save and listfiles. Only a file can be a container, and decode()
returns null for anything that isn't one, so the replies are untouched.
*/
function parseFileContents(data) {
	let container = decodeContainer(data);
	if (!container) {
		return parse(data);
	}
	setAudioReader(function(i) {
		return container.samples[i];
	});
	try {
		return parse(container.docText);
	} finally {
		setAudioReader(null);
	}
}

function parseReturnPayload(data, callback) {
	let result = null;
	try {
		result = parseFileContents(data);
	} catch (e) {
		result = describeParseFailure(e);
	}
	// Always call back, even on failure. This used to be able to throw on its
	// way out of the catch block (see below), and because the callback never
	// ran, anything waiting on a deferred value -- like the import builtin --
	// would just spin forever with no indication of what went wrong.
	callback(result);
}

// Turns whatever came out of parse() into a nex we can hand back.
//
// Not every failure is a PEG syntax error. Bugs inside the parser's own
// support code throw ordinary TypeErrors, which have no .location, and the
// old version of this assumed the PEG shape unconditionally -- so a real bug
// got replaced by "Cannot read properties of undefined (reading 'start')",
// hiding the thing you actually needed to see.
function describeParseFailure(e) {
	if (Utils.isError(e)) {
		// already a vodka error, pass it along rather than losing it
		return e;
	}
	if (e && e.location && e.location.start) {
		let expected = (e.expected && e.expected[0] && e.expected[0].type)
				? e.expected[0].type
				: '(unknown)';
		return constructFatalError(
`PEG PARSER ERROR
full error message follows:
${e.name}
${e.message}
line: ${e.location.start.line}
col: ${e.location.start.column}
found: "${e.found}"
expected: ${expected}
` + e);
	}
	return constructFatalError(
`PARSER ERROR (not a syntax error -- this is probably a bug in vodka)
${e && e.name}
${e && e.message}
${(e && e.stack) ? e.stack : ''}`);
}

function evaluatePackage(nex) {
	if (!(nex.getTypeName() == '-command-'
				&& (nex.getCommandName() == 'package'
				|| nex.getCommandName() == 'template'))) {
		let r = constructFatalError('Can only import packages or templates, see file contents')
		return r;
	}
	let result = evaluateNexSafely(nex, BINDINGS);
	return result;
}

// This util is meant to be used from functions like
// save-template and save-package.
// These aren't meant to be called from "code" because it doesn't
// give you access to success/failure, or the returned deferred value.
// It's more of an ide shortcut kind of thing.
function saveShortcut(namesym, val, callback) {
	let nametype = namesym.getTypeName();
	let nm = '';
	saveNex(nm, val, function(result) {
		if (Utils.isInfo(result)) {
			callback(null);
		} else {
			callback(result);
		}
	});
}

export {
	getOutstandingRequestCount,
	saveNex,
	importNex,
	loadNex,
	listFiles,
	listStandardFunctionFiles,
	loadRaw,
	saveRaw,
	loadAndRun,
	saveShortcut,
	listAudio
}