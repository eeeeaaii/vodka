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
			{name:'list()', type:'NexContainer'}
		],
		function(env, argEnv) {
			return env.lb('list()').getFirstChild();
		}
	);

	Builtin.createBuiltin(
		'cdr',
		[
			{name:'list()', type:'NexContainer'}
		],
		function(env, argEnv) {
			let c = env.lb('list()');
			c.removeChild(c.getChildAt(0));
			return c;
		}
	);

	Builtin.createBuiltin(
		'cons',
		[
			{name:'nex', type:'*'},
			{name:'list()', type:'NexContainer'},
		],
		function(env, argEnv) {
			let lst = env.lb('list()');
			lst.prependChild(env.lb('nex'));
			return lst;
		}
	);

	Builtin.createBuiltin(
		'is-empty',
		[
			{name:'list()', type:'NexContainer'},
		],
		function(env, argEnv) {
			let lst = env.lb('list()');
			let rb = !lst.hasChildren();
			return new Bool(rb);
		}
	);

	Builtin.createBuiltin(
		'begin',
		[
			{name:'nex*...', type:'*', variadic:true}
		],
		function(env, argEnv) {
			let lst = env.lb('nex*...');
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
			{name:'_name@', type:'ESymbol',skipeval:true},
			{name:'nex', type:'*'}
		],
		function(env, argEnv) {
			let rhs = env.lb('nex');
			argEnv.bind(env.lb('_name@').getTypedValue(), rhs);
			return rhs;
		}
	);

	Builtin.createBuiltin(
		'bind',
		[
			{name:'_name@', type:'ESymbol',skipeval:true},
			{name:'nex', type:'*'}
		],
		function(env, argEnv) {
			let val = env.lb('nex');
			let name = env.lb('_name@');
			BUILTINS.bindInPackage(name.getTypedValue(), val);
			return name;
		}
	);

	Builtin.createBuiltin(
		'bind-unique',
		[
			{name:'_name@', type:'ESymbol', skipeval:true},
			{name:'nex', type:'*'}
		],
		function(env, argEnv) {
			let val = env.lb('nex');
			BUILTINS.bindUniqueInPackage(env.lb('_name@').getTypedValue(), val);
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
		'built-ins',
		[
		],
		function(env, argEnv) {
			let names = BUILTINS.getParent().getAllBoundSymbolsAtThisLevel();
			let r = new Doc();
			for (let i = 0; i < names.length; i++) {
				let sym = new ESymbol(names[i]);
				r.appendChild(sym);
			}
			return r;
		}
	);

	Builtin.createBuiltin(
		'eval-after',
		[
			{name: 'cmd', type:'*'},
			{name: 'time#', type:'Integer'}
		],
		function(env, argEnv) {
			let time = env.lb('time#').getTypedValue();
			let toEval = env.lb('cmd');
			let exp = new Expectation();
			setTimeout(function() {
				exp.fulfill(evaluateNexSafely(toEval, argEnv));
			}, time);
			return exp;
		}
	);

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
	);

	Builtin.createBuiltin(
		'random',
		[],
		function(env, argEnv) {
			let n = Math.random();
			return new Float(n);
		}
	);

	Builtin.createBuiltin(
		'do-on-after',
		[
			{name: 'func&', type:'Lambda'},
			{name: 'arg', type:'*'},
			{name: 'delay#', type:'Integer'}
		],
		function(env, argEnv) {
			let lambda = env.lb('func&');
			let arg = env.lb('arg');
			let delay = env.lb('delay#');
			let e = new Expectation();
			e.appendChild(arg);
			let clearVar = setTimeout(function() {
				let cmd = new Command('');
				cmd.appendChild(lambda);
				e.removeChild(arg); // eventually not needed
				cmd.appendChild(arg);
				let result = evaluateNexSafely(cmd, argEnv);
				e.fulfill(result);
			}.bind(this), delay.getTypedValue());
			e.setDeleteHandler(function() {
				clearTimeout(clearVar);
			}.bind(this));
			return e;
		}
	);

}