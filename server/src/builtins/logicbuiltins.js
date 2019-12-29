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

function createLogicBuiltins() {
	Builtin.createBuiltin(
		'not',
		[
			{name:'a0', type:'Bool'},
		],
		function(env, argEnv) {
			return new Bool(!env.lb('a0').getTypedValue());
		}
	)


	Builtin.createBuiltin(
		'and',
		[
			{name:'a0', type:'Bool'},
			{name:'a1', type:'Bool'},
		],
		function(env, argEnv) {
			return new Bool(env.lb('a0').getTypedValue() && env.lb('a1').getTypedValue());
		}
	)

	Builtin.createBuiltin(
		'or',
		[
			{name:'a0', type:'Bool'},
			{name:'a1', type:'Bool'},
		],
		function(env, argEnv) {
			return new Bool(env.lb('a0').getTypedValue() || env.lb('a1').getTypedValue());
		}
	)

	Builtin.createBuiltin(
		'if',
		[
			{name:'a0', type:'Bool'},
			{name:'a1', type:'*'}, // skipeval sort of, see custom evaluator
			{name:'a2', type:'*'}, // skipeval sort of, see custom evaluator
		],
		function(env, argEnv) {
			let b = env.lb('a0').getTypedValue();
			if (b) {
				return env.lb('a1');
			} else {
				return env.lb('a2');
			}
		},
		function(phaseExecutor, nex, env) {
			return new IfCommandPhase(phaseExecutor, nex, env);
		}
	)
}