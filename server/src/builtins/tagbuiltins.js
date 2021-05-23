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
import { Bool } from '../nex/bool.js'
import { Tag } from '../tag.js'

function createTagBuiltins() {

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $addTag(env, executionEnvironment) {
		let n = env.lb('nex');
		let tagname = env.lb('tag').getFullTypedValue();
		n.addTag(new Tag(tagname));
		return n;
	}

	Builtin.createBuiltin(
		'add-tag--to',
		[ 'tag$', 'nex' ],
		$addTag
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $clearTags(env, executionEnvironment) {
		let n = env.lb('_nex');
		n.clearTags();
		return n;
	}

	Builtin.createBuiltin(
		'clear-tags-from',
		[ 'nex' ],
		$clearTags
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $hasTag(env, executionEnvironment) {
		let n = env.lb('nex');
		let tagname = env.lb('tag').getFullTypedValue();
		let tag = new Tag(tagname);
		if (n.hasTag(tag)) {
			return new Bool(true);
		} else {
			return new Bool(false);
		}
	}

	Builtin.createBuiltin(
		'--has-tag',
		[ 'nex', 'tag$' ],
		$hasTag
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $removeTag(env, executionEnvironment) {
		let n = env.lb('nex');
		let tagname = env.lb('tag').getFullTypedValue();
		let tag = new Tag(tagname);
		n.removeTag(tag);
		return n;
	}

	Builtin.createBuiltin(
		'remove-tag--from',
		[ 'tag$', 'nex' ],
		$removeTag
	);
}

export { createTagBuiltins }

