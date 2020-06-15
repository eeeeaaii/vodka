//startgnumessage//
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
//endgnumessage//
//testname//  functions_environment_set
//startdescription//
/*
basic test of the "set" primitive. I have a command with nothing in it but a lambda. Inside the lambda I use let to make @a = 10. then I let @b be equal to a lambda that sets @a to 100. then I execute the lambda b in a command. then I return a. executing that whole thing returns 100, because the set command was able to set the value of @a in the outer scope.
*/
//enddescription//
//testspec// |Shift|~|Shift|&|Shift| |Shift|~|l|e|t|Shift|@|a|Shift|#|1|0|Shift|Tab|Shift|~|l|e|t|Shift|@|b|Shift|&|Shift| |Shift|~|e|Backspace|s|e|t|Shift|@|a|Shift|#|1|0|0|Shift|Tab|Tab|Tab|Shift|~|b|ArrowRight|Shift|@|a|Shift|Tab|Tab|Shift|Enter
//starttest//
var harness = require('../testharness');
var testactions = [];
testactions.push({type:'keydown', code:'ShiftRight'});
testactions.push({type:'keydown', code:'Backquote'});
testactions.push({type:'keyup', code:'Backquote'});
testactions.push({type:'keyup', code:'ShiftRight'});
testactions.push({type:'keydown', code:'ShiftRight'}); // type &
testactions.push({type:'keydown', code:'Digit7'});
testactions.push({type:'keyup', code:'Digit7'});
testactions.push({type:'keyup', code:'ShiftRight'});
testactions.push({type:'keydown', code:'Enter'});
testactions.push({type:'keyup', code:'Enter'});
testactions.push({type:'keydown', code:'ShiftLeft'}); // change orientation of &
testactions.push({type:'keydown', code:'Space'});
testactions.push({type:'keyup', code:'Space'});
testactions.push({type:'keyup', code:'ShiftLeft'});
testactions.push({type:'keydown', code:'ShiftRight'});
testactions.push({type:'keydown', code:'Backquote'});
testactions.push({type:'keyup', code:'Backquote'});
testactions.push({type:'keyup', code:'ShiftRight'});
testactions.push({type:'keydown', code:'KeyL'});
testactions.push({type:'keydown', code:'KeyE'});
testactions.push({type:'keyup', code:'KeyL'});
testactions.push({type:'keydown', code:'KeyT'});
testactions.push({type:'keyup', code:'KeyE'});
testactions.push({type:'keyup', code:'KeyT'});
testactions.push({type:'keydown', code:'ShiftRight'});
testactions.push({type:'keydown', code:'Digit2'});
testactions.push({type:'keyup', code:'Digit2'});
testactions.push({type:'keyup', code:'ShiftRight'});
testactions.push({type:'keydown', code:'KeyA'});
testactions.push({type:'keyup', code:'KeyA'});
testactions.push({type:'keydown', code:'ShiftRight'});
testactions.push({type:'keydown', code:'Digit3'});
testactions.push({type:'keyup', code:'Digit3'});
testactions.push({type:'keyup', code:'ShiftRight'});
testactions.push({type:'keydown', code:'Digit1'});
testactions.push({type:'keyup', code:'Digit1'});
testactions.push({type:'keydown', code:'Digit0'});
testactions.push({type:'keyup', code:'Digit0'});
testactions.push({type:'keydown', code:'ShiftRight'});
testactions.push({type:'keydown', code:'Tab'});
testactions.push({type:'keyup', code:'Tab'});
testactions.push({type:'keyup', code:'ShiftRight'});
testactions.push({type:'keydown', code:'ShiftRight'});
testactions.push({type:'keydown', code:'Backquote'});
testactions.push({type:'keyup', code:'Backquote'});
testactions.push({type:'keyup', code:'ShiftRight'});
testactions.push({type:'keydown', code:'KeyL'});
testactions.push({type:'keydown', code:'KeyE'});
testactions.push({type:'keydown', code:'KeyT'});
testactions.push({type:'keyup', code:'KeyL'});
testactions.push({type:'keyup', code:'KeyE'});
testactions.push({type:'keyup', code:'KeyT'});
testactions.push({type:'keydown', code:'ShiftRight'});
testactions.push({type:'keydown', code:'Digit2'});
testactions.push({type:'keyup', code:'Digit2'});
testactions.push({type:'keyup', code:'ShiftRight'});
testactions.push({type:'keydown', code:'KeyB'});
testactions.push({type:'keyup', code:'KeyB'});
testactions.push({type:'keydown', code:'ShiftLeft'}); // type &
testactions.push({type:'keydown', code:'Digit7'});
testactions.push({type:'keyup', code:'Digit7'});
testactions.push({type:'keyup', code:'ShiftLeft'});
testactions.push({type:'keydown', code:'Enter'});
testactions.push({type:'keyup', code:'Enter'});
testactions.push({type:'keydown', code:'ShiftLeft'}); // change orientation
testactions.push({type:'keydown', code:'Space'});
testactions.push({type:'keyup', code:'Space'});
testactions.push({type:'keyup', code:'ShiftLeft'});
testactions.push({type:'keydown', code:'ShiftRight'});
testactions.push({type:'keydown', code:'Backquote'});
testactions.push({type:'keyup', code:'Backquote'});
testactions.push({type:'keyup', code:'ShiftRight'});
testactions.push({type:'keydown', code:'KeyE'});
testactions.push({type:'keyup', code:'KeyE'});
testactions.push({type:'keydown', code:'Backspace'});
testactions.push({type:'keyup', code:'Backspace'});
testactions.push({type:'keydown', code:'KeyS'});
testactions.push({type:'keyup', code:'KeyS'});
testactions.push({type:'keydown', code:'KeyE'});
testactions.push({type:'keydown', code:'KeyT'});
testactions.push({type:'keyup', code:'KeyE'});
testactions.push({type:'keyup', code:'KeyT'});
testactions.push({type:'keydown', code:'ShiftRight'});
testactions.push({type:'keydown', code:'Digit2'});
testactions.push({type:'keyup', code:'Digit2'});
testactions.push({type:'keyup', code:'ShiftRight'});
testactions.push({type:'keydown', code:'KeyA'});
testactions.push({type:'keyup', code:'KeyA'});
testactions.push({type:'keydown', code:'ShiftRight'});
testactions.push({type:'keydown', code:'Digit3'});
testactions.push({type:'keyup', code:'Digit3'});
testactions.push({type:'keyup', code:'ShiftRight'});
testactions.push({type:'keydown', code:'Digit1'});
testactions.push({type:'keyup', code:'Digit1'});
testactions.push({type:'keydown', code:'Digit0'});
testactions.push({type:'keyup', code:'Digit0'});
testactions.push({type:'keydown', code:'Digit0'});
testactions.push({type:'keyup', code:'Digit0'});
testactions.push({type:'keydown', code:'ShiftRight'});
testactions.push({type:'keydown', code:'Tab'});
testactions.push({type:'keyup', code:'Tab'});
testactions.push({type:'keydown', code:'Tab'});
testactions.push({type:'keyup', code:'Tab'});
testactions.push({type:'keydown', code:'Tab'});
testactions.push({type:'keyup', code:'Tab'});
testactions.push({type:'keyup', code:'ShiftRight'});
testactions.push({type:'keydown', code:'ShiftRight'});
testactions.push({type:'keydown', code:'Backquote'});
testactions.push({type:'keyup', code:'Backquote'});
testactions.push({type:'keyup', code:'ShiftRight'});
testactions.push({type:'keydown', code:'KeyB'});
testactions.push({type:'keyup', code:'KeyB'});
testactions.push({type:'keydown', code:'ArrowRight'});
testactions.push({type:'keyup', code:'ArrowRight'});
testactions.push({type:'keydown', code:'ShiftRight'});
testactions.push({type:'keydown', code:'Digit2'});
testactions.push({type:'keyup', code:'Digit2'});
testactions.push({type:'keyup', code:'ShiftRight'});
testactions.push({type:'keydown', code:'KeyA'});
testactions.push({type:'keyup', code:'KeyA'});
testactions.push({type:'keydown', code:'ShiftRight'});
testactions.push({type:'keydown', code:'Tab'});
testactions.push({type:'keyup', code:'Tab'});
testactions.push({type:'keydown', code:'Tab'});
testactions.push({type:'keyup', code:'Tab'});
testactions.push({type:'keyup', code:'ShiftRight'});
testactions.push({type:'keydown', code:'ShiftLeft'});
testactions.push({type:'keydown', code:'Enter'});
testactions.push({type:'keyup', code:'Enter'});
testactions.push({type:'keyup', code:'ShiftLeft'});
harness.runTest(testactions, 'direct');
//endtest//
