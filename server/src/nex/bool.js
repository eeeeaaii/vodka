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

import { ValueNex } from './valuenex.js'
import { isNormallyHandled } from '../keyresponsefunctions.js'
import { experiments } from '../globalappflags.js'
import { Editor } from '../editors.js'


/**
 * Nex that represents a boolean value.
 */
class Bool extends ValueNex {
	constructor(val) {
		if (val === 'true') {
			val = 'yes';
		} else if (val === 'false') {
			val = 'no';
		} else if (val === 'yes' || val === 'no') {
			// do nothing
		} else {
			val = !!val ? 'yes' : 'no';
		}
		super(val, '!', 'boolean')
	}

	getTypeName() {
		return '-bool-';
	}

	makeCopy() {
		let r = new Bool(this.getTypedValue());
		this.copyFieldsTo(r);
		return r;
	}

	toString(version) {
		if (version == 'v2') {
			return this.toStringV2();
		}
		return '!' + this.renderValue();
	}

	toStringV2() {
		return '!' + this.toStringV2TagList() + this.renderValue();
	}

	getTypedValue() {
		return this.value === 'yes';
	}

	isEmpty() {
		return true;
	}

	renderValue() {
		return this.value;
	}

	getDefaultHandler() {
		return 'justAppendLetterOrSeparator';
	}

	renderInto(renderNode, renderFlags, withEditor) {
		super.renderInto(renderNode, renderFlags, withEditor);
		let domNode = renderNode.getDomNode();
		if (this.isEditing) {
			domNode.classList.add('editing');
		} else {
			domNode.classList.remove('editing');
		}
	}

	getEventTable(context) {
		if (experiments.BETTER_KEYBINDINGS) {
			return {};
		} else {
			return {
				// these 2 are questionable but make tests pass?
				'ShiftBackspace': 'remove-selected-and-select-previous-leaf-v2',
				'Backspace': 'remove-selected-and-select-previous-leaf-v2',
			}
		}
	}
}

class BoolEditor extends Editor {
	constructor(nex) {
		super(nex, 'BoolEditor');
	}

	doBackspaceEdit() {
	}

	doAppendEdit(text) {
		if (/^[yY]$/.test(text)) {
			this.nex.setValue('yes');
		} else if (/^[nN]$/.test(text)) {
			this.nex.setValue('no');
		}
	}

	shouldAppend(text) {
		return /^[yYnN]$/.test(text);
	}

	shouldTerminateAndReroute(text) {
		return !(/^[yYnN]$/.test(text));
	}
}

export { Bool, BoolEditor }
