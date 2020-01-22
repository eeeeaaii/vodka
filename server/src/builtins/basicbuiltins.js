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
			let c = env.lb('a0');
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
			let lst = env.lb('a1');
			lst.prependChild(env.lb('a0'));
			return lst;
		}
	);

	Builtin.createBuiltin(
		'is-empty',
		[
			{name:'a0', type:'NexContainer'},
		],
		function(env, argEnv) {
			let lst = env.lb('a0');
			let rb = !lst.hasChildren();
			return new Bool(rb);
		}
	);

	Builtin.createBuiltin(
		'begin',
		[
			{name:'a0', type:'*', variadic:true}
		],
		function(env, argEnv) {
			let lst = env.lb('a0');
			if (lst.numChildren() == 0) {
				return new Nil();
			} else {
				return lst.getChildAt(lst.numChildren() - 1);
			}
		}
	);

	Builtin.createBuiltin(
		'let',
		[
			{name:'a0', type:'ESymbol',skipeval:true},
			{name:'a1', type:'*'}
		],
		function(env, argEnv) {
			let rhs = env.lb('a1');
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
			let val = env.lb('a1');
			let name = env.lb('a0');
			BUILTINS.bindInPackage(name.getTypedValue(), val);
			return name;
		}
	);

	Builtin.createBuiltin(
		'bind-unique',
		[
			{name:'a0', type:'ESymbol', skipeval:true},
			{name:'a1', type:'*'}
		],
		function(env, argEnv) {
			let val = env.lb('a1');
			BUILTINS.bindUniqueInPackage(env.lb('a0').getTypedValue(), val);
			return val;
		}
	);

	Builtin.createBuiltin(
		'bound',
		[
		],
		function(env, argEnv) {
			let names = BUILTINS.getAllBoundSymbolsAtThisLevel();
			let r = new Doc();
			for (let i = 0; i < names.length; i++) {
				let sym = new ESymbol(names[i]);
				r.appendChild(sym);
			}
			return r;
		}
	);

	Builtin.createBuiltin(
		'save',
		[
			{name:'a0', type:'ESymbol', skipeval:true},
			{name:'a1', type:'*', skipeval:true}
		],
		function(env, argEnv) {
			let nm = env.lb('a0').getTypedValue();
			let val = env.lb('a1');			
			let exp = new Expectation();
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
			let nm = env.lb('a0').getTypedValue();
			let val = env.lb('a1');			
			let exp = new Expectation();
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
			let nm = env.lb('a0').getTypedValue();
			let exp = new Expectation();
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
			let sym = env.lb('sym').makeCopy();
			let nm = sym.getTypedValue();
			let val = env.lb('val');
			if (val) {
				val = val.makeCopy();
				toEval = val.makeCopy();
				let evaluated = toEval.evaluate(argEnv);
				let exp = new Expectation(function(result) {
					let c = new Command('edit');
					c.appendChild(sym)
					c.appendChild(val);
					c.appendChild(result);
					c.appendChild(evaluated);
					return c;
				});
				saveNex(nm, val, exp);
				return exp;
			} else {
				let exp = new Expectation(function(newval) {
					let c = new Command('edit');
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
			let time = env.lb('a1').getTypedValue();
			let toEval = env.lb('a0');
			let exp = new Expectation();
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
			let e = new Expectation();
			e.appendChild(new Integer(4));
			return e;
		}
	)

	Builtin.createBuiltin(
		'random',
		[],
		function(env, argEnv) {
			let n = Math.random();
			return new Float(n);
		}
	)

	Builtin.createBuiltin(
		'do-on-after',
		[
			{name: 'a0', type:'Lambda'},
			{name: 'a1', type:'*'},
			{name: 'a2', type:'Integer'}
		],
		function(env, argEnv) {
			let lambda = env.lb('a0');
			let arg = env.lb('a1');
			let delay = env.lb('a2');
			let e = new Expectation();
			e.appendChild(arg);
			setTimeout(function() {
				let cmd = new Command('');
				cmd.appendChild(lambda);
				e.removeChild(arg);
				cmd.appendChild(arg);
				e.appendChild(cmd);
				let result = cmd.evaluate(BUILTINS);
				e.fulfill(result);
			}.bind(this), delay.getTypedValue());
			return e;
		}
	)
}