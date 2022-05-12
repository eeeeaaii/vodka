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
//testname// actions_funnel_midseparatorlinebreak
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
doKeyInput('Shift', 'ShiftLeft', true, false, false);
doKeyInput('H', 'KeyH', true, false, false);
doKeyInput('e', 'KeyE', false, false, false);
doKeyInput('l', 'KeyL', false, false, false);
doKeyInput('l', 'KeyL', false, false, false);
doKeyInput('o', 'KeyO', false, false, false);
doKeyInput(' ', 'Space', false, false, false);
doKeyInput('w', 'KeyW', false, false, false);
doKeyInput('o', 'KeyO', false, false, false);
doKeyInput('r', 'KeyR', false, false, false);
doKeyInput('l', 'KeyL', false, false, false);
doKeyInput('d', 'KeyD', false, false, false);
doKeyInput('ArrowLeft', 'ArrowLeft', false, false, false);
doKeyInput('ArrowLeft', 'ArrowLeft', false, false, false);
doKeyInput('ArrowLeft', 'ArrowLeft', false, false, false);
doKeyInput('ArrowLeft', 'ArrowLeft', false, false, false);
doKeyInput('ArrowLeft', 'ArrowLeft', false, false, false);
doKeyInput('Enter', 'Enter', false, false, false);
doKeyInput('ArrowLeft', 'ArrowLeft', false, false, false);
});
//endtest//
