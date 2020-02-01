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
// test: functions_error_expand
/*
verifies that when an error object is created, it can be expanded/enlarged so you can see the full error message. I create an error just by trying to evaluate a "car" that has no arguments"
*/

	// |Shift|~|c|a|r|Shift|Enter|Shift|Enter
	
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
		code:'KeyC'
	});
testactions.push({
		type:'keyup',
		code:'KeyC'
	});
testactions.push({
		type:'keydown',
		code:'KeyA'
	});
testactions.push({
		type:'keydown',
		code:'KeyR'
	});
testactions.push({
		type:'keyup',
		code:'KeyA'
	});
testactions.push({
		type:'keyup',
		code:'KeyR'
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
		code:'ShiftLeft'
	});
testactions.push({
		type:'keyup',
		code:'Enter'
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
