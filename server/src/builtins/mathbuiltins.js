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

import * as Utils from '../utils.js'

import { Builtin } from '../nex/builtin.js'
import { constructFatalError } from '../nex/eerror.js'
import { constructFloat } from '../nex/float.js'
import { constructInteger } from '../nex/integer.js'
import { constructBool } from '../nex/bool.js'
import { UNBOUND } from '../environment.js'


function createMathBuiltins() {

	// minuend - subtrahend

	


	

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  


	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $greaterThan(env, executionEnvironment) {
		let a = env.lb('lhs').getTypedValue();
		let b = env.lb('rhs').getTypedValue();
		let r = (a > b);
		return constructBool(r);
	}

	

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  


	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $lessThan(env, executionEnvironment) {
		let a = env.lb('lhs').getTypedValue();
		let b = env.lb('rhs').getTypedValue();
		let r = (a < b);
		return constructBool(r);
	}

	

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  


	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  


	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  


	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  


	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $getPi(env, executionEnvironment) {
		return constructFloat(Math.PI);
	}

	Builtin.createBuiltin(
		'get-pi',
		[ ],
		$getPi,
		'Returns pi.'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $getE(env, executionEnvironment) {
		return constructFloat(Math.E);
	}

	Builtin.createBuiltin(
		'get-e',
		[ ],
		$getE,
		'Returns e.'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  


	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  


	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $atan(env, executionEnvironment) {
		let a = env.lb('arg').getTypedValue();
		let b = Math.atan(a);
		return constructFloat(b);
	}

	

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  


	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  


	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  


	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  


	


	


	// log base e, helps to differentiate
	// from methods that log things
	


	


	


	


	


	


	Builtin.createBuiltin(
		'random',
		[],
		function $random(env, executionEnvironment) {
			let n = Math.random();
			return constructFloat(n);
		},
		'Returns a random number between 0 and 1.'
	);


	


	


	


	
}

export { createMathBuiltins }

