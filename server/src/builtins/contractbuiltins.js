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

import { contractEnforcer } from '../contract.js'
import { IdentityContract } from '../contract.js'
import { SimpleTypeContract } from '../contract.js'
import { ContentsLikeContract } from '../contract.js'
import { ContentsTaggedLikeContract } from '../contract.js'

function createContractBuiltins() {
	Builtin.createBuiltin(
		'must-be',
		[ 'nix^', 'nex' ],
		function(env, executionEnvironment) {
			let nix = env.lb('nix');
			let nex = env.lb('nex');
			if (nix.numTags() != 1) {
				return new EError('must-be: cannot set up contract, nix needs exactly one tag')
			}
			let tag = nix.getTag(0);
			let contract = new IdentityContract(nex.getID());
			contractEnforcer.createContract(tag, contract);
			return nex;
		},
		'ensures that the nix tag can only be applied to |nex.'
	);

	Builtin.createBuiltin(
		'must-have-type-of',
		[ 'nix^', 'nex' ],
		function(env, executionEnvironment) {
			let nix = env.lb('nix');
			let nex = env.lb('nex');
			if (nix.numTags() != 1) {
				return new EError('tag-must-be: cannot set up contract, nix needs exactly one tag')
			}
			let tag = nix.getTag(0);
			let contract = new SimpleTypeContract(nex.getTypeName());
			contractEnforcer.createContract(tag, contract);
			return nex;
		},
		'ensures that anything with the nix tag must have the same type as |nex.'
	);

	Builtin.createBuiltin(
		'must-have-contents-tagged-like',
		[ 'nix^', 'org()' ],
		function(env, executionEnvironment) {
			let nix = env.lb('nix');
			let org = env.lb('org');
			if (nix.numTags() != 1) {
				return new EError('must-have-contents-tagged-like: cannot set up contract, nix needs exactly one tag')
			}
			let tag = nix.getTag(0);
			let contract = new ContentsTaggedLikeContract(org);
			contractEnforcer.createContract(tag, contract);
			return org;
		},
		'ensures that anything with the nix tag must have the same number of children as |org, and those children must be tagged the same way.'
	);

	Builtin.createBuiltin(
		'must-have-contents-like',
		[ 'nix^', 'org()' ],
		function(env, executionEnvironment) {
			let nix = env.lb('nix');
			let org = env.lb('org');
			if (nix.numTags() != 1) {
				return new EError('must-have-contents-like: cannot set up contract, nix needs exactly one tag')
			}
			let tag = nix.getTag(0);
			let contract = new ContentsLikeContract(org);
			contractEnforcer.createContract(tag, contract);
			return org;
		},
		'ensures that anything with the nix tag must have the same number of children as |org, and those children must have the same types.'
	);
}

export { createContractBuiltins }

