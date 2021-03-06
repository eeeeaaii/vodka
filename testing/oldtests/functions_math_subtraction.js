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
// test: functions_math_subtraction
/*
complete test of subtraction, including mixed types
*/

	// |Shift|~|Shift|*|Shift|#|3|Shift|#|4|Shift|Tab|Shift|~|Shift|*|Shift|#|3|Shift|Tab|Shift|~|Shift|*|5|Backspace|Backspace|Shift|*|Shift|%|5|.|5|Shift|#|3|Shift|Tab|Shift|~|Shift|*|Shift|%|4|.|4|Shift|%|6|4|Backspace|.|4|Shift|Tab|Tab|Shift|Tab|Shift|~|Shift|*|Shift|#|3|Shift|#|3|Shift|#|3|Shift|#|3|Shift|Tab|Shift|~|Shift|*|ArrowUp|ArrowUp|ArrowUp|ArrowUp|ArrowUp|Shift|Enter|ArrowDown|Shift|Enter|ArrowDown|Shift|Enter|ArrowDown|Shift|Enter|ArrowDown|Shift|Enter|ArrowDown|Shift|Enter
	
var harness = require('../testharness');

var testactions = [];

testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Backquote'
	});
testactions.push({
		type:'keyup',
		code:'Backquote'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'Digit8'
	});
testactions.push({
		type:'keyup',
		code:'Digit8'
	});
testactions.push({
		type:'keyup',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Digit3'
	});
testactions.push({
		type:'keyup',
		code:'Digit3'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Digit3'
	});
testactions.push({
		type:'keyup',
		code:'Digit3'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Digit3'
	});
testactions.push({
		type:'keyup',
		code:'Digit3'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Digit4'
	});
testactions.push({
		type:'keyup',
		code:'Digit4'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Backquote'
	});
testactions.push({
		type:'keyup',
		code:'Backquote'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'Digit8'
	});
testactions.push({
		type:'keyup',
		code:'Digit8'
	});
testactions.push({
		type:'keyup',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Digit3'
	});
testactions.push({
		type:'keyup',
		code:'Digit3'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Digit3'
	});
testactions.push({
		type:'keyup',
		code:'Digit3'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Backquote'
	});
testactions.push({
		type:'keyup',
		code:'Backquote'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'Digit8'
	});
testactions.push({
		type:'keyup',
		code:'Digit8'
	});
testactions.push({
		type:'keyup',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'Digit5'
	});
testactions.push({
		type:'keyup',
		code:'Digit5'
	});
testactions.push({
		type:'keydown',
		code:'Backspace'
	});
testactions.push({
		type:'keyup',
		code:'Backspace'
	});
testactions.push({
		type:'keydown',
		code:'Backspace'
	});
testactions.push({
		type:'keyup',
		code:'Backspace'
	});
testactions.push({
		type:'keydown',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'Digit8'
	});
testactions.push({
		type:'keyup',
		code:'Digit8'
	});
testactions.push({
		type:'keyup',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Digit5'
	});
testactions.push({
		type:'keyup',
		code:'Digit5'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Digit5'
	});
testactions.push({
		type:'keyup',
		code:'Digit5'
	});
testactions.push({
		type:'keydown',
		code:'Period'
	});
testactions.push({
		type:'keyup',
		code:'Period'
	});
testactions.push({
		type:'keydown',
		code:'Digit5'
	});
testactions.push({
		type:'keyup',
		code:'Digit5'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Digit3'
	});
testactions.push({
		type:'keyup',
		code:'Digit3'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Digit3'
	});
testactions.push({
		type:'keyup',
		code:'Digit3'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Backquote'
	});
testactions.push({
		type:'keyup',
		code:'Backquote'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'Digit8'
	});
testactions.push({
		type:'keyup',
		code:'Digit8'
	});
testactions.push({
		type:'keyup',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Digit5'
	});
testactions.push({
		type:'keyup',
		code:'Digit5'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Digit4'
	});
