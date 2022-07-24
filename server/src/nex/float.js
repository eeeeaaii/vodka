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
import { heap } from '../heap.js'
import { constructFatalError } from './eerror.js'


/**
 * Represents a floating point number (decimal).
 */
class Float extends ValueNex {
	constructor(val) {
		super((val) ? val : '0', '%', 'float');
		if (!this._isValid(this.getValue())) {
			this.setValue('0');
		}
	}

	getTypeName() {
		return '-float-';
	}

	makeCopy() {
		let r = constructFloat(this.getValue());
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
		let domNode = renderNode.getDomNode();
		if (this.isEditing) {
			domNode.classList.add('editing');
		} else {
			domNode.classList.remove('editing');
		}
	}

	toStringV2() {
		return `%${this.toStringV2Literal()}${this.toStringV2TagList()}${this.getValue()}`;
	}

	_isValid(value) {
		return !isNaN(Number(value));
	}

	renderValue() {
		return this.getValue();
	}

	finalizeValue() {
		if (isNaN(this.getValue())) {
			this.setValue('0.0');
		}
		let n = Number(this.getValue());
		if (Math.round(n) == n) {
			this.setValue('' + n + '.0');
		} else {
			this.setValue('' + n);
		}	
	}

	getTypedValue() {
		let v = this.getValue();
		return Number(v);
	}

	appendMinus() {
		if (this.getValue() == '0') return;
		if (this.getValue() == '0.') return;
		if (/0\.0+$/.test(this.getValue())) return;
		if (this.getValue().charAt(0) == '-') {
			this.setValue(this.getValue().substring(1));
		} else {
			this.setValue('-' + this.getValue());
		}
	}

	appendZero() {
		if (this.getValue() == '0') return;
		this.setValue(this.getValue() + '0');
	}

	appendDot() {
		if (this.getValue().indexOf('.') >= 0) return;
		this.setValue(this.getValue() + '.');
	}

	appendDigit(d) {
		if (this.getValue() == '0') {
			this.setValue(d);
		} else {
			this.setValue(this.getValue() + d);
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
		let v = this.getValue();
		if (v == '0') return;
		if (v.length == 1) {
			this.setValue('0');
			return;
		}
		if (v.length == 2 && v.charAt(0) == '-') {
			this.setValue('0');
			return;
		}
		this.setValue(v.substr(0, v.length - 1));
		let isNegative = this.getValue().charAt(0) == '-';
		let isZero = /-?0(\.0*)$/.test(this.getValue());
		if (isNegative && isZero) {
			this.setValue(this.getValue().substring(1));
		}
		this.setDirtyForRendering(true);
	}

	getDefaultHandler() {
		return 'standardDefault';
	}

	getEventTable(context) {
		return {
		}
	}

	memUsed() {
		return super.memUsed() + heap.sizeFloat();
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

	getStateForUndo() {
		return this.nex.getValue();
	}

	setStateForUndo(val) {
		this.nex.setValue(val);
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

function constructFloat(val) {
	if (!heap.requestMem(heap.sizeFloat())) {
		throw constructFatalError(`OUT OF MEMORY: cannot allocate Float.
stats: ${heap.stats()}`)
	}
	return heap.register(new Float(val));
}

export { Float, FloatEditor, constructFloat }

