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
//testname// tags_editing_backspace_emptytag_nolefttag
//startdescription//
/*
regular backspace on empty tag which is the first one leaves tag edit mode
*/
//enddescription//
//testspec// |Shift|@|a|p|p|l|e|Enter|`|b|a|n|a|n|a|ArrowRight|d|u|r|i|a|n|ArrowLeft|Backspace|Backspace|Backspace|Backspace|Backspace|Backspace|Backspace
//starttest//
var harness = require('../testharness');

var testactions = [];

testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit2'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keyup',code:'Digit2'});
testactions.push({type:'keydown',code:'KeyA'});
testactions.push({type:'keydown',code:'KeyP'});
testactions.push({type:'keyup',code:'KeyA'});
testactions.push({type:'keyup',code:'KeyP'});
testactions.push({type:'keydown',code:'KeyP'});
testactions.push({type:'keyup',code:'KeyP'});
testactions.push({type:'keydown',code:'KeyL'});
testactions.push({type:'keydown',code:'KeyE'});
testactions.push({type:'keyup',code:'KeyL'});
testactions.push({type:'keyup',code:'KeyE'});
testactions.push({type:'keydown',code:'Enter'});
testactions.push({type:'keyup',code:'Enter'});
testactions.push({type:'keydown',code:'Backquote'});
testactions.push({type:'keyup',code:'Backquote'});
testactions.push({type:'keydown',code:'KeyB'});
testactions.push({type:'keydown',code:'KeyA'});
testactions.push({type:'keyup',code:'KeyB'});
testactions.push({type:'keydown',code:'KeyN'});
testactions.push({type:'keyup',code:'KeyA'});
testactions.push({type:'keyup',code:'KeyN'});
testactions.push({type:'keydown',code:'KeyA'});
testactions.push({type:'keyup',code:'KeyA'});
testactions.push({type:'keydown',code:'KeyN'});
testactions.push({type:'keydown',code:'KeyA'});
testactions.push({type:'keyup',code:'KeyN'});
testactions.push({type:'keyup',code:'KeyA'});
testactions.push({type:'keydown',code:'ArrowRight'});
testactions.push({type:'keyup',code:'ArrowRight'});
testactions.push({type:'keydown',code:'KeyD'});
testactions.push({type:'keyup',code:'KeyD'});
testactions.push({type:'keydown',code:'KeyU'});
testactions.push({type:'keyup',code:'KeyU'});
testactions.push({type:'keydown',code:'KeyR'});
testactions.push({type:'keyup',code:'KeyR'});
testactions.push({type:'keydown',code:'KeyI'});
testactions.push({type:'keyup',code:'KeyI'});
testactions.push({type:'keydown',code:'KeyA'});
testactions.push({type:'keyup',code:'KeyA'});
testactions.push({type:'keydown',code:'KeyN'});
testactions.push({type:'keyup',code:'KeyN'});
testactions.push({type:'keydown',code:'ArrowLeft'});
testactions.push({type:'keyup',code:'ArrowLeft'});
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
testactions.push({type:'keydown',code:'Backspace'});
testactions.push({type:'keyup',code:'Backspace'});

harness.runTestNew(testactions, 'direct');
//endtest//
