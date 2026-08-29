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
Keeps the document you are editing in localStorage so that reloading the page
doesn't throw your work away. This is a convenience, not a save: saving to the
server is still what persists a document properly.

Two things worth knowing about what gets stored:

  - The root nex has no toStringV2, so the document is stored as a *list* of
    serialized top-level children rather than one string. That also handles the
    case where the root holds more than one thing, which doSave() clearly
    anticipates.

  - Audio doesn't go in localStorage. A second of samples is about 250KB of
    base64 against a budget of around 5MB, so a wavetable serializes as a
    reference and its samples go to IndexedDB instead -- see audiostore.js.
    Where IndexedDB isn't available the old behaviour stands: wavetables come
    back silent and everything else round-trips.

Storage is keyed by session id, so two tabs on different sessions don't collide.
Two tabs on the *same* session share one slot and the last writer wins.
*/

import { systemState } from './systemstate.js'
import { parse } from './nexparser2.js'
import { SerializationContext, SERIALIZE_BROWSER_STORAGE } from './serializationcontext.js'
import * as audioStore from './audiostore.js'
import { saveEditorState } from './editorstate.js'

const KEY_PREFIX = 'vodka.autosave.';
const FORMAT_VERSION = 1;
const SAVE_DELAY_MS = 800;

let pendingSave = null;
let restored = false;
let disabled = false;

function storageKey() {
	let id = systemState.getSessionId();
	return KEY_PREFIX + (id ? id : 'nosession');
}

// Storage can throw rather than merely be empty: private windows, blocked site
// data, quota. Every access goes through these two.
function readStorage(key) {
	try {
		return window.localStorage.getItem(key);
	} catch (e) {
		disabled = true;
		return null;
	}
}

function writeStorage(key, value) {
	try {
		window.localStorage.setItem(key, value);
		return true;
	} catch (e) {
		// QuotaExceededError is the interesting one -- most likely a document
		// large enough that we should stop trying rather than retry every edit.
		console.log('vodka: autosave failed (' + e.name + '), disabling for this session.');
		disabled = true;
		return false;
	}
}

function serializeDocument(rootNode) {
	let rootNex = rootNode.getNex();
	let docs = [];
	let ctx = new SerializationContext(SERIALIZE_BROWSER_STORAGE);
	for (let i = 0; i < rootNex.numChildren(); i++) {
		docs.push('v2:' + rootNex.getChildAt(i).toString('v2', ctx));
	}
	return docs;
}

function saveNow(rootNode) {
	if (disabled || !restored) return;
	let docs;
	try {
		docs = serializeDocument(rootNode);
	} catch (e) {
		console.log('vodka: autosave could not serialize the document: ' + e);
		return;
	}
	let wrote = writeStorage(storageKey(), JSON.stringify({
		version: FORMAT_VERSION,
		sessionId: systemState.getSessionId() || null,
		docs: docs
	}));
	// A save that did not happen says nothing about what is still in use.
	if (!wrote) return;
	// Samples the document no longer mentions are dead. Editing a wavetable
	// gives its new contents a new hash, so without this every intermediate
	// state of every sound would be kept forever. Reading the references back
	// out of what we just wrote is the cheapest way to know exactly what
	// survived, and can't drift from it.
	audioStore.pruneToKeys(collectAudioRefs(docs));
	saveEditorState();
}

const AUDIO_REF_RE = /idb:([0-9a-f]+-[0-9a-f]+)/g;

function collectAudioRefs(docs) {
	let keys = new Set();
	for (let i = 0; i < docs.length; i++) {
		let m;
		AUDIO_REF_RE.lastIndex = 0;
		while ((m = AUDIO_REF_RE.exec(docs[i])) !== null) {
			keys.add(m[1]);
		}
	}
	return keys;
}

/**
 * Called after anything that changes the document. Debounced, because
 * serializing on every keystroke is wasteful and the cost scales with document
 * size.
 */
function scheduleAutosave(rootNode) {
	if (disabled || !restored) return;
	if (pendingSave) clearTimeout(pendingSave);
	pendingSave = setTimeout(function() {
		pendingSave = null;
		saveNow(rootNode);
	}, SAVE_DELAY_MS);
}

/**
 * Returns true if a stored document was found and appended to the root.
 * Call before enabling autosave, so an empty root can't overwrite stored work.
 */
function restoreAutosave(rootNode) {
	let raw = readStorage(storageKey());
	if (!raw) {
		restored = true;
		return false;
	}
	let stored;
	try {
		stored = JSON.parse(raw);
	} catch (e) {
		console.log('vodka: stored document was unreadable, ignoring it.');
		restored = true;
		return false;
	}
	if (!stored || stored.version !== FORMAT_VERSION || !Array.isArray(stored.docs)) {
		restored = true;
		return false;
	}
	let appended = 0;
	for (let i = 0; i < stored.docs.length; i++) {
		try {
			rootNode.appendChild(parse(stored.docs[i]));
			appended++;
		} catch (e) {
			// One unparseable child shouldn't cost you the rest of the document.
			console.log('vodka: skipped an unreadable item while restoring: ' + e);
		}
	}
	restored = true;
	return appended > 0;
}

/**
 * Turn autosave on without attempting a restore. Used on the paths that load a
 * document explicitly (a ?file= query, say): those shouldn't be replaced by
 * stored work, but edits to them should still survive a reload.
 */
function enableAutosave() {
	restored = true;
}

/**
 * Writes a pending save immediately instead of waiting out the debounce.
 *
 * Without this, anything done in the last SAVE_DELAY_MS before a reload is
 * simply gone -- which at 800ms is most of a second of work, and is exactly
 * the window a person is in when they change something and reload to see what
 * happened. beforeunload gives us a synchronous moment to spend, and
 * localStorage is synchronous, so the pending write lands.
 *
 * Sample data is already in IndexedDB by this point: put() writes as soon as
 * the samples are serialized rather than waiting for the debounce, so what's
 * pending here is only the document itself.
 */
function installUnloadFlush(rootNode) {
	window.addEventListener('beforeunload', function() {
		// zoom doesn't go through the action system, so this is the only place
		// it reliably gets written
		saveEditorState();
		if (!pendingSave) return;
		clearTimeout(pendingSave);
		pendingSave = null;
		saveNow(rootNode);
	});
}

function hasPendingSave() {
	return !!pendingSave;
}

function clearAutosave() {
	try {
		window.localStorage.removeItem(storageKey());
	} catch (e) {
		// nothing useful to do
	}
}

export { scheduleAutosave, restoreAutosave, enableAutosave, clearAutosave, saveNow, installUnloadFlush, hasPendingSave }
