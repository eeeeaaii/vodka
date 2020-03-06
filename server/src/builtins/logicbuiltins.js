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
			{name:'exp!', type:'Bool'},
		],
		function(env, argEnv) {
			return new Bool(!env.lb('exp!').getTypedValue());
		}
	)


	Builtin.createBuiltin(
		'and',
		[
			{name:'exp1!', type:'Bool'},
			{name:'exp2!', type:'Bool'},
		],
		function(env, argEnv) {
			return new Bool(env.lb('exp1!').getTypedValue() && env.lb('exp2!').getTypedValue());
		}
	)

	Builtin.createBuiltin(
		'or',
		[
			{name:'exp1!', type:'Bool'},
			{name:'exp2!', type:'Bool'},
		],
		function(env, argEnv) {
			return new Bool(env.lb('exp1!').getTypedValue() || env.lb('exp2!').getTypedValue());
		}
	)

	Builtin.createBuiltin(
		'if',
		[
			{name:'cond!', type:'Bool'},
			{name:'{true}', type:'*', skipeval:true},
			{name:'{false}', type:'*', skipeval:true},
		],
		function(env, argEnv) {
			let b = env.lb('cond!').getTypedValue();
			if (b) {
				let iftrue = evaluateNexSafely(env.lb('{true}'), argEnv);
				if (iftrue instanceof EError) {
					iftrue = wrapError('&szlig;', 'if: error in argument 2', iftrue);
				}
				return iftrue;
			} else {
				let iffalse = evaluateNexSafely(env.lb('{false}'), argEnv);
				if (iffalse instanceof EError) {
					iffalse = wrapError('&szlig;', 'if: error in argument 3', iffalse);
				}
				return iffalse;
			}
		},
		function(phaseExecutor, nex, env) {
			return new IfCommandPhase(phaseExecutor, nex, env);
		}
	)
}