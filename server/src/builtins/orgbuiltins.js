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

function createOrgBuiltins() {
	Builtin.createBuiltin(
		'set-tagged',
		['org) any'],
		function(env, executionEnvironment) {
			// first param should be an org,
			// second param is any.
			// first param should be tagged.
			// second param is assigned to the 
			// member of first param bearing its tag.
			return new EString("unimplemented");
		}
	)


	Builtin.createBuiltin(
		'class',
		[ 'sym@ org)' ],
		function(env, executionEnvironment) {
			let sym = env.lb('sym');
			let canonicalOrg = env.lb('org').makeCopy();

			/*
			initer = method that does this:
				newthis = copy of canonical org
				for each method in newthis:
					if (method has this pointer as first arg):
						newmethod = method that does this:
							firstarg = newthis
							return call of method(firstarg, rest of args)
						replace method with newmethod in newthis
					endif
				endfor
				return newthis
			bind initer to symbol make-sym (where sym is name of class)

			if we were allowing polymorphism we would do the above
			for each initializer in a class but polymorphism isn't good
			because it relies on extracontextual information to resolve
			the method reference

			*/

			return new EString("unimplemented");
			// let r = '';
			// let ar = env.lb('str');
			// for (let i = 0; i < ar.numChildren(); i++) {
			// 	let s = ar.getChildAt(i).getFullTypedValue();
			// 	r += s;
			// }
			// return new EString(r);
		}
	);
}

export { createOrgBuiltins }

