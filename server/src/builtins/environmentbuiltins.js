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

import { autocomplete } from '../autocomplete.js'
import { Builtin } from '../nex/builtin.js'
import { EError } from '../nex/eerror.js'
import { Bool } from '../nex/bool.js'
import { ESymbol } from '../nex/esymbol.js'
import { Doc } from '../nex/doc.js'
import { BINDINGS } from '../environment.js'
import { PERFORMANCE_MONITOR } from '../perfmon.js'
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
		},
		'binds a new global variable named |name with a value of |nex.'
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
		},
		'returns a list of all globally bound variables.'
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
		},
		'returns a list of all vodka builtins.'
	);

	Builtin.createBuiltin(
		'is-bound',
		[ '_name@'],
		function(env, executionEnvironment) {
			let name = env.lb('name');
			try {
				let binding = executionEnvironment.lookupBinding(name.getTypedValue());
				return new Bool(true);
			} catch (e) {
				// don't swallow real errors
				if (e.getTypeName
						&& e.getTypeName() == '-error-'
						&& e.getFullTypedValue().substr(0, 16) == 'undefined symbol') {
					return new Bool(false);
				} else {
					throw e;
				}
			}
		},
		'returns true if the symbol |name is bound in the global environment.'
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
		},
		'binds |name to |nex in the current closure\'s local scope.'
	);

	Builtin.createBuiltin(
		'set',
		[ '_name@', 'nex' ],
		function(env, executionEnvironment) {
			let rhs = env.lb('nex');
			let namenex = env.lb('name');
			let name = namenex.getTypedValue();
			let tag = null;
			if (namenex.numTags() == 1) {
				tag = namenex.getTag(0);
			}
			executionEnvironment.set(name, rhs, tag);
			return rhs;
		},
		'changes the value of |name to |nex (|name can be a local variable or globally bound symbol).'
	);

	Builtin.createBuiltin(
		'unclose',
		[ 'closure&' ],
		function(env, executionEnvironment) {
			// replaces the closure with the dynamic scope of the function we are in
			let rhs = env.lb('closure');
			rhs.setLexicalEnvironment(executionEnvironment);
			return rhs;
		},
		'replaces the lexical environment of |closure with the current lexical environment.'
	);	

}

export { createEnvironmentBuiltins }

