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


var BUILTIN_ARG_PREFIX = '****arg****';

class Environment {
	constructor(parentEnv) {
		this.parentEnv = parentEnv;
		this.symbols = {};
		this.uniques = {};
	}

	debug(lvl) {
		if (!lvl) {
			lvl = '';
		}
		for (var x in this.symbols) {
			console.log(`${lvl}${x}=${this.symbols[x]}`)
		}
		for (var x in this.uniques) {
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
		var env = new Environment(this);
		return env;
	}

	bindInPackage(name, val) {
		this.bind(name, val);
	}

	bindUniqueInPackage(name, val) {
		this.bindUnique(name, val);
	}

	bind(name, val) {
		this.symbols[name] = val;
	}

	bindUnique(name, val) {
		this.uniques[name] = val;
	}

	lb(name) {
		var nm = BUILTIN_ARG_PREFIX + name;
		if (!this.symbols[nm]) {
			return null;
		}
		// hack - we are testing to see if it's a javascript array
		// because we do a garbage thing where for variadics
		// we map a symbol to a js thing instead of a vodka thing.
		if (this.symbols[nm].push) {
			var tocopy = this.symbols[nm];
			var z = [];
			for (var i = 0; i < tocopy.length; i++) {
				z.push(tocopy[i].makeCopy());
			}
			return z;
		} else {
			return this.symbols[nm].makeCopy();
		}
	}

	lookupBinding(name) {
		if (this.symbols[name]) {
			return this.symbols[name].makeCopy();
		} else if (this.uniques[name]) {
			return this.uniques[name];
		} else if (this.parentEnv) {
			return this.parentEnv.lookupBinding(name);
		} else {
			throw new EError(`Unbound symbol ${name}`);
		}
	}
}

