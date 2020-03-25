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
// test: actions_stepeval_unboundsymbolerror
/*
make sure that an unbound symbol correctly replaces expectation with the right error when you're step executing.
*/

	// |Shift|~|Shift|+|Shift|#|3|Shift|@|f|l|o|o|f|Shift|CapsLock|Shift|Tab|Meta|Enter|Enter|Enter
	
var harness = require('../testharness');

var testactions = [];

testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Backquote'});
      testactions.push({type:'keyup',code:'Backquote'});
      testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'Equal'});
      testactions.push({type:'keyup',code:'Equal'});
      testactions.push({type:'keyup',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit3'});
      testactions.push({type:'keyup',code:'Digit3'});
      testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit3'});
      testactions.push({type:'keyup',code:'Digit3'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit2'});
      testactions.push({type:'keyup',code:'Digit2'});
      testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'KeyF'});
      testactions.push({type:'keyup',code:'KeyF'});
testactions.push({type:'keydown',code:'KeyL'});
      testactions.push({type:'keyup',code:'KeyL'});
testactions.push({type:'keydown',code:'KeyO'});
      testactions.push({type:'keyup',code:'KeyO'});
testactions.push({type:'keydown',code:'KeyO'});
      testactions.push({type:'keyup',code:'KeyO'});
testactions.push({type:'keydown',code:'KeyF'});
      testactions.push({type:'keyup',code:'KeyF'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'CapsLock'});
      testactions.push({type:'keyup',code:'ShiftRight'});
      testactions.push({type:'keyup',code:'CapsLock'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Tab'});
      testactions.push({type:'keyup',code:'Tab'});
      testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'MetaLeft'});
testactions.push({type:'keydown',code:'Enter'});
testactions.push({type:'keydown',code:'Enter'});
testactions.push({type:'keydown',code:'Enter'});
      testactions.push({type:'keyup',code:'MetaLeft'});

harness.runTest(testactions, 'direct');
