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
	constructor(nex) {
		this._isEditing = false;
		this.nex = nex;
	}

	doBackspaceEdit() {
		// override
	}

	doAppendEdit(text) {
		// override
	}

	shouldTerminate(text) {
		return text == 'Enter'
			|| text == 'Tab'
			|| text == 'Backspace';
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

	shouldTerminateAndReroute(text) {
		return false;
	}

	shouldAppend(text) {
		return false;
	}

	routeKey(text) {
		if (this.shouldIgnore(text)) {
			return false;
		} else if (this.shouldBackspace(text)) {
			this.doBackspaceEdit();
			return false;
		} else if (this.shouldTerminate(text)) {
			this._isEditing = false;
			this.nex.isEditing = false;
			return false;
		} else if (this.shouldTerminateAndReroute(text)) {
			this._isEditing = false;
			this.nex.isEditing = false;
			return true;
		} else if (this.shouldAppend(text)) {
			this.doAppendEdit(text);
			return false;
		} else {
			console.log('editor: ignored ' + text);
			return false;
		}
	}

	startEditing() {
		this._isEditing = true;
		this.nex.isEditing = true;
	}

	isEditing() {
		return this._isEditing;
	}

	postNode() {
		return null;
	}

	preNode() {
		return null;
	}

	forceClose() {
		this._isEditing = false;
		this.nex.isEditing = false;
	}
}

export { Editor }