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

import { EError } from './nex/eerror.js'

class ContractEnforcer {
	constructor() {
		this.contracts = {};
	}

	createContract(fortag, contract) {
		let name = fortag.getName();
		if (!this.contracts[name]) {
			this.contracts[name] = [];
		}
		this.contracts[name].push(contract);
	}

	enforce(tag, nex) {
		let name = tag.getName();
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
		this.children = [];
	}

	addChildAt(c, i) {
		this.children[i] = c;
	}

	removeChildAt(i) {
		this.children[i] = null;
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

	getName() {
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

	getName() {
		return 'TYPE CONTRACT';
	}

	getDescription() {
		return 'satisfied when object has type ' + this.typename;
	}
}

class AllOfContract extends AbstractContract {
	constructor(contractList) {
		super();
		this.contractList = contractList;
	}

	isSatisfiedBy(nex) {
		for (let i = 0; i < this.contractList.length; i++) {
			if (!this.contractList[i].isSatisfiedBy(nex)) {
				return false;
			}
		}
		return true;
	}

	getConstituentContractList() {
		let s = '';
		for (let i = 0; i < this.contractList.length; i++) {
			if (s != '') {
				s += ', ';
			}
			s += this.contractList[i].getName();
		}
	}

	getError(nex) {
		return `contract not satisfied, nex must satisfy all constituent contracts: ${this.getConstituentContractList()}.`;
	}

	getName() {
		return 'ALL OF CONTRACT';
	}

	getDescription() {
		return `satisfied when object satisfies all constituent contracts: ${this.getConstituentContractList()}`;
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
		return `contract not satisfied, must have tag ${this.tag.getName()}`;
	}

	getName() {
		return 'ALL OF CONTRACT';
	}

	getDescription() {
		return `satisfied when object has tag ${this.tag.getName()}`;
	}
}


class ContainsExactlyContract extends AbstractContract {
	constructor() {
		super();
	}

	isSatisfiedBy(nex) {
		if (!nex.isNexContainer()) {
			return false;
		}

		// copy
		let contracts = [];
		for (let i = 0; i < this.children.length; i++) {
			contracts[i] = this.children[i];
		}

		
		for (let i = 0; i < nex.numChildren(); i++) {
			// each child needs to satisfy one contract
			let child = nex.getChildAt(i);
			for (let j = 0; j < contracts.length; j++) {
				let contract = contracts[j];
				if (contract && contract.isSatisfiedBy(child)) {
					contracts.splice(j, 1);
					break;
				}
				// can't find anything that satisfies it
				return false;
			}
		}

		// there was one left over not satisfied by anything
		if (contracts.length > 0) {
			return false;
		}
		return true;
	}

	getError(nex) {
		return `contract not satisfied, nex must have children that exactly satisfy child contracts.`;
	}

	getName() {
		return 'CONTAINS EXACTLY CONTRACT';
	}

	getDescription() {
		return `satisfied when object has children that exactly satisfy the child contracts.`;
	}
}



const contractEnforcer = new ContractEnforcer(); // someday this will likely be scoped in the environment

export { contractEnforcer, IdentityContract, TypeContract, AllOfContract, ContainsExactlyContract, HasTagContract }

