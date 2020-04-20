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
			{name:'add#%...', type:'Number',variadic:true}, // addends
		],
		function(env, executionEnvironment) {
			let total = 0;
			let foundFloat = false;
			let ar = env.lb('add#%...');
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
			{name:'min#%', type:'Number'}, // minuend
			{name:'?sub#%', type:'Number', optional:true}, // subtrahend
		],
		function(env, executionEnvironment) {
			let a = env.lb('min#%');
			let b = env.lb('?sub#%');
			if (b == UNBOUND) {
				let n = (-a.getTypedValue());
				if (a instanceof Float) {
					return new Float(n);
				} else {
					return new Integer(n);
				}
			} else {
				let result = a.getTypedValue() - b.getTypedValue();
				if (a instanceof Float
						|| b instanceof Float) {
					return new Float(result);
				} else {
					return new Integer(result);
				}
			}
		}
	);

	Builtin.createBuiltin(
		'*',
		[
			{name:'fact#%...', type:'Number',variadic:true} // factor???
		],
		function(env, executionEnvironment) {
			let result = 1;
			let foundFloat = false;
			let ar = env.lb('fact#%...');
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
			{name:'divid#%', type:'Number'}, // dividend
			{name:'divis#%', type:'Number'}, // divisor
		],
		function(env, executionEnvironment) {
			let a = env.lb('divid#%');
			let b = env.lb('divis#%');
			if (b.getTypedValue() == 0) {
				return new EError('divide: cannot divide by zero, Sorry!');
			}
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
		'modulo',
		[
			{name:'divid#', type:'Integer'}, //?
			{name:'modulus#', type:'Integer'},
		],
		function(env, executionEnvironment) {
			let a = env.lb('divid#');
			let b = env.lb('modulus#');
			let result = a.getTypedValue() % b.getTypedValue();
			return new Integer(result);
		}
	);

	Builtin.createBuiltin(
		'round',
		[
			{name:'arg%', type:'Float'},
		],
		function(env, executionEnvironment) {
			let a = env.lb('arg%').getTypedValue();
			a = Math.round(a);
			return new Float(a);
		}
	)

	Builtin.createBuiltin(
		'sin',
		[
			{name:'arg%', type:'Float'},
		],
		function(env, executionEnvironment) {
			let a = env.lb('arg%').getTypedValue();
			let b = Math.sin(a);
			return new Float(b);
		}
	)

	Builtin.createBuiltin(
		'cos',
		[
			{name:'arg%', type:'Float'},
		],
		function(env, executionEnvironment) {
			let a = env.lb('arg%').getTypedValue();
			let b = Math.cos(a);
			return new Float(b);
		}
	)

	Builtin.createBuiltin(
		'tan',
		[
			{name:'arg%', type:'Float'},
		],
		function(env, executionEnvironment) {
			let a = env.lb('arg%').getTypedValue();
			let b = Math.tan(a);
			return new Float(b);
		}
	)

	Builtin.createBuiltin(
		'asin',
		[
			{name:'arg%', type:'Float'},
		],
		function(env, executionEnvironment) {
			let a = env.lb('arg%').getTypedValue();
			let b = Math.asin(a);
			return new Float(b);
		}
	)

	Builtin.createBuiltin(
		'acos',
		[
			{name:'arg%', type:'Float'},
		],
		function(env, executionEnvironment) {
			let a = env.lb('arg%').getTypedValue();
			let b = Math.acos(a);
			return new Float(b);
		}
	)

	Builtin.createBuiltin(
		'atan',
		[
			{name:'arg%', type:'Float'},
		],
		function(env, executionEnvironment) {
			let a = env.lb('arg%').getTypedValue();
			let b = Math.atan(a);
			return new Float(b);
		}
	)

	Builtin.createBuiltin(
		'atan2',
		[
			{name:'y%', type:'Float'},
			{name:'x%', type:'Float'},
		],
		function(env, executionEnvironment) {
			let y = env.lb('y%').getTypedValue();
			let x = env.lb('x%').getTypedValue();
			return new Float(Math.atan2(y, x));
		}
	)

	Builtin.createBuiltin(
		'exp',
		[
			{name:'a%', type:'Float'},
		],
		function(env, executionEnvironment) {
			let a = env.lb('a%').getTypedValue();
			return new Float(Math.exp(a));
		}
	)

	Builtin.createBuiltin(
		'log',
		[
			{name:'a%', type:'Float'},
		],
		function(env, executionEnvironment) {
			let a = env.lb('a%').getTypedValue();
			return new Float(Math.log(a));
		}
	)

	Builtin.createBuiltin(
		'log10',
		[
			{name:'a%', type:'Float'},
		],
		function(env, executionEnvironment) {
			let a = env.lb('a%').getTypedValue();
			return new Float(Math.log10(a));
		}
	)

	Builtin.createBuiltin(
		'log2',
		[
			{name:'a%', type:'Float'},
		],
		function(env, executionEnvironment) {
			let a = env.lb('a%').getTypedValue();
			return new Float(Math.log2(a));
		}
	)

	Builtin.createBuiltin(
		'ceiling',
		[
			{name:'arg%', type:'Float'},
		],
		function(env, executionEnvironment) {
			let a = env.lb('arg%').getTypedValue();
			a = Math.ceil(a);
			return new Float(a);
		}
	)

	Builtin.createBuiltin(
		'floor',
		[
			{name:'arg%', type:'Float'},
		],
		function(env, executionEnvironment) {
			let a = env.lb('arg%').getTypedValue();
			a = Math.floor(a);
			return new Float(a);
		}
	)

	Builtin.createBuiltin(
		'power',
		[
			{name:'a%', type:'Float'},
			{name:'b%', type:'Float'},
		],
		function(env, executionEnvironment) {
			let a = env.lb('a%').getTypedValue();
			let b = env.lb('b%').getTypedValue();
			return new Float(Math.pow(a, b));
		}
	)

	Builtin.createBuiltin(
		'square-root',
		[
			{name:'a%', type:'Float'},
		],
		function(env, executionEnvironment) {
			let a = env.lb('a%').getTypedValue();
			return new Float(Math.sqrt(a));
		}
	)

	Builtin.createBuiltin(
		'nth-root',
		[
			{name:'a%', type:'Float'},
			{name:'b%', type:'Float'},
		],
		function(env, executionEnvironment) {
			let a = env.lb('a%').getTypedValue();
			let b = env.lb('b%').getTypedValue();
			return new Float(Math.pow(a, (1.0/b)));
		}
	)
	Builtin.createBuiltin(
		'=',
		[
			{name:'lhs#%', type:'Number'},
			{name:'rhs#%', type:'Number'},
		],
		function(env, executionEnvironment) {
			let a = env.lb('lhs#%').getTypedValue();
			let b = env.lb('rhs#%').getTypedValue();
			let r = (a == b);
			return new Bool(r);
		}
	);

	Builtin.createBuiltin(
		'<',
		[
			{name:'lhs#%', type:'Number'},
			{name:'rhs#%', type:'Number'},
		],
		function(env, executionEnvironment) {
			let a = env.lb('lhs#%').getTypedValue();
			let b = env.lb('rhs#%').getTypedValue();
			let r = (a < b);
			return new Bool(r);
		}
	);

	Builtin.createBuiltin(
		'<=',
		[
			{name:'lhs#%', type:'Number'},
			{name:'rhs#%', type:'Number'},
		],
		function(env, executionEnvironment) {
			let a = env.lb('lhs#%').getTypedValue();
			let b = env.lb('rhs#%').getTypedValue();
			let r = (a <= b);
			return new Bool(r);
		}
	);

	Builtin.createBuiltin(
		'>',
		[
			{name:'lhs#%', type:'Number'},
			{name:'rhs#%', type:'Number'},
		],
		function(env, executionEnvironment) {
			let a = env.lb('lhs#%').getTypedValue();
			let b = env.lb('rhs#%').getTypedValue();
			let r = (a > b);
			return new Bool(r);
		}
	);

	Builtin.createBuiltin(
		'>=',
		[
			{name:'lhs#%', type:'Number'},
			{name:'rhs#%', type:'Number'},
		],
		function(env, executionEnvironment) {
			let a = env.lb('lhs#%').getTypedValue();
			let b = env.lb('rhs#%').getTypedValue();
			let r = (a >= b);
			return new Bool(r);
		}
	);

	Builtin.createBuiltin(
		'<>',
		[
			{name:'lhs#%', type:'Number'},
			{name:'rhs#%', type:'Number'},
		],
		function(env, executionEnvironment) {
			let a = env.lb('lhs#%').getTypedValue();
			let b = env.lb('rhs#%').getTypedValue();
			let r = (a != b);
			return new Bool(r);
		}
	);


	Builtin.createBuiltin(
		'random',
		[],
		function(env, executionEnvironment) {
			let n = Math.random();
			return new Float(n);
		}
	);

}