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
Says what a nex is being serialized FOR, so types carrying bulk data can put it
somewhere appropriate instead of inlining it everywhere.

A wavetable holds megabytes of samples. That is fine written into a file, where
the samples go in the file's own resource section, and hopeless in localStorage,
which holds about five megabytes in total, so autosave puts them in IndexedDB
and writes a reference. A surface will have the same problem when its drawing is
made to persist at all.
*/

// A file. Bulk data goes in the file's resource section; the document refers to
// it by index.
const SERIALIZE_FILE = 1;

// localStorage. Bulk data goes to IndexedDB, or nowhere if IndexedDB is not
// available, and the document refers to it by content hash.
const SERIALIZE_BROWSER_STORAGE = 2;

// Anything else -- printing, debugging, an error message. Bulk data is left out
// entirely, because nothing that reads this wants a megabyte of base64.
const SERIALIZE_DISPLAY = 3;

class SerializationContext {
	// audioCollector is only meaningful for SERIALIZE_FILE
	constructor(mode, audioCollector) {
		this.mode = mode;
		this.audioCollector = audioCollector ? audioCollector : null;
	}

	isFile() {
		return this.mode == SERIALIZE_FILE;
	}

	isBrowserStorage() {
		return this.mode == SERIALIZE_BROWSER_STORAGE;
	}
}

// Shared, because it carries nothing and every caller that doesn't say what it
// wants means this one.
const DISPLAY_CONTEXT = new SerializationContext(SERIALIZE_DISPLAY);

export {
	SerializationContext,
	DISPLAY_CONTEXT,
	SERIALIZE_FILE,
	SERIALIZE_BROWSER_STORAGE,
	SERIALIZE_DISPLAY
}
