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
		for (let name in this.symbols) {
			console.log(`${lvl}${name}=${this.symbols[name].val}`)
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
		if (this.symbols[name]) {
			this.symbols[name].val = val;
			this.symbols[name].version++;
		} else {
			this.symbols[name] = {
				val: val,
				version: 0
			};
		}
	}

	set(name, val) {
		if (this.symbols[name]) {
			let rec = this.symbols[name];
			rec.val = val;
			rec.version++;
		} else if (this.parentEnv) {
			this.parentEnv.set(name, val);
		}
	}

	lb(name) {
		let nm = BUILTIN_ARG_PREFIX + name;
		if (!this.symbols[nm]) {
			return UNBOUND;
		}
		return this.symbols[nm].val;
	}

	getAllBoundSymbolsAtThisLevel() {
		var r = [];
		let nm = null;
		for (nm in this.symbols) {
			r.push(nm);
		}
		return r;
	}

	lookupFullBinding(name) {
		let tmp = this.symbols[name];
		if (tmp) {
			return tmp;
		} else if (this.parentEnv) {
			return this.parentEnv.lookupBinding(name);
		} else {
			throw new EError(`undefined symbol: ${name}. Sorry!`);
		}
	}

	lookupBinding(name) {
		let tmp = this.symbols[name];
		if (tmp) {
			return tmp.val;
		} else if (this.parentEnv) {
			return this.parentEnv.lookupBinding(name);
		} else {
			throw new EError(`undefined symbol: ${name}. Sorry!`);
		}
	}
}

