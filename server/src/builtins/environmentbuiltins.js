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

import * as Utils from '../utils.js'

import { autocomplete } from '../autocomplete.js'
import { Builtin } from '../nex/builtin.js'
import { constructFatalError } from '../nex/eerror.js'

import { constructEString } from '../nex/estring.js'
import { constructBool } from '../nex/bool.js'
import { constructESymbol } from '../nex/esymbol.js'
import { constructNil } from '../nex/nil.js'
import { constructOrg } from '../nex/org.js'

import { BINDINGS } from '../environment.js'
import { PERFORMANCE_MONITOR } from '../perfmon.js'
import { UNBOUND } from '../environment.js'
import { evaluateNexSafely } from '../evaluator.js'
import { wrapError } from '../evaluator.js'
import { experiments } from '../globalappflags.js'
import { sAttach } from '../syntheticroot.js'

function createEnvironmentBuiltins() {

	Builtin.createBuiltin(
		'bind',
		[ '_name@', 'nex' ],
		function $bind(env, executionEnvironment) {
			let val = env.lb('nex');
			let name = env.lb('name');
			let namestr = name.getTypedValue();
			if (namestr.indexOf(':') >= 0) {
				return constructFatalError('bind: cannot bind a symbol with a colon (:) except via the package mechanism. Sorry!');
			}
			let packageName = executionEnvironment.getPackageForBinding();
			if (packageName) {
				BINDINGS.bindInPackage(namestr, val, packageName);
			} else {
				BINDINGS.normalBind(namestr, val);
			}
			return name;
		},
		'Binds a new global variable named |name to |nex. Aliases: bind to'
	);
	Builtin.aliasBuiltin('bind to', 'bind');


	Builtin.createBuiltin(
		'bindings',
		[ '_search@?' ],
		function $bindings(env, executionEnvironment) {
			let ssnex = env.lb('search');
			let ss = "";
			if (ssnex != UNBOUND) {
				ss = ssnex.getTypedValue();
			}
			let matches = autocomplete.findAllBindingsMatching(ss);
			let r = constructOrg();
			for (let j = 0; j < matches.length; j++) {
				r.appendChild(constructESymbol(matches[j].name))
			}
			return r;
		},
		'Returns a list of all globally bound variables that match the search string |search, or all if |search is omitted.'
	);


	Builtin.createBuiltin(
		'builtins',
		[ '_search@?' ],
		function $builtins(env, executionEnvironment) {
			let ssnex = env.lb('search');
			let ss = "";
			if (ssnex != UNBOUND) {
				ss = ssnex.getTypedValue();
			}
			let matches = autocomplete.findAllBuiltinsMatching(ss);
			let r = constructOrg();
			for (let j = 0; j < matches.length; j++) {
				r.appendChild(constructESymbol(matches[j].name))
			}
			return r;
		},
		'Returns a list of standard Vodka builtin function names that match |search, or all of them if |search arg is not provided.'
	);


	Builtin.createBuiltin(
		'is-bound',
		[ '_name@'],
		function $isBound(env, executionEnvironment) {
			let name = env.lb('name');
			try {
				let binding = executionEnvironment.lookupBinding(name.getTypedValue());
				return constructBool(true);
			} catch (e) {
				// don't swallow real errors
				if (e.getTypeName
						&& e.getTypeName() == '-error-'
						&& e.getFullTypedValue().substr(0, 16) == 'undefined symbol') {
					return constructBool(false);
				} else {
					throw e;
				}
			}
		},
		'Returns true if the symbol |name is bound in the global environment.'
	);


	Builtin.createBuiltin(
		'let',
		[ '_name@', 'nex' ],
		function $let(env, executionEnvironment) {
			let rhs = env.lb('nex');
			let symname = env.lb('name').getTypedValue();
			executionEnvironment.bind(symname, rhs);
			if (rhs.getTypeName() == '-closure-') {
				// basically let is always "letrec"
				rhs.getLexicalEnvironment().bind(symname, rhs);
			}
			return rhs;
		},
		'Binds the variable |name to |nex in the current closure\'s local scope. Aliases: let be'
	);
	Builtin.aliasBuiltin('let be', 'let');


	Builtin.createBuiltin(
		'set',
		[ '_name@', 'nex' ],
		function $set(env, executionEnvironment) {
			let namenex = env.lb('name');
			let rhs = env.lb('nex');
			let name = namenex.getTypedValue();
			let tag = null;
			if (namenex.numTags() == 1) {
				tag = namenex.getTag(0);
			}
			executionEnvironment.set(name, rhs, tag);
			return rhs;
		},
		`Changes the binding for |name so that it becomes bound to |nex, regardless of the scope of |name (it can be a local variable, in an enclosing scope, or a globally bound symbol). This function doesn't change the scope of |name.`
	);


	Builtin.createBuiltin(
		'unclose',
		[ 'closure&' ],
		function $unclose(env, executionEnvironment) {
			// replaces the closure with the dynamic scope of the function we are in
			let rhs = env.lb('closure');
			rhs.setLexicalEnvironment(executionEnvironment);
			return rhs;
		},
		'Replaces the lexical environment of |closure with the lexical environment that exists at the call site of this call to unclose.'
	);	


	Builtin.createBuiltin(
		'use',
		[ '_name@' ],
		function $use(env, executionEnvironment) {
			let packageName = env.lb('name').getTypedValue();
			if (!BINDINGS.isKnownPackageName(packageName)) {
				return constructFatalError(`use: invalid package name ${packageName}. Sorry!`);
			}
			executionEnvironment.usePackage(packageName);
			return constructNil();
		},
		'Makes it so bindings in the package |name can be dereferenced without the package identifier. Stays in effect for the remainder of the current scope.'
	);	


	Builtin.createBuiltin(
		'using',
		[ '_namelist()', '_nex...' ],
		function $using(env, executionEnvironment) {
			let packageList = env.lb('namelist');
			for (let i = 0; i < packageList.numChildren(); i++) {
				let c = packageList.getChildAt(i);
				if (!(c.getTypeName() == '-symbol-')) {
					return constructFatalError(`using: first arg must be a list of symbols that denote package names, but ${c.prettyPrint()} is not a symbol. Sorry!`);
				}
				let packageName = c.getTypedValue();
				if (!BINDINGS.isKnownPackageName(packageName)) {
					return constructFatalError(`using: invalid package name ${packageName}. Sorry!`);
				}
				executionEnvironment.usePackage(packageName);
			}
			let lst = env.lb('nex');
			let result = constructNil();
			for (let j = 0; j < lst.numChildren(); j++) {
				let c = lst.getChildAt(j);
				result = sAttach(evaluateNexSafely(c, executionEnvironment));
				if (Utils.isFatalError(result)) {
					result = wrapError('&szlig;', `using: error in expression ${j+1}, cannot continue. Sorry!`, result);
					return result;
				}
			}
			return result;
		},
		'makes it so bindings in the packages in |namelist can be dereferenced without the package identifier when evaluating the rest of the arguments.'
	);	


	Builtin.createBuiltin(
		'dump-memory',
		[ 'closure&' ],
		function $dumpMemory(env, executionEnvironment) {
			let closure = env.lb('closure');
			let lexenv = closure.getLexicalEnvironment();
			let doLevel = function(envAtLevel) {
				let r = constructOrg();
				envAtLevel.doForEachBinding(function(binding) {
					let rec = constructOrg();
					rec.appendChild(constructESymbol(binding.name));
					rec.appendChild(binding.val);
					r.appendChild(rec);
				})
				if (envAtLevel.getParent()) {
					r.appendChild(doLevel(envAtLevel.getParent()));
				}
				return r;
			}
			return doLevel(lexenv);
		},
		'Returns the memory environment of |closure, in the form of a list containing all bound symbols along with their values.'
	);


	Builtin.createBuiltin(
		'see-id',
		[ 'nex' ],
		function $seeId(env, executionEnvironment) {
			let nex = env.lb('nex');
			return constructEString('' + nex.getID());
		},
		'Returns the in-memory ID of |nex as a string.'
	);


}

export { createEnvironmentBuiltins }

