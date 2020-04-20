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
		[
			{name: 'exp,', type:'Expectation', optional:true}
		],
		function(env, executionEnvironment) {
			let exp = env.lb('exp,');
			if (exp == UNBOUND) {
				FF_GEN++;
				return new Nil();
			} else {
				exp.cancel();
				return exp;
			}
		}
	);

	Builtin.createBuiltin(
		'reset',
		[
			{name: 'exp,', type:'Expectation'}
		],
		function(env, executionEnvironment) {
			let exp = env.lb('exp,');
			exp.reset();
			return exp;
		}
	);

	Builtin.createBuiltin(
		'ff-with',
		[
			{name: 'exp,', type:'Expectation'},
			{name: 'func&', type:'Closure'}
		],
		function(env, executionEnvironment) {
			let closure = env.lb('func&');
			let exp = env.lb('exp,');
			exp.ffWith(closure, executionEnvironment);
			return exp;
		}
	);

	Builtin.createBuiltin(
		'set-pending',
		[
			{name: 'exp,', type:'Expectation'},
			{name: 'expother,', type:'Expectation'}
		],
		function(env, executionEnvironment) {
			// makes the first one pending the second basically
			let exp = env.lb('exp,');
			let expother = env.lb('expother,');
			expother.addFulfillCallback(exp.getCallbackForSet());
			return exp;
		}
	);

	Builtin.createBuiltin(
		'make-pending',
		[
			{name: 'expother,', type:'Expectation'}
		],
		function(env, executionEnvironment) {
			// makes the first one pending the second basically
			let exp = new Expectation();
			let expother = env.lb('expother,');
			expother.addFulfillCallback(exp.getCallbackForSet());
			return exp;
		}
	);

	Builtin.createBuiltin(
		'set-handle',
		[
			{name: 'exp,', type:'Expectation'}
		],
		function(env, executionEnvironment) {
			let exp = env.lb('exp,');
			exp.setHandle(exp.getCallbackForSet());;
			return exp;
		}
	);

	Builtin.createBuiltin(
		'handle',
		[
			{name: 'exp,', type:'Expectation'}
		],
		function(env, executionEnvironment) {
			let exp = env.lb('exp,');
			if (!exp.hasHandle()) {
				return new EError('exp: cannot handle because this expectation was not set to fulfill on handle. Sorry!');
			}
			exp.getHandle()();
			return exp;
		}
	);

	// make-delay?
	Builtin.createBuiltin(
		'set-delay',
		[
			{name: 'exp,', type:'Expectation'},
			{name: 'time#', type:'Integer'},
		],
		function(env, executionEnvironment) {
			let time = env.lb('time#').getTypedValue();
			let exp = env.lb('exp,');
			let callback = exp.getCallbackForSet();
			setTimeout(function() {
				callback(null /* do not set a value, the default is whatever the child is of the exp */);
			}, time);
			return exp;
		}
	);

	Builtin.createBuiltin(
		'set-click',
		[
			{name: 'exp,', type:'Expectation'}
		],
		function(env, executionEnvironment) {
			let exp = env.lb('exp,');
			let callback = exp.getCallbackForSet();
			exp.extraClickHandler = function() {
				// should be passing an event object I think?
				callback();
			}
			return exp;
		}
	);
}