testactions.push({
		type:'keyup',
		code:'Digit4'
	});
testactions.push({
		type:'keydown',
		code:'Period'
	});
testactions.push({
		type:'keyup',
		code:'Period'
	});
testactions.push({
		type:'keydown',
		code:'Digit4'
	});
testactions.push({
		type:'keyup',
		code:'Digit4'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Digit5'
	});
testactions.push({
		type:'keyup',
		code:'Digit5'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Digit6'
	});
testactions.push({
		type:'keyup',
		code:'Digit6'
	});
testactions.push({
		type:'keydown',
		code:'Digit4'
	});
testactions.push({
		type:'keyup',
		code:'Digit4'
	});
testactions.push({
		type:'keydown',
		code:'Backspace'
	});
testactions.push({
		type:'keyup',
		code:'Backspace'
	});
testactions.push({
		type:'keydown',
		code:'Period'
	});
testactions.push({
		type:'keydown',
		code:'Digit4'
	});
testactions.push({
		type:'keyup',
		code:'Period'
	});
testactions.push({
		type:'keyup',
		code:'Digit4'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'Tab'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Backquote'
	});
testactions.push({
		type:'keyup',
		code:'Backquote'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'Digit8'
	});
testactions.push({
		type:'keyup',
		code:'Digit8'
	});
testactions.push({
		type:'keyup',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Digit3'
	});
testactions.push({
		type:'keyup',
		code:'Digit3'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Digit3'
	});
testactions.push({
		type:'keyup',
		code:'Digit3'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Digit3'
	});
testactions.push({
		type:'keyup',
		code:'Digit3'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Digit3'
	});
testactions.push({
		type:'keyup',
		code:'Digit3'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Digit3'
	});
testactions.push({
		type:'keyup',
		code:'Digit3'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Digit3'
	});
testactions.push({
		type:'keyup',
		code:'Digit3'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Digit3'
	});
testactions.push({
		type:'keyup',
		code:'Digit3'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Digit3'
	});
testactions.push({
		type:'keyup',
		code:'Digit3'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Backquote'
	});
testactions.push({
		type:'keyup',
		code:'Backquote'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'Digit8'
	});
testactions.push({
		type:'keyup',
		code:'Digit8'
	});
testactions.push({
		type:'keyup',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'ArrowUp'
	});
testactions.push({
		type:'keyup',
		code:'ArrowUp'
	});
testactions.push({
		type:'keydown',
		code:'ArrowUp'
	});
testactions.push({
		type:'keyup',
		code:'ArrowUp'
	});
testactions.push({
		type:'keydown',
		code:'ArrowUp'
	});
testactions.push({
		type:'keyup',
		code:'ArrowUp'
	});
testactions.push({
		type:'keydown',
		code:'ArrowUp'
	});
testactions.push({
		type:'keyup',
		code:'ArrowUp'
	});
testactions.push({
		type:'keydown',
		code:'ArrowUp'
	});
testactions.push({
		type:'keyup',
		code:'ArrowUp'
	});
testactions.push({
		type:'keydown',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'ArrowDown'
	});
testactions.push({
		type:'keyup',
		code:'ArrowDown'
	});
testactions.push({
		type:'keydown',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'ArrowDown'
	});
testactions.push({
		type:'keyup',
		code:'ArrowDown'
	});
testactions.push({
		type:'keydown',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'ArrowDown'
	});
testactions.push({
		type:'keyup',
		code:'ArrowDown'
	});
testactions.push({
		type:'keydown',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'ArrowDown'
	});
testactions.push({
		type:'keyup',
		code:'ArrowDown'
	});
testactions.push({
		type:'keydown',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'ArrowDown'
	});
testactions.push({
		type:'keyup',
		code:'ArrowDown'
	});
testactions.push({
		type:'keydown',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'ShiftLeft'
	});

harness.runTest(testactions, 'direct');
