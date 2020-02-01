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
			{name:'nex', type:'*'}
		],
		function(env, argEnv) {
			return new Bool(env.lb('nex') instanceof EError);
		}
	);

	Builtin.createBuiltin(
		'is-boolean',
		[
			{name:'nex', type:'*'}
		],
		function(env, argEnv) {
			return new Bool(env.lb('nex') instanceof Bool);
		}
	);

	Builtin.createBuiltin(
		'is-command',
		[
			{name:'nex', type:'*'}
		],
		function(env, argEnv) {
			return new Bool(env.lb('nex') instanceof Command);
		}
	);

	Builtin.createBuiltin(
		'is-doc',
		[
			{name:'nex', type:'*'}
		],
		function(env, argEnv) {
			return new Bool(env.lb('nex') instanceof Doc);
		}
	);

	Builtin.createBuiltin(
		'is-string',
		[
			{name:'nex', type:'*'}
		],
		function(env, argEnv) {
			return new Bool(env.lb('nex') instanceof EString);
		}
	);

	Builtin.createBuiltin(
		'is-symbol',
		[
			{name:'nex', type:'*'}
		],
		function(env, argEnv) {
			return new Bool(env.lb('nex') instanceof ESymbol);
		}
	);

	Builtin.createBuiltin(
		'is-expectation',
		[
			{name:'nex', type:'*'}
		],
		function(env, argEnv) {
			return new Bool(env.lb('nex') instanceof Expectation);
		}
	);

	Builtin.createBuiltin(
		'is-float',
		[
			{name:'nex', type:'*'}
		],
		function(env, argEnv) {
			return new Bool(env.lb('nex') instanceof Float);
		}
	);

	Builtin.createBuiltin(
		'is-integer',
		[
			{name:'nex', type:'*'}
		],
		function(env, argEnv) {
			return new Bool(env.lb('nex') instanceof Integer);
		}
	);

	Builtin.createBuiltin(
		'is-lambda',
		[
			{name:'nex', type:'*'}
		],
		function(env, argEnv) {
			return new Bool(env.lb('nex') instanceof Lambda);
		}
	);

	Builtin.createBuiltin(
		'is-letter',
		[
			{name:'nex', type:'*'}
		],
		function(env, argEnv) {
			return new Bool(env.lb('nex') instanceof Letter);
		}
	);

	Builtin.createBuiltin(
		'is-line',
		[
			{name:'nex', type:'*'}
		],
		function(env, argEnv) {
			return new Bool(env.lb('nex') instanceof Line);
		}
	);

	Builtin.createBuiltin(
		'is-nil',
		[
			{name:'nex', type:'*'}
		],
		function(env, argEnv) {
			return new Bool(env.lb('nex') instanceof Nil);
		}
	);
	Builtin.createBuiltin(
		'is-separator',
		[
			{name:'nex', type:'*'}
		],
		function(env, argEnv) {
			return new Bool(env.lb('nex') instanceof Separator
				&& !(env.lb('nex') instanceof Letter));
		}
	);
	Builtin.createBuiltin(
		'is-word',
		[
			{name:'nex', type:'*'}
		],
		function(env, argEnv) {
			return new Bool(env.lb('nex') instanceof Word);
		}
	);
	Builtin.createBuiltin(
		'is-list',
		[
			{name:'nex', type:'*'}
		],
		function(env, argEnv) {
			return new Bool(env.lb('nex') instanceof NexContainer);
		}
	);
	Builtin.createBuiltin(
		'is-zlist',
		[
			{name:'nex', type:'*'}
		],
		function(env, argEnv) {
			return new Bool(env.lb('nex') instanceof Zlist);
		}
	);
}