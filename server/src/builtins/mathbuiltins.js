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

function createMathBuiltins() {
	Builtin.createBuiltin(
		'+',
		[
			{name:'a0', type:'Number',variadic:true},
		],
		function(env, argEnv) {
			let total = 0;
			let foundFloat = false;
			let ar = env.lb('a0');
			for (let i = 0; i < ar.numChildren(); i++) {
				let arg = ar.getChildAt(i);
				if (arg instanceof Float) {
					foundFloat = true;
				}
				total += arg.getTypedValue();
			}
			let r = foundFloat ? new Float(total) : new Integer(total);
			return r;
		}
	);

	Builtin.createBuiltin(
		'-',
		[
			{name:'a0', type:'Number'},
			{name:'a1', type:'Number'},
		],
		function(env, argEnv) {
			let a = env.lb('a0');
			let b = env.lb('a1');
			let result = a.getTypedValue() - b.getTypedValue();
			if (a instanceof Float
					|| b instanceof Float) {
				return new Float(result);
			} else {
				return new Integer(result);
			}
		}
	);

	Builtin.createBuiltin(
		'*',
		[
			{name:'a0', type:'Number',variadic:true}
		],
		function(env, argEnv) {
			let result = 1;
			let foundFloat = false;
			let ar = env.lb('a0');
			for (let i = 0; i < ar.numChildren(); i++) {
				let arg = ar.getChildAt(i);
				if (arg instanceof Float) {
					foundFloat = true;
				}
				result *= arg.getTypedValue();
			}
			let r = foundFloat ? new Float(result) : new Integer(result);
			return r;
		}
	);

	Builtin.createBuiltin(
		'/',
		[
			{name:'a0', type:'Number'},
			{name:'a1', type:'Number'},
		],
		function(env, argEnv) {
			let a = env.lb('a0');
			let b = env.lb('a1');
			let result = a.getTypedValue() / b.getTypedValue();
			if (a instanceof Float
					|| b instanceof Float) {
				return new Float(result);
			} else {
				return new Integer(result);
			}
		}
	);

	Builtin.createBuiltin(
		'=',
		[
			{name:'a0', type:'Number'},
			{name:'a1', type:'Number'},
		],
		function(env, argEnv) {
			let a = env.lb('a0').getTypedValue();
			let b = env.lb('a1').getTypedValue();
			let r = (a == b);
			return new Bool(r);
		}
	);

	Builtin.createBuiltin(
		'<',
		[
			{name:'a0', type:'Number'},
			{name:'a1', type:'Number'},
		],
		function(env, argEnv) {
			let a = env.lb('a0').getTypedValue();
			let b = env.lb('a1').getTypedValue();
			let r = (a < b);
			return new Bool(r);
		}
	);

	Builtin.createBuiltin(
		'<=',
		[
			{name:'a0', type:'Number'},
			{name:'a1', type:'Number'},
		],
		function(env, argEnv) {
			let a = env.lb('a0').getTypedValue();
			let b = env.lb('a1').getTypedValue();
			let r = (a <= b);
			return new Bool(r);
		}
	);

	Builtin.createBuiltin(
		'>',
		[
			{name:'a0', type:'Number'},
			{name:'a1', type:'Number'},
		],
		function(env, argEnv) {
			let a = env.lb('a0').getTypedValue();
			let b = env.lb('a1').getTypedValue();
			let r = (a > b);
			return new Bool(r);
		}
	);

	Builtin.createBuiltin(
		'>=',
		[
			{name:'a0', type:'Number'},
			{name:'a1', type:'Number'},
		],
		function(env, argEnv) {
			let a = env.lb('a0').getTypedValue();
			let b = env.lb('a1').getTypedValue();
			let r = (a >= b);
			return new Bool(r);
		}
	);

	Builtin.createBuiltin(
		'<>',
		[
			{name:'a0', type:'Number'},
			{name:'a1', type:'Number'},
		],
		function(env, argEnv) {
			let a = env.lb('a0').getTypedValue();
			let b = env.lb('a1').getTypedValue();
			let r = (a != b);
			return new Bool(r);
		}
	);
}