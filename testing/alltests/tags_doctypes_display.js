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
// test: tags_doctypes_display
/*
Verifies that tags are displayed in all doc-type nexes (words, letters, etc)
*/

	// |Shift|~|a|d|d|-|t|a|g|Tab|m|ArrowRight|Shift|$|Shift|Enter|f|o|o|b|a|r|Tab|Enter|Shift|Tab|Shift|Enter|ArrowRight|Shift|~|a|d|d|-|t|a|g|Shift|(|h|e|l|l|o|Shift|Tab|ArrowRight|Shift|$|Shift|Enter|f|o|o|b|a|r|Tab|Enter|Shift|Tab|Shift|Enter|ArrowRight|Shift|~|a|d|d|-|t|a|g|Tab|[|Shift|H|e|l|l|o|Shift|Tab|Tab|ArrowRight|Shift|$|Shift|Enter|f|o|o|b|a|r|Tab|Enter|Shift|Tab|Shift|Enter|Shift|~|Backspace|Shift|Tab|ArrowRight|Shift|~|a|d|d|-|t|a|g|Tab|Shift|{|h|e|l|l|o| |t|h|e|r|e|Shift|Tab|Tab|Tab|ArrowRight|Shift|$|Shift|Enter|f|o|o|b|a|r|Tab|Enter|Shift|Tab|Shift|Enter|ArrowRight|Shift|{|h|e|l|l|o| |t|h|e|r|e|ArrowLeft|ArrowLeft|ArrowLeft|ArrowLeft|ArrowLeft|Meta|c|Shift|Tab|Tab|ArrowRight|Shift|~|h|e|l|Backspace|Backspace|Backspace|a|d|d|-|t|a|g|Tab|Meta|v|ArrowRight|Shift|$|Shift|Enter|h|e|l|l|o|t|h|e|r|e|f|o|o|b|a|r|Tab|Enter|Shift|Tab|Shift|Enter
	
var harness = require('../testharness');

var testactions = [];

testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Backquote'
	});
testactions.push({
		type:'keyup',
		code:'Backquote'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'KeyA'
	});
testactions.push({
		type:'keydown',
		code:'KeyD'
	});
testactions.push({
		type:'keyup',
		code:'KeyA'
	});
testactions.push({
		type:'keyup',
		code:'KeyD'
	});
testactions.push({
		type:'keydown',
		code:'KeyD'
	});
testactions.push({
		type:'keyup',
		code:'KeyD'
	});
testactions.push({
		type:'keydown',
		code:'Minus'
	});
testactions.push({
		type:'keyup',
		code:'Minus'
	});
testactions.push({
		type:'keydown',
		code:'KeyT'
	});
testactions.push({
		type:'keyup',
		code:'KeyT'
	});
testactions.push({
		type:'keydown',
		code:'KeyA'
	});
testactions.push({
		type:'keydown',
		code:'KeyG'
	});
testactions.push({
		type:'keyup',
		code:'KeyA'
	});
testactions.push({
		type:'keyup',
		code:'KeyG'
	});
testactions.push({
		type:'keydown',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'Tab'
	});
testactions.push({
		type:'keydown',
		code:'KeyM'
	});
testactions.push({
		type:'keyup',
		code:'KeyM'
	});
testactions.push({
		type:'keydown',
		code:'ArrowRight'
	});
testactions.push({
		type:'keyup',
		code:'ArrowRight'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Digit4'
	});
testactions.push({
		type:'keyup',
		code:'Digit4'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'KeyF'
	});
testactions.push({
		type:'keyup',
		code:'KeyF'
	});
testactions.push({
		type:'keydown',
		code:'KeyO'
	});
testactions.push({
		type:'keyup',
		code:'KeyO'
	});
testactions.push({
		type:'keydown',
		code:'KeyO'
	});
testactions.push({
		type:'keydown',
		code:'KeyB'
	});
testactions.push({
		type:'keyup',
		code:'KeyO'
	});
