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

function createFileBuiltins() {

	Builtin.createBuiltin(
		'save',
		[
			{name:'_name@', type:'ESymbol', skipeval:true},
			{name:'_nex', type:'*', skipeval:true}
		],
		function(env, argEnv) {
			let nm = env.lb('_name@').getTypedValue();
			let val = env.lb('_nex');			
			let exp = new Expectation();
			saveNex(nm, val, exp);
			return exp;
		}
	);

	Builtin.createBuiltin(
		'save-result',
		[
			{name:'_name@', type:'ESymbol', skipeval:true},
			{name:'nex', type:'*'}
		],
		function(env, argEnv) {
			let nm = env.lb('_name@').getTypedValue();
			let val = env.lb('nex');			
			let exp = new Expectation();
			saveNex(nm, val, exp);
			return exp;
		}
	);

	Builtin.createBuiltin(
		'load',
		[
			{name:'_name@', type:'ESymbol', skipeval:true},
		],
		function(env, argEnv) {
			let nm = env.lb('_name@').getTypedValue();
			let exp = new Expectation();
			loadNex(nm, exp);
			return exp;
		}
	);

	Builtin.createBuiltin(
		'import',
		[
			{name:'_name@', type:'ESymbol', skipeval:true},
		],
		function(env, argEnv) {
			let nm = env.lb('_name@').getTypedValue();
			let exp = new Expectation();
			importNex(nm, exp);
			return exp;
		}
	);

	Builtin.createBuiltin(
		'with-imports',
		[
			{name:'imports()', type:'NexContainer'},
			{name:'_nex', type:'*', skipeval:true}
		],
		function(env, argEnv) {
			let importList = env.lb('imports()');
			let nex = env.lb('_nex');
			let exp = new Expectation();
			importChain(importList, nex, exp);
			return exp;
		}
	);

	// deprecated, remove, maybe re-implement as bootstrapped
	Builtin.createBuiltin(
		'edit',
		[
			{name:'_name@', type:'ESymbol', skipeval:true},
			{name:'_val???', type:'*', skipeval:true, optional:true},
		],
		function(env, argEnv) {
			let sym = env.lb('_name@').makeCopy();
			let nm = sym.getTypedValue();
			let val = env.lb('_val???');
			if (val) {
				val = val.makeCopy();
				toEval = val.makeCopy();
				let evaluated = evaluateNexSafely(toEval, argEnv);
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
}