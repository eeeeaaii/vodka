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


const BUILTIN_ARG_PREFIX = '|';
const UNBOUND = "****UNBOUND****"

class Environment {
	constructor(parentEnv) {
		this.parentEnv = parentEnv;
		this.symbols = {};
		// deprecated
		this.uniques = {};
	}

	debug(lvl) {
		if (!lvl) {
			lvl = '';
		}
		for (let x in this.symbols) {
			console.log(`${lvl}${x}=${this.symbols[x]}`)
		}
		for (let x in this.uniques) {
			console.log(`${lvl}${x}:${this.uniques[x]}`)
		}
		if (this.parentEnv) {
			this.parentEnv.debug(lvl + '  ')
		}
	}

	getParent() {
		return this.parentEnv;
	}

	pushEnv() {
		let env = new Environment(this);
		return env;
	}

	bindInPackage(name, val) {
		this.bind(name, val);
	}

	bindUniqueInPackage(name, val) {
		this.bindUnique(name, val);
	}

	bind(name, val) {
		val.setBoundName(name);
		this.symbols[name] = val;
	}

	set(name, val) {
		if (this.symbols[name]) {
			this.symbols[name] = val;
		} else if (this.parentEnv) {
			this.parentEnv.set(name, val);
		}
	}

	bindUnique(name, val) {
		if (RENDERNODES) {
			throw new Error('deprecated in RENDERNODES');
		}
		this.uniques[name] = val;
	}

	lb(name) {
		let nm = BUILTIN_ARG_PREFIX + name;
		if (!this.symbols[nm]) {
			return UNBOUND;
		}
		// hack - we are testing to see if it's a javascript array
		// because we do a garbage thing where for variadics
		// we map a symbol to a js thing instead of a vodka thing.

		// TODO: I think we can remove this.
		if (this.symbols[nm].push) {
			let tocopy = this.symbols[nm];
			let z = [];
			for (let i = 0; i < tocopy.length; i++) {
				z.push(tocopy[i].makeCopy());
			}
			return z;
		} else {
			if (RENDERNODES) {
				return this.symbols[nm];
			} else {
				return this.symbols[nm].makeCopy();
			}
		}
	}

	getAllBoundSymbolsAtThisLevel() {
		var r = [];
		let nm = null;
		for (nm in this.symbols) {
			r.push(nm);
		}
		for (nm in this.uniques) {
			r.push(nm);
		}
		return r;
	}

	lookupBinding(name) {
		if (this.symbols[name]) {
			if (RENDERNODES) {
				return this.symbols[name];
			} else {
				return this.symbols[name].makeCopy();
			}
		} else if (this.uniques[name]) {
			return this.uniques[name];
		} else if (this.parentEnv) {
			return this.parentEnv.lookupBinding(name);
		} else {
			throw new EError(`Unbound symbol ${name}`);
		}
	}
}

