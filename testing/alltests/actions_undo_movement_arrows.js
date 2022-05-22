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
//testname// actions_undo_movement_arrows
//startdescription//
/*
undoes arrow movement
*/
//enddescription//
//testspec// |Shift|(|Shift|#|#|#|#|#|#|#|#|ArrowLeft|ArrowLeft|ArrowLeft|ArrowLeft|ArrowRight|ArrowRight|Meta|z|ArrowDown|Meta|z|ArrowLeft|ArrowLeft|Meta|z|ArrowUp|Meta|z
//starttest//
var harness = require('../testharness');

var testactions = [];

testactions.push({type:'keydown',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'Digit9'});
testactions.push({type:'keyup',code:'Digit9'});
testactions.push({type:'keyup',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit3'});
testactions.push({type:'keyup',code:'Digit3'});
testactions.push({type:'keydown',code:'Digit3'});
testactions.push({type:'keyup',code:'Digit3'});
testactions.push({type:'keydown',code:'Digit3'});
testactions.push({type:'keyup',code:'Digit3'});
testactions.push({type:'keydown',code:'Digit3'});
testactions.push({type:'keyup',code:'Digit3'});
testactions.push({type:'keydown',code:'Digit3'});
testactions.push({type:'keyup',code:'Digit3'});
testactions.push({type:'keydown',code:'Digit3'});
testactions.push({type:'keyup',code:'Digit3'});
testactions.push({type:'keydown',code:'Digit3'});
testactions.push({type:'keyup',code:'Digit3'});
testactions.push({type:'keydown',code:'Digit3'});
testactions.push({type:'keyup',code:'Digit3'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'ArrowLeft'});
testactions.push({type:'keyup',code:'ArrowLeft'});
testactions.push({type:'keydown',code:'ArrowLeft'});
testactions.push({type:'keyup',code:'ArrowLeft'});
testactions.push({type:'keydown',code:'ArrowLeft'});
testactions.push({type:'keyup',code:'ArrowLeft'});
testactions.push({type:'keydown',code:'ArrowLeft'});
testactions.push({type:'keyup',code:'ArrowLeft'});
testactions.push({type:'keydown',code:'ArrowRight'});
testactions.push({type:'keyup',code:'ArrowRight'});
testactions.push({type:'keydown',code:'ArrowRight'});
testactions.push({type:'keyup',code:'ArrowRight'});
testactions.push({type:'keydown',code:'MetaRight'});
testactions.push({type:'keydown',code:'KeyZ'});
testactions.push({type:'keyup',code:'MetaRight'});
testactions.push({type:'keydown',code:'ArrowDown'});
testactions.push({type:'keyup',code:'ArrowDown'});
testactions.push({type:'keydown',code:'MetaRight'});
testactions.push({type:'keydown',code:'KeyZ'});
testactions.push({type:'keyup',code:'MetaRight'});
testactions.push({type:'keydown',code:'ArrowLeft'});
testactions.push({type:'keyup',code:'ArrowLeft'});
testactions.push({type:'keydown',code:'ArrowLeft'});
testactions.push({type:'keyup',code:'ArrowLeft'});
testactions.push({type:'keydown',code:'MetaRight'});
testactions.push({type:'keydown',code:'KeyZ'});
testactions.push({type:'keyup',code:'MetaRight'});
testactions.push({type:'keydown',code:'ArrowUp'});
testactions.push({type:'keyup',code:'ArrowUp'});
testactions.push({type:'keydown',code:'MetaRight'});
testactions.push({type:'keydown',code:'KeyZ'});
testactions.push({type:'keyup',code:'MetaRight'});

const experiment_flags = {
"DISABLE_ALERT_ANIMATIONS":true,
"MAX_RENDER_DEPTH":100,
"NO_SPLASH":true,
"V2_INSERTION_LENIENT_DOC_FORMAT":false,
"ASM_RUNTIME":false,
"OLD_ARROW_KEY_TRAVERSAL":false,
"ERRORS_REPLACE":true,
"STATIC_PIPS":true
};
	

harness.runTestWithFlags(testactions, 'direct', experiment_flags);
//endtest//
