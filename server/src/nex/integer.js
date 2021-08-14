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
import { Editor } from '../editors.js'
import { experiments } from '../globalappflags.js'

/**
 * Represents an integer.
 */
class Integer extends ValueNex {
	constructor(val) {
		if (!val) {
			val = '0';
		}
		super(val, '#', 'integer');
		if (!this._isValid(this.getValue())) {
			this.setValue('0');
		}
		this.minusPressed = false; // TODO: move to editor
	}

	setValue(v) {
		super.setValue(v);
		if (experiments.ASM_RUNTIME) {
			Module.ccall("set_integer_value",
					'number',
					['number', 'number'],
					[this.runtimeId, Number(v)]
					);
		}
	}

	getValue() {
		if (experiments.ASM_RUNTIME) {
			return '' + Module.ccall("get_integer_value",
					'number',
					['number'],
					[this.runtimeId]
					);
		}		
		return this.value;
	}


	getTypeName() {
		return '-integer-';
	}

	makeCopy() {
		let r = new Integer(this.getValue());
		this.copyFieldsTo(r);
		return r;
	}

	toString(version) {
		if (version == 'v2') {
			return this.toStringV2();
		}
		return super.toString(version);
	}

	toStringV2() {
		return `#${this.toStringV2Literal()}${this.toStringV2TagList()}${this.getValue()}`;
	}

	_isValid(value) {
		let v = Number(value);
		return !isNaN(v);
	}

	renderValue() {
		let r = '' + this.getValue();
		if (this.isEditing) {
			return r; // no commas when editing
		}
		let pos = 0;
		let r2 = '';
		for (let i = r.length - 1; i >= 0; i--) {
			let c = r.charAt(i);
			if (pos++ == 3) {
				pos = 1;
				r2 = ',' + r2;
			}
			r2 = c + r2;
		}
		return r2;
	}

	getTypedValue() {
		return Number(this.getValue());
	}

	renderInto(renderNode, renderFlags, withEditor) {
		super.renderInto(renderNode, renderFlags, withEditor);
		if (experiments.REMAINING_EDITORS) {
			let domNode = renderNode.getDomNode();
			if (this.isEditing) {
				domNode.classList.add('editing');
			} else {
				domNode.classList.remove('editing');
			}
		}
	}

	appendText(txt) {
		if (txt == '-') {
			// negate it, unless it's zero
			if (this.getValue() == '0') {
				// this hack allows you to type a minus before typing digits
				// if the thing is zero
				this.minusPressed = true;
				this.setDirtyForRendering(true);
				return;
			}
			if (this.getValue().charAt(0) == '-') {
				this.setValue(this.getValue().substring(1));
			} else {
				this.setValue('-' + this.getValue());
			}
		} else if (/[0-9]/.test(txt)) {
			if (this.getValue() == '0') {
				if (txt != '0') {
					// just because we pressed minus before doesn't mean that
					// '-004' is a thing
					this.setValue((this.minusPressed ? '-' : '') + txt);
				} else {
					this.setValue(txt);
				}
			} else {
				this.setValue(this.getValue() + txt);
			}
		};
		this.minusPressed = false;
		this.setDirtyForRendering(true);
	}

	deleteLastLetter() {
		let v = this.getValue();
		if (v == '0') return;
		let isNegative = this.getValue().charAt(0) == '-';
		let realLength = isNegative ? v.length == 2 : v.length == 1;
		if (realLength == 1) {
			this.setValue('0');
			this.setDirtyForRendering(true);
			return;
		}
		this.setValue(v.substr(0, v.length - 1));
		this.setDirtyForRendering(true);
	}

	getDefaultHandler() {
		return 'integerDefault';
	}

}

class IntegerEditor extends Editor {
	constructor(nex) {
		super(nex, 'IntegerEditor');
	}

	hasContent() {
		return this.nex.renderValue() != '0';
	}

	doBackspaceEdit() {
		this.nex.deleteLastLetter();
	}

	doAppendEdit(text) {
		this.nex.appendText(text);
	}

	shouldAppend(text) {
		return /^[0-9-]$/.test(text);
	}

	shouldTerminateAndReroute(text) {
		return super.shouldTerminateAndReroute()
			|| !this.shouldAppend(text);
	}
}


export { Integer, IntegerEditor }

