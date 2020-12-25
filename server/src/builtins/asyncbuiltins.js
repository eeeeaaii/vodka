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


import { eventQueueDispatcher } from '../eventqueuedispatcher.js'
import { Builtin } from '../nex/builtin.js'
import { Nil } from '../nex/nil.js'
import { Expectation, incFFGen } from '../nex/expectation.js'
import { UNBOUND } from '../environment.js'
import { Lambda } from '../nex/lambda.js'
import { evaluateNexSafely } from '../evaluator.js'


function createAsyncBuiltins() {

	Builtin.createBuiltin(
		'ff',
		[ 'exp1*'],
		function $ff(env, executionEnvironment) {
			let exp1 = env.lb('exp1');
			exp1.activate();
			return exp1; // or 2?
		},
		'activates the expectation.'
	);

	Builtin.aliasBuiltin('act', 'ff');

	Builtin.createBuiltin(
		'cancel-ff',
		[ 'exp*?' ],
		function $cancelFf(env, executionEnvironment) {
			let exp = env.lb('exp');
			if (exp == UNBOUND) {
				incFFGen();
				return new Nil();
			} else {
				exp.cancel();
				return exp;
			}
		},
		'cancels the optional argument |exp (it will never fulfill), or, if no args, cancels all unfulfilled expectations.'
	);

	Builtin.createBuiltin(
		'exp-gc',
		[],
		function $expGc(env, executionEnvironment) {
			eventQueueDispatcher.enqueueGC();
			return new Nil();
		},
		'attempts to cancel any unfulfilled expectations that are not visible on the screen.'
	);

	Builtin.createBuiltin(
		'ff-of',
		[ 'exp*'],
		function $ffOf(env, executionEnvironment) {
			let exp = env.lb('exp');
			let c = exp.getFFClosure();
			if (!c) {
				return new Nil();
			} else {
				return c;
			}
		},
		'retrieves the fulfill-function for |exp (or nil, if it doesn\'t have one).'
	);


	Builtin.createBuiltin(
		'ff-with',
		[ 'exp*', 'val' ],
		function $ffWith(env, executionEnvironment) {
			let ff = env.lb('val');
			if (ff.getTypeName() != '-closure-') {
				let argstring = ' a';
				let children = [ ff ];
				let lambda = Lambda.makeLambda(argstring, children);
				ff = evaluateNexSafely(lambda, executionEnvironment);
			}
			let exp = env.lb('exp');
			exp.ffWith(ff, executionEnvironment);
			return exp;
		},
		'sets the fulfill-function of |exp to be |val (if it\'s a closure), or a closure that returns |val (if it\'s not).'
	);

	Builtin.createBuiltin(
		'reset',
		[ 'exp*' ],
		function $reset(env, executionEnvironment) {
			let exp = env.lb('exp');
			exp.reset();
			return exp;
		},
		'if |exp has been fulfilled, resets it so that it can be activated again.'
	);

	Builtin.createBuiltin(
		'set-click',
		[ 'exp*' ],
		function $setClick(env, executionEnvironment) {
			let exp = env.lb('exp');
			if (exp.numChildren() > 1) {
				return new EError('set-click: more than one clickable object unsupported');
			}
			if (exp.numChildren() == 0) {
				return new EError('set-click: must have at least one clickable object');
			}
			exp.set(function(callback, ex) {
				return function() {
					ex.getChildAt(0).extraClickHandler = function() {
						callback();
					}
				}
			});
			return exp;
		},
		'sets |exp to fulfill when clicked on.'
	);

	Builtin.createBuiltin(
		'set-delay',
		[ 'exp*', 'time#' ],
		function $setDelay(env, executionEnvironment) {
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
		},
		'sets |exp to fulfill after the specified delay.'
	);


	Builtin.createBuiltin(
		'set-immediate',
		[ 'exp*'],
		function $setImmediate(env, executionEnvironment) {
			let exp = env.lb('exp');
			exp.set(function(callback) {
				return function() {
					callback(null);
				}
			});
			return exp;
		},
		'sets |exp to fulfill immediately.'
	);

}

export { createAsyncBuiltins }

