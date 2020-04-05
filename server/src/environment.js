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
		this.currentPackageForBinding = null;
		this.packages = null;
		this.listOfPackagesUsed = null;
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

	// packages:
	// - want to be able to bind "naked" names
	// - if you bind something within a package, then you access that binding with
	//   packagename:binding
	//   unless you do (using packagename)
	// - we want to make it illegal to bind a symbol with : in it so we can restrict
	//   that to just the (package ) builtin

	usePackage(name) {
		if (this.listOfPackagesUsed == null) {
			this.listOfPackagesUsed = [];
		}
		this.listOfPackagesUsed.push(name);
	}

	setPackageForBinding(name) {
		if (this.packages == null) {
			this.packages = [];
		}
		this.currentPackageForBinding = name;
		this.packages.push(name);
	}

	isKnownPackageName(name) {
		return this.packages && this.packages.includes(name);
	}

	bindInPackage(name, val) {
		if (name.indexOf(':') >= 0) {
			throw new EError('bind: cannot bind a symbol with a colon (:) except via the package mechanism. Sorry!');
		}
		if (this.currentPackageForBinding) {
			name = this.currentPackageForBinding + ':' + name;
			if (val.getTypeName() == '-lambda-') {
				let use = new Command('use');
				use.appendChild(new ESymbol(this.currentPackageForBinding));
				val.prependChild(use);
			}
		}
		this.bind(name, val);
	}

	bind(name, val) {
		val.setBoundName(name);
		if (this.symbols[name]) {
			this.symbols[name].val = val;
			this.symbols[name].closure = val.closure;
			this.symbols[name].version++;
		} else {
			this.symbols[name] = {
				val: val,
				closure: val.closure,
				version: 0
			};
		}
	}

	set(name, val) {
		let binding = this._recursiveLookup(name, [this.listOfPackagesUsed]);
		if (!binding) {
			throw new EError(`undefined symbol ${name}, cannot set. Sorry!`)
		}
		binding.val = val;
		binding.closure = val.closure;
		binding.version++; // I forget what this is for
	}

	// only used by builtins to retrieve args, we can just directly access this env
	lb(name) {
		let nm = BUILTIN_ARG_PREFIX + name;
		if (!this.symbols[nm]) {
			return UNBOUND;
		}
		this.symbols[nm].val.closure = this.symbols[nm].closure;
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

	// private
	_recursiveLookup(name, listOfListOfPackagesUsed) {
		// this can also be a package binding if the person
		// uses the fully qualified name, i.e. @foo:bar
		let nakedBinding = this.symbols[name];
		if (nakedBinding) {
			return nakedBinding;
		};
		// only executes at the BINDINGS level
		if (this.packages) {
			// go through all the lists of used packages provided at all lower levels
			for (let i = 0; i < listOfListOfPackagesUsed.length; i++) {
				let list = listOfListOfPackagesUsed[i];
				if (!list) continue; // can be null
				for (let j = 0; j < list.length; j++) {
					// go through all the packages we are using
					let packageName = list[j];
					// it has to be a valid package name, otherwise "using" would fail.
					let packageBinding = this.symbols[`${packageName}:${name}`];
					if (packageBinding) {
						return packageBinding;
					}						
				}
			}
		}
		if (this.parentEnv) {
			listOfListOfPackagesUsed.push(this.parentEnv.listOfPackagesUsed);
			return this.parentEnv._recursiveLookup(name, listOfListOfPackagesUsed);
		}
		return null;
	}

	// returns the full binding struct
	lookupFullBinding(name) {
		let binding = this._recursiveLookup(name, [this.listOfPackagesUsed]);
		if (!binding) {
			throw new EError(`undefined symbol: ${name}. Sorry!`);
		}
		binding.val.closure = binding.closure;
		return binding;
	}

	// just returns the name
	lookupBinding(name) {
		return this.lookupFullBinding(name).val;
	}
}

