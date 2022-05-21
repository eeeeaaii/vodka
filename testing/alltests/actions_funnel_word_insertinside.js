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
//testname// actions_funnel_word_insertinside
//startdescription//
/*
verifies correct behavior when you have a word selected and you insert a separator or letter
*/
//enddescription//
//testspec// |Shift|~|a|Enter|Shift|<|Shift|!|Shift|Tab|Shift|<|Shift|@|Shift|Tab|Shift|<|Shift|#|Shift|Tab|Shift|<|Shift|$|Shift|Tab|Shift|<|Shift|%|Shift|Tab|Shift|<|Shift|^|Shift|Tab|Shift|<|Shift|&|Shift|Tab|Shift|<|Shift|*|Shift|Tab|Shift|<|Shift|(|Shift|Tab|Shift|<|Shift|<|Shift|Tab|Shift|<|Shift|)|Shift|{|Shift|Tab
//starttest//
var harness = require('../testharness');

var testactions = [];

testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Backquote'});
testactions.push({type:'keyup',code:'Backquote'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'KeyA'});
testactions.push({type:'keyup',code:'KeyA'});
testactions.push({type:'keydown',code:'Enter'});
testactions.push({type:'keyup',code:'Enter'});
testactions.push({type:'keydown',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'Comma'});
testactions.push({type:'keyup',code:'ShiftLeft'});
testactions.push({type:'keyup',code:'Comma'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit1'});
testactions.push({type:'keyup',code:'Digit1'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Tab'});
testactions.push({type:'keyup',code:'Tab'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'Comma'});
testactions.push({type:'keyup',code:'ShiftLeft'});
testactions.push({type:'keyup',code:'Comma'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit2'});
testactions.push({type:'keyup',code:'Digit2'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Tab'});
testactions.push({type:'keyup',code:'Tab'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'Comma'});
testactions.push({type:'keyup',code:'ShiftLeft'});
testactions.push({type:'keyup',code:'Comma'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit3'});
testactions.push({type:'keyup',code:'Digit3'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Tab'});
testactions.push({type:'keyup',code:'Tab'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'Comma'});
testactions.push({type:'keyup',code:'ShiftLeft'});
testactions.push({type:'keyup',code:'Comma'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit4'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keyup',code:'Digit4'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Tab'});
testactions.push({type:'keyup',code:'Tab'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'Comma'});
testactions.push({type:'keyup',code:'ShiftLeft'});
testactions.push({type:'keyup',code:'Comma'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit5'});
testactions.push({type:'keyup',code:'Digit5'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Tab'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keyup',code:'Tab'});
testactions.push({type:'keydown',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'Comma'});
testactions.push({type:'keyup',code:'ShiftLeft'});
testactions.push({type:'keyup',code:'Comma'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit6'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keyup',code:'Digit6'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Tab'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keyup',code:'Tab'});
testactions.push({type:'keydown',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'Comma'});
testactions.push({type:'keyup',code:'Comma'});
testactions.push({type:'keyup',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit7'});
testactions.push({type:'keyup',code:'Digit7'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Tab'});
testactions.push({type:'keyup',code:'Tab'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'Comma'});
testactions.push({type:'keyup',code:'ShiftLeft'});
testactions.push({type:'keyup',code:'Comma'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit8'});
testactions.push({type:'keyup',code:'Digit8'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Tab'});
testactions.push({type:'keyup',code:'Tab'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'Comma'});
testactions.push({type:'keyup',code:'Comma'});
testactions.push({type:'keyup',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit9'});
testactions.push({type:'keyup',code:'Digit9'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Tab'});
testactions.push({type:'keyup',code:'Tab'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'Comma'});
testactions.push({type:'keyup',code:'Comma'});
testactions.push({type:'keyup',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'Comma'});
testactions.push({type:'keyup',code:'ShiftLeft'});
testactions.push({type:'keyup',code:'Comma'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Tab'});
testactions.push({type:'keyup',code:'Tab'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'Comma'});
testactions.push({type:'keyup',code:'Comma'});
testactions.push({type:'keyup',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'Digit0'});
testactions.push({type:'keyup',code:'Digit0'});
testactions.push({type:'keyup',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'BracketLeft'});
testactions.push({type:'keyup',code:'BracketLeft'});
testactions.push({type:'keyup',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Tab'});
testactions.push({type:'keyup',code:'Tab'});
testactions.push({type:'keyup',code:'ShiftRight'});

const experiment_flags = {
"DISABLE_ALERT_ANIMATIONS":true,
"MAX_RENDER_DEPTH":100,
"NO_SPLASH":true,
"V2_INSERTION_LENIENT_DOC_FORMAT":false,
"ASM_RUNTIME":false,
"OLD_ARROW_KEY_TRAVERSAL":false,
"ERRORS_REPLACE":true,
"STATIC_PIPS":false
};
	

harness.runTestWithFlags(testactions, 'direct', experiment_flags);
//endtest//
