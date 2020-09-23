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
//testname// tags_editing_arrow_leftmostempty
//startdescription//
/*
verifies that arrowing left on the leftmost tag makes a new empty tag to the left
*/
//enddescription//
//testspec// |Shift|@|a|p|p|l|e|Enter|`|b|a|n|a|n|a|ArrowLeft|t|a|g|ArrowLeft
//starttest//
var harness = require('../testharness');

var testactions = [];

testactions.push({type:'keydown',code:'ShiftRight'});
testactions.push({type:'keydown',code:'Digit2'});
testactions.push({type:'keyup',code:'Digit2'});
testactions.push({type:'keyup',code:'ShiftRight'});
testactions.push({type:'keydown',code:'KeyA'});
testactions.push({type:'keydown',code:'KeyP'});
testactions.push({type:'keyup',code:'KeyA'});
testactions.push({type:'keyup',code:'KeyP'});
testactions.push({type:'keydown',code:'KeyP'});
testactions.push({type:'keyup',code:'KeyP'});
testactions.push({type:'keydown',code:'KeyL'});
testactions.push({type:'keydown',code:'KeyE'});
testactions.push({type:'keyup',code:'KeyE'});
testactions.push({type:'keyup',code:'KeyL'});
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
testactions.push({type:'keydown',code:'KeyN'});
testactions.push({type:'keyup',code:'KeyA'});
testactions.push({type:'keydown',code:'KeyA'});
testactions.push({type:'keyup',code:'KeyN'});
testactions.push({type:'keyup',code:'KeyA'});
testactions.push({type:'keydown',code:'ArrowLeft'});
testactions.push({type:'keyup',code:'ArrowLeft'});
testactions.push({type:'keydown',code:'KeyT'});
testactions.push({type:'keyup',code:'KeyT'});
testactions.push({type:'keydown',code:'KeyA'});
testactions.push({type:'keyup',code:'KeyA'});
testactions.push({type:'keydown',code:'KeyG'});
testactions.push({type:'keyup',code:'KeyG'});
testactions.push({type:'keydown',code:'ArrowLeft'});
testactions.push({type:'keyup',code:'ArrowLeft'});

harness.runTestNew(testactions, 'direct');
//endtest//