testactions.push({
		type:'keyup',
		code:'KeyB'
	});
testactions.push({
		type:'keydown',
		code:'KeyA'
	});
testactions.push({
		type:'keydown',
		code:'KeyR'
	});
testactions.push({
		type:'keyup',
		code:'KeyA'
	});
testactions.push({
		type:'keyup',
		code:'KeyR'
	});
testactions.push({
		type:'keydown',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'Tab'
	});
testactions.push({
		type:'keydown',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'Enter'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'ArrowRight'
	});
testactions.push({
		type:'keyup',
		code:'ArrowRight'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Backquote'
	});
testactions.push({
		type:'keyup',
		code:'Backquote'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'KeyA'
	});
testactions.push({
		type:'keydown',
		code:'KeyD'
	});
testactions.push({
		type:'keyup',
		code:'KeyA'
	});
testactions.push({
		type:'keyup',
		code:'KeyD'
	});
testactions.push({
		type:'keydown',
		code:'KeyD'
	});
testactions.push({
		type:'keyup',
		code:'KeyD'
	});
testactions.push({
		type:'keydown',
		code:'Minus'
	});
testactions.push({
		type:'keyup',
		code:'Minus'
	});
testactions.push({
		type:'keydown',
		code:'KeyT'
	});
testactions.push({
		type:'keydown',
		code:'KeyA'
	});
testactions.push({
		type:'keyup',
		code:'KeyT'
	});
testactions.push({
		type:'keyup',
		code:'KeyA'
	});
testactions.push({
		type:'keydown',
		code:'KeyG'
	});
testactions.push({
		type:'keyup',
		code:'KeyG'
	});
testactions.push({
		type:'keydown',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'Digit9'
	});
testactions.push({
		type:'keyup',
		code:'Digit9'
	});
testactions.push({
		type:'keyup',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'KeyH'
	});
testactions.push({
		type:'keyup',
		code:'KeyH'
	});
testactions.push({
		type:'keydown',
		code:'KeyE'
	});
testactions.push({
		type:'keyup',
		code:'KeyE'
	});
testactions.push({
		type:'keydown',
		code:'KeyL'
	});
testactions.push({
		type:'keyup',
		code:'KeyL'
	});
testactions.push({
		type:'keydown',
		code:'KeyL'
	});
testactions.push({
		type:'keyup',
		code:'KeyL'
	});
testactions.push({
		type:'keydown',
		code:'KeyO'
	});
testactions.push({
		type:'keyup',
		code:'KeyO'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'ArrowRight'
	});
testactions.push({
		type:'keyup',
		code:'ArrowRight'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Digit4'
	});
testactions.push({
		type:'keyup',
		code:'Digit4'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'KeyF'
	});
testactions.push({
		type:'keydown',
		code:'KeyO'
	});
testactions.push({
		type:'keyup',
		code:'KeyF'
	});
testactions.push({
		type:'keyup',
		code:'KeyO'
	});
testactions.push({
		type:'keydown',
		code:'KeyO'
	});
testactions.push({
		type:'keydown',
		code:'KeyB'
	});
testactions.push({
		type:'keyup',
		code:'KeyO'
	});
testactions.push({
		type:'keyup',
		code:'KeyB'
	});
testactions.push({
		type:'keydown',
		code:'KeyA'
	});
testactions.push({
		type:'keydown',
		code:'KeyR'
	});
testactions.push({
		type:'keyup',
		code:'KeyA'
	});
testactions.push({
		type:'keyup',
		code:'KeyR'
	});
testactions.push({
		type:'keydown',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'Tab'
	});
testactions.push({
		type:'keydown',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'Enter'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'ArrowRight'
	});
testactions.push({
		type:'keyup',
		code:'ArrowRight'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Backquote'
	});
testactions.push({
		type:'keyup',
		code:'Backquote'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'KeyA'
	});
testactions.push({
		type:'keyup',
		code:'KeyA'
	});
