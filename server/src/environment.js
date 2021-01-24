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

import { EError } from './nex/eerror.js'
import { NexContainer } from './nex/nexcontainer.js'
import { systemState } from './systemstate.js'
import { Tag } from './tag.js'

/** @module environment */


/**
 * This class represents a memory space or scope. The entire memory space of the
 * running program is a tree of Environment objects.
 */
class Environment {
	/**
	 * Creates a new environment.
	 * @param {Environment} parentEnv - the parent environment
	 */
	constructor(parentEnv) {
		this.parentEnv = parentEnv;
		this.symbols = {};
		this.currentPackageForBinding = null;
		this.packages = null;
		this.listOfPackagesUsed = null;
	}

	copy(shareParent) {
		throw new Error('dont do this');
		let newEnv = new Environment(null);
		for (let sym in this.symbols) {
			let rec = this.symbols[sym];
			let copiedRecord = this.copyBindingRecord(rec);
			newEnv.symbols[sym] = copiedRecord;
		}
		newEnv.currentPackageForBinding = this.currentPackageForBinding;
		if (this.packages) {
			newEnv.packages = [];
			for (let i = 0; i < this.packages.length; i++) {
				newEnv.packages[i] = this.packages[i];
			}
		}
		if (this.listOfPackagesUsed) {
			newEnv.listOfPackagesUsed = [];
			for (let i = 0; i < this.listOfPackagesUsed.length; i++) {
				newEnv.listOfPackagesUsed[i] = this.listOfPackagesUsed[i];
			}
		}
		if (this.parentEnv) {
			if (shareParent) {
				newEnv.parentEnv = this.parentEnv;
			} else {
				newEnv.parentEnv = this.parentEnv.copy();
			}
		}
		return newEnv;
	}

	copyJustThisScope() {
		return this.copy(true /* share parent */)
	}

	toString() {
		let r = '';
		for (let name in this.symbols) {
			if (r != '') {
				r += ',';
			}
			r += `${name}=${this.symbols[name]}`;
		}
		return r;
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

	packageBeingUsed(name) {
		if (!this.listOfPackagesUsed) {
			return false;
		}
		for (let i = 0; i < this.listOfPackagesUsed.length ; i++) {
			if (name == this.listOfPackagesUsed[i]) {
				return true;
			}
		}
		return false;
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
		}
		if (val.getTypeName() == '-closure-' && !this.packageBeingUsed(this.currentPackageForBinding)) {
			val.getLexicalEnvironment().usePackage(this.currentPackageForBinding);
		}
		this.bind(name, val, this.currentPackageForBinding);
	}

	makeBindingRecord(name, value, packageName) {
		return {
			name: name,
			val: value,
			packageName: packageName
		}
	}

	copyBindingRecord(record) {
		return {
			name: record.name,
			val: record.val,
			packagename: record.packagename
		}
	}

	bind(name, val, packageName) {
		if (this.symbols[name]) {
			this.symbols[name].val = val;
			this.symbols[name].packageName = packageName; // I guess it's totally unnecessary because you could parse the name.
		} else {
			this.symbols[name] = this.makeBindingRecord(name, val, packageName);
		}
		if (val.getTypeName() == '-closure-') {
			val.setCmdName(name);
		}
	}

	// only used by builtins to retrieve args, we can just directly access this env
	lb(name) {
		let nm = BUILTIN_ARG_PREFIX + name;
		if (!this.symbols[nm]) {
			return UNBOUND;
		}
		return this.symbols[nm].val;
	}

	getAllBoundSymbolsAtThisLevel() {
		let r = [];
		let nm = null;
		for (nm in this.symbols) {
			r.push(nm);
		}
		return r;
	}

	doForEachBinding(f) {
		for (let s in this.symbols) {
			let symrec = this.symbols[s];
			f(symrec);
		}
	}

