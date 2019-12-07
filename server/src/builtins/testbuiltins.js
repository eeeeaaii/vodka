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

function createTestBuiltins() {
	Builtin.createBuiltin(
		'is-error',
		[
			{name:'a0', type:'*'}
		],
		function(env, argEnv) {
			return new Bool(env.lb('a0') instanceof EError
				&& !(env.lb('a0') instanceof EString));
		}
	);

	Builtin.createBuiltin(
		'is-boolean',
		[
			{name:'a0', type:'*'}
		],
		function(env, argEnv) {
			return new Bool(env.lb('a0') instanceof Bool);
		}
	);

	Builtin.createBuiltin(
		'is-command',
		[
			{name:'a0', type:'*'}
		],
		function(env, argEnv) {
			return new Bool(env.lb('a0') instanceof Command);
		}
	);

	Builtin.createBuiltin(
		'is-doc',
		[
			{name:'a0', type:'*'}
		],
		function(env, argEnv) {
			return new Bool(env.lb('a0') instanceof Doc);
		}
	);

	Builtin.createBuiltin(
		'is-string',
		[
			{name:'a0', type:'*'}
		],
		function(env, argEnv) {
			return new Bool(env.lb('a0') instanceof EString);
		}
	);

	Builtin.createBuiltin(
		'is-symbol',
		[
			{name:'a0', type:'*'}
		],
		function(env, argEnv) {
			return new Bool(env.lb('a0') instanceof ESymbol);
		}
	);

	Builtin.createBuiltin(
		'is-expectation',
		[
			{name:'a0', type:'*'}
		],
		function(env, argEnv) {
			return new Bool(env.lb('a0') instanceof Expectation);
		}
	);

	Builtin.createBuiltin(
		'is-float',
		[
			{name:'a0', type:'*'}
		],
		function(env, argEnv) {
			return new Bool(env.lb('a0') instanceof Float);
		}
	);

	Builtin.createBuiltin(
		'is-integer',
		[
			{name:'a0', type:'*'}
		],
		function(env, argEnv) {
			return new Bool(env.lb('a0') instanceof Integer);
		}
	);

	Builtin.createBuiltin(
		'is-lambda',
		[
			{name:'a0', type:'*'}
		],
		function(env, argEnv) {
			return new Bool(env.lb('a0') instanceof Lambda);
		}
	);

	Builtin.createBuiltin(
		'is-letter',
		[
			{name:'a0', type:'*'}
		],
		function(env, argEnv) {
			return new Bool(env.lb('a0') instanceof Letter);
		}
	);

	Builtin.createBuiltin(
		'is-line',
		[
			{name:'a0', type:'*'}
		],
		function(env, argEnv) {
			return new Bool(env.lb('a0') instanceof Line);
		}
	);

	Builtin.createBuiltin(
		'is-nil',
		[
			{name:'a0', type:'*'}
		],
		function(env, argEnv) {
			return new Bool(env.lb('a0') instanceof Nil);
		}
	);
	Builtin.createBuiltin(
		'is-separator',
		[
			{name:'a0', type:'*'}
		],
		function(env, argEnv) {
			return new Bool(env.lb('a0') instanceof Separator
				&& !(env.lb('a0') instanceof Letter));
		}
	);
	Builtin.createBuiltin(
		'is-word',
		[
			{name:'a0', type:'*'}
		],
		function(env, argEnv) {
			return new Bool(env.lb('a0') instanceof Word);
		}
	);
}