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

import { ValueNex, startNumberDrag } from './valuenex.js'
import {
	clampDigitExponent,
	digitCaretDisplay,
	digitCaretHtml,
	isDigitCaretKey,
	routeDigitCaretKey,
	steppedValue,
	DIGIT_CARET_EVENT_TABLE
} from './digitcaret.js'
import { Editor } from '../editors.js'
import { experiments } from '../globalappflags.js'
import { heap } from '../heap.js'
import { constructFatalError } from './eerror.js'

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
		/*
		Which digit the arrows work on, as a power of ten: 0 is the ones place,
		3 the thousands. A whole number has no places below the ones, so this
		never goes negative -- see clampDigitExponent.

		The caret only shows once the arrows have been used on it, so typing a
		number into a fresh integer does not make padding zeros appear under
		your fingers, and it goes away again when the editor closes.

		(comment by Claude)
		*/
		this.editDigitExponent = 0;
		this.digitCaretActive = false;
	}

	wasmSetup() {
		this.runtimeId = Module.ccall("create_integer",
			'number',
			[]);
		this.setWasmValue = Module.cwrap("set_integer_value",
			'number',
			['number', 'number']);
		this.getWasmValue = Module.cwrap("get_integer_value",
			'number',
			['number']);
	}

	// setValue(v) {
	// 	if (experiments.ASM_RUNTIME) {
	// 		this.setWasmValue(this.runtimeId, Number(v));
	// 	} else {
	// 		super.setValue(v);
	// 	}
	// }

	// getValue() {
	// 	if (experiments.ASM_RUNTIME) {
	// 		return '' + this.getWasmValue(this.runtimeId);
	// 	} else {
	// 		return this.getValue();
	// 	}		
	// }

	rootLevelPostEvaluationStep() {
		this.setMutable(false);
	}

	getTypeName() {
		return '-integer-';
	}

	makeCopy() {
		let r = constructInteger(this.getValue());
		this.copyFieldsTo(r);
		return r;
	}

	toString(version, ctx) {
		if (version == 'v2') {
			return this.toStringV2(ctx);
		}
		return super.toString(version);
	}

	toStringV2(ctx) {
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

	/*
	Shift with an arrow steps the number, the way it does on a number box in
	max and everything descended from one -- the point being that you can hear
	a parameter move without stopping to retype it.

	Only when the integer is selected rather than being edited: keys go to the
	editor while one is open, so shift-up there is whatever the editor makes of
	it. Anything not named here falls through to the generic table, so arrows
	still move the selection as usual.
	*/
	getEventTable(context) {
		return DIGIT_CARET_EVENT_TABLE;
	}

	// one press of the arrow, which is one of whatever digit you are on
	// (comment by Claude)
	getStepAmount() {
		return Math.pow(10, this.editDigitExponent);
	}

	// a whole number's caret stops at the ones place
	// (comment by Claude)
	allowsFractionDigits() {
		return false;
	}

	// shown only once the arrows have been used, see the constructor
	// (comment by Claude)
	showsDigitCaret() {
		return this.isEditing && this.digitCaretActive;
	}

	startEditing() {
		this.digitCaretActive = false;
	}

	stopEditing() {
		this.digitCaretActive = false;
	}

	/*
	Left is a bigger digit and right is a smaller one, which is the direction
	they sit in the number rather than the direction the exponent goes. Moving
	left off the front of the number pads it with zeros, so 3000 becomes 03000
	and the next press up makes it 13000.

	(comment by Claude)
	*/
	moveEditDigit(delta) {
		this.editDigitExponent = clampDigitExponent(
				this.editDigitExponent + delta, this.allowsFractionDigits());
		this.digitCaretActive = true;
		this.setDirtyForRendering(true);
	}

	// add or subtract one of the digit the caret is on
	// (comment by Claude)
	stepByEditDigit(direction) {
		this.setValue(steppedValue(this.getValue(), this.editDigitExponent, direction));
		this.digitCaretActive = true;
		this.setDirtyForRendering(true);
	}

	/*
	The digit the arrows are on gets an underline that blinks, the way a text
	caret does. The thousands commas are already dropped while editing, so the
	caret counts digits in a string with nothing else in it.

	(comment by Claude)
	*/
	escapedRenderValue() {
		if (!this.showsDigitCaret()) {
			return super.escapedRenderValue();
		}
		let d = digitCaretDisplay(this.getValue(), this.editDigitExponent);
		if (!d) {
			return super.escapedRenderValue();
		}
		return digitCaretHtml(this, d.text, d.index);
	}

	// there is nothing finer than one to offer, so modifiers mean nothing here
	// (comment by Claude)
	getDragStep(event) {
		return 1;
	}

	/*
	Press and move to change it. Not while it is being edited, when the pointer
	belongs to the text, and not on something immutable, which is the same rule
	stepping follows: a number that cannot be edited cannot be dragged.

	(comment by Claude)
	*/
	startDragIfAllowed(event) {
		if (this.isEditing || !this.isMutable()) {
			return;
		}
		startNumberDrag(this, event);
	}

	renderInto(renderNode, renderFlags, withEditor) {
		super.renderInto(renderNode, renderFlags, withEditor);
		let domNode = renderNode.getDomNode();
		domNode.onmousedown = (event) => this.startDragIfAllowed(event);
		if (this.isEditing) {
			domNode.classList.add('editing');
		} else {
			domNode.classList.remove('editing');
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
		return 'standardDefault';
	}


	memUsed() {
		return super.memUsed() + heap.sizeInteger();
	}
}

class IntegerEditor extends Editor {
	constructor(nex) {
		super(nex, 'IntegerEditor');
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

	shouldIgnore(text) {
		if (text == '.') return true;
		return super.shouldIgnore(text);
	}

	shouldAppend(text) {
		return /^[0-9-]$/.test(text);
	}

	shouldTerminateAndReroute(text) {
		if (isDigitCaretKey(text)) {
			return false;
		}
		return super.shouldTerminateAndReroute()
			|| !this.shouldAppend(text);
	}

	performSpecialProcessing(text) {
		if (routeDigitCaretKey(this.nex, text)) {
			return null;
		}
		return super.performSpecialProcessing(text);
	}
}

function constructInteger(val) {
	if (!heap.requestMem(heap.sizeInteger())) {
		throw constructFatalError(`OUT OF MEMORY: cannot allocate Integer.
stats: ${heap.stats()}`)
	}
	return heap.register(new Integer(val));
}


export { Integer, IntegerEditor, constructInteger }

