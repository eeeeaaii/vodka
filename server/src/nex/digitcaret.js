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

/*
Stepping one digit of a number at a time, which is what shift and the arrows do
to a float or an integer: up and down change the digit the caret is on, left and
right move the caret.

The caret's position is a power of ten rather than an offset into the string --
-1 is the tenths place, 0 the ones, 3 the thousands -- because that is what it
means musically and because it does not move when the number gets longer. An
integer's caret cannot go below zero; everything else here is the same for both.

Pure functions over the value as a string. The string is what the user typed, so
0.10125 has five decimal places whether or not the arithmetic that produced it
did, and that matters: stepping has to keep the digits it is not touching.

(comment by Claude)
*/

/*
Past these javascript writes the number in exponential notation, which has no
digit places to put a caret on.
*/
const MIN_FRACTION_EXPONENT = -6;
const MAX_DIGIT_EXPONENT = 6;

function decimalPlacesOf(s) {
	let dot = s.indexOf('.');
	if (dot == -1) {
		return 0;
	}
	return s.length - dot - 1;
}

// allowFraction is false for a whole number, whose smallest digit is the ones
function clampDigitExponent(e, allowFraction) {
	let min = allowFraction ? MIN_FRACTION_EXPONENT : 0;
	if (e < min) {
		return min;
	}
	if (e > MAX_DIGIT_EXPONENT) {
		return MAX_DIGIT_EXPONENT;
	}
	return e;
}

/*
The value with enough zeros on it to have a digit where the caret is, and where
in that string the digit lands. Writing 32 as 32.000 to put the caret on the
thousandths is what a calculator does, and it is honest: those zeros are what the
next press is going to change. The same going the other way, where 0.01 becomes
000.01 and 5 becomes 0005 to reach the thousands.

Null when the value is not a plain decimal -- an e in it, or nothing at all --
which has no digit places to speak of. The caller then draws it plainly.
*/
function digitCaretDisplay(value, e) {
	let m = /^(-?)([0-9]*)(?:\.([0-9]*))?$/.exec(value);
	if (!m) {
		return null;
	}
	let sign = m[1];
	let intpart = m[2];
	let frac = (m[3] === undefined) ? '' : m[3];
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
The value with one of the digit at e added to or taken off it.

Rounded to whichever has more decimal places, the step or the number, so that
working on the hundredths of 0.10125 gives 0.11125 and not 0.11. The rounding is
there at all because 0.1 added to itself in binary floating point arrives at
0.30000000000000004, and a number box that reads like that after three presses
is useless.
*/
function steppedValue(value, e, direction) {
	let step = Math.pow(10, e);
	let n = Number(value);
	if (isNaN(n)) {
		n = 0;
	}
	let places = Math.max(decimalPlacesOf(String(step)), decimalPlacesOf(value));
	return String(Number((n + direction * step).toFixed(places)));
}

// the four keys that pick and step a digit. An editor has to let them through:
// anything that is not a number key would otherwise close it.
function isDigitCaretKey(text) {
	return text == 'ShiftArrowLeft' || text == 'ShiftArrowRight'
		|| text == 'ShiftArrowUp' || text == 'ShiftArrowDown';
}

/*
What one of those keys does to the nex. Returns true when it was handled, so an
editor can say "nothing to reroute" on exactly the keys this took.
*/
function routeDigitCaretKey(nex, text) {
	switch(text) {
		case 'ShiftArrowLeft':
			nex.moveEditDigit(1);
			return true;
		case 'ShiftArrowRight':
			nex.moveEditDigit(-1);
			return true;
		case 'ShiftArrowUp':
			nex.stepByEditDigit(1);
			return true;
		case 'ShiftArrowDown':
			nex.stepByEditDigit(-1);
			return true;
	}
	return false;
}

/*
Shift and an arrow, for the nex's own event table. These only fire when the nex
is selected and not being edited; the first one opens the editor and the rest go
through it.
*/
const DIGIT_CARET_EVENT_TABLE = {
	'ShiftArrowUp': 'increment-value',
	'ShiftArrowDown': 'decrement-value',
	'ShiftArrowLeft': 'edit-digit-left',
	'ShiftArrowRight': 'edit-digit-right',
};

/*
The digit the caret is on, wrapped in a span the stylesheet gives a blinking
underline. Everything in here is digits, a dot and a minus, so there is nothing
to escape, but it goes through the nex's own escaping anyway rather than being
the one place that assumes that.
*/
function digitCaretHtml(nex, text, index) {
	return nex.escape(text.substring(0, index))
			+ '<span class="digitcaret">'
			+ nex.escape(text.charAt(index))
			+ '</span>'
			+ nex.escape(text.substring(index + 1));
}

export {
	clampDigitExponent,
	decimalPlacesOf,
	digitCaretDisplay,
	digitCaretHtml,
	isDigitCaretKey,
	routeDigitCaretKey,
	steppedValue,
	DIGIT_CARET_EVENT_TABLE
}
