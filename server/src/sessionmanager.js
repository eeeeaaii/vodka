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

/*
Sessions, as the browser knows them. A hosted vodka keeps nothing, so this is
the only place a session exists: its document in localStorage under
vodka.autosave.<id>, its samples in indexeddb under <id>/<hash>.

A session file carries one session. Importing one writes it under the id inside
the file, so the same session opened on two machines is the same session rather
than a copy of it -- and if saving to a server ever comes back, that id is what
both machines would be pointing at.
*/

import { systemState } from './systemstate.js'
import * as audioStore from './audiostore.js'

const AUTOSAVE_PREFIX = 'vodka.autosave.';
const NAMES_KEY = 'vodka.sessionnames';
const SESSION_PREFIX = 'vs-';
const FILE_VERSION = 1;
const FILE_EXTENSION = '.vks';

function readStorage(key) {
	try {
		return window.localStorage.getItem(key);
	} catch (e) {
		return null;
	}
}

function writeStorage(key, value) {
	try {
		window.localStorage.setItem(key, value);
		return true;
	} catch (e) {
		return false;
	}
}

// Names live apart from the documents so that naming a session cannot damage
// what is in it, and so a session can be named before it holds anything.
function readNames() {
	let raw = readStorage(NAMES_KEY);
	if (!raw) return {};
	try {
		let parsed = JSON.parse(raw);
		return (parsed && parsed.names) ? parsed.names : {};
	} catch (e) {
		return {};
	}
}

function writeNames(names) {
	writeStorage(NAMES_KEY, JSON.stringify({ version: FILE_VERSION, names: names }));
}

function nameOf(sessionId) {
	let names = readNames();
	return names[sessionId] ? names[sessionId] : sessionId;
}

function setName(sessionId, name) {
	let names = readNames();
	if (name && name != sessionId) {
		names[sessionId] = name;
	} else {
		delete names[sessionId];
	}
	writeNames(names);
}

function newSessionId() {
	let uuid = (window.crypto && window.crypto.randomUUID)
			? window.crypto.randomUUID()
			: ('' + Date.now() + '-' + Math.random().toString(16).substring(2));
	return SESSION_PREFIX + uuid;
}

/*
Every session this browser knows about: the ones with a document saved, plus
any that have been named but not yet written to. A session made a moment ago
and not yet typed into still has to appear in the list.
*/
function listSessions() {
    let ids = {};
    try {
        for (let i = 0; i < window.localStorage.length; i++) {
            let key = window.localStorage.key(i);
            if (key && key.indexOf(AUTOSAVE_PREFIX) == 0) {
                ids[key.substring(AUTOSAVE_PREFIX.length)] = true;
            }
        }
    } catch (e) {
        // storage unreadable; the current session is still worth listing
    }
    let names = readNames();
    for (let id in names) ids[id] = true;
    let current = systemState.getSessionId();
    if (current) ids[current] = true;

    let r = [];
    for (let id in ids) {
        r.push({ id: id, name: nameOf(id), isCurrent: id == current });
    }
    r.sort(function(a, b) { return a.name.localeCompare(b.name); });
    return r;
}

function documentOf(sessionId) {
	let raw = readStorage(AUTOSAVE_PREFIX + sessionId);
	if (!raw) return null;
	try {
		return JSON.parse(raw);
	} catch (e) {
		return null;
	}
}

function toBase64(buffer) {
	let bytes = new Uint8Array(buffer);
	let out = '';
	// in chunks, because a whole sample buffer as one apply() argument list
	// overflows the stack
	for (let i = 0; i < bytes.length; i += 8192) {
		out += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
	}
	return window.btoa(out);
}

function fromBase64(text) {
	let binary = window.atob(text);
	let bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes.buffer;
}

/*
Everything needed to put this session back somewhere else. Editor state is left
out on purpose: bpm and the default timebase are only reachable through set-bpm
and set-default-timebase, so they are in the document already and come back when
it is evaluated.
*/
function exportCurrentSession() {
	let sessionId = systemState.getSessionId();
	let doc = documentOf(sessionId);
	let samples = audioStore.entries().map(function (e) {
		return { hash: e.hash, samples: toBase64(e.buffer) };
	});
	return {
		version: FILE_VERSION,
		kind: 'vodka-session',
		// the name is here as well as on the file, because file names get
		// renamed and copied and this is the one that counts
		sessionId: sessionId,
		name: nameOf(sessionId),
		exported: new Date().toISOString(),
		document: doc,
		samples: samples,
	};
}

