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


import * as Vodka from '../vodka.js'

import { Builtin } from '../nex/builtin.js'
import { Nil } from '../nex/nil.js'
import { Expectation, incFFGen } from '../nex/expectation.js'
import { UNBOUND } from '../environment.js'
import { Lambda } from '../nex/lambda.js'
import { evaluateNexSafely } from '../evaluator.js'


function createAsyncBuiltins() {
	// is this something we will even have?
	// addVirtualChild isn't a thing anymore
	// Builtin.createBuiltin(
	// 	'activate-after',
	// 	[ 'exp1*', 'exp2*' ],
	// 	function(env, executionEnvironment) {
	// 		// the one we want to make sure ISN'T activated
	// 		// is the one we want to set to be pending ON the other one.
	// 		// this means though that the other one could have been
	// 		// activated, it doesn't matter. So we return the one
	// 		// that we just set to not activate until the other thing.
	// 		let exp1 = env.lb('exp1');
	// 		let exp2 = env.lb('exp2');
	// 		exp1.addVirtualChild(exp2);
	// 		return exp1; // or 2?
	// 	}
	// );

	Builtin.createBuiltin(
		'ff',
		[ 'exp1*'],
		function(env, executionEnvironment) {
			let exp1 = env.lb('exp1');
			exp1.activate();
			return exp1; // or 2?
		}
	);


	Builtin.createBuiltin(
		'cancel-ff',
		[ 'exp*?' ],
		function(env, executionEnvironment) {
			let exp = env.lb('exp');
			if (exp == UNBOUND) {
				incFFGen();
				return new Nil();
			} else {
				exp.cancel();
				return exp;
			}
		}
	);

	Builtin.createBuiltin(
		'exp-gc',
		[],
		function(env, executionEnvironment) {
			Vodka.eventQueue.enqueueGC();
			return new Nil();
		}
	);


	Builtin.createBuiltin(
		'copy-exp',
		[ 'nex*' ],
		function(env, executionEnvironment) {
			return env.lb('nex').makeCopy();
		}
	);

	Builtin.createBuiltin(
		'ff-of',
		[ 'exp*'],
		function(env, executionEnvironment) {
			let exp = env.lb('exp');
			let c = exp.getFFClosure();
			if (!c) {
				return new Nil();
			} else {
				return c;
			}
		}
	);


	Builtin.createBuiltin(
		'ff-with',
		[ 'exp*', 'any' ],
		function(env, executionEnvironment) {
			let ff = env.lb('any');
			if (ff.getTypeName() != '-closure-') {
				let argstring = ' a';
				let children = [ ff ];
				let lambda = Lambda.makeLambda(argstring, children);
				ff = evaluateNexSafely(lambda, executionEnvironment);
			}
			let exp = env.lb('exp');
			exp.ffWith(ff, executionEnvironment);
			return exp;
		}
	);

	Builtin.createBuiltin(
		'let-exp',
		[ '_name@', 'nex*' ],
		function(env, executionEnvironment) {
			let rhs = env.lb('nex');
			let symname = env.lb('name').getTypedValue();
			executionEnvironment.bind(symname, rhs);
			if (rhs.getTypeName() == '-closure-') {
				// basically let is always "letrec"
				rhs.getLexicalEnvironment().bind(symname, rhs);
			}
			return rhs;
		}
	);

	Builtin.createBuiltin(
		'nest-in-expectation',
		[ 'exp,...' ],
		function(env, executionEnvironment) {
			let exps = env.lb('exp');
			let r = new Expectation();
			for (let i = exps.numChildren() - 1; i >= 0; i--) {
				let c = exps.getChildAt(i);
				r.appendChild(c);
			}
			return r;
		}
	);

	Builtin.createBuiltin(
		'reset',
		[ 'exp*' ],
		function(env, executionEnvironment) {
			let exp = env.lb('exp');
			exp.reset();
			return exp;
		}
	);

	Builtin.createBuiltin(
		'set-click',
		[ 'exp*' ],
		function(env, executionEnvironment) {
			let exp = env.lb('exp');
			exp.set(function(callback, ex) {
				return function() {
					ex.extraClickHandler = function() {
						callback();
					}
				}
			});
			return exp;
		}
	);

	Builtin.createBuiltin(
		'set-delay',
		[ 'exp*', 'time#' ],
		function(env, executionEnvironment) {
			let time = env.lb('time').getTypedValue();
			let exp = env.lb('exp');
			exp.set(function(callback) {
				return function() {
					setTimeout(function() {
						callback(null /* do not set a value, the default is whatever the child is of the exp */);
					}, time)
				}
			});
			return exp;
		}
	);

}

export { createAsyncBuiltins }

