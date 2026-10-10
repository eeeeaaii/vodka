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
import { Editor } from '../editors.js'
import { heap } from '../heap.js'
import { constructFatalError } from './eerror.js'


/*
How far from the ones place the caret can be moved. Past these javascript writes
the number in exponential notation, which has no digit places to put a caret on.

(comment by Claude)
*/
const MIN_DIGIT_EXPONENT = -6;
const MAX_DIGIT_EXPONENT = 6;

/*
How many digits a decimal string has after the point. Asked of the string rather
than the number, because the string is what the user typed and 0.10125 has five
places whether or not the arithmetic that produced it did.

(comment by Claude)
*/
function decimalPlacesOf(s) {
	let dot = s.indexOf('.');
	if (dot == -1) {
		return 0;
	}
	return s.length - dot - 1;
}

/**
 * Represents a floating point number (decimal).
 */
class Float extends ValueNex {
	constructor(val) {
		super((val) ? val : '0', '%', 'float');
		if (!this._isValid(this.getValue())) {
			this.setValue('0');
		}
		/*
		Which digit the arrows work on, as a power of ten: -1 is the tenths
		place, 0 the ones, 2 the hundreds. A tenth to begin with, because that is
		what stepping a float always did and most floats here live between zero
		and one.

		Whether the caret is being shown is a separate question from where it is.
		Typing a number into a fresh float should not make padding zeros appear
		under your fingers, so the caret only shows once you have used the arrows
		on it, and it goes away again when the editor closes.

		(comment by Claude)
		*/
		this.editDigitExponent = -1;
		this.digitCaretActive = false;
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

	toString(version, ctx) {
		if (version == 'v2') {
			return this.toStringV2(ctx);
		}
		return super.toString(version);
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

	toStringV2(ctx) {
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

	/*
	The same stepping an integer has, because a number you want to nudge while
	listening to it is more often a float than an integer -- a gain, a ratio, a
	cutoff -- and it was the one kind of number you could not nudge.

	Left and right pick which digit is being stepped. All four open the editor
	if it is not open, so the only key that commits the number is enter, and
	escape puts back what was there before you started.

	(comment by Claude)
	*/
	getEventTable(context) {
		return {
			'ShiftArrowUp': 'increment-value',
			'ShiftArrowDown': 'decrement-value',
			'ShiftArrowLeft': 'edit-digit-left',
			'ShiftArrowRight': 'edit-digit-right',
		}
	}

	// one press of the arrow, which is one of whatever digit you are on
	// (comment by Claude)
	getStepAmount() {
		return Math.pow(10, this.editDigitExponent);
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
	they sit in the number rather than the direction the exponent goes.

	(comment by Claude)
	*/
	moveEditDigit(delta) {
		let e = this.editDigitExponent + delta;
		if (e < MIN_DIGIT_EXPONENT) {
			e = MIN_DIGIT_EXPONENT;
		}
		if (e > MAX_DIGIT_EXPONENT) {
			e = MAX_DIGIT_EXPONENT;
		}
		this.editDigitExponent = e;
		this.digitCaretActive = true;
		this.setDirtyForRendering(true);
	}

	/*
	Add or subtract one of the digit the caret is on.

	Rounded to whichever has more decimal places, the step or the number, so
	that working on the hundredths of 0.10125 gives 0.11125 and not 0.11. The
	rounding is there at all because 0.1 added to itself in binary floating
	point arrives at 0.30000000000000004, and a number box that reads like that
	after three presses is useless.

	(comment by Claude)
	*/
	stepByEditDigit(direction) {
		let step = this.getStepAmount();
		let n = this.getTypedValue();
		if (isNaN(n)) {
			n = 0;
		}
		let places = Math.max(decimalPlacesOf(String(step)),
				decimalPlacesOf(this.getValue()));
		this.setValue(String(Number((n + direction * step).toFixed(places))));
		this.digitCaretActive = true;
		this.setDirtyForRendering(true);
	}

	/*
	The value with enough zeros on it to have a digit where the caret is, and
	where in that string the digit lands. Writing 32 as 32.000 to put the caret
	on the thousandths is what a calculator does, and it is honest: those zeros
	are what the next press is going to change. The same going the other way,
	where 0.01 becomes 000.01 to reach the hundreds.

	Null when the value is not a plain decimal -- an e in it, or nothing at all
	-- which has no digit places to speak of. The caller then draws it plainly.

	(comment by Claude)
	*/
	digitCaretDisplay() {
		let m = /^(-?)([0-9]*)(?:\.([0-9]*))?$/.exec(this.getValue());
		if (!m) {
			return null;
		}
		let sign = m[1];
		let intpart = m[2];
		let frac = (m[3] === undefined) ? '' : m[3];
		let e = this.editDigitExponent;
		if (e >= 0) {
			while (intpart.length < e + 1) {
				intpart = '0' + intpart;
			}
		} else {
			while (frac.length < -e) {
				frac = frac + '0';
			}
		}
		// '.5' is a value you can type, and it needs a digit in the ones place
		// before anything can be counted from it
		// (comment by Claude)
		if (intpart.length == 0) {
			intpart = '0';
		}
		let index = (e >= 0)
				? sign.length + intpart.length - 1 - e
				: sign.length + intpart.length - e;
		let text = sign + intpart + ((frac.length > 0) ? '.' + frac : '');
		if (index < 0 || index >= text.length) {
			return null;
		}
		return { text: text, index: index };
	}

	/*
	The digit the arrows are on gets an underline that blinks, the way a text
	caret does, so you can see where you are working.

	(comment by Claude)
	*/
	escapedRenderValue() {
		if (!this.showsDigitCaret()) {
			return super.escapedRenderValue();
		}
		let d = this.digitCaretDisplay();
		if (!d) {
			return super.escapedRenderValue();
		}
		return this.escape(d.text.substring(0, d.index))
				+ '<span class="floatdigitcaret">'
				+ this.escape(d.text.charAt(d.index))
				+ '</span>'
				+ this.escape(d.text.substring(d.index + 1));
	}

	/*
	Dragging starts at whole numbers and each modifier you add moves one digit
	to the right, so the keys you are holding say how far down the number you
	are working. Shift is the one stepping with an arrow already uses, so it
	means tenths in both places.

	(comment by Claude)
	*/
	getDragStep(event) {
		// a mac turns control-press into a right-click, so accept command too
		// (comment by Claude)
		let fine = event.ctrlKey || event.metaKey;
		if (event.shiftKey && fine) {
			return 0.001;
		} else if (fine) {
			return 0.01;
		} else if (event.shiftKey) {
			return 0.1;
		}
		return 1;
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

	/*
	The arrows that pick and step a digit. The editor has to know about them
	because anything that is not a number key would otherwise close it and be
	handed back to the document.

	(comment by Claude)
	*/
	isDigitKey(text) {
		return text == 'ShiftArrowLeft' || text == 'ShiftArrowRight'
			|| text == 'ShiftArrowUp' || text == 'ShiftArrowDown';
	}

	shouldTerminateAndReroute(text) {
		if (this.isDigitKey(text)) {
			return false;
		}
		return super.shouldTerminateAndReroute()
			|| !this.shouldAppend(text);
	}

	performSpecialProcessing(text) {
		switch(text) {
			case 'ShiftArrowLeft':
				this.nex.moveEditDigit(1);
				return null;
			case 'ShiftArrowRight':
				this.nex.moveEditDigit(-1);
				return null;
			case 'ShiftArrowUp':
				this.nex.stepByEditDigit(1);
				return null;
			case 'ShiftArrowDown':
				this.nex.stepByEditDigit(-1);
				return null;
		}
		return super.performSpecialProcessing(text);
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