testactions.push({
		type:'keydown',
		code:'KeyD'
	});
testactions.push({
		type:'keyup',
		code:'KeyD'
	});
testactions.push({
		type:'keydown',
		code:'KeyD'
	});
testactions.push({
		type:'keyup',
		code:'KeyD'
	});
testactions.push({
		type:'keydown',
		code:'Minus'
	});
testactions.push({
		type:'keyup',
		code:'Minus'
	});
testactions.push({
		type:'keydown',
		code:'KeyT'
	});
testactions.push({
		type:'keyup',
		code:'KeyT'
	});
testactions.push({
		type:'keydown',
		code:'KeyA'
	});
testactions.push({
		type:'keyup',
		code:'KeyA'
	});
testactions.push({
		type:'keydown',
		code:'KeyG'
	});
testactions.push({
		type:'keyup',
		code:'KeyG'
	});
testactions.push({
		type:'keydown',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'Tab'
	});
testactions.push({
		type:'keydown',
		code:'BracketLeft'
	});
testactions.push({
		type:'keyup',
		code:'BracketLeft'
	});
testactions.push({
		type:'keydown',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'KeyH'
	});
testactions.push({
		type:'keyup',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keyup',
		code:'KeyH'
	});
testactions.push({
		type:'keydown',
		code:'KeyE'
	});
testactions.push({
		type:'keydown',
		code:'KeyL'
	});
testactions.push({
		type:'keyup',
		code:'KeyE'
	});
testactions.push({
		type:'keyup',
		code:'KeyL'
	});
testactions.push({
		type:'keydown',
		code:'KeyL'
	});
testactions.push({
		type:'keyup',
		code:'KeyL'
	});
testactions.push({
		type:'keydown',
		code:'KeyO'
	});
testactions.push({
		type:'keyup',
		code:'KeyO'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'Tab'
	});
testactions.push({
		type:'keydown',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'ArrowRight'
	});
testactions.push({
		type:'keyup',
		code:'ArrowRight'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Digit4'
	});
testactions.push({
		type:'keyup',
		code:'Digit4'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keyup',
		code:'Enter'
	});
testactions.push({
		type:'keydown',
		code:'KeyF'
	});
testactions.push({
		type:'keyup',
		code:'KeyF'
	});
testactions.push({
		type:'keydown',
		code:'KeyO'
	});
testactions.push({
		type:'keyup',
		code:'KeyO'
	});
testactions.push({
		type:'keydown',
		code:'KeyO'
	});
testactions.push({
		type:'keydown',
		code:'KeyB'
	});
testactions.push({
		type:'keyup',
		code:'KeyO'
	});
testactions.push({
		type:'keyup',
		code:'KeyB'
	});
testactions.push({
		type:'keydown',
		code:'KeyA'
	});
testactions.push({
		type:'keydown',
		code:'KeyR'
	});
testactions.push({
		type:'keyup',
		code:'KeyA'
	});
testactions.push({
		type:'keyup',
		code:'KeyR'
	});
testactions.push({
		type:'keydown',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'Tab'
	});
testactions.push({
		type:'keydown',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'Enter'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Backquote'
	});
testactions.push({
		type:'keyup',
		code:'Backquote'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Backspace'
	});
testactions.push({
		type:'keyup',
		code:'Backspace'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'ArrowRight'
	});
testactions.push({
		type:'keyup',
		code:'ArrowRight'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Backquote'
	});
testactions.push({
		type:'keyup',
		code:'Backquote'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'KeyA'
	});
testactions.push({
		type:'keydown',
		code:'KeyD'
	});
testactions.push({
		type:'keyup',
		code:'KeyA'
	});
testactions.push({
		type:'keyup',
		code:'KeyD'
	});
testactions.push({
		type:'keydown',
		code:'KeyD'
	});
testactions.push({
		type:'keydown',
		code:'Minus'
	});
testactions.push({
		type:'keyup',
		code:'KeyD'
	});