	hasSymbolItself(name) {
		return !!this.symbols[name];
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

	getNextReference(org, name) {
		let c = org.getChildWithTag(name);
	}

 	isDereferenceable(n) {
		return n.getTypeName() == '-org-' || n.getTypeName() == '-nativeorg-';
	}

	dereference(val, dereferencingPart) {
		if (dereferencingPart.length == 0) {
			return val;
		} else {
			let refName = dereferencingPart[0];
			let thisReferenceTag = new Tag(refName);
			if (!this.isDereferenceable(val)) {
				throw new EError(`cannot dereference this thing: [${val.debugString()}]. Sorry!`);
			}
			let newval = val.getChildWithTag(thisReferenceTag);
			if (!newval) {
				throw new EError(`unknown reference ${refName}. Sorry!`);
			}
			dereferencingPart.shift();
			return this.dereference(newval, dereferencingPart)
		}
	}

	derefToParent(val, dereferencingPart) {
		if (dereferencingPart.length == 1) {
			return {
				'val': val,
				'tag': new Tag(dereferencingPart[0])
			}
		} else {
			let refName = dereferencingPart[0];
			let thisReferenceTag = new Tag(refName);
			if (!this.isDereferenceable(val)) {
				throw new EError(`cannot dereference this thing: [${val.debugString()}]. Sorry!`);
			}
			let newval = val.getChildWithTag(thisReferenceTag);
			if (!newval) {
				throw new EError(`unknown reference ${refName}. Sorry!`);
			}
			dereferencingPart.shift();
			return this.derefToParent(newval, dereferencingPart)
		}
	}

	// returns the full binding struct
	lookupFullBinding(name) {
		let dereferencingPart = null;
		if (name.indexOf('.') >= 0) {
			dereferencingPart = name.substr(name.indexOf('.') + 1).split('.');
			name = name.substr(0, name.indexOf('.'));
		}
		let binding = this._recursiveLookup(name, [this.listOfPackagesUsed]);
		if (!binding) {
			throw new EError(`undefined symbol: ${name}. Sorry!`);
		}
		binding.val.packageName = binding.packageName;
		if (dereferencingPart) {
			binding = this.copyBindingRecord(binding);
			binding.val = this.dereference(binding.val, dereferencingPart);
		}
		return binding;
	}

	// just returns the value
	lookupBinding(name) {
		return this.lookupFullBinding(name).val;
	}

	// TODO(https://github.com/eeeeaaii/vodka/issues/133)
	hasBinding(name) {
		let binding = this._recursiveLookup(name, [this.listOfPackagesUsed]);
		return !!binding;
	}

	set(name, val, optionalTag) {
		let dereferencingPart = null;
		if (name.indexOf('.') >= 0) {
			dereferencingPart = name.substr(name.indexOf('.') + 1).split('.');
			name = name.substr(0, name.indexOf('.'));
		}
		let binding = this._recursiveLookup(name, [this.listOfPackagesUsed]);
		if (!binding) {
			throw new EError(`undefined symbol: ${name}, cannot set. Sorry!`);
		}
		if (dereferencingPart) {
			let derefSetRecord = this.derefToParent(binding.val, dereferencingPart);
			let v = derefSetRecord.val;
			if (!(v instanceof NexContainer)) {
				throw new EError('cannot dereference a non-org');
			}
			for (let i = 0; i < v.numChildren(); i++) {
				if (v.getChildAt(i).hasTag(derefSetRecord.tag)) {
					val.addTag(derefSetRecord.tag);
					v.replaceChildAt(val, i);
					return;
				}
			}
			// if we got here, we tried to reference a nonexistant property.
			throw new EError(`unknown reference ${derefSetRecord.tag.getName()}. Sorry!`);
		} else {
			binding.val = val;
		}
	}



/*
		let binding = this._recursiveLookup(name, [this.listOfPackagesUsed]);
		if (!binding) {
			throw new EError(`undefined symbol ${name}, cannot set. Sorry!`)
		}
		if (optionalTag) {
			// need to find child of binding that has this tag.
			let v = binding.val;
			if (!(v instanceof NexContainer)) {
				throw new EError('cannot dereference a non-org');
			}
			for (let i = 0; i < v.numChildren(); i++) {
				if (v.getChildAt(i).hasTag(optionalTag)) {
					val.addTag(optionalTag);
					v.replaceChildAt(val, i);
					return;
				}
			}
		} else {
			binding.val = val;
		}
	}
	*/

}

// global lexical environment.
// BUILTINS are implemented in javascript.
// anything bound with (bind ...) goes in BINDINGS.
// any environments nested under that are closures.

/**
 * This is the global built-in lexical environment. All symbols bound here
 * are natively implemented in javascript and are part of the
 * vodka language runtime.
 */
const BUILTINS = new Environment(null);

/**
 * This is the global environment for user-bound variables. All symbols
 * bound with the bind primitive are in this scope.
 */
const BINDINGS = BUILTINS.pushEnv();

export { Environment, BUILTINS, BINDINGS, BUILTIN_ARG_PREFIX, UNBOUND }

