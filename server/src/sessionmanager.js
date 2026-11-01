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

(comment by Claude)
*/

import { systemState, PAGE_SEPARATOR } from './systemstate.js'
import * as audioStore from './audiostore.js'
import { stopAutosave, flushAutosave } from './autosave.js'
import { canSave } from './deployment.js'

const AUTOSAVE_PREFIX = 'vodka.autosave.';
const NAMES_KEY = 'vodka.sessionnames';
// zoom and the like, kept per session alongside the document -- see editorstate.js
const EDITORSTATE_PREFIX = 'vodka.editorstate.';
const PER_SESSION_PREFIXES = [AUTOSAVE_PREFIX, EDITORSTATE_PREFIX];
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
// (comment by Claude)
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

(comment by Claude)
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
        // (comment by Claude)
    }
    let names = readNames();
    for (let id in names) ids[id] = true;
    let current = systemState.getStorageId();
    if (current) ids[current] = true;

    /*
    A key can name a page of a session rather than a session, and a page is not
    somewhere the server knows about -- so it is split back out here and handed
    over separately, or the link built from it would ask for a session id that
    does not exist.
    */
    let r = [];
    for (let id in ids) {
        let at = id.indexOf(PAGE_SEPARATOR);
        let sessionId = at == -1 ? id : id.substring(0, at);
        let page = at == -1 ? null : id.substring(at + PAGE_SEPARATOR.length);
        r.push({
            id: sessionId,
            page: page,
            name: nameOf(id) + (page ? ' (page ' + page + ')' : ''),
            isCurrent: id == current,
        });
    }
    r.sort(function(a, b) { return a.name.localeCompare(b.name); });
    return r;
}

/*
Everything this browser is keeping about this session: the document, the name it
was given, and the audio. There is no way to remove a session otherwise -- the
list on the welcome screen only ever grew -- and the audio is what makes that
matter, since a session's samples can run to hundreds of megabytes and go on
counting against the origin's storage quota long after the session stopped being
one you use.

Autosave is stopped first. It writes on a timer and again as the page unloads,
so a document deleted while it is still being saved comes straight back.
*/
function deleteSessionData(sessionId) {
	if (sessionId == systemState.getSessionId()) {
		stopAutosave();
	}
	let storageIds = storageIdsOf(sessionId);
	let names = readNames();
	for (let i = 0; i < storageIds.length; i++) {
		for (let j = 0; j < PER_SESSION_PREFIXES.length; j++) {
			try {
				window.localStorage.removeItem(PER_SESSION_PREFIXES[j] + storageIds[i]);
			} catch (e) {
				// storage unreadable; the audio is still worth removing
			}
		}
		delete names[storageIds[i]];
	}
	writeNames(names);
	return Promise.all(storageIds.map(function (id) {
		return audioStore.removeAllForSession(id);
	}));
}

/*
A session's browser storage is held under its id, and under its id plus a page
for each page anybody opened -- so everything done to a session as a whole
(delete, copy, rename) is done to each of these.

(comment by Claude)
*/
function storageIdsOf(sessionId) {
	let ids = [sessionId];
	try {
		for (let i = 0; i < window.localStorage.length; i++) {
			let key = window.localStorage.key(i);
			for (let j = 0; key && j < PER_SESSION_PREFIXES.length; j++) {
				let pagePrefix = PER_SESSION_PREFIXES[j] + sessionId + PAGE_SEPARATOR;
				let id = key.substring(PER_SESSION_PREFIXES[j].length);
				if (key.indexOf(pagePrefix) == 0 && ids.indexOf(id) == -1) {
					ids.push(id);
				}
			}
		}
	} catch (e) {
		// storage unreadable; the session itself is still the one to act on
	}
	return ids;
}

// the same storage id, under another session
function renamedStorageId(storageId, fromSessionId, toSessionId) {
	return toSessionId + storageId.substring(fromSessionId.length);
}

