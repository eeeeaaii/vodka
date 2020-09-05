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
//testname// execution_eval_andkeep_expectation_error
//startdescription//
/*
tests that if you eval-and-keep something that returns an expectation, and then later that expectation resolves to an error, you get the beep etc and see it.
*/
//enddescription//
//testspec// |Shift|~|l|o|a|d|Shift|@|d|s|l|k|s|d|f|Shift|Tab|Shift|Enter
//starttest//
var harness = require('../testharness');

var testactions = [];

testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Backquote'});
testactions.push({type:'keyup',code:'Backquote'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'KeyL'});
testactions.push({type:'keyup',code:'KeyL'});
testactions.push({type:'keydown',code:'KeyO'});
testactions.push({type:'keydown',code:'KeyA'});
testactions.push({type:'keydown',code:'KeyD'});
testactions.push({type:'keyup',code:'KeyO'});
testactions.push({type:'keyup',code:'KeyA'});
testactions.push({type:'keyup',code:'KeyD'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit2'});
testactions.push({type:'keyup',code:'Digit2'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'KeyD'});
testactions.push({type:'keydown',code:'KeyS'});
testactions.push({type:'keyup',code:'KeyS'});
testactions.push({type:'keyup',code:'KeyD'});
testactions.push({type:'keydown',code:'KeyL'});
testactions.push({type:'keydown',code:'KeyK'});
testactions.push({type:'keydown',code:'KeyS'});
testactions.push({type:'keyup',code:'KeyK'});
testactions.push({type:'keydown',code:'KeyD'});
testactions.push({type:'keydown',code:'KeyF'});
testactions.push({type:'keyup',code:'KeyL'});
testactions.push({type:'keyup',code:'KeyS'});
testactions.push({type:'keyup',code:'KeyD'});
testactions.push({type:'keyup',code:'KeyF'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Tab'});
testactions.push({type:'keyup',code:'Tab'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'Enter'});
testactions.push({type:'keyup',code:'Enter'});
testactions.push({type:'keyup',code:'ShiftLeft'});
testactions.push({type:'pause',length:500});

harness.runTestNew(testactions, 'direct');
//endtest//
