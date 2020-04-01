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
		'cancel',
		[
			{name: 'exp,', type:'Expectation'},
		],
		function(env, argEnv) {
			let exp = env.lb('exp,');
			exp.cancel();
			return exp;
		}
	);

	Builtin.createBuiltin(
		'ff-with',
		[
			{name: 'exp,', type:'Expectation'},
			{name: 'func&', type:'Lambda'}
		],
		function(env, argEnv) {
			let lambda = env.lb('func&');
			let exp = env.lb('exp,');
			exp.ffWith(lambda, argEnv);
			return exp;
		}
	);

	Builtin.createBuiltin(
		'set-delay',
		[
			{name: 'exp,', type:'Expectation'},
			{name: 'time#', type:'Integer'},
		],
		function(env, argEnv) {
			let time = env.lb('time#').getTypedValue();
			let exp = env.lb('exp,');
			let callback = exp.getCallbackForSet();
			setTimeout(function() {
				callback();
			}, time);
			return exp;
		}
	);

	Builtin.createBuiltin(
		'set-click',
		[
			{name: 'exp,', type:'Expectation'}
		],
		function(env, argEnv) {
			let exp = env.lb('exp,');
			let callback = exp.getCallbackForSet();
			exp.extraClickHandler = function() {
				callback();
			}
			return exp;
		}
	);
}