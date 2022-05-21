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
//testname// functions_async_waitforclick
//startdescription//
/*
wait for click function
*/
//enddescription//
//testspec// |Shift|~|b|i|n|d|Shift|@|a|Shift|$|a|p|p|l|e|s|Tab|Enter|Shift|Tab|Enter|Enter|Shift|~|w|a|i|t|-|f|o|r|-|c|l|i|c|k|Shift|@|a|Shift|Tab|Enter
//starttest//
var harness = require('../testharness');

var testactions = [];

testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Backquote'});
testactions.push({type:'keyup',code:'Backquote'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'KeyB'});
testactions.push({type:'keydown',code:'KeyI'});
testactions.push({type:'keyup',code:'KeyB'});
testactions.push({type:'keyup',code:'KeyI'});
testactions.push({type:'keydown',code:'KeyN'});
testactions.push({type:'keydown',code:'KeyD'});
testactions.push({type:'keyup',code:'KeyN'});
testactions.push({type:'keyup',code:'KeyD'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit2'});
testactions.push({type:'keyup',code:'Digit2'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'KeyA'});
testactions.push({type:'keyup',code:'KeyA'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit4'});
testactions.push({type:'keyup',code:'Digit4'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'KeyA'});
testactions.push({type:'keydown',code:'KeyP'});
testactions.push({type:'keyup',code:'KeyP'});
testactions.push({type:'keyup',code:'KeyA'});
testactions.push({type:'keydown',code:'KeyP'});
testactions.push({type:'keyup',code:'KeyP'});
testactions.push({type:'keydown',code:'KeyL'});
testactions.push({type:'keydown',code:'KeyE'});
testactions.push({type:'keyup',code:'KeyL'});
testactions.push({type:'keyup',code:'KeyE'});
testactions.push({type:'keydown',code:'KeyS'});
testactions.push({type:'keyup',code:'KeyS'});
testactions.push({type:'keydown',code:'Tab'});
testactions.push({type:'keyup',code:'Tab'});
testactions.push({type:'keydown',code:'Enter'});
testactions.push({type:'keyup',code:'Enter'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Tab'});
testactions.push({type:'keyup',code:'Tab'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Enter'});
testactions.push({type:'keyup',code:'Enter'});
testactions.push({type:'keydown',code:'Enter'});
testactions.push({type:'keyup',code:'Enter'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Backquote'});
testactions.push({type:'keyup',code:'Backquote'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'KeyW'});
testactions.push({type:'keydown',code:'KeyA'});
testactions.push({type:'keyup',code:'KeyW'});
testactions.push({type:'keydown',code:'KeyI'});
testactions.push({type:'keyup',code:'KeyA'});
testactions.push({type:'keydown',code:'KeyT'});
testactions.push({type:'keyup',code:'KeyI'});
testactions.push({type:'keyup',code:'KeyT'});
testactions.push({type:'keydown',code:'Minus'});
testactions.push({type:'keyup',code:'Minus'});
testactions.push({type:'keydown',code:'KeyF'});
testactions.push({type:'keydown',code:'KeyO'});
testactions.push({type:'keyup',code:'KeyF'});
testactions.push({type:'keyup',code:'KeyO'});
testactions.push({type:'keydown',code:'KeyR'});
testactions.push({type:'keyup',code:'KeyR'});
testactions.push({type:'keydown',code:'Minus'});
testactions.push({type:'keyup',code:'Minus'});
testactions.push({type:'keydown',code:'KeyC'});
testactions.push({type:'keydown',code:'KeyL'});
testactions.push({type:'keyup',code:'KeyC'});
testactions.push({type:'keydown',code:'KeyI'});
testactions.push({type:'keyup',code:'KeyL'});
testactions.push({type:'keyup',code:'KeyI'});
testactions.push({type:'keydown',code:'KeyC'});
testactions.push({type:'keyup',code:'KeyC'});
testactions.push({type:'keydown',code:'KeyK'});
testactions.push({type:'keyup',code:'KeyK'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit2'});
testactions.push({type:'keyup',code:'Digit2'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'KeyA'});
testactions.push({type:'keyup',code:'KeyA'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Tab'});
testactions.push({type:'keyup',code:'Tab'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Enter'});
testactions.push({type:'keyup',code:'Enter'});
testactions.push({type:'click',x:'48',y:'12'});
testactions.push({type:'click',x:'48',y:'12'});
testactions.push({type:'pause',length:1000});

const experiment_flags = {
"DISABLE_ALERT_ANIMATIONS":true,
"MAX_RENDER_DEPTH":100,
"NO_SPLASH":true,
"V2_INSERTION_LENIENT_DOC_FORMAT":false,
"ASM_RUNTIME":false,
"OLD_ARROW_KEY_TRAVERSAL":false,
"ERRORS_REPLACE":true,
};
	

harness.runTestWithFlags(testactions, 'direct', experiment_flags);
//endtest//
