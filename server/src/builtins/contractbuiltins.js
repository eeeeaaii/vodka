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
import { EError, newTagOrThrowOOM } from '../nex/eerror.js'
import { constructContract } from '../nex/contract.js'

import {
	contractEnforcer,
	IdentityContract,
	TypeContract,
	HasTagContract
} from '../contractfunctions.js'
import { Tag } from '../tag.js'

function createContractBuiltins() {

	// tagged as -- satisfies --

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	Builtin.createBuiltin(
		'certify satisfies',
		[ 'tag$', 'contractк' ],
		function $mustBe(env, executionEnvironment) {
			// TODO: type check
			let tagname = env.lb('tag');
			let c = env.lb('contract');
			let tag = newTagOrThrowOOM(tagname.getFullTypedValue(), 'certify satisfies builtin');
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
			let contractImpl = new HasTagContract(newTagOrThrowOOM(tag.getFullTypedValue(), 'has tag contract builtin'));
			let cnex = constructContract(contractImpl);
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
			let cnex = constructContract(contractImpl);
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
			return constructContract(contractImpl);
		},
		'Returns a contract that is only satisified if an object has the same type as |nex.'
	);

	// Builtin.createBuiltin(
	// 	'all-of-contract',
	// 	[ 'c...' ],
	// 	function $allOfContract(env, executionEnvironment) {
	// 		let c = env.lb('c');
	// 		let constituentContracts = [];
	// 		for (let i = 0; i < c.numChildren(); i++) {
	// 			constituentContracts[i] = c.getChildAt(i).getImpl();
	// 		}
	// 		let contractImpl = new AllOfContract(constituentContracts);
	// 		return constructContract(contractImpl);
	// 	},
	// 	'Returns a contract that is only satisfied if all the constituent contracts |c are satisfied.'
	// );

	// What we actually want are:
	/*

	## simple contracts ##

	all-children-contract -- satisfied if all children satisfy the contract
	no-child-contract -- satisfied if no child has that contract
	some-child-contract -- satisfied if it has some child with the given contract
	all-child-pairs-contract -- satisfied if all pairs of children satisfy the contract
	some-child-pair-contract -- satisified if some pair of children satisfy the contract
	no-child-pair-contract -- satisfied if no pair of children satisfy the contract

	## composite contracts ##

	any-of-contract -- satisfied if any of the contracts that are children of the contract nex are satisfied
	none-of-contract -- satisifed if none of the contracts that are children of the contract nex are satisfied
	all-of-contract -- satisfied if all of the contracts that are children of the contract nex are satisfied

	*/

	// Builtin.createBuiltin(
	// 	'contains-exactly-contract',
	// 	[ 'c...' ],
	// 	function $containsExactly(env, executionEnvironment) {
	// 		let c = env.lb('c');
	// 		let contractImpl = new ContainsExactlyContract();
	// 		let r = constructContract(contractImpl);

	// 		for (let i = 0; i < c.numChildren(); i++) {
	// 			r.appendChild(c.getChildAt(i));
	// 		}
	// 		return r;
	// 	},
	// 	'Returns a contract that is only satisfied if the object has children that exactly match the child contracts.'
	// );
}


export { createContractBuiltins }

