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
How you were looking at the document, as opposed to the document itself, which
autosave.js handles. Wavetable zoom is the reason this exists: it isn't part of
any nex, so it was lost on every reload.

Stored under its own key so a change here can't corrupt the document.
*/

import { systemState } from './systemstate.js'
import {
	getGlobalPixelsPerSample,
	setGlobalPixelsPerSample,
	getGlobalHeightPixelsFullScale,
	setGlobalHeightPixelsFullScale,
	getBpm,
	setBpm,
	getDefaultTimebase,
	setDefaultTimebaseValue
} from './wavetablefunctions.js'

const KEY_PREFIX = 'vodka.editorstate.';
const FORMAT_VERSION = 1;

function storageKey() {
	let id = systemState.getSessionId();
	return KEY_PREFIX + (id ? id : 'nosession');
}

function currentState() {
	return {
		version: FORMAT_VERSION,
		wavetable: {
			pixelsPerSample: getGlobalPixelsPerSample(),
			heightPixelsFullScale: getGlobalHeightPixelsFullScale(),
			bpm: getBpm(),
			defaultTimebase: getDefaultTimebase()
		}
	};
}

function isPositiveNumber(v) {
	return typeof v === 'number' && isFinite(v) && v > 0;
}

function saveEditorState() {
	try {
		window.localStorage.setItem(storageKey(), JSON.stringify(currentState()));
	} catch (e) {
		// nothing useful to do; the document save reports quota problems already
	}
}

function restoreEditorState() {
	let raw;
	try {
		raw = window.localStorage.getItem(storageKey());
	} catch (e) {
		return;
	}
	if (!raw) return;
	let stored;
	try {
		stored = JSON.parse(raw);
	} catch (e) {
		return;
	}
	if (!stored || stored.version !== FORMAT_VERSION || !stored.wavetable) return;

	let w = stored.wavetable;
	// checked rather than trusted: a zero or negative zoom divides by itself in
	// windowWidth and takes the renderer down with it
	if (isPositiveNumber(w.pixelsPerSample)) {
		setGlobalPixelsPerSample(w.pixelsPerSample);
	}
	if (isPositiveNumber(w.heightPixelsFullScale)) {
		setGlobalHeightPixelsFullScale(w.heightPixelsFullScale);
	}
	if (isPositiveNumber(w.bpm)) {
		setBpm(w.bpm);
	}
	if (typeof w.defaultTimebase === 'string') {
		setDefaultTimebaseValue(w.defaultTimebase);
	}
}

export { saveEditorState, restoreEditorState }
