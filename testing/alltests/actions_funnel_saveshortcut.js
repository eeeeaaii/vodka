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
//testname// actions_funnel_saveshortcut
//startdescription//
/*
tests the command-s save shortcut, including testing that it works the second time.
*/
//enddescription//
//testspec// |s|o|m|e|c|o|d|e|Shift|#|3|Shift|#|3|Shift|#|3|Shift|Enter|Meta|s|Backspace|Backspace|Backspace|Backspace|Backspace|Backspace|Backspace|Backspace|Backspace|Backspace|Backspace|Backspace|Backspace|Backspace|Backspace|Backspace|Backspace|t|Backspace|Backspace|t|Enter|Shift|Tab|Shift|Enter|Tab|ArrowRight|ArrowRight|Tab|m|o|r|e|c|o|d|e|Enter|Meta|s
//starttest//
var harness = require('../testharness');

var testactions = [];

testactions.push({type:'keydown',code:'KeyS'});
testactions.push({type:'keydown',code:'KeyO'});
testactions.push({type:'keyup',code:'KeyS'});
testactions.push({type:'keydown',code:'KeyM'});
testactions.push({type:'keyup',code:'KeyO'});
testactions.push({type:'keydown',code:'KeyE'});
testactions.push({type:'keyup',code:'KeyM'});
testactions.push({type:'keyup',code:'KeyE'});
testactions.push({type:'keydown',code:'KeyC'});
testactions.push({type:'keydown',code:'KeyO'});
testactions.push({type:'keyup',code:'KeyC'});
testactions.push({type:'keyup',code:'KeyO'});
testactions.push({type:'keydown',code:'KeyD'});
testactions.push({type:'keyup',code:'KeyD'});
testactions.push({type:'keydown',code:'KeyE'});
testactions.push({type:'keyup',code:'KeyE'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit3'});
testactions.push({type:'keyup',code:'Digit3'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit3'});
testactions.push({type:'keyup',code:'Digit3'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit3'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keyup',code:'Digit3'});
testactions.push({type:'keydown',code:'Digit3'});
testactions.push({type:'keyup',code:'Digit3'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit3'});
testactions.push({type:'keyup',code:'Digit3'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit3'});
testactions.push({type:'keyup',code:'Digit3'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Enter'});
testactions.push({type:'keyup',code:'Enter'});
testactions.push({type:'keydown',code:'MetaRight'});
testactions.push({type:'keydown',code:'KeyS'});
testactions.push({type:'keyup',code:'MetaRight'});
testactions.push({type:'keydown',code:'Backspace'});
testactions.push({type:'keydown',code:'Backspace'});
testactions.push({type:'keydown',code:'Backspace'});
testactions.push({type:'keydown',code:'Backspace'});
testactions.push({type:'keydown',code:'Backspace'});
testactions.push({type:'keydown',code:'Backspace'});
testactions.push({type:'keydown',code:'Backspace'});
testactions.push({type:'keydown',code:'Backspace'});
testactions.push({type:'keydown',code:'Backspace'});
testactions.push({type:'keydown',code:'Backspace'});
testactions.push({type:'keydown',code:'Backspace'});
testactions.push({type:'keydown',code:'Backspace'});
testactions.push({type:'keyup',code:'Backspace'});
testactions.push({type:'keydown',code:'Backspace'});
testactions.push({type:'keyup',code:'Backspace'});
testactions.push({type:'keydown',code:'Backspace'});
testactions.push({type:'keyup',code:'Backspace'});
testactions.push({type:'keydown',code:'Backspace'});
testactions.push({type:'keyup',code:'Backspace'});
testactions.push({type:'keydown',code:'Backspace'});
testactions.push({type:'keyup',code:'Backspace'});
testactions.push({type:'keydown',code:'Backspace'});
testactions.push({type:'keyup',code:'Backspace'});
testactions.push({type:'keydown',code:'KeyT'});
testactions.push({type:'keyup',code:'KeyT'});
testactions.push({type:'keydown',code:'Backspace'});
testactions.push({type:'keyup',code:'Backspace'});
testactions.push({type:'keydown',code:'Backspace'});
testactions.push({type:'keyup',code:'Backspace'});
testactions.push({type:'keydown',code:'KeyT'});
testactions.push({type:'keyup',code:'KeyT'});
testactions.push({type:'keydown',code:'Enter'});
testactions.push({type:'keyup',code:'Enter'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Tab'});
testactions.push({type:'keyup',code:'Tab'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'Enter'});
testactions.push({type:'keyup',code:'Enter'});
testactions.push({type:'keyup',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'Tab'});
testactions.push({type:'keyup',code:'Tab'});
testactions.push({type:'keydown',code:'ArrowRight'});
testactions.push({type:'keyup',code:'ArrowRight'});
testactions.push({type:'keydown',code:'ArrowRight'});
testactions.push({type:'keyup',code:'ArrowRight'});
testactions.push({type:'keydown',code:'Tab'});
testactions.push({type:'keyup',code:'Tab'});
testactions.push({type:'keydown',code:'KeyM'});
testactions.push({type:'keydown',code:'KeyO'});
testactions.push({type:'keyup',code:'KeyM'});
testactions.push({type:'keydown',code:'KeyR'});
testactions.push({type:'keydown',code:'KeyE'});
testactions.push({type:'keyup',code:'KeyR'});
testactions.push({type:'keyup',code:'KeyO'});
testactions.push({type:'keyup',code:'KeyE'});
testactions.push({type:'keydown',code:'KeyC'});
testactions.push({type:'keydown',code:'KeyO'});
testactions.push({type:'keyup',code:'KeyC'});
testactions.push({type:'keydown',code:'KeyD'});
testactions.push({type:'keyup',code:'KeyO'});
testactions.push({type:'keyup',code:'KeyD'});
testactions.push({type:'keydown',code:'KeyE'});
testactions.push({type:'keyup',code:'KeyE'});
testactions.push({type:'keydown',code:'Enter'});
testactions.push({type:'keyup',code:'Enter'});
testactions.push({type:'keydown',code:'MetaRight'});
testactions.push({type:'keydown',code:'KeyS'});
testactions.push({type:'keyup',code:'MetaRight'});

const experiment_flags = {
"DISABLE_ALERT_ANIMATIONS":true,
"MAX_RENDER_DEPTH":100,
"NO_SPLASH":true,
"V2_INSERTION_LENIENT_DOC_FORMAT":false,
"ASM_RUNTIME":false,
"OLD_ARROW_KEY_TRAVERSAL":false,
"ERRORS_REPLACE":true,
"STATIC_PIPS":true,
"SHOULD_REVERT_TO_CANONICAL_NAME":false
};
	

harness.runTestWithFlags(testactions, 'direct', experiment_flags);
//endtest//
