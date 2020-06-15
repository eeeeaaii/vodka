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
//testname// actions_funnel_word_arrows
//testspec// [none]
//startdescription//
/*
This test types a bunch of random words into a line, separated
by semicolons and spaces etc,
then shift-tabs out to the line, then tabs into the first word.
then it hits right arrow. Originally hitting right arrow on a word
would skip separators in between and jump to the next word but I'm deprecating
that behavior - but will keep this test, just going to reset the golden.
*/
//enddescription//
//starttest//
var harness = require('../testharness');
harness.runTest(function() {
doKeyInput('Escape', 'Escape', false, false, false);
doKeyInput('h', 'KeyH', false, false, false);
doKeyInput('Shift', 'ShiftLeft', true, false, false);
doKeyInput(' ', 'Space', false, false, false);
doKeyInput(' ', 'Space', false, false, false);
doKeyInput('l', 'KeyL', false, false, false);
doKeyInput('s', 'KeyS', false, false, false);
doKeyInput('k', 'KeyK', false, false, false);
doKeyInput('d', 'KeyD', false, false, false);
doKeyInput(' ', 'Space', false, false, false);
doKeyInput(';', 'Semicolon', false, false, false);
doKeyInput(' ', 'Space', false, false, false);
doKeyInput(';', 'Semicolon', false, false, false);
doKeyInput(';', 'Semicolon', false, false, false);
doKeyInput(' ', 'Space', false, false, false);
doKeyInput('s', 'KeyS', false, false, false);
doKeyInput('d', 'KeyD', false, false, false);
doKeyInput('f', 'KeyF', false, false, false);
doKeyInput(' ', 'Space', false, false, false);
doKeyInput('s', 'KeyS', false, false, false);
doKeyInput('d', 'KeyD', false, false, false);
doKeyInput(' ', 'Space', false, false, false);
doKeyInput(' ', 'Space', false, false, false);
doKeyInput('s', 'KeyS', false, false, false);
doKeyInput('d', 'KeyD', false, false, false);
doKeyInput('f', 'KeyF', false, false, false);
doKeyInput('k', 'KeyK', false, false, false);
doKeyInput('d', 'KeyD', false, false, false);
doKeyInput('f', 'KeyF', false, false, false);
doKeyInput('k', 'KeyK', false, false, false);
doKeyInput(' ', 'Space', false, false, false);
doKeyInput('s', 'KeyS', false, false, false);
doKeyInput('d', 'KeyD', false, false, false);
doKeyInput('f', 'KeyF', false, false, false);
doKeyInput(' ', 'Space', false, false, false);
doKeyInput('s', 'KeyS', false, false, false);
doKeyInput('d', 'KeyD', false, false, false);
doKeyInput('f', 'KeyF', false, false, false);
doKeyInput('k', 'KeyK', false, false, false);
doKeyInput(' ', 'Space', false, false, false);
doKeyInput(' ', 'Space', false, false, false);
doKeyInput('k', 'KeyK', false, false, false);
doKeyInput('s', 'KeyS', false, false, false);
doKeyInput('d', 'KeyD', false, false, false);
doKeyInput(' ', 'Space', false, false, false);
doKeyInput('Shift', 'ShiftRight', true, false, false);
doKeyInput('Tab', 'Tab', true, false, false);
doKeyInput('Tab', 'Tab', false, false, false);
doKeyInput('ArrowRight', 'ArrowRight', false, false, false);
doKeyInput('ArrowRight', 'ArrowRight', false, false, false);
doKeyInput('ArrowRight', 'ArrowRight', false, false, false);
doKeyInput('ArrowRight', 'ArrowRight', false, false, false);
doKeyInput('ArrowRight', 'ArrowRight', false, false, false);
doKeyInput('ArrowRight', 'ArrowRight', false, false, false);
doKeyInput('ArrowRight', 'ArrowRight', false, false, false);
doKeyInput('ArrowLeft', 'ArrowLeft', false, false, false);
doKeyInput('ArrowLeft', 'ArrowLeft', false, false, false);
doKeyInput('ArrowLeft', 'ArrowLeft', false, false, false);
doKeyInput('ArrowLeft', 'ArrowLeft', false, false, false);
});
//endtest//
