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

// test: functions_execution_lambda_noargs
/*
This test tests the basic function of what command does when you don't have command text. It's supposed to expect the first arg to be a lambda, and execute it. in this case we test it with a valid lambda, which returns 3, and we test it again with something that's not a lambda, which returns error. incidentally ends up being a minimal test for lambda itself as well.
*/

	// |Shift|~|Tab|Shift|&|Tab|Shift|#|3|Shift|Tab|Tab|Shift|~|Tab|Shift|&|Backspace|Tab|Shift|#|3|Shift|Tab|ArrowUp|Shift|Enter|ArrowDown|Shift|Enter
	
var harness = require('../testharness');

var testactions = [];

testactions.push({type:'keydown',code:'ShiftRight'}); // ~
testactions.push({type:'keydown',code:'Backquote'});
testactions.push({type:'keyup',code:'Backquote'});
testactions.push({type:'keyup',code:'ShiftRight'});

testactions.push({type:'keydown',code:'Tab'}); // Tab
testactions.push({type:'keyup',code:'Tab'});

testactions.push({type:'keydown',code:'ShiftLeft'}); // &
testactions.push({type:'keydown',code:'Digit7'});
testactions.push({type:'keyup',code:'Digit7'});
testactions.push({type:'keyup',code:'ShiftLeft'});

testactions.push({type:'keydown',code:'Tab'}); // Tab
testactions.push({type:'keyup',code:'Tab'});

testactions.push({type:'keydown',code:'ShiftRight'}); // #3
testactions.push({type:'keydown',code:'Digit3'});
testactions.push({type:'keyup',code:'Digit3'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit3'});
testactions.push({type:'keyup',code:'Digit3'});

testactions.push({type:'keydown',code:'ShiftRight'}); // shift-tab shift-tab
testactions.push({type:'keydown',code:'Tab'});
testactions.push({type:'keyup',code:'Tab'});
testactions.push({type:'keydown',code:'Tab'});
testactions.push({type:'keyup',code:'Tab'});
testactions.push({type:'keyup',code:'ShiftRight'});

testactions.push({type:'keydown',code:'ShiftRight'}); // ~
testactions.push({type:'keydown',code:'Backquote'});
testactions.push({type:'keyup',code:'Backquote'});
testactions.push({type:'keyup',code:'ShiftRight'});

testactions.push({type:'keydown',code:'Tab'}); // Tab
testactions.push({type:'keyup',code:'Tab'});

//testactions.push({type:'keydown',code:'ShiftLeft'});
//testactions.push({type:'keydown',code:'Digit7'});
//testactions.push({type:'keyup',code:'Digit7'});
//testactions.push({type:'keyup',code:'ShiftLeft'});
//testactions.push({type:'keydown',code:'Backspace'});
//testactions.push({type:'keyup',code:'Backspace'});
testactions.push({type:'keydown',code:'Tab'});
testactions.push({type:'keyup',code:'Tab'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit3'});
testactions.push({type:'keyup',code:'Digit3'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit3'});
testactions.push({type:'keyup',code:'Digit3'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Tab'});
testactions.push({type:'keyup',code:'Tab'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'ArrowUp'});
testactions.push({type:'keyup',code:'ArrowUp'});
testactions.push({type:'keydown',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'Enter'});
testactions.push({type:'keyup',code:'Enter'});
testactions.push({type:'keyup',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'ArrowDown'});
testactions.push({type:'keyup',code:'ArrowDown'});
testactions.push({type:'keydown',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'Enter'});
testactions.push({type:'keyup',code:'Enter'});
testactions.push({type:'keyup',code:'ShiftLeft'});

harness.runTest(testactions, 'direct');
