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
//testname//  actions_funnel_command_typingletters
//startdescription//
/*
this verifies that if you type raw letters inside a command or a lambda, it will show you them normally without weird spacing, and will not insert words for you. inside a command context, you will have to manually create words, or make a line (or doc) and then type inside the line (or doc) and have it create words for you.
*/
//enddescription//
//testspec// |Shift|~|Tab|t|y|p|i|n|g| |w|o|r|s|;|s|d|f|;|s|d|f| |;|;|d|f|Shift|Tab|Shift|&|Tab|t|y|p|i| |s|;|s|f|d| |;|s|f|d| |Shift|(|s|d|f| |s|d|Shift|Tab|ArrowUp|Tab|Shift|(|d|f|d|f| |d|d
//starttest//
var harness = require('../testharness');
var testactions = [];
testactions.push({type:'keydown', code:'ShiftRight'});
testactions.push({type:'keydown', code:'Backquote'});
testactions.push({type:'keyup', code:'Backquote'});
testactions.push({type:'keyup', code:'ShiftRight'});
testactions.push({type:'keydown', code:'Tab'});
testactions.push({type:'keyup', code:'Tab'});
testactions.push({type:'keydown', code:'KeyT'});
testactions.push({type:'keydown', code:'KeyY'});
testactions.push({type:'keyup', code:'KeyT'});
testactions.push({type:'keydown', code:'KeyP'});
testactions.push({type:'keyup', code:'KeyY'});
testactions.push({type:'keydown', code:'KeyI'});
testactions.push({type:'keyup', code:'KeyP'});
testactions.push({type:'keyup', code:'KeyI'});
testactions.push({type:'keydown', code:'KeyN'});
testactions.push({type:'keydown', code:'KeyG'});
testactions.push({type:'keyup', code:'KeyG'});
testactions.push({type:'keydown', code:'Space'});
testactions.push({type:'keyup', code:'KeyN'});
testactions.push({type:'keydown', code:'KeyW'});
testactions.push({type:'keyup', code:'Space'});
testactions.push({type:'keydown', code:'KeyO'});
testactions.push({type:'keyup', code:'KeyW'});
testactions.push({type:'keydown', code:'KeyR'});
testactions.push({type:'keyup', code:'KeyO'});
testactions.push({type:'keyup', code:'KeyR'});
testactions.push({type:'keydown', code:'KeyS'});
testactions.push({type:'keyup', code:'KeyS'});
testactions.push({type:'keydown', code:'Semicolon'});
testactions.push({type:'keyup', code:'Semicolon'});
testactions.push({type:'keydown', code:'KeyS'});
testactions.push({type:'keydown', code:'KeyD'});
testactions.push({type:'keyup', code:'KeyS'});
testactions.push({type:'keydown', code:'KeyF'});
testactions.push({type:'keyup', code:'KeyD'});
testactions.push({type:'keyup', code:'KeyF'});
testactions.push({type:'keydown', code:'Semicolon'});
testactions.push({type:'keydown', code:'KeyS'});
testactions.push({type:'keyup', code:'Semicolon'});
testactions.push({type:'keydown', code:'KeyD'});
testactions.push({type:'keydown', code:'KeyF'});
testactions.push({type:'keyup', code:'KeyS'});
testactions.push({type:'keyup', code:'KeyD'});
testactions.push({type:'keyup', code:'KeyF'});
testactions.push({type:'keydown', code:'Space'});
testactions.push({type:'keydown', code:'Semicolon'});
testactions.push({type:'keyup', code:'Space'});
testactions.push({type:'keyup', code:'Semicolon'});
testactions.push({type:'keydown', code:'Semicolon'});
testactions.push({type:'keyup', code:'Semicolon'});
testactions.push({type:'keydown', code:'KeyD'});
testactions.push({type:'keydown', code:'KeyF'});
testactions.push({type:'keyup', code:'KeyD'});
testactions.push({type:'keyup', code:'KeyF'});
testactions.push({type:'keydown', code:'ShiftRight'});
testactions.push({type:'keydown', code:'Tab'});
testactions.push({type:'keyup', code:'Tab'});
testactions.push({type:'keyup', code:'ShiftRight'});
testactions.push({type:'keydown', code:'ShiftLeft'});
testactions.push({type:'keydown', code:'Digit7'});
testactions.push({type:'keyup', code:'Digit7'});
testactions.push({type:'keyup', code:'ShiftLeft'});
testactions.push({type:'keydown', code:'Tab'});
testactions.push({type:'keyup', code:'Tab'});
testactions.push({type:'keydown', code:'KeyT'});
testactions.push({type:'keydown', code:'KeyY'});
testactions.push({type:'keyup', code:'KeyT'});
testactions.push({type:'keydown', code:'KeyP'});
testactions.push({type:'keyup', code:'KeyY'});
testactions.push({type:'keyup', code:'KeyP'});
testactions.push({type:'keydown', code:'KeyI'});
testactions.push({type:'keyup', code:'KeyI'});
testactions.push({type:'keydown', code:'Space'});
testactions.push({type:'keyup', code:'Space'});
testactions.push({type:'keydown', code:'KeyS'});
testactions.push({type:'keydown', code:'Semicolon'});
testactions.push({type:'keyup', code:'KeyS'});
testactions.push({type:'keyup', code:'Semicolon'});
testactions.push({type:'keydown', code:'KeyS'});
testactions.push({type:'keyup', code:'KeyS'});
testactions.push({type:'keydown', code:'KeyF'});
testactions.push({type:'keydown', code:'KeyD'});
testactions.push({type:'keyup', code:'KeyD'});
testactions.push({type:'keyup', code:'KeyF'});
testactions.push({type:'keydown', code:'Space'});
testactions.push({type:'keyup', code:'Space'});
testactions.push({type:'keydown', code:'Semicolon'});
testactions.push({type:'keyup', code:'Semicolon'});
testactions.push({type:'keydown', code:'KeyS'});
testactions.push({type:'keydown', code:'KeyF'});
testactions.push({type:'keyup', code:'KeyS'});
testactions.push({type:'keydown', code:'KeyD'});
testactions.push({type:'keyup', code:'KeyF'});
testactions.push({type:'keyup', code:'KeyD'});
testactions.push({type:'keydown', code:'Space'});
testactions.push({type:'keyup', code:'Space'});
testactions.push({type:'keydown', code:'ShiftLeft'});
testactions.push({type:'keydown', code:'Digit9'});
testactions.push({type:'keyup', code:'Digit9'});
testactions.push({type:'keyup', code:'ShiftLeft'});
testactions.push({type:'keydown', code:'KeyS'});
testactions.push({type:'keydown', code:'KeyD'});
testactions.push({type:'keyup', code:'KeyS'});
testactions.push({type:'keydown', code:'KeyF'});
testactions.push({type:'keyup', code:'KeyD'});
testactions.push({type:'keyup', code:'KeyF'});
testactions.push({type:'keydown', code:'Space'});
testactions.push({type:'keyup', code:'Space'});
testactions.push({type:'keydown', code:'KeyS'});
testactions.push({type:'keydown', code:'KeyD'});
testactions.push({type:'keyup', code:'KeyS'});
testactions.push({type:'keyup', code:'KeyD'});
testactions.push({type:'keydown', code:'ShiftRight'});
testactions.push({type:'keydown', code:'Tab'});
testactions.push({type:'keyup', code:'Tab'});
testactions.push({type:'keyup', code:'ShiftRight'});
testactions.push({type:'keydown', code:'ArrowUp'});
testactions.push({type:'keyup', code:'ArrowUp'});
testactions.push({type:'keydown', code:'Tab'});
testactions.push({type:'keyup', code:'Tab'});
testactions.push({type:'keydown', code:'ArrowRight'});
testactions.push({type:'keyup', code:'ArrowRight'});
testactions.push({type:'keydown', code:'ShiftLeft'});
testactions.push({type:'keydown', code:'Digit9'});
testactions.push({type:'keyup', code:'Digit9'});
testactions.push({type:'keyup', code:'ShiftLeft'});
testactions.push({type:'keydown', code:'KeyD'});
testactions.push({type:'keydown', code:'KeyF'});
testactions.push({type:'keyup', code:'KeyD'});
testactions.push({type:'keyup', code:'KeyF'});
testactions.push({type:'keydown', code:'KeyD'});
testactions.push({type:'keydown', code:'KeyF'});
testactions.push({type:'keyup', code:'KeyD'});
testactions.push({type:'keyup', code:'KeyF'});
testactions.push({type:'keydown', code:'Space'});
testactions.push({type:'keyup', code:'Space'});
testactions.push({type:'keydown', code:'KeyD'});
testactions.push({type:'keyup', code:'KeyD'});
testactions.push({type:'keydown', code:'KeyD'});
testactions.push({type:'keyup', code:'KeyD'});
harness.runTest(testactions, 'direct');
//endtest//
