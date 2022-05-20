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
//testname// actions_editor_string_escape
//startdescription//
/*
makes sure you can put html-type characters into a string and they will render correctly (like <, >, &, etc)
*/
//enddescription//
//testspec// |Shift|$|Shift|Enter|Shift|<|d|i|v|Tab|Enter|Shift|$|Shift|Enter|Shift|>|d|i|v|Tab|Enter|Shift|$|Shift|Enter|Shift|&|d|i|v|Tab|Enter|Shift|$|Shift|Enter|Shift|"|d|i|v|Tab|Enter|Shift|$|Shift|Enter|'|d|i|v|Tab|Enter
//starttest//
var harness = require('../testharness');

var testactions = [];
testactions.push({type:'keyup',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'Backspace'});
testactions.push({type:'keyup',code:'Backspace'});
testactions.push({type:'keyup',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit4'});
testactions.push({type:'keyup',code:'Digit4'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'ShiftLeft'});
testactions.push({type:'keyup',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'Comma'});
testactions.push({type:'keyup',code:'Comma'});
testactions.push({type:'keyup',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'KeyD'});
testactions.push({type:'keydown',code:'KeyI'});
testactions.push({type:'keyup',code:'KeyD'});
testactions.push({type:'keyup',code:'KeyI'});
testactions.push({type:'keydown',code:'KeyV'});
testactions.push({type:'keyup',code:'KeyV'});
testactions.push({type:'keydown',code:'Tab'});
testactions.push({type:'keyup',code:'Tab'});
testactions.push({type:'keydown',code:'Enter'});
testactions.push({type:'click',x:'0',y:'0'});
testactions.push({type:'keyup',code:'Enter'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit4'});
testactions.push({type:'keyup',code:'Digit4'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'ShiftLeft'});
testactions.push({type:'keyup',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'Period'});
testactions.push({type:'keyup',code:'ShiftLeft'});
testactions.push({type:'keyup',code:'Period'});
testactions.push({type:'keydown',code:'KeyD'});
testactions.push({type:'keydown',code:'KeyI'});
testactions.push({type:'keyup',code:'KeyD'});
testactions.push({type:'keyup',code:'KeyI'});
testactions.push({type:'keydown',code:'KeyV'});
testactions.push({type:'keyup',code:'KeyV'});
testactions.push({type:'keydown',code:'Tab'});
testactions.push({type:'keyup',code:'Tab'});
testactions.push({type:'keydown',code:'Enter'});
testactions.push({type:'click',x:'0',y:'0'});
testactions.push({type:'keyup',code:'Enter'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit4'});
testactions.push({type:'keyup',code:'Digit4'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'ShiftLeft'});
testactions.push({type:'keyup',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'Digit7'});
testactions.push({type:'keyup',code:'Digit7'});
testactions.push({type:'keyup',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'KeyD'});
testactions.push({type:'keydown',code:'KeyI'});
testactions.push({type:'keyup',code:'KeyD'});
testactions.push({type:'keyup',code:'KeyI'});
testactions.push({type:'keydown',code:'KeyV'});
testactions.push({type:'keyup',code:'KeyV'});
testactions.push({type:'keydown',code:'Tab'});
testactions.push({type:'keyup',code:'Tab'});
testactions.push({type:'keydown',code:'Enter'});
testactions.push({type:'click',x:'0',y:'0'});
testactions.push({type:'keyup',code:'Enter'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit4'});
testactions.push({type:'keyup',code:'Digit4'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'ShiftLeft'});
testactions.push({type:'keyup',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Quote'});
testactions.push({type:'keyup',code:'Quote'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'KeyD'});
testactions.push({type:'keydown',code:'KeyI'});
testactions.push({type:'keyup',code:'KeyD'});
testactions.push({type:'keyup',code:'KeyI'});
testactions.push({type:'keydown',code:'KeyV'});
testactions.push({type:'keyup',code:'KeyV'});
testactions.push({type:'keydown',code:'Tab'});
testactions.push({type:'keyup',code:'Tab'});
testactions.push({type:'keydown',code:'Enter'});
testactions.push({type:'click',x:'0',y:'0'});
testactions.push({type:'keyup',code:'Enter'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit4'});
testactions.push({type:'keyup',code:'Digit4'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'ShiftLeft'});
testactions.push({type:'keyup',code:'ShiftLeft'});
testactions.push({type:'keydown',code:'Quote'});
testactions.push({type:'keyup',code:'Quote'});
testactions.push({type:'keydown',code:'KeyD'});
testactions.push({type:'keydown',code:'KeyI'});
testactions.push({type:'keyup',code:'KeyD'});
testactions.push({type:'keyup',code:'KeyI'});
testactions.push({type:'keydown',code:'KeyV'});
testactions.push({type:'keyup',code:'KeyV'});
testactions.push({type:'keydown',code:'Tab'});
testactions.push({type:'keyup',code:'Tab'});
testactions.push({type:'keydown',code:'Enter'});
testactions.push({type:'click',x:'0',y:'0'});
testactions.push({type:'keyup',code:'Enter'});

const experiment_flags = {
"V2_INSERTION_LENIENT_DOC_FORMAT":true,
"NO_COPY_CSS":true,
"DISABLE_ALERT_ANIMATIONS":true,
"BETTER_KEYBINDINGS":true,
"MAX_RENDER_DEPTH":100,
"NO_SPLASH":true,
"REMAINING_EDITORS":true,
"CAN_HAVE_EMPTY_ROOT":true,
"NEW_CLOSURE_DISPLAY":true,
"THE_GREAT_MAC_WINDOWS_OPTION_CTRL_SWITCHAROO":true,
"SAVE_EVALUATES_CONTENTS":true
};

harness.runTestWithFlags(testactions, 'direct', experiment_flags);
//endtest//
