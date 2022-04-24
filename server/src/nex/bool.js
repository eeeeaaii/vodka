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

	rootLevelPostEvaluationStep() {
		this.setMutable(false);
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
		return `!${this.toStringV2Literal()}${this.toStringV2TagList()}${this.saveRenderValue()}`;
	}

	getTypedValue() {
		return this.value === 'yes';
	}

	isEmpty() {
		return true;
	}

	// TODO: save it as T or F not yes or no
	saveRenderValue() {
		return this.getTypedValue() ? 'yes' : 'no';
	}

	renderValue() {
		return this.getTypedValue() ? 'T' : 'F';
	}

	escapedRenderValue() {
		return '<span class="boolfont">' + this.renderValue() + '</span>'
	}

	getDefaultHandler() {
		return 'standardDefault';
	}

	renderInto(renderNode, renderFlags, withEditor) {
		super.renderInto(renderNode, renderFlags, withEditor);
		let domNode = renderNode.getDomNode();
		if (this.isEditing) {
			domNode.classList.add('editing');
		} else {
			domNode.classList.remove('editing');
		}
		if (this.getTypedValue()) {
			domNode.classList.add('booleanyes');
			domNode.classList.remove('booleanno');
		} else {
			domNode.classList.add('booleanno');
			domNode.classList.remove('booleanyes');
		}
	}

	getEventTable(context) {
		return {};
	}
}

class BoolEditor extends Editor {
	constructor(nex) {
		super(nex, 'BoolEditor');
	}

	getStateForUndo() {
		return this.nex.getValue();
	}

	setStateForUndo(val) {
		this.nex.setValue(val);
	}

	doBackspaceEdit() {
	}

	startEditing() {
		super.startEditing();
		this.oldVal = this.nex.getValue();
	}

	abort() {
		this.nex.setValue(this.oldVal);
	}

	doAppendEdit(text) {
		let v = this.nex.getValue();
		this.nex.setValue((v == 'yes') ? 'no' : 'yes');
	}

	shouldAppend(text) {
		return /^[a-zA-Z0-9]$/.test(text);
	}

	shouldTerminateAndReroute(text) {
		if (super.shouldTerminateAndReroute()) return true;
		return !(/^[a-zA-Z0-9]$/.test(text));
	}
}

export { Bool, BoolEditor }
