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

// test: actions_funnel_word_insertionpointdisappear
/*
makes sure that the insertion point disappears if user moves away from a word
*/

	// |h|e|l|l|o|Shift|Tab|Shift|(|Shift|(|Shift|Tab|Tab|ArrowRight|Tab|ArrowRight|Tab|Shift|Tab
	
var harness = require('../testharness');

var testactions = [];

testactions.push({
		type:'keydown',
		code:'KeyH'
	});
testactions.push({
		type:'keyup',
		code:'KeyH'
	});
testactions.push({
		type:'keydown',
		code:'KeyE'
	});
testactions.push({
		type:'keydown',
		code:'KeyL'
	});
testactions.push({
		type:'keyup',
		code:'KeyE'
	});
testactions.push({
		type:'keyup',
		code:'KeyL'
	});
testactions.push({
		type:'keydown',
		code:'KeyL'
	});
testactions.push({
		type:'keyup',
		code:'KeyL'
	});
testactions.push({
		type:'keydown',
		code:'KeyO'
	});
testactions.push({
		type:'keyup',
		code:'KeyO'
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
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'Digit9'
	});
testactions.push({
		type:'keyup',
		code:'Digit9'
	});
testactions.push({
		type:'keyup',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'Digit9'
	});
testactions.push({
		type:'keyup',
		code:'Digit9'
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
		code:'ArrowRight'
	});
testactions.push({
		type:'keyup',
		code:'ArrowRight'
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
		code:'ArrowRight'
	});
testactions.push({
		type:'keyup',
		code:'ArrowRight'
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

harness.runTest(testactions, 'direct');
