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

// These contract implementations don't have children.
// the corresponding nexes do.

class ContractEnforcer {
	constructor() {
		this.contracts = {};
	}

	createContract(fortag, contract) {
		let name = fortag.getTagString();
		if (!this.contracts[name]) {
			this.contracts[name] = [];
		}
		this.contracts[name].push(contract);
	}

	enforce(tag, nex) {
		let name = tag.getTagString();
		if (!this.contracts[name]) {
			return null;
		}
		for (let i = 0; i < this.contracts[name].length; i++) {
			let contract = this.contracts[name][i];
			if (!contract.isSatisfiedBy(nex)) {
				let err = 'For tag `' + name + '`: ';
				return err + contract.getError(nex);
			}
		}
		return null;
	}
}

class AbstractContract {
	constructor() {
	}
}

class IdentityContract extends AbstractContract {
	constructor(id) {
		super();
		this.id = id;
	}

	isSatisfiedBy(nex) {
		return (nex.getID() == this.id);
	}

	getError(nex) {
		return `contract not satisfied, nex must have oid=${this.id}, was ${nex.getID()}`;
	}

	getContractName() {
		return 'IDENTITY CONTRACT';
	}

	getDescription() {
		return 'satisfied when object has id ' + this.id;
	}
}


class TypeContract extends AbstractContract {
	constructor(typename) {
		super();
		this.typename = typename;
	}

	isSatisfiedBy(nex) {
		return (nex.getTypeName() == this.typename);
	}

	getError(nex) {
		return `contract not satisfied, nex must have type ${this.typename}`;
	}

	getContractName() {
		return 'TYPE CONTRACT';
	}

	getDescription() {
		return 'satisfied when object has type ' + this.typename;
	}
}


class HasTagContract extends AbstractContract {
	constructor(tag) {
		super();
		this.tag = tag;
	}

	isSatisfiedBy(nex) {
		for (let i = 0 ; i < nex.numTags(); i++) {
			let t = nex.getTag(i);
			if (t.equals(this.tag)) {
				return true;
			}
		}
		return false;
	}

	getError(nex) {
		return `contract not satisfied, must have tag ${this.tag.getTagString()}`;
	}

	getContractName() {
		return 'ALL OF CONTRACT';
	}

	getDescription() {
		return `satisfied when object has tag ${this.tag.getTagString()}`;
	}
}



const contractEnforcer = new ContractEnforcer(); // someday this will likely be scoped in the environment

export { contractEnforcer, IdentityContract, TypeContract, HasTagContract }

