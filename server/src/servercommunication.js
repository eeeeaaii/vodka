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
import { hasLiveIndex } from './deployment.js';
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

/*
Reading a file that ships with the app is a plain GET, so it works the same
whether the vodka server is answering or a static host is. Only writes still
need the api, and only the vodka server allows those.
*/
function fetchShippedFile(name) {
	return fetch('packages/' + encodeURIComponent(name)).then(function (r) {
		if (!r.ok) throw new Error('not found');
		return r.text();
	});
}

/*
A live server reads its own directory, so a file added while you work shows up
without a rebuild. A static host was given the list at build time.
*/
function fetchIndex(which) {
	return fetch(which + '/index.json').then(function (r) {
		if (!r.ok) throw new Error('no index');
		return r.json();
	});
}

function namesToOrgPayload(names) {
	let quoted = names.map(function (n) { return '"' + n + '"'; }).join(' ');
	return 'v2:(| ' + quoted + ' |)';
}

function listFromIndex(which, callback) {
	fetchIndex(which).then(function (names) {
		parseReturnPayload(namesToOrgPayload(names), callback);
	}).catch(function () {
		callback(serverError());
	});
}

function listFiles(callback) {
	if (!hasLiveIndex()) {
		listFromIndex('packages', callback);
		return;
	}
	let payload = `listfiles`;

	sendToServer(payload, function(data) {
		parseReturnPayload(data, callback);
	}, function() {
		callback(serverError());
	});
}

/*
A static host cannot list a directory, so the audio index was written at build
time. It is not a flat list of names like the package index: it maps each bank
(or category) to the wav files in it, which is the shape the list builtins
want, and the same shape the server produces when it reads the directory.
*/
function audioIndexToOrgPayload(index, library) {
	let s = 'v2:(|';
	for (let bank in index) {
		s += ' (|<`' + bank + '`>';
		let files = index[bank];
		for (let i = 0; i < files.length; i++) {
			// the library goes in front, the same as the server writes it, so
			// a name from a listing says where it lives wherever it came from
			s += ' $"' + library + '/' + bank + '/' + files[i] + '"';
		}
		s += '|)';
	}
	s += '|)';
	return s;
}

function listAudioFromIndex(which, library, callback) {
	fetchIndex(which).then(function (index) {
		parseReturnPayload(audioIndexToOrgPayload(index, library), callback);
	}).catch(function () {
		callback(serverError());
	});
}

/*
Which library, not which directory -- the server maps the name to a path so a
client can't ask for one that isn't a library. The static index lives under a
directory name, though, so that mapping is here too.
*/
const LIBRARY_DIRS = {
	sample: 'sounds',
	wave: 'waves',
};

function listAudio(library, callback) {
	if (!LIBRARY_DIRS[library]) {
		callback(constructFatalError(`no audio library called ${library}`));
		return;
	}
	if (!hasLiveIndex()) {
		listAudioFromIndex(LIBRARY_DIRS[library], library, callback);
		return;
	}
	let payload = `listaudio\t${library}`;

	sendToServer(payload, function(data) {
		parseReturnPayload(data, callback);
	}, function() {
		callback(serverError());
	});
}


function listStandardFunctionFiles(callback) {
	if (!hasLiveIndex()) {
		listFromIndex('packages', callback);
		return;
	}
	let payload = `liststandardfunctionfiles`;

	sendToServer(payload, function(data) {
		parseReturnPayload(data, callback);
	}, function() {
		callback(serverError());
	});
}


function loadNex(name, callback) {
	if (!hasLiveIndex()) {
		fetchShippedFile(name).then(function (text) {
			document.title = name;
			systemState.setDefaultFileName(name);
			parseReturnPayload(text, callback);
		}).catch(function () {
			callback(serverError());
		});
		return;
	}
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
		parseReturnPayload(data, function(r) {
			/*
			The window says which file you are working on, and saving one under
			a name makes it that file just as much as loading it does -- until
			now only loading said so, which left the title naming whatever you
			opened however long ago and whatever you have saved since.

			Only when it worked. A save that failed has not made this that file,
			and renaming the window would be a quiet lie about where the work
			went.
			*/
			if (!Utils.isFatalError(r)) {
				document.title = name;
				systemState.setDefaultFileName(name);
			}
			callback(r);
		});
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
			callback(evaluateImportedFile(nex));
		})
	}, function() {
		callback(serverError());
	});
}

function loadAndRun(name, callback) {
	if (!hasLiveIndex()) {
		fetchShippedFile(name).then(function (text) {
			parseReturnPayload(text, function (parsed) {
				callback(evaluateNexSafely(parsed, BINDINGS));
			});
		}).catch(function () {
			callback(serverError());
		});
		return;
	}
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
	systemState.setAudioSampleResolver(function(id) {
		return container.samples[id];
	});
	try {
		return parse(container.docText);
	} finally {
		systemState.setAudioSampleResolver(null);
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

/*
import evaluates whatever the file holds.

It used to insist the file be a command named package or template and refuse
everything else, which ruled out importing a file that is a list of binds, or a
single expression you want run. Nothing downstream needed the guarantee -- the
package builtin is what makes a package, and it makes one whether import or
anything else is what evaluated it.
*/
function evaluateImportedFile(nex) {
	return evaluateNexSafely(nex, BINDINGS);
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