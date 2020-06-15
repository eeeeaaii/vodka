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

import * as Vodka from '../vodka.js'

import { Builtin } from '../nex/builtin.js'
import { EError } from '../nex/eerror.js'
import { ESymbol } from '../nex/esymbol.js'
import { Doc } from '../nex/doc.js'
import { PERFORMANCE_MONITOR, BINDINGS } from '../vodka.js'
import { UNBOUND } from '../environment.js'

function createEnvironmentBuiltins() {

	Builtin.createBuiltin(
		'bind',
		[ '_name@', 'nex' ],
		function(env, executionEnvironment) {
			let val = env.lb('nex');
			let name = env.lb('name');
			let namestr = name.getTypedValue();
			BINDINGS.bindInPackage(namestr, val);
			return name;
		}
	);

	Builtin.createBuiltin(
		'bindings',
		[ '_search@?' ],
		function(env, executionEnvironment) {
			let ssnex = env.lb('search');
			let ss = "";
			if (ssnex != UNBOUND) {
				ss = ssnex.getTypedValue();
			}
			let matches = Vodka.autocomplete.findAllBindingsMatching(ss);
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
		[ '_search@?' ],
		function(env, executionEnvironment) {
			let ssnex = env.lb('search');
			let ss = "";
			if (ssnex != UNBOUND) {
				ss = ssnex.getTypedValue();
			}
			let matches = Vodka.autocomplete.findAllBuiltinsMatching(ss);
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
		'let',
		[ '_name@', 'nex' ],
		function(env, executionEnvironment) {
			let rhs = env.lb('nex');
			let symname = env.lb('name').getTypedValue();
			executionEnvironment.bind(symname, rhs);
			if (rhs.getTypeName() == '-closure-') {
				// basically let is always "letrec"
				rhs.getLexicalEnvironment().bind(symname, rhs);
			}
			return rhs;
		}
	);

	Builtin.createBuiltin(
		'set',
		[ '_name@', 'nex' ],
		function(env, executionEnvironment) {
			let rhs = env.lb('nex');
			executionEnvironment.set(env.lb('name').getTypedValue(), rhs);
			return rhs;
		}
	);

	Builtin.createBuiltin(
		'unclose',
		[ 'closure&' ],
		function(env, executionEnvironment) {
			// replaces the closure with the dynamic scope of the function we are in
			let rhs = env.lb('closure');
			rhs.setLexicalEnvironment(executionEnvironment);
			return rhs;
		}
	);	

}

export { createEnvironmentBuiltins }

