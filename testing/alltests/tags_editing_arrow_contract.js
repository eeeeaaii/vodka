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
//testname// tags_editing_arrow_contract
//startdescription//
/*
verifies that hitting arrow to switch tags will check the contract first and, if not satisfied, will 1. throw an error 2. put the tag back to its previous value
*/
//enddescription//
//testspec// |Shift|~|m|u|s|t|-|h|a|v|e|-|t|y|p|e|-|o|f|Shift|^|`|i|n|t|e|g|e|r|Enter|Shift|#|Shift|Tab|Enter|Shift|#|`|z|ArrowRight|i|n|t|ArrowLeft|ArrowRight|e|g|e|r|ArrowLeft|Enter|Shift|@|`|z|ArrowRight|i|n|t|ArrowLeft|ArrowRight|e|g|e|r|ArrowLeft
//starttest//
var harness = require('../testharness');

var testactions = [];

testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Backquote'});
testactions.push({type:'keyup',code:'Backquote'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'KeyM'});
testactions.push({type:'keyup',code:'KeyM'});
testactions.push({type:'keydown',code:'KeyU'});
testactions.push({type:'keydown',code:'KeyS'});
testactions.push({type:'keyup',code:'KeyU'});
testactions.push({type:'keydown',code:'KeyT'});
testactions.push({type:'keyup',code:'KeyS'});
testactions.push({type:'keydown',code:'Minus'});
testactions.push({type:'keyup',code:'KeyT'});
testactions.push({type:'keyup',code:'Minus'});
testactions.push({type:'keydown',code:'KeyH'});
testactions.push({type:'keydown',code:'KeyA'});
testactions.push({type:'keyup',code:'KeyH'});
testactions.push({type:'keydown',code:'KeyV'});
testactions.push({type:'keydown',code:'KeyE'});
testactions.push({type:'keyup',code:'KeyA'});
testactions.push({type:'keyup',code:'KeyV'});
testactions.push({type:'keydown',code:'Minus'});
testactions.push({type:'keyup',code:'KeyE'});
testactions.push({type:'keyup',code:'Minus'});
testactions.push({type:'keydown',code:'KeyT'});
testactions.push({type:'keydown',code:'KeyY'});
testactions.push({type:'keyup',code:'KeyT'});
testactions.push({type:'keydown',code:'KeyP'});
testactions.push({type:'keyup',code:'KeyY'});
testactions.push({type:'keydown',code:'KeyE'});
testactions.push({type:'keyup',code:'KeyP'});
testactions.push({type:'keyup',code:'KeyE'});
testactions.push({type:'keydown',code:'Minus'});
testactions.push({type:'keyup',code:'Minus'});
testactions.push({type:'keydown',code:'KeyO'});
testactions.push({type:'keydown',code:'KeyF'});
testactions.push({type:'keyup',code:'KeyO'});
testactions.push({type:'keyup',code:'KeyF'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit6'});
testactions.push({type:'keyup',code:'Digit6'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Backquote'});
testactions.push({type:'keyup',code:'Backquote'});
testactions.push({type:'keydown',code:'KeyI'});
testactions.push({type:'keyup',code:'KeyI'});
testactions.push({type:'keydown',code:'KeyN'});
testactions.push({type:'keyup',code:'KeyN'});
testactions.push({type:'keydown',code:'KeyT'});
testactions.push({type:'keyup',code:'KeyT'});
testactions.push({type:'keydown',code:'KeyE'});
testactions.push({type:'keyup',code:'KeyE'});
testactions.push({type:'keydown',code:'KeyG'});
testactions.push({type:'keyup',code:'KeyG'});
testactions.push({type:'keydown',code:'KeyE'});
testactions.push({type:'keydown',code:'KeyR'});
testactions.push({type:'keyup',code:'KeyE'});
testactions.push({type:'keyup',code:'KeyR'});
testactions.push({type:'keydown',code:'Enter'});
testactions.push({type:'keyup',code:'Enter'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit3'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keyup',code:'Digit3'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Tab'});
testactions.push({type:'keyup',code:'Tab'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Enter'});
testactions.push({type:'keyup',code:'Enter'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit3'});
testactions.push({type:'keyup',code:'Digit3'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Backquote'});
testactions.push({type:'keyup',code:'Backquote'});
testactions.push({type:'keydown',code:'KeyZ'});
testactions.push({type:'keyup',code:'KeyZ'});
testactions.push({type:'keydown',code:'ArrowRight'});
testactions.push({type:'keyup',code:'ArrowRight'});
testactions.push({type:'keydown',code:'KeyI'});
testactions.push({type:'keyup',code:'KeyI'});
testactions.push({type:'keydown',code:'KeyN'});
testactions.push({type:'keyup',code:'KeyN'});
testactions.push({type:'keydown',code:'KeyT'});
testactions.push({type:'keyup',code:'KeyT'});
testactions.push({type:'keydown',code:'ArrowLeft'});
testactions.push({type:'keyup',code:'ArrowLeft'});
testactions.push({type:'keydown',code:'ArrowRight'});
testactions.push({type:'keyup',code:'ArrowRight'});
testactions.push({type:'keydown',code:'KeyE'});
testactions.push({type:'keyup',code:'KeyE'});
testactions.push({type:'keydown',code:'KeyG'});
testactions.push({type:'keyup',code:'KeyG'});
testactions.push({type:'keydown',code:'KeyE'});
testactions.push({type:'keydown',code:'KeyR'});
testactions.push({type:'keyup',code:'KeyE'});
testactions.push({type:'keyup',code:'KeyR'});
testactions.push({type:'keydown',code:'ArrowLeft'});
testactions.push({type:'keyup',code:'ArrowLeft'});
testactions.push({type:'keydown',code:'Enter'});
testactions.push({type:'keyup',code:'Enter'});
testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit2'});
testactions.push({type:'keyup',code:'Digit2'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Backquote'});
testactions.push({type:'keyup',code:'Backquote'});
testactions.push({type:'keydown',code:'KeyZ'});
testactions.push({type:'keyup',code:'KeyZ'});
testactions.push({type:'keydown',code:'ArrowRight'});
testactions.push({type:'keyup',code:'ArrowRight'});
testactions.push({type:'keydown',code:'KeyI'});
testactions.push({type:'keyup',code:'KeyI'});
testactions.push({type:'keydown',code:'KeyN'});
testactions.push({type:'keyup',code:'KeyN'});
testactions.push({type:'keydown',code:'KeyT'});
testactions.push({type:'keyup',code:'KeyT'});
testactions.push({type:'keydown',code:'ArrowLeft'});
testactions.push({type:'keyup',code:'ArrowLeft'});
testactions.push({type:'keydown',code:'ArrowRight'});
testactions.push({type:'keyup',code:'ArrowRight'});
testactions.push({type:'keydown',code:'KeyE'});
testactions.push({type:'keyup',code:'KeyE'});
testactions.push({type:'keydown',code:'KeyG'});
testactions.push({type:'keyup',code:'KeyG'});
testactions.push({type:'keydown',code:'KeyE'});
testactions.push({type:'keydown',code:'KeyR'});
testactions.push({type:'keyup',code:'KeyE'});
testactions.push({type:'keyup',code:'KeyR'});
testactions.push({type:'keydown',code:'ArrowLeft'});
testactions.push({type:'keyup',code:'ArrowLeft'});

harness.runTestNew(testactions, 'direct');
//endtest//
