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

// test: actions_funnel_separator_uparrow
/*
This test verifies that the up arrow for separators (and by extension letters)), which in a doc/line/word context selects the corresponding word in the previous line, will behave reasonably in other contexts where line-bridging fails: in particular, if the parent of the separator is a doc element, up arrow should just do the same thing as left arrow.
*/

	// |Shift|~|;|Shift|~|ArrowUp|ArrowUp
	
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
		code:'Semicolon'
	});
testactions.push({
		type:'keyup',
		code:'Semicolon'
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

harness.runTest(testactions, 'direct');
