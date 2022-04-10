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
		return text == 'Shift'
			|| text == 'NakedShift'
			|| text == 'Control'
			|| text == 'Meta'
			|| text == 'Alt';
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

	performSpecialProcessing(text) {
		console.log('editor: ignored ' + text);
		return false;
	}

	routeKey(text) {
		this.nex.setDirtyForRendering(true);
		if (this.shouldIgnore(text)) {
			return false;
		} else if (this.shouldBackspace(text)) {
			this.doBackspaceEdit();
			return false;
		} else if (this.shouldTerminate(text)) {
			this.finish();
			return false;
		} else if (this.shouldReroute(text)) {
			return true;
		} else if (this.shouldTerminateAndReroute(text)) {
			this.finish();
			return true;
		} else if (this.shouldAppend(text)) {
			this.doAppendEdit(text);
			return false;
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