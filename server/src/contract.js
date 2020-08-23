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

import { EError } from '../nex/eerror.js'

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

class IdentityContract {
	constructor(id) {
		this.id = id;
	}

	isSatisfiedBy(nex) {
		return (nex.getID() == this.id);
	}

	getError(nex) {
		return `contract not satisfied, nex must have oid=${this.id}, was ${nex.getID()}`;
	}
}

class ContentsTaggedLikeContract {
	constructor(nex) {
		this.specs = [];
		this.structString = '';
		for (let i = 0; i < nex.numChildren(); i++) {
			let c = nex.getChildAt(i);
			if (c.numTags() != 1) {
				throw new EError("Cannot create contract, each child must have one tag.");
			}
			let tag = c.getTag(0).getName();
			let type = c.getTypeName();
			this.specs.push({
				tag: tag,
				type: type
			})
			this.structString += ` { tag: ${tag}, type: ${type} }`;
		}
	}

	isSatisfiedBy(nex) {
		let tally = [];
		if (nex.numChildren() != this.specs.length) {
			return false;
		}
		for (let i = 0; i < nex.numChildren() ; i++) {
			let c = nex.getChildAt(i);
			if (c.numTags() != 1) {
				return false;
			}
			let tag = c.getTag(0).getName();
			let type = c.getTypeName();
			for (let j = 0; j < this.specs.length; j++) {
				if (tally[j]) continue;
				if (this.specs[j].tag == tag && this.specs[j].type == type) {
					tally[j] = 1;
				}
			}
		}
		for (let k = 0; k < this.specs.length; k++) {
			if (!tally[k]) return false;
		}
		return true;
	}

	getError(nex) {
		return `contract not satisfied, nex must have this exact structure=${this.structString}.`;
	}
}


class ContentsLikeContract {
	constructor(nex) {
		this.specs = [];
		this.structString = '';
		for (let i = 0; i < nex.numChildren(); i++) {
			let c = nex.getChildAt(i);
			let type = c.getTypeName();
			this.specs.push({
				type: type
			})
			this.structString += ` { type: ${type} }`;
		}
	}

	isSatisfiedBy(nex) {
		let tally = [];
		if (nex.numChildren() != this.specs.length) {
			return false;
		}
		for (let i = 0; i < nex.numChildren() ; i++) {
			let c = nex.getChildAt(i);
			let type = c.getTypeName();
			for (let j = 0; j < this.specs.length; j++) {
				if (tally[j]) continue;
				if (this.specs[j].type == type) {
					tally[j] = true;
				}
			}
		}
		for (let k = 0; k < this.specs.length; k++) {
			if (!tally[k]) return false;
		}
		return true;
	}

	getError(nex) {
		return `contract not satisfied, nex must have this exact structure=${this.structString}.`;
	}
}

class SimpleTypeContract {
	constructor(typeName) {
		this.typeName = typeName;
	}

	isSatisfiedBy(nex) {
		return (nex.getTypeName() == this.typeName);
	}

	getError(nex) {
		return `contract not satisfied, nex must have type=${this.typeName}, was ${nex.getTypeName()}`;
	}
}

const contractEnforcer = new ContractEnforcer(); // someday this will likely be scoped in the environment

export { contractEnforcer, IdentityContract, SimpleTypeContract, ContentsLikeContract, ContentsTaggedLikeContract }