testactions.push({
		type:'keyup',
		code:'Minus'
	});
testactions.push({
		type:'keydown',
		code:'KeyT'
	});
testactions.push({
		type:'keydown',
		code:'KeyA'
	});
testactions.push({
		type:'keyup',
		code:'KeyT'
	});
testactions.push({
		type:'keyup',
		code:'KeyA'
	});
testactions.push({
		type:'keydown',
		code:'KeyG'
	});
testactions.push({
		type:'keyup',
		code:'KeyG'
	});
testactions.push({
		type:'keydown',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'Tab'
	});
testactions.push({
		type:'keydown',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'BracketLeft'
	});
testactions.push({
		type:'keyup',
		code:'BracketLeft'
	});
testactions.push({
		type:'keyup',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'KeyH'
	});
testactions.push({
		type:'keyup',
		code:'KeyH'
	});
testactions.push({
		type:'keydown',
		code:'KeyE'
	});
testactions.push({
		type:'keyup',
		code:'KeyE'
	});
testactions.push({
		type:'keydown',
		code:'KeyL'
	});
testactions.push({
		type:'keyup',
		code:'KeyL'
	});
testactions.push({
		type:'keydown',
		code:'KeyL'
	});
testactions.push({
		type:'keyup',
		code:'KeyL'
	});
testactions.push({
		type:'keydown',
		code:'KeyO'
	});
testactions.push({
		type:'keyup',
		code:'KeyO'
	});
testactions.push({
		type:'keydown',
		code:'Space'
	});
testactions.push({
		type:'keyup',
		code:'Space'
	});
testactions.push({
		type:'keydown',
		code:'KeyT'
	});
testactions.push({
		type:'keydown',
		code:'KeyH'
	});
testactions.push({
		type:'keyup',
		code:'KeyT'
	});
testactions.push({
		type:'keyup',
		code:'KeyH'
	});
testactions.push({
		type:'keydown',
		code:'KeyE'
	});
testactions.push({
		type:'keydown',
		code:'KeyR'
	});
testactions.push({
		type:'keyup',
		code:'KeyE'
	});
testactions.push({
		type:'keydown',
		code:'KeyE'
	});
testactions.push({
		type:'keyup',
		code:'KeyR'
	});
testactions.push({
		type:'keyup',
		code:'KeyE'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'Tab'
	});
testactions.push({
		type:'keydown',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'Tab'
	});
testactions.push({
		type:'keydown',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'ArrowRight'
	});
testactions.push({
		type:'keyup',
		code:'ArrowRight'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Digit4'
	});
testactions.push({
		type:'keyup',
		code:'Digit4'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'KeyF'
	});
testactions.push({
		type:'keydown',
		code:'KeyO'
	});
testactions.push({
		type:'keyup',
		code:'KeyF'
	});
testactions.push({
		type:'keyup',
		code:'KeyO'
	});
testactions.push({
		type:'keydown',
		code:'KeyO'
	});
testactions.push({
		type:'keydown',
		code:'KeyB'
	});
testactions.push({
		type:'keyup',
		code:'KeyO'
	});
testactions.push({
		type:'keyup',
		code:'KeyB'
	});
testactions.push({
		type:'keydown',
		code:'KeyA'
	});
testactions.push({
		type:'keydown',
		code:'KeyR'
	});
testactions.push({
		type:'keyup',
		code:'KeyA'
	});
testactions.push({
		type:'keyup',
		code:'KeyR'
	});
testactions.push({
		type:'keydown',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'Tab'
	});
testactions.push({
		type:'keydown',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'Enter'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'ArrowRight'
	});
testactions.push({
		type:'keyup',
		code:'ArrowRight'
	});
testactions.push({
		type:'keydown',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'BracketLeft'
	});
testactions.push({
		type:'keyup',
		code:'BracketLeft'
	});
testactions.push({
		type:'keyup',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'KeyH'
	});
testactions.push({
		type:'keydown',
		code:'KeyE'
	});
