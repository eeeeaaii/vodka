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
Sample storage for autosave, kept in IndexedDB rather than localStorage.

localStorage holds strings, so samples have to be base64'd -- a third larger
than the bytes they encode -- against a budget of about 5MB total. One second
of audio is roughly 250KB encoded, so a handful of sounds fills it. That is
why autosave has been writing wavetables out silent. IndexedDB stores a
Float32Array directly with no encoding step, and its quota is a fraction of
free disk rather than a fixed few megabytes.

The asynchrony is deliberately not visible to the rest of the app. Everything
is read into memory once, during startup, before the document is built; from
then on get() is an ordinary synchronous lookup and nothing in the evaluator,
the renderer or the wavetable code has to know where the samples came from.
Writes go out in the background and nobody waits for them.

Samples are keyed by a hash of their contents, which means the identity
question -- "is this the same audio as before?" -- has an answer that doesn't
depend on tracking which wavetable owns what. Two wavetables holding identical
audio share one record, and a wavetable whose samples were edited writes a new
one. Records nothing refers to any more are pruned after a save.
*/

import { systemState } from './systemstate.js'

const DB_NAME = 'vodka-audio';
const DB_VERSION = 1;
const STORE = 'samples';

// Records are namespaced by session id for the same reason the localStorage key
// is: two sessions open in two tabs shouldn't see each other's audio.
function scopedKey(hash) {
	let id = systemState.getSessionId();
	return (id ? id : 'nosession') + '/' + hash;
}

// Everything read at startup. get() serves from here, so callers never see a
// promise.
let loaded = new Map();

// Set when IndexedDB is unavailable or refuses us -- a private window, blocked
// site data, an old browser. Autosave then behaves as it did before: documents
// round-trip, audio doesn't.
let unavailable = false;

let dbPromise = null;

function openDb() {
	if (dbPromise) {
		return dbPromise;
	}
	dbPromise = new Promise(function(resolve) {
		let req;
		try {
			req = window.indexedDB.open(DB_NAME, DB_VERSION);
		} catch (e) {
			unavailable = true;
			resolve(null);
			return;
		}
		req.onupgradeneeded = function() {
			let db = req.result;
			if (!db.objectStoreNames.contains(STORE)) {
				db.createObjectStore(STORE);
			}
		};
		req.onsuccess = function() { resolve(req.result); };
		req.onerror = function() { unavailable = true; resolve(null); };
		req.onblocked = function() { unavailable = true; resolve(null); };
	});
	return dbPromise;
}

/*
Reads every sample record for this session into memory. Call once, and await it
before building the document -- that await is the only place the asynchrony
exists, and it happens during startup where there is nothing to block.
*/
function loadAll() {
	return openDb().then(function(db) {
		if (!db) return;
		return new Promise(function(resolve) {
			let tx;
			try {
				tx = db.transaction(STORE, 'readonly');
			} catch (e) {
				unavailable = true;
				resolve();
				return;
			}
			let store = tx.objectStore(STORE);
			let req = store.openCursor();
			let prefix = scopedKey('');
			req.onsuccess = function() {
				let cursor = req.result;
				if (!cursor) {
					resolve();
					return;
				}
				let k = '' + cursor.key;
				if (k.indexOf(prefix) == 0) {
					loaded.set(k.substring(prefix.length), cursor.value);
				}
				cursor.continue();
			};
			req.onerror = function() { resolve(); };
		});
	}).catch(function() {
		unavailable = true;
	});
}

// Synchronous by design -- see the note at the top of the file.
function get(hash) {
	let v = loaded.get(hash);
	if (!v) return null;
	// Stored as a plain ArrayBuffer; hand back the view the caller expects.
	return new Float32Array(v);
}

function has(hash) {
	return loaded.has(hash);
}

/*
Records the samples under their hash and writes them out in the background.
Returns immediately; the in-memory copy is updated first, so a get() right
after a put() works whether or not the write has landed.
*/
function put(hash, float32array) {
	if (unavailable) return;
	if (loaded.has(hash)) {
		// Same contents, already stored. Nothing to write.
		return;
	}
	let buffer = float32array.buffer.slice(
			float32array.byteOffset,
			float32array.byteOffset + float32array.byteLength);
	loaded.set(hash, buffer);
	openDb().then(function(db) {
		if (!db) return;
		try {
			let tx = db.transaction(STORE, 'readwrite');
			tx.objectStore(STORE).put(buffer, scopedKey(hash));
		} catch (e) {
			unavailable = true;
		}
	});
}

/*
Drops records no longer referenced by the saved document. Without this, editing
a wavetable would leave its previous contents behind forever, and a long
session would accumulate every intermediate state of every sound.

Takes the set of hashes the document still mentions. Background, like put().
*/
/*
Forgets a wavetable's samples. Called when the wavetable itself is freed, which
vodka knows the moment it happens -- heap.free calls cleanupOnMemoryFree as soon
as the last reference drops. Nothing has to be inferred from what a document
does or does not mention.
*/
function remove(id) {
	if (!id) return;
	loaded.delete(id);
	if (unavailable) return;
	openDb().then(function(db) {
		if (!db) return;
		try {
			let tx = db.transaction(STORE, 'readwrite');
			tx.objectStore(STORE).delete(scopedKey(id));
		} catch (e) {
			unavailable = true;
		}
	});
}

/*
FNV-1a over the sample bytes. Not cryptographic -- it decides "have I already
stored exactly these samples", and a collision would mean one wavetable coming
back as another, so the length is mixed in and the hash is taken over the raw
bytes rather than the float values.

Cost is a pass over the buffer, which at a 800ms save debounce is not something
a person can notice.
*/

function isUnavailable() {
	return unavailable;
}

export {
	loadAll,
	get,
	has,
	put,
	remove,
	isUnavailable
}
