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

import { Builtin } from '../nex/builtin.js'
import { EError } from '../nex/eerror.js'
import { Float } from '../nex/float.js'
import { Integer } from '../nex/integer.js'
import { Bool } from '../nex/bool.js'

function createMathBuiltins() {
	Builtin.createBuiltin(
		'+',
		[ 'add#%...' ],
		function(env, executionEnvironment) {
			let total = 0;
			let foundFloat = false;
			let ar = env.lb('add');
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
			'min#%', // minuend
			'sub#%?' // subtrahend
		],
		function(env, executionEnvironment) {
			let a = env.lb('min');
			let b = env.lb('sub');
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
		[ 'fact#%...' ],
		function(env, executionEnvironment) {
			let result = 1;
			let foundFloat = false;
			let ar = env.lb('fact');
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
		[ 'divid#%', 'divis#%' ],
		function(env, executionEnvironment) {
			let a = env.lb('divid');
			let b = env.lb('divis');
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
		[ 'divid#', 'modulus#' ],
		function(env, executionEnvironment) {
			let a = env.lb('divid');
			let b = env.lb('modulus');
			let result = a.getTypedValue() % b.getTypedValue();
			return new Integer(result);
		}
	);

	Builtin.createBuiltin(
		'round',
		[ 'arg%' ],
		function(env, executionEnvironment) {
			let a = env.lb('arg').getTypedValue();
			a = Math.round(a);
			return new Float(a);
		}
	)

	Builtin.createBuiltin(
		'sin',
		[ 'arg%' ],
		function(env, executionEnvironment) {
			let a = env.lb('arg').getTypedValue();
			let b = Math.sin(a);
			return new Float(b);
		}
	)

	Builtin.createBuiltin(
		'cos',
		[ 'arg%' ],
		function(env, executionEnvironment) {
			let a = env.lb('arg').getTypedValue();
			let b = Math.cos(a);
			return new Float(b);
		}
	)

	Builtin.createBuiltin(
		'tan',
		[ 'arg%' ],
		function(env, executionEnvironment) {
			let a = env.lb('arg').getTypedValue();
			let b = Math.tan(a);
			return new Float(b);
		}
	)

	Builtin.createBuiltin(
		'asin',
		[ 'arg%' ],
		function(env, executionEnvironment) {
			let a = env.lb('arg').getTypedValue();
			let b = Math.asin(a);
			return new Float(b);
		}
	)

	Builtin.createBuiltin(
		'acos',
		[ 'arg%' ],
		function(env, executionEnvironment) {
			let a = env.lb('arg').getTypedValue();
			let b = Math.acos(a);
			return new Float(b);
		}
	)

	Builtin.createBuiltin(
		'atan',
		[ 'arg%' ],
		function(env, executionEnvironment) {
			let a = env.lb('arg').getTypedValue();
			let b = Math.atan(a);
			return new Float(b);
		}
	)

	Builtin.createBuiltin(
		'atan2',
		[ 'y%', 'x%' ],
		function(env, executionEnvironment) {
			let y = env.lb('y').getTypedValue();
			let x = env.lb('x').getTypedValue();
			return new Float(Math.atan2(y, x));
		}
	)

	Builtin.createBuiltin(
		'exp',
		[ 'a%' ],
		function(env, executionEnvironment) {
			let a = env.lb('a').getTypedValue();
			return new Float(Math.exp(a));
		}
	)

	Builtin.createBuiltin(
		'log',
		[ 'a%' ],
		function(env, executionEnvironment) {
			let a = env.lb('a').getTypedValue();
			return new Float(Math.log(a));
		}
	)

	Builtin.createBuiltin(
		'log10',
		[ 'a%' ],
		function(env, executionEnvironment) {
			let a = env.lb('a').getTypedValue();
			return new Float(Math.log10(a));
		}
	)

	Builtin.createBuiltin(
		'log2',
		[ 'a%' ],
		function(env, executionEnvironment) {
			let a = env.lb('a').getTypedValue();
			return new Float(Math.log2(a));
		}
	)

	Builtin.createBuiltin(
		'ceiling',
		[ 'arg%' ],
		function(env, executionEnvironment) {
			let a = env.lb('arg').getTypedValue();
			a = Math.ceil(a);
			return new Float(a);
		}
	)

	Builtin.createBuiltin(
		'floor',
		[ 'arg%' ],
		function(env, executionEnvironment) {
			let a = env.lb('arg').getTypedValue();
			a = Math.floor(a);
			return new Float(a);
		}
	)

	Builtin.createBuiltin(
		'power',
		[ 'a%', 'b%' ],
		function(env, executionEnvironment) {
			let a = env.lb('a').getTypedValue();
			let b = env.lb('b').getTypedValue();
			return new Float(Math.pow(a, b));
		}
	)

	Builtin.createBuiltin(
		'square-root',
		[ 'a%' ],
		function(env, executionEnvironment) {
			let a = env.lb('a').getTypedValue();
			return new Float(Math.sqrt(a));
		}
	)

	Builtin.createBuiltin(
		'nth-root',
		[ 'a%', 'b%' ],
		function(env, executionEnvironment) {
			let a = env.lb('a').getTypedValue();
			let b = env.lb('b').getTypedValue();
			return new Float(Math.pow(a, (1.0/b)));
		}
	)
	Builtin.createBuiltin(
		'=',
		[ 'lhs#%', 'rhs#%' ],
		function(env, executionEnvironment) {
			let a = env.lb('lhs').getTypedValue();
			let b = env.lb('rhs').getTypedValue();
			let r = (a == b);
			return new Bool(r);
		}
	);

	Builtin.createBuiltin(
		'<',
		[ 'lhs#%', 'rhs#%' ],
		function(env, executionEnvironment) {
			let a = env.lb('lhs').getTypedValue();
			let b = env.lb('rhs').getTypedValue();
			let r = (a < b);
			return new Bool(r);
		}
	);

	Builtin.createBuiltin(
		'<=',
		[ 'lhs#%', 'rhs#%' ],
		function(env, executionEnvironment) {
			let a = env.lb('lhs').getTypedValue();
			let b = env.lb('rhs').getTypedValue();
			let r = (a <= b);
			return new Bool(r);
		}
	);

	Builtin.createBuiltin(
		'>',
		[ 'lhs#%', 'rhs#%' ],
		function(env, executionEnvironment) {
			let a = env.lb('lhs').getTypedValue();
			let b = env.lb('rhs').getTypedValue();
			let r = (a > b);
			return new Bool(r);
		}
	);

	Builtin.createBuiltin(
		'>=',
		[ 'lhs#%', 'rhs#%' ],
		function(env, executionEnvironment) {
			let a = env.lb('lhs').getTypedValue();
			let b = env.lb('rhs').getTypedValue();
			let r = (a >= b);
			return new Bool(r);
		}
	);

	Builtin.createBuiltin(
		'<>',
		[ 'lhs#%', 'rhs#%' ],
		function(env, executionEnvironment) {
			let a = env.lb('lhs').getTypedValue();
			let b = env.lb('rhs').getTypedValue();
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

export { createMathBuiltins }