testactions.push({
		type:'keyup',
		code:'KeyH'
	});
testactions.push({
		type:'keyup',
		code:'KeyE'
	});
testactions.push({
		type:'keydown',
		code:'KeyL'
	});
testactions.push({
		type:'keyup',
		code:'KeyL'
	});
testactions.push({
		type:'keydown',
		code:'KeyL'
	});
testactions.push({
		type:'keyup',
		code:'KeyL'
	});
testactions.push({
		type:'keydown',
		code:'KeyO'
	});
testactions.push({
		type:'keyup',
		code:'KeyO'
	});
testactions.push({
		type:'keydown',
		code:'Space'
	});
testactions.push({
		type:'keyup',
		code:'Space'
	});
testactions.push({
		type:'keydown',
		code:'KeyT'
	});
testactions.push({
		type:'keyup',
		code:'KeyT'
	});
testactions.push({
		type:'keydown',
		code:'KeyH'
	});
testactions.push({
		type:'keyup',
		code:'KeyH'
	});
testactions.push({
		type:'keydown',
		code:'KeyE'
	});
testactions.push({
		type:'keydown',
		code:'KeyR'
	});
testactions.push({
		type:'keyup',
		code:'KeyE'
	});
testactions.push({
		type:'keyup',
		code:'KeyR'
	});
testactions.push({
		type:'keydown',
		code:'KeyE'
	});
testactions.push({
		type:'keyup',
		code:'KeyE'
	});
testactions.push({
		type:'keydown',
		code:'ArrowLeft'
	});
testactions.push({
		type:'keyup',
		code:'ArrowLeft'
	});
testactions.push({
		type:'keydown',
		code:'ArrowLeft'
	});
testactions.push({
		type:'keyup',
		code:'ArrowLeft'
	});
testactions.push({
		type:'keydown',
		code:'ArrowLeft'
	});
testactions.push({
		type:'keyup',
		code:'ArrowLeft'
	});
testactions.push({
		type:'keydown',
		code:'ArrowLeft'
	});
testactions.push({
		type:'keyup',
		code:'ArrowLeft'
	});
testactions.push({
		type:'keydown',
		code:'ArrowLeft'
	});
testactions.push({
		type:'keyup',
		code:'ArrowLeft'
	});
testactions.push({
		type:'keydown',
		code:'MetaRight'
	});
testactions.push({
		type:'keydown',
		code:'KeyC'
	});
testactions.push({
		type:'keyup',
		code:'MetaRight'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'Tab'
	});
testactions.push({
		type:'keydown',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'ArrowRight'
	});
testactions.push({
		type:'keyup',
		code:'ArrowRight'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Backquote'
	});
testactions.push({
		type:'keyup',
		code:'Backquote'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'KeyH'
	});
testactions.push({
		type:'keyup',
		code:'KeyH'
	});
testactions.push({
		type:'keydown',
		code:'KeyE'
	});
testactions.push({
		type:'keyup',
		code:'KeyE'
	});
testactions.push({
		type:'keydown',
		code:'KeyL'
	});
testactions.push({
		type:'keyup',
		code:'KeyL'
	});
testactions.push({
		type:'keydown',
		code:'Backspace'
	});
testactions.push({
		type:'keyup',
		code:'Backspace'
	});
testactions.push({
		type:'keydown',
		code:'Backspace'
	});
testactions.push({
		type:'keyup',
		code:'Backspace'
	});
testactions.push({
		type:'keydown',
		code:'Backspace'
	});
testactions.push({
		type:'keyup',
		code:'Backspace'
	});
testactions.push({
		type:'keydown',
		code:'KeyA'
	});
testactions.push({
		type:'keydown',
		code:'KeyD'
	});
testactions.push({
		type:'keyup',
		code:'KeyA'
	});
testactions.push({
		type:'keyup',
		code:'KeyD'
	});
testactions.push({
		type:'keydown',
		code:'KeyD'
	});
