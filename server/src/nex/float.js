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
 * Represents a floating point number (decimal).
 */
class Float extends ValueNex {
	constructor(val) {
		super((val) ? val : '0', '%', 'float');
		if (!this._isValid(this.value)) {
			this.value = '0';
		}
	}

	getTypeName() {
		return '-float-';
	}

	makeCopy() {
		let r = new Float(this.value);
		this.copyFieldsTo(r);
		return r;
	}

	rootLevelPostEvaluationStep() {
		this.setMutable(false);
	}

	toString(version) {
		if (version == 'v2') {
			return this.toStringV2();
		}
		return super.toString(version);
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

	toStringV2() {
		return `%${this.toStringV2Literal()}${this.toStringV2TagList()}${this.value}`;
	}

	_isValid(value) {
		return !isNaN(Number(value));
	}

	renderValue() {
		return this.value;
	}

	finalizeValue() {
		if (isNaN(this.value)) {
			this.value = '0.0';
		}
		let n = Number(this.value);
		if (Math.round(n) == n) {
			this.value = '' + n + '.0';
		} else {
			this.value = '' + n;
		}	
	}

	getTypedValue() {
		let v = this.value;
		return Number(v);
	}

	appendMinus() {
		if (this.value == '0') return;
		if (this.value == '0.') return;
		if (/0\.0+$/.test(this.value)) return;
		if (this.value.charAt(0) == '-') {
			this.value = this.value.substring(1);
		} else {
			this.value = '-' + this.value;
		}
	}

	appendZero() {
		if (this.value == '0') return;
		this.value = this.value + '0';
	}

	appendDot() {
		if (this.value.indexOf('.') >= 0) return;
		this.value = this.value + '.';
	}

	appendDigit(d) {
		if (this.value == '0') {
			this.value = d;
		} else {
			this.value = this.value + d;
		}
	}

	appendText(text) {
		if (text == '-') {
			this.appendMinus();
		} else if (text == '.') {
			this.appendDot();
		} else if (text == '0') {
			this.appendZero();
		} else {
			this.appendDigit(text);
		}
		this.setDirtyForRendering(true);
	}

	deleteLastLetter() {
		let v = this.value;
		if (v == '0') return;
		if (v.length == 1) {
			this.value = '0';
			return;
		}
		if (v.length == 2 && v.charAt(0) == '-') {
			this.value = '0';
			return;
		}
		this.value = v.substr(0, v.length - 1);
		let isNegative = this.value.charAt(0) == '-';
		let isZero = /-?0(\.0*)$/.test(this.value);
		if (isNegative && isZero) {
			this.value = this.value.substring(1);
		}
		this.setDirtyForRendering(true);
	}

	getDefaultHandler() {
		return 'floatDefault';
	}

	getEventTable(context) {
		return {
		}
	}
}


class FloatEditor extends Editor {
	constructor(nex) {
		super(nex, 'FloatEditor');
	}

	finish() {
		this.nex.finalizeValue();
		return super.finish();
	}

	hasContent() {
		return this.nex.renderValue() != '0';
	}
	
	startEditing() {
		super.startEditing();
		this.oldVal = this.nex.getValue();
	}

	abort() {
		this.nex.setValue(this.oldVal);
	}

	doBackspaceEdit() {
		this.nex.deleteLastLetter();
	}

	doAppendEdit(text) {
		this.nex.appendText(text);
	}

	shouldAppend(text) {
		return /^[0-9-.e]$/.test(text);
	}

	shouldTerminateAndReroute(text) {
		return super.shouldTerminateAndReroute()
			|| !this.shouldAppend(text);
	}
}

export { Float, FloatEditor }

