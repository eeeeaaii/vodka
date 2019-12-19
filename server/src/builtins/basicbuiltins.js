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

function createBasicBuiltins() {
	Builtin.createBuiltin(
		'car',
		[
			{name:'a0', type:'NexContainer'}
		],
		function(env, argEnv) {
			return env.lb('a0').getFirstChild();
		}
	);

	Builtin.createBuiltin(
		'cdr',
		[
			{name:'a0', type:'NexContainer'}
		],
		function(env, argEnv) {
			var c = env.lb('a0');
			c.removeChild(c.getChildAt(0));
			return c;
		}
	);

	Builtin.createBuiltin(
		'cons',
		[
			{name:'a0', type:'*'},
			{name:'a1', type:'NexContainer'},
		],
		function(env, argEnv) {
			var lst = env.lb('a1');
			lst.prependChild(env.lb('a0'));
			return lst;
		}
	);

	Builtin.createBuiltin(
		'begin',
		[
			{name:'a0', type:'*', variadic:true, skipeval:true}
		],
		function(env, argEnv) {
			var r = new Nil();
			var lst = env.lb('a0');
			for (var i = 0; i < lst.numChildren(); i++) {
				r = lst.getChildAt(i).evaluate(argEnv);
			}
			return r;
		}
	);

	Builtin.createBuiltin(
		'let',
		[
			{name:'a0', type:'ESymbol',skipeval:true},
			{name:'a1', type:'*'}
		],
		function(env, argEnv) {
			var rhs = env.lb('a1');
			argEnv.bind(env.lb('a0').getTypedValue(), rhs);
			return rhs;
		}
	);

	Builtin.createBuiltin(
		'bind',
		[
			{name:'a0', type:'ESymbol',skipeval:true},
			{name:'a1', type:'*'}
		],
		function(env, argEnv) {
			var val = env.lb('a1');
			BUILTINS.bindInPackage(env.lb('a0').getTypedValue(), val);
			return val;
		}
	);

	Builtin.createBuiltin(
		'bind-unique',
		[
			{name:'a0', type:'ESymbol', skipeval:true},
			{name:'a1', type:'*'}
		],
		function(env, argEnv) {
			var val = env.lb('a1');
			BUILTINS.bindUniqueInPackage(env.lb('a0').getTypedValue(), val);
			return val;
		}
	);

	Builtin.createBuiltin(
		'save',
		[
			{name:'a0', type:'ESymbol', skipeval:true},
			{name:'a1', type:'*', skipeval:true}
		],
		function(env, argEnv) {
			var nm = env.lb('a0').getTypedValue();
			var val = env.lb('a1');			
			var exp = new Expectation();
			saveNex(nm, val, exp);
			return exp;
		}
	);

	Builtin.createBuiltin(
		'save-result',
		[
			{name:'a0', type:'ESymbol', skipeval:true},
			{name:'a1', type:'*'}
		],
		function(env, argEnv) {
			var nm = env.lb('a0').getTypedValue();
			var val = env.lb('a1');			
			var exp = new Expectation();
			saveNex(nm, val, exp);
			return exp;
		}
	);

	Builtin.createBuiltin(
		'load',
		[
			{name:'a0', type:'ESymbol', skipeval:true},
		],
		function(env, argEnv) {
			var nm = env.lb('a0').getTypedValue();
			var exp = new Expectation();
			loadNex(nm, exp);
			return exp;
		}
	);

	// this is temporary, I can implement this on top of save/load
	Builtin.createBuiltin(
		'edit',
		[
			{name:'sym', type:'ESymbol', skipeval:true},
			{name:'val', type:'*', skipeval:true, optional:true},
			{name:'result', type:'*', skipeval:true, optional:true},
			{name:'evaluated', type:'*', skipeval:true, optional:true}
		],
		function(env, argEnv) {
			var sym = env.lb('sym').makeCopy();
			var nm = sym.getTypedValue();
			var val = env.lb('val');
			if (val) {
				val = val.makeCopy();
				toEval = val.makeCopy();
				var evaluated = toEval.evaluate(argEnv);
				var exp = new Expectation(function(result) {
					var c = new Command('edit');
					c.appendChild(sym)
					c.appendChild(val);
					c.appendChild(result);
					c.appendChild(evaluated);
					return c;
				});
				saveNex(nm, val, exp);
				return exp;
			} else {
				var exp = new Expectation(function(newval) {
					var c = new Command('edit');
					c.appendChild(sym);
					c.appendChild(newval);
					return c;
				})
				loadNex(nm, exp);
				return exp;
			}


		}
	);

	Builtin.createBuiltin(
		'eval-after',
		[
			{name: 'a0', type:'*'},
			{name: 'a1', type:'Integer'}
		],
		function(env, argEnv) {
			var time = env.lb('a1').getTypedValue();
			var toEval = env.lb('a0');
			var exp = new Expectation();
			setTimeout(function() {
				exp.fulfill(toEval.evaluate(argEnv));
			}, time);
			return exp;
		}
	)

	// I'm not sure if I will need more creator functions or not.
	Builtin.createBuiltin(
		'make-expectation',
		[
		],
		function(env, argEnv) {
			var e = new Expectation();
			e.appendChild(new Integer(4));
			return e;
		}
	)

}