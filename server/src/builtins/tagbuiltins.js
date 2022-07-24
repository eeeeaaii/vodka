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
import { constructFatalError, newTagOrThrowOOM } from '../nex/eerror.js'
import { constructBool } from '../nex/bool.js'
import { Tag } from '../tag.js'
import { contractEnforcer } from '../contractfunctions.js';

function createTagBuiltins() {

	// IT IS AN INTENTIONAL CHOICE THAT THERE ARE NO FUNCTIONS TO REMOVE TAGS
	// Tags enforce types via contracts. If you can remove tags, you can
	// subvert any type protections that someone wants to add to something.
	// you can remove them using the editor of course, but not with code.

	Builtin.createBuiltin(
		'add-tag to',
		[ 'tag$', 'nex' ],
		function $addTag(env, executionEnvironment) {
			let nex = env.lb('nex');
			let tagname = env.lb('tag').getFullTypedValue();
			let tag = newTagOrThrowOOM(tagname, 'add-tag builtin');
			let errorMessage = contractEnforcer.enforce(tag, nex);
			if (errorMessage) {
				let e = constructFatalError(errorMessage);
				return e;
			}
			nex.addTag(newTagOrThrowOOM(tagname, 'add-tag builtin'));
			return nex;
		},
		'Adds the tag |tag to |nex.'
	);


	Builtin.createBuiltin(
		' has-tag',
		[ 'nex', 'tag$' ],
		function $hasTag(env, executionEnvironment) {
			let n = env.lb('nex');
			let tagname = env.lb('tag').getFullTypedValue();
			let tag = newTagOrThrowOOM(tagname, 'has-tag builtin');
			if (n.hasTag(tag)) {
				return constructBool(true);
			} else {
				return constructBool(false);
			}
		},
		'Returns true if |nex has a tag equal to |tag.'
	);

}

export { createTagBuiltins }

