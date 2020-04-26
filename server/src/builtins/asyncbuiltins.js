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



function createAsyncBuiltins() {
	Builtin.createBuiltin(
		'cancel-ff',
		[ 'exp,?' ],
		function(env, executionEnvironment) {
			let exp = env.lb('exp');
			if (exp == UNBOUND) {
				eventQueue.enqueueGC();
				return new Nil();
			} else {
				exp.cancel();
				return exp;
			}
		}
	);

	Builtin.createBuiltin(
		'reset',
		[ 'exp,' ],
		function(env, executionEnvironment) {
			let exp = env.lb('exp');
			exp.reset();
			return exp;
		}
	);

	Builtin.createBuiltin(
		'ff-with',
		[ 'exp,', 'func&' ],
		function(env, executionEnvironment) {
			let closure = env.lb('func');
			let exp = env.lb('exp');
			exp.ffWith(closure, executionEnvironment);
			return exp;
		}
	);

	Builtin.createBuiltin(
		'ff-with',
		[ 'exp,', 'func&' ],
		function(env, executionEnvironment) {
			let closure = env.lb('func');
			let exp = env.lb('exp');
			exp.ffWith(closure, executionEnvironment);
			return exp;
		}
	);

	Builtin.createBuiltin(
		'activate-after',
		[ 'exp1,', 'exp2,' ],
		function(env, executionEnvironment) {
			// the one we want to make sure ISN'T activated
			// is the one we want to set to be pending ON the other one.
			// this means though that the other one could have been
			// activated, it doesn't matter. So we return the one
			// that we just set to not activate until the other thing.
			let exp1 = env.lb('exp1');
			let exp2 = env.lb('exp2');
			exp1.addVirtualChild(exp2);
			return exp1; // or 2?
		}
	);

	Builtin.createBuiltin(
		'set-delay',
		[ 'exp,', 'time#' ],
		function(env, executionEnvironment) {
			let time = env.lb('time').getTypedValue();
			let exp = env.lb('exp');
			let callback = exp.getCallbackForSet();
			exp.set(function() {
				setTimeout(function() {
					callback(null /* do not set a value, the default is whatever the child is of the exp */);
				}, time);				
			});
			return exp;
		}
	);

	Builtin.createBuiltin(
		'set-click',
		[ 'exp,' ],
		function(env, executionEnvironment) {
			let exp = env.lb('exp');
			let callback = exp.getCallbackForSet();
			exp.set(function() {
				exp.extraClickHandler = function() {
					// should be passing an event object I think?
					callback();
				}
			})
			return exp;
		}
	);
}