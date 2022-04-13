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

class Editor {
	constructor(nex, type) {
		this._isEditing = false;
		this.nex = nex;
		this.type = type;
	}

	doBackspaceEdit() {
		// override
	}

	doAppendEdit(text) {
		// override
	}

	shouldTerminate(text) {
		return text == 'Enter';
	}

	shouldBackspace(text) {
		return text == 'Backspace'
			&& this.hasContent();
	}

	hasContent() {
		return false;
	}

	shouldIgnore(text) {
		return false;
	}

	shouldReroute(text) {
		return false;
	}

	shouldTerminateAndReroute(text) {
		return text == 'ShiftTab' || text == 'Tab';
	}

	shouldAppend(text) {
		return false;
	}

	shouldAbort(text) {
		return text == 'Escape';
	}

	lastBackspaceReroute(text) {
		return text == 'Backspace'
			&& !this.hasContent();
	}

	performSpecialProcessing(text) {
		console.log('editor: ignored ' + text);
		return text;
	}

	abort() {

	}

	// if you return a keycode, that keycode is rerouted
	// if you return null, you've handled the key, nothing happens
	routeKey(text) {
		this.nex.setDirtyForRendering(true);

		// shouldIgnore is only overridden by the wavetable editor.
		if (this.shouldIgnore(text)) {
			return null;
		} else if (this.shouldAbort(text)) {
			this.abort();
			this.finish();
			return null;

		// currently shouldBackspace and shouldTerminate are
		// only overridden by the tag editor.
		} else if (this.shouldBackspace(text)) {
			this.doBackspaceEdit();
			return null;

		// also overridden by tag editor
		} else if (this.lastBackspaceReroute(text)) {
			return 'LastBackspace';

		} else if (this.shouldTerminate(text)) {
			this.finish();
			return null;

		// this is not overridden anywhere.
		} else if (this.shouldReroute(text)) {
			return text;

		// These next two are overridden by most of
		// the nex editors and they are used to do things
		// like make sure only digits are understood
		// by the integer editor, etc.
		} else if (this.shouldTerminateAndReroute(text)) {
			this.finish();
			return text;
		} else if (this.shouldAppend(text)) {
			this.doAppendEdit(text);
			return null;

		} else {
			return this.performSpecialProcessing(text);
		}
	}

	startEditing() {
		this._isEditing = true;
		this.nex.isEditing = true;
		if (this.nex.startEditing) {
			this.nex.startEditing();
		}
	}

	finish() {
		this._isEditing = false;
		this.nex.isEditing = false;
		if (this.nex.stopEditing) {
			this.nex.stopEditing();
		}
		this.nex.setDirtyForRendering(true);
	}

	isEditing() {
		return this._isEditing;
	}

	forceClose() {
		this.finish();
	}
}

export { Editor }