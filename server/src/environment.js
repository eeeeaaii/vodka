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

	lb(name) {
		let nm = BUILTIN_ARG_PREFIX + name;
		if (!this.symbols[nm]) {
			return UNBOUND;
		}
		// hack - we are testing to see if it's a javascript array
		// because we do a garbage thing where for variadics
		// we map a symbol to a js thing instead of a vodka thing.

		if (this.symbols[nm].push) {
			let tocopy = this.symbols[nm];
			let z = [];
			for (let i = 0; i < tocopy.length; i++) {
				z.push(tocopy[i].makeCopy());
			}
			return z;
		} else {
			return this.symbols[nm];
		}
	}

	getAllBoundSymbolsAtThisLevel() {
		var r = [];
		let nm = null;
		for (nm in this.symbols) {
			r.push(nm);
		}
		return r;
	}

	lookupBinding(name) {
		let tmp = this.symbols[name];
		if (tmp) {
			return tmp;
		} else if (this.parentEnv) {
			return this.parentEnv.lookupBinding(name);
		} else {
			throw new EError(`So we tried to look up the symbol ${name} in memory, but there's`
				+ ` nothing stored under that name. Either that`
				+ ` symbol needs to be globally bound to something using "bind", or it needs`
				+ ` to be assigned a value in the local lexical environment using "let".`
				+ ` Double check the scope of your "let" statements and also just the spelling`
				+ ` of this symbol to make sure you didn't make a typo.`);
		}
	}
}

