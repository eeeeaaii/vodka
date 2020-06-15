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
// test: functions_basic_bind_returnssymbol
/*
Verifies that when you bind a symbol to a value, the thing that is returned by "bind" is the symbol, not the value. This is important because if you return the value, it can be edited, which changes what the symbol is bound to.
*/

	// |Shift|~|b|i|n|d|Shift|@|a|Shift|#|4|Shift|Tab|Shift|Enter
	
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
		code:'KeyB'
	});
testactions.push({
		type:'keyup',
		code:'KeyB'
	});
testactions.push({
		type:'keydown',
		code:'KeyI'
	});
testactions.push({
		type:'keyup',
		code:'KeyI'
	});
testactions.push({
		type:'keydown',
		code:'KeyN'
	});
testactions.push({
		type:'keydown',
		code:'KeyD'
	});
testactions.push({
		type:'keyup',
		code:'KeyN'
	});
testactions.push({
		type:'keyup',
		code:'KeyD'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Digit2'
	});
testactions.push({
		type:'keyup',
		code:'Digit2'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'KeyA'
	});
testactions.push({
		type:'keyup',
		code:'KeyA'
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