function fileNameForCurrentSession() {
	return systemState.getSessionId() + FILE_EXTENSION;
}

function parseSessionFile(text) {
	let parsed;
	try {
		parsed = JSON.parse(text);
	} catch (e) {
		return { error: 'that is not a vodka session file.' };
	}
	if (!parsed || parsed.kind != 'vodka-session') {
		return { error: 'that is not a vodka session file.' };
	}
	if (parsed.version > FILE_VERSION) {
		return { error: 'that session was written by a newer vodka than this one.' };
	}
	if (!parsed.sessionId) {
		return { error: 'that session file has no session id in it.' };
	}
	return { session: parsed };
}

/*
Writes the session under the id the file carries, replacing whatever was there
under that id and leaving every other session alone. Re-importing your own
export therefore refreshes that session rather than making a second copy of it.
*/
function importSession(parsed) {
	let sessionId = parsed.sessionId;
	if (parsed.document) {
		writeStorage(AUTOSAVE_PREFIX + sessionId, JSON.stringify(parsed.document));
	}
	if (parsed.name) {
		setName(sessionId, parsed.name);
	}
	let writes = [];
	let samples = parsed.samples ? parsed.samples : [];
	for (let i = 0; i < samples.length; i++) {
		writes.push(audioStore.putForSession(
				sessionId, samples[i].hash, fromBase64(samples[i].samples)));
	}
	return Promise.all(writes).then(function () { return sessionId; });
}

// A duplicate is a new session holding the same things, so it gets a new id --
// unlike an import, which is the same session arriving somewhere else.
function duplicateCurrentSession(name) {
	let sessionId = newSessionId();
	let doc = documentOf(systemState.getSessionId());
	if (doc) {
		doc = JSON.parse(JSON.stringify(doc));
		doc.sessionId = sessionId;
		writeStorage(AUTOSAVE_PREFIX + sessionId, JSON.stringify(doc));
	}
	setName(sessionId, name);
	let writes = audioStore.entries().map(function (e) {
		return audioStore.putForSession(sessionId, e.hash, e.buffer);
	});
	return Promise.all(writes).then(function () { return sessionId; });
}

/*
showSaveFilePicker lets the browser put the file where the user says and is
chrome and edge only, so the anchor is not a legacy path -- it is what firefox
and safari get.
*/
function saveTextToFile(text, suggestedName) {
	let blob = new Blob([text], { type: 'application/json;charset=utf-8' });
	if (window.showSaveFilePicker) {
		return window.showSaveFilePicker({
			suggestedName: suggestedName,
			types: [{
				description: 'Vodka session',
				accept: { 'application/json': [FILE_EXTENSION] },
			}],
		}).then(function (handle) {
			return handle.createWritable();
		}).then(function (writable) {
			return writable.write(blob).then(function () { return writable.close(); });
		}).then(function () {
			return true;
		}).catch(function () {
			// the picker was dismissed, which is not a failure worth reporting
			return false;
		});
	}
	let url = URL.createObjectURL(blob);
	let a = document.createElement('a');
	a.href = url;
	a.download = suggestedName;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	// revoked on a later turn of the loop, or the download never starts
	window.setTimeout(function () { URL.revokeObjectURL(url); }, 0);
	return Promise.resolve(true);
}

function readTextFromFile() {
	return new Promise(function (resolve) {
		let input = document.createElement('input');
		input.type = 'file';
		input.accept = FILE_EXTENSION + ',application/json';
		input.onchange = function () {
			let file = input.files && input.files[0];
			if (!file) {
				resolve(null);
				return;
			}
			let reader = new FileReader();
			reader.onload = function () { resolve(String(reader.result)); };
			reader.onerror = function () { resolve(null); };
			// utf-8, which matters because a command name can hold anything
			reader.readAsText(file, 'utf-8');
		};
		input.click();
	});
}

export {
	AUTOSAVE_PREFIX,
	FILE_EXTENSION,
	FILE_VERSION,
	listSessions,
	nameOf,
	setName,
	newSessionId,
	documentOf,
	readStorage,
	writeStorage,
	exportCurrentSession,
	fileNameForCurrentSession,
	parseSessionFile,
	importSession,
	duplicateCurrentSession,
	saveTextToFile,
	readTextFromFile,
}
