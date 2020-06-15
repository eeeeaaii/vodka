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
//testname// actions_funnel_emptylines
//startdescription//
/*
[none]
*/
//enddescription//
//testspec// [none]
//starttest//
var harness = require('../testharness');
harness.runTest(function() {
doKeyInput('Escape', 'Escape', false, false, false);
doKeyInput('e', 'KeyE', false, false, false);
doKeyInput('m', 'KeyM', false, false, false);
doKeyInput('p', 'KeyP', false, false, false);
doKeyInput('t', 'KeyT', false, false, false);
doKeyInput('y', 'KeyY', false, false, false);
doKeyInput('l', 'KeyL', false, false, false);
doKeyInput('i', 'KeyI', false, false, false);
doKeyInput('n', 'KeyN', false, false, false);
doKeyInput('e', 'KeyE', false, false, false);
doKeyInput('s', 'KeyS', false, false, false);
doKeyInput('Enter', 'Enter', false, false, false);
doKeyInput('Enter', 'Enter', false, false, false);
doKeyInput('Enter', 'Enter', false, false, false);
doKeyInput('Enter', 'Enter', false, false, false);
doKeyInput('t', 'KeyT', false, false, false);
doKeyInput('h', 'KeyH', false, false, false);
doKeyInput('e', 'KeyE', false, false, false);
doKeyInput('r', 'KeyR', false, false, false);
doKeyInput('e', 'KeyE', false, false, false);
doKeyInput('.', 'Period', false, false, false);
});
//endtest//
