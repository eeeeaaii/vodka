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

class ContractEnforcer {
	constructor() {
		this.contracts = {};
	}

	createContract(fortag, contract) {
		this.contracts[fortag.getName()] = contract;
	}

	enforce(tag, nex) {
		let contract = this.contracts[tag.getName()];
		if (!contract) {
			return true;
		}
		return contract.isSatisfiedBy(nex);
	}
}

class IdentityContract {
	constructor(id) {
		this.id = id;
	}

	isSatisfiedBy(nex) {
		return (nex.getID() == this.id);
	}
}

class SimpleTypeContract {
	constructor(typeName) {
		this.typeName = typeName;
	}

	isSatisfiedBy(nex) {
		return (nex.getTypeName() == this.typeName);
	}
}

export { ContractEnforcer, IdentityContract, SimpleTypeContract }

