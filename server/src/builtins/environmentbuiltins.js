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


function createEnvironmentBuiltins() {
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
		'set',
		[
			{name:'_name@', type:'ESymbol',skipeval:true},
			{name:'nex', type:'*'}
		],
		function(env, argEnv) {
			let rhs = env.lb('nex');
			argEnv.set(env.lb('_name@').getTypedValue(), rhs);
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
			let namevalue = name.getTypedValue();
			if (PERFORMANCE_MONITOR) {
				if (val.getTypeName() == '-lambda-') {
					perfmon.registerMethod(namevalue);
				}
			}
			BINDINGS.bindInPackage(namevalue, val);
			return name;
		}
	);

	Builtin.createBuiltin(
		'bindings',
		[
			{name: '_?search@', type:'ESymbol', skipeval:true, optional:true}
		],
		function(env, argEnv) {
			let ssnex = env.lb('_?search@');
			let ss = "";
			if (ssnex != UNBOUND) {
				ss = ssnex.getTypedValue();
			}
			let matches = autocomplete.findAllBindingsMatching(ss);
			if (matches.length == 1) {
				return new ESymbol(matches[0]);
			} else {
				let r = new Doc();
				for (let j = 0; j < matches.length; j++) {
					r.appendChild(new ESymbol(matches[j]))
				}
				return r;
			}
		}
	);

	Builtin.createBuiltin(
		'builtins',
		[
			{name: '_?search@', type:'ESymbol', skipeval:true, optional:true}
		],
		function(env, argEnv) {
			let ssnex = env.lb('_?search@');
			let ss = "";
			if (ssnex != UNBOUND) {
				ss = ssnex.getTypedValue();
			}
			let matches = autocomplete.findAllBuiltinsMatching(ss);
			if (matches.length == 1) {
				return new ESymbol(matches[0]);
			} else {
				let r = new Doc();
				for (let j = 0; j < matches.length; j++) {
					r.appendChild(new ESymbol(matches[j]))
				}
				return r;
			}
		}
	);
}