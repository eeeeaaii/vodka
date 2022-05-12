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
import { Contract } from '../nex/contract.js'

import {
	contractEnforcer,
	IdentityContract,
	TypeContract,
	AllOfContract,
	ContainsExactlyContract,
	HasTagContract
} from '../contractfunctions.js'
import { Tag } from '../tag.js'

function createContractBuiltins() {

	// tagged as -- satisfies --

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	Builtin.createBuiltin(
		'certify satisfies',
		[ 'tag$', 'contract' ],
		function $mustBe(env, executionEnvironment) {
			let tagname = env.lb('tag');
			let c = env.lb('contract');
			let tag = new Tag(tagname.getFullTypedValue());
			contractEnforcer.createContract(tag, c.getImpl());
			c.addContractTag(tag);
			return c;
		},
		'Declares that any object tagged with |tag must satisfy the passed-in |contract.'
	);


	Builtin.createBuiltin(
		'has-tag-contract',
		[ 'tag$' ],
		function $hasTagContract(env, executionEnvironment) {
			let tag = env.lb('tag');
			let contractImpl = new HasTagContract(new Tag(tag.getFullTypedValue()));
			let cnex = new Contract(contractImpl);
			return cnex;
		},
		'Returns a contract that is satisfied if something is tagged with |tag.'
	);


	Builtin.createBuiltin(
		'identity-contract',
		[ 'nex' ],
		function $mustBe(env, executionEnvironment) {
			let nex = env.lb('nex');
			let contractImpl = new IdentityContract(nex.getID());
			let cnex = new Contract(contractImpl);
			return cnex;
		},
		'Returns a contract that is only satisfied for the specific passed-in object |nex.'
	);


	Builtin.createBuiltin(
		'type-contract',
		[ 'nex' ],
		function $mustHaveTypeOf(env, executionEnvironment) {
			let nex = env.lb('nex');
			let contractImpl = new TypeContract(nex.getTypeName());
			return new Contract(contractImpl);
		},
		'Returns a contract that is only satisified if an object has the same type as |nex.'
	);

	Builtin.createBuiltin(
		'all-of-contract',
		[ 'c...' ],
		function $allOfContract(env, executionEnvironment) {
			let c = env.lb('c');
			let constituentContracts = [];
			for (let i = 0; i < c.numChildren(); i++) {
				constituentContracts[i] = c.getChildAt(i).getImpl();
			}
			let contractImpl = new AllOfContract(constituentContracts);
			return new Contract(contractImpl);
		},
		'Returns a contract that is only satisfied if all the constituent contracts |c are satisfied.'
	);

	// What we actually want are:
	/*
	has-child-contract -- satisfied if it has a child with the given contract
	no-child-contract -- satisfied if no child has that contract
	no-child-except-contract -- satisfied if there are no children that don't satisfy that contract
	any-of-contract -- satisfied if any of the listed contracts are satisfied
	none-of-contract -- satisifed if none of the contracts are satisfied


	*/

	// Builtin.createBuiltin(
	// 	'contains-exactly-contract',
	// 	[ 'c...' ],
	// 	function $containsExactly(env, executionEnvironment) {
	// 		let c = env.lb('c');
	// 		let contractImpl = new ContainsExactlyContract();
	// 		let r = new Contract(contractImpl);

	// 		for (let i = 0; i < c.numChildren(); i++) {
	// 			r.appendChild(c.getChildAt(i));
	// 		}
	// 		return r;
	// 	},
	// 	'Returns a contract that is only satisfied if the object has children that exactly match the child contracts.'
	// );
}


export { createContractBuiltins }

