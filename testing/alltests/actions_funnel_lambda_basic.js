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


var harness = require('../testharness');

var testactions = [];

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
		code:'ShiftLeft'
	});
testactions.push({
		type:'keydown',
		code:'Digit7'
	});
testactions.push({
		type:'keyup',
		code:'Digit7'
	});
testactions.push({
		type:'keyup',
		code:'ShiftLeft'
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
		code:'KeyA'
	});
testactions.push({
		type:'keyup',
		code:'KeyA'
	});
testactions.push({
		type:'keydown',
		code:'KeyN'
	});
testactions.push({
		type:'keydown',
		code:'KeyD'
	});
testactions.push({
		type:'keyup',
		code:'KeyN'
	});
testactions.push({
		type:'keydown',
		code:'Space'
	});
testactions.push({
		type:'keyup',
		code:'KeyD'
	});
testactions.push({
		type:'keyup',
		code:'Space'
	});
testactions.push({
		type:'keydown',
		code:'KeyS'
	});
testactions.push({
		type:'keydown',
		code:'KeyO'
	});
testactions.push({
		type:'keyup',
		code:'KeyS'
	});
testactions.push({
		type:'keyup',
		code:'KeyO'
	});

harness.runTest(testactions, 'direct');