testactions.push({
		type:'keydown',
		code:'Minus'
	});
testactions.push({
		type:'keyup',
		code:'KeyD'
	});
testactions.push({
		type:'keyup',
		code:'Minus'
	});
testactions.push({
		type:'keydown',
		code:'KeyT'
	});
testactions.push({
		type:'keyup',
		code:'KeyT'
	});
testactions.push({
		type:'keydown',
		code:'KeyA'
	});
testactions.push({
		type:'keyup',
		code:'KeyA'
	});
testactions.push({
		type:'keydown',
		code:'KeyG'
	});
testactions.push({
		type:'keyup',
		code:'KeyG'
	});
testactions.push({
		type:'keydown',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'Tab'
	});
testactions.push({
		type:'keydown',
		code:'MetaRight'
	});
testactions.push({
		type:'keydown',
		code:'KeyV'
	});
testactions.push({
		type:'keyup',
		code:'MetaRight'
	});
testactions.push({
		type:'keydown',
		code:'ArrowRight'
	});
testactions.push({
		type:'keyup',
		code:'ArrowRight'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Digit4'
	});
testactions.push({
		type:'keyup',
		code:'Digit4'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'KeyH'
	});
testactions.push({
		type:'keydown',
		code:'KeyE'
	});
testactions.push({
		type:'keyup',
		code:'KeyH'
	});
testactions.push({
		type:'keyup',
		code:'KeyE'
	});
testactions.push({
		type:'keydown',
		code:'KeyL'
	});
testactions.push({
		type:'keyup',
		code:'KeyL'
	});
testactions.push({
		type:'keydown',
		code:'KeyL'
	});
testactions.push({
		type:'keyup',
		code:'KeyL'
	});
testactions.push({
		type:'keydown',
		code:'KeyO'
	});
testactions.push({
		type:'keyup',
		code:'KeyO'
	});
testactions.push({
		type:'keydown',
		code:'KeyT'
	});
testactions.push({
		type:'keyup',
		code:'KeyT'
	});
testactions.push({
		type:'keydown',
		code:'KeyH'
	});
testactions.push({
		type:'keydown',
		code:'KeyE'
	});
testactions.push({
		type:'keyup',
		code:'KeyH'
	});
testactions.push({
		type:'keyup',
		code:'KeyE'
	});
testactions.push({
		type:'keydown',
		code:'KeyR'
	});
testactions.push({
		type:'keydown',
		code:'KeyE'
	});
testactions.push({
		type:'keyup',
		code:'KeyR'
	});
testactions.push({
		type:'keyup',
		code:'KeyE'
	});
testactions.push({
		type:'keydown',
		code:'KeyF'
	});
testactions.push({
		type:'keydown',
		code:'KeyO'
	});
testactions.push({
		type:'keyup',
		code:'KeyF'
	});
testactions.push({
		type:'keyup',
		code:'KeyO'
	});
testactions.push({
		type:'keydown',
		code:'KeyO'
	});
testactions.push({
		type:'keydown',
		code:'KeyB'
	});
testactions.push({
		type:'keyup',
		code:'KeyO'
	});
testactions.push({
		type:'keyup',
		code:'KeyB'
	});
testactions.push({
		type:'keydown',
		code:'KeyA'
	});
testactions.push({
		type:'keydown',
		code:'KeyR'
	});
testactions.push({
		type:'keyup',
		code:'KeyA'
	});
testactions.push({
		type:'keyup',
		code:'KeyR'
	});
testactions.push({
		type:'keydown',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'Tab'
	});
testactions.push({
		type:'keydown',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'Enter'
	});
testactions.push({
		type:'keydown',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'Tab'
	});
testactions.push({
		type:'keyup',
		code:'ShiftRight'
	});
testactions.push({
		type:'keydown',
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'Enter'
	});
testactions.push({
		type:'keyup',
		code:'ShiftLeft'
	});

harness.runTest(testactions, 'direct');
