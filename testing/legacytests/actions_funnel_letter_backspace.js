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
//testname// actions_funnel_letter_backspace
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
doKeyInput('a', 'KeyA', false, false, false);
doKeyInput('b', 'KeyB', false, false, false);
doKeyInput('c', 'KeyC', false, false, false);
doKeyInput('Backspace', 'Backspace', false, false, false);
});
//endtest//