/*
Copies everything this browser holds for one session under another: each
page's document and the audio that goes with it. The document records whose it
is, so that is rewritten too, or the copy would think it was the original.

If it is the session on screen, whatever is waiting to be autosaved is written
first, or the copy would be of the document as it was a moment ago.

(comment by Claude)
*/
function copySessionData(fromSessionId, toSessionId, name) {
	if (fromSessionId == systemState.getSessionId()) {
		flushAutosave();
	}
	let storageIds = storageIdsOf(fromSessionId);
	let writes = [];
	for (let i = 0; i < storageIds.length; i++) {
		let toId = renamedStorageId(storageIds[i], fromSessionId, toSessionId);
		let doc = documentOf(storageIds[i]);
		if (doc) {
			doc.sessionId = toId;
			writeStorage(AUTOSAVE_PREFIX + toId, JSON.stringify(doc));
		}
		let editorState = readStorage(EDITORSTATE_PREFIX + storageIds[i]);
		if (editorState) {
			writeStorage(EDITORSTATE_PREFIX + toId, editorState);
		}
		writes.push(audioStore.copyAllForSession(storageIds[i], toId));
	}
	if (name) {
		setName(toSessionId, name);
	}
	return Promise.all(writes).then(function () { return toSessionId; });
}

function moveSessionData(fromSessionId, toSessionId, name) {
	return copySessionData(fromSessionId, toSessionId, name).then(function () {
		return deleteSessionData(fromSessionId);
	}).then(function () { return toSessionId; });
}

/*
How much of the browser's storage a session is using: its documents and editor
state, counted as the two bytes a character costs in localStorage, and its
audio, which is nearly always most of it.

(comment by Claude)
*/
function browserBytesOf(sessionId) {
	let storageIds = storageIdsOf(sessionId);
	let docBytes = 0;
	for (let i = 0; i < storageIds.length; i++) {
		for (let j = 0; j < PER_SESSION_PREFIXES.length; j++) {
			let raw = readStorage(PER_SESSION_PREFIXES[j] + storageIds[i]);
			if (raw) docBytes += raw.length * 2;
		}
	}
	return Promise.all(storageIds.map(function (id) {
		return audioStore.sizeForSession(id);
	})).then(function (sizes) {
		return sizes.reduce(function (a, b) { return a + b; }, docBytes);
	});
}

/*
On a server you run yourself a session is also a folder of files, and the
folder is the server's to list, make, rename, copy and delete. These answer
nothing useful anywhere else, and are not asked.

(comment by Claude)
*/
function listSessionFolders() {
	if (!canSave()) return Promise.resolve([]);
	return fetch('sessions.json').then(function (r) {
		return r.ok ? r.json() : [];
	}).catch(function () { return []; });
}

function sessionFolderOp(op, id, to) {
	if (!canSave()) return Promise.resolve({ ok: true });
	return fetch('sessions', {
		method: 'POST',
		body: JSON.stringify({ op: op, id: id, to: to }),
	}).then(function (r) {
		return r.json();
	}).catch(function () {
		return { ok: false, error: 'could not reach the server.' };
	});
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
	// (comment by Claude)
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

(comment by Claude)
*/
function exportCurrentSession() {
	let sessionId = systemState.getSessionId();
	let doc = documentOf(sessionId);
	let samples = audioStore.entries().map(function (e) {
		return { hash: e.hash, samples: toBase64(e.buffer) };
	});
	console.log('vodka export: ' + samples.length + ' sample buffer(s) in the file');
	return {
		version: FILE_VERSION,
		kind: 'vodka-session',
		// the name is here as well as on the file, because file names get
		// renamed and copied and this is the one that counts
		// (comment by Claude)
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

(comment by Claude)
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
	return Promise.all(writes).then(function (results) {
		let landed = results.filter(function (ok) { return ok; }).length;
		console.log('vodka import: ' + landed + ' of ' + samples.length
				+ ' sample buffer(s) committed');
		return sessionId;
	});
}

/*
showSaveFilePicker lets the browser put the file where the user says and is
chrome and edge only, so the anchor is not a legacy path -- it is what firefox
and safari get.

(comment by Claude)
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
			// (comment by Claude)
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
	// (comment by Claude)
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
			// (comment by Claude)
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
	deleteSessionData,
	copySessionData,
	moveSessionData,
	browserBytesOf,
	listSessionFolders,
	sessionFolderOp,
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
	saveTextToFile,
	readTextFromFile,
}
