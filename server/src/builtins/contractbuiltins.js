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

function createContractBuiltins() {
	Builtin.createBuiltin(
		'must-be',
		[
			{name:'tag^', type:'Nil'},
			{name:'nex', type:'*'}
		],
		function(env, executionEnvironment) {
			// enforces that the tag can only be applied to
			// nexes that have the same type as the passed-in arg
			let nil = env.lb('tag^');
			let nex = env.lb('nex');
			if (nil.numTags() != 1) {
				return new EError('tag-must-be: cannot set up contract, first arg needs exactly one tag')
			}
			let tag = nil.getTag(0);
			let contract = new IdentityContract(nex.getID());
			contractEnforcer.createContract(tag, contract);
			return nex;
		}
	);

	Builtin.createBuiltin(
		'must-have-type-of',
		[
			{name:'tag^', type:'Nil'},
			{name:'nex', type:'*'}
		],
		function(env, executionEnvironment) {
			// enforces that the tag can only be applied to
			// nexes that have the same type as the passed-in arg
			let nil = env.lb('tag^');
			let nex = env.lb('nex');
			if (nil.numTags() != 1) {
				return new EError('tag-must-be: cannot set up contract, first arg needs exactly one tag')
			}
			let tag = nil.getTag(0);
			let contract = new SimpleTypeContract(nex.getTypeName());
			contractEnforcer.createContract(tag, contract);
			return nex;
		}
	);
}