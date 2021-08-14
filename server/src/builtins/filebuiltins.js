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

import * as Utils from '../utils.js'

import { Builtin } from '../nex/builtin.js'
import { Command } from '../nex/command.js'
import { Lambda } from '../nex/lambda.js'
import { EError } from '../nex/eerror.js'
import { EString } from '../nex/estring.js'
import { Expectation } from '../nex/expectation.js'
import { Nil } from '../nex/nil.js'
import { Org } from '../nex/org.js'
import { ESymbol } from '../nex/esymbol.js'
import { ERROR_TYPE_INFO } from '../nex/eerror.js'
import { wrapError } from '../evaluator.js'
import { saveShortcut, saveNex, loadNex, importNex, loadRaw, saveRaw } from '../servercommunication.js'
import { evaluateNexSafely } from '../evaluator.js'
import { BINDINGS } from '../environment.js'
import { experiments } from '../globalappflags.js'

function createFileBuiltins() {

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  	

	Builtin.createBuiltin(
		'load',
		[ '_name' ],
		function $load(env, executionEnvironment) {
			let namesym = env.lb('name');
			let nametype = namesym.getTypeName();
			let nm = '';
			let loadmethod = '';
			if (nametype == '-symbol-') {
				loadmethod = 'loadpackage';
				nm = namesym.getTypedValue();
			} else if (nametype == '-string-') {
				loadmethod = 'load';
				nm = namesym.getFullTypedValue();
			} else {
				return new EError(`load: name must be symbol or string. Sorry!`);
			}
			let exp = new Expectation();
			exp.setExptextSetname('load');
			exp.set(function(callback) {
				return function() {
					loadNex(nm, loadmethod, function(loadResult) {
						callback(loadResult);
					})
				}
			})
			let loadingMessage = new EError(`loading the file ${nm}`);
			loadingMessage.setErrorType(ERROR_TYPE_INFO);
			exp.appendChild(loadingMessage)
			return exp;
		},
		'loads the file |name as a Nex (parsing it)'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	if (experiments.SAVE_EVALUATES_CONTENTS) {

		function doSave(namesym, val) {
				let nametype = namesym.getTypeName();
				let savemethod = '';
				let nm = '';
				if (nametype == '-symbol-') {
					savemethod = 'savepackage';
					nm = namesym.getTypedValue();
				} else if (nametype == '-string-') {
					savemethod = 'save';
					nm = namesym.getFullTypedValue();
				} else {
					return new EError(`save: name must be symbol or string. Sorry!`);
				}
				let exp = new Expectation();
				exp.setExptextSetname('save');
				exp.set(function(callback) {
					return function() {
						saveNex(nm, val, savemethod, function(saveResult) {
							saveResult.appendChild(val);
							callback(saveResult);
						})
					}
				});
				let savingMessage = new EError(`saving (in the file ${nm}) this data: ${val.prettyPrint()}`);
				savingMessage.setErrorType(ERROR_TYPE_INFO);
				exp.appendChild(savingMessage)
				return exp;			
		}

		Builtin.createBuiltin(
			'eval--and-save-as',
			[ 'nex', '_name' ],
			function $save(env, executionEnvironment) {
				return doSave(env.lb('name'), env.lb('nex'));
			},
			'saves |nex in the file |name (|nex is evaluated).'
		);

		Builtin.createBuiltin(
			'save--as',
			[ '_nex', '_name' ],
			function $save(env, executionEnvironment) {
				return doSave(env.lb('name'), env.lb('nex'));
			},
			'saves |nex in the file |name (without evaluating |nex).'
		);

		Builtin.createBuiltin(
			'save--as--then-eval',
			[ '_nex', '_name' ],
			function $save(env, executionEnvironment) {
				let nex = env.lb('nex');
				let name = env.lb('name');
				let r = evaluateNexSafely(nex, executionEnvironment);
				if (Utils.isFatalError(r)) {
					// don't need to alert because for syncronous errors it's handled
				} else {
					saveShortcut(name, nex, function(result) {
						if (result != null) {
							alert('saveqr: save failed! Check result: ' + result.debugString());
						}
					});
				}
				return r;
			},
			'saves |nex in the file |name (without evaluating |nex), then evaluates nex and returns it. If the save fails, the user will see an alert message.'
		);
	} else {

		Builtin.createBuiltin(
			'save--as',
			[ '_nex', '_name' ],
			function $save(env, executionEnvironment) {
				let namesym = env.lb('name');
				let nametype = namesym.getTypeName();
				let savemethod = '';
				let nm = '';
				if (nametype == '-symbol-') {
					savemethod = 'savepackage';
					nm = namesym.getTypedValue();
				} else if (nametype == '-string-') {
					savemethod = 'save';
					nm = namesym.getFullTypedValue();
				} else {
					return new EError(`save: name must be symbol or string. Sorry!`);
				}
				let val = env.lb('nex');			
				let exp = new Expectation();
				exp.setExptextSetname('save-as');
				exp.set(function(callback) {
					return function() {
						saveNex(nm, val, savemethod, function(saveResult) {
							callback(saveResult);
						})
					}
				});
				let savingMessage = new EError(`saving (in the file ${nm}) this data: ${val.prettyPrint()}`);
				savingMessage.setErrorType(ERROR_TYPE_INFO);
				exp.appendChild(savingMessage)
				return exp;
			},
			'saves |nex in the file |name.'
		);

	}


	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	

	Builtin.createBuiltin(
		'load-string',
		[ '_name$' ],
		function $loadFile(env, executionEnvironment) {
			let namesym = env.lb('name');
			let loadmethod = 'loadraw';
			let nm = namesym.getFullTypedValue();
			let exp = new Expectation();
			exp.setExptextSetname('load-string');
			exp.set(function(callback) {
				return function() {
					loadRaw(nm, loadmethod, function(loadResult) {
						callback(new EString(loadResult));
					})
				}
			})
			let loadingMessage = new EError(`loading the file ${nm}`);
			loadingMessage.setErrorType(ERROR_TYPE_INFO);
			exp.appendChild(loadingMessage)
			return exp;
		},
		'loads raw bytes from the file |name into a string.'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  


	Builtin.createBuiltin(
		'save-string--as',
		[ 'val$', '_name$'],
		function $saveFile(env, executionEnvironment) {
			let namesym = env.lb('name');
			let nm = namesym.getFullTypedValue();

			let val = env.lb('val');
			let saveval = val.getFullTypedValue();

			let savemethod = 'saveraw';

			let exp = new Expectation();
			exp.setExptextSetname('save-string-as');
			exp.set(function(callback) {
				return function() {
					saveRaw(nm, saveval, savemethod, function(saveResult) {
						callback(saveResult);
					})
				}
			});
			let savingMessage = new EError(`saving (in the file ${nm}) this data: ${val}`);
			savingMessage.setErrorType(ERROR_TYPE_INFO);
			exp.appendChild(savingMessage)
			return exp;
		},
		'saves |nex in the file |name.'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  



	Builtin.createBuiltin(
		'import',
		[ '_name' ],
		function $import(env, executionEnvironment) {
			let namesym = env.lb('name');
			let nametype = namesym.getTypeName();
			let nm = '';
			let loadmethod = '';
			if (nametype == '-symbol-') {
				loadmethod = 'loadpackage';
				nm = namesym.getTypedValue();
			} else if (nametype == '-string-') {
				loadmethod = 'load';
				nm = namesym.getFullTypedValue();
			} else {
				return new EError(`import: name must be symbol or string. Sorry!`);
			}

			let exp = new Expectation();
			exp.setExptextSetname('import');
			exp.set(function(callback) {
				return function() {
					importNex(nm, loadmethod, function(importResult) {
						callback(importResult);
					})
				}
			})
			let importMessage = new EError(`importing the package ${nm}`);
			importMessage.setErrorType(ERROR_TYPE_INFO);
			exp.appendChild(importMessage)
			// we activate because import is frequently used in the package
			// construct in an imperative style, and if I didn't do this
			// I'd have to put special logic in package() to do it and this
			// is easier.
			exp.activate();
			return exp;
		},
		'imports the package in file |name, loading the file and binding the package contents into memory.'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  
	// this could be a util function I guess

	

	Builtin.createBuiltin(
		'with-imports',
		[ '_nexes...' ],
		function $withImports(env, executionEnvironment) {
			let nexes = env.lb('nexes');
			let innerExpArgs = [];
			let toReturn = new Nil();
			for (let i = 0; i < nexes.numChildren(); i++) {
				let nex = nexes.getChildAt(i);
				if (i == nexes.numChildren() - 1) {
					toReturn = nex;
				} else {
					if (!nex.getTypeName() == '-symbol-') {
						return new EError(`Cannot import ${nex.prettyPrint()}.`);
					}
					innerExpArgs.push(Command.makeCommandWithArgs("import", nex));
				}
			}
			// the reason for outer/inner exp is that
			// if we set ff-with on the inner exp
			// (the one that contains multiple items)
			// we will get ff-with called for each item
			let cmd =
			//Command.makeCommandWithArgs(
			//	"ff",
				Command.makeCommandWithArgs(
					"ff-with",
					Command.makeCommandWithArgs(
						"make-expectation",
						Command.makeCommandWithArgs(
							"make-expectation",
							innerExpArgs)),
					Lambda.makeLambda(
						"n",
						toReturn));
			return evaluateNexSafely(cmd, executionEnvironment);
		},
		'imports the packages named in the args one after the other, and then executes the last arg with those packages imported and loaded.'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	

	Builtin.createBuiltin(
		'package-named--is',
		[ '_name@', '_nex...' ],
		function $package(env, executionEnvironment) {
			let packageName = env.lb('name').getTypedValue();
			let lst = env.lb('nex');
			BINDINGS.setPackageForBinding(packageName);
			let lastresult = new Nil();
			for (let i = 0; i < lst.numChildren(); i++) {
				let c = lst.getChildAt(i);
				lastresult = evaluateNexSafely(c, executionEnvironment);
				// not sure what to do about errors yet?
			}
			BINDINGS.setPackageForBinding(null);
			return new Nil();
		},
		'creates a package named |name (all bindings in |nex will be bound with the package name as their scope identifier).'
	);

	// run it AND save it *mind=blown*
	
	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  
	// need to make it so that if it fails you don't lose all your work.

	if (experiments.SAVE_EVALUATES_CONTENTS) {
		Builtin.createBuiltin(
			'save-package--as',
			[ '_nex', '_name@' ],
			function $savePackage(env, executionEnvironment) {
				// figure out the real name
				let namesym = env.lb('name');
				let nametype = namesym.getTypeName();
				let savemethod = '';
				let nm = '';
				if (nametype == '-symbol-') {
					savemethod = 'savepackage';
					nm = namesym.getTypedValue();
				} else if (nametype == '-string-') {
					savemethod = 'save';
					nm = namesym.getFullTypedValue();
				} else {
					return new EError(`save-package: name must be symbol or string. Sorry!`);
				}
				let val = env.lb('nex');
				// evaluate the thing. It's probably a package but doesn't have to be.
				let result = evaluateNexSafely(val, executionEnvironment);
				if (Utils.isFatalError(result)) {
					let r = new EError(`save-package: error evaluating package, see contents of this error`);
					r.appendChild(result);					
					r.appendChild(val);
					return r;					
				}

				let exp = new Expectation();
				exp.setExptextSetname('save-package-as');
				exp.set(function(callback) {
					return function() {
						saveNex(nm, val, savemethod, function(saveResult) {
							callback(saveResult);
						})
					}
				});
				let savingMessage = new EError(`saving (in the file ${nm}) this data: ${val.prettyPrint()}`);
				savingMessage.setErrorType(ERROR_TYPE_INFO);
				exp.appendChild(savingMessage)
				exp.appendChild(val)
				return exp;
			},
			'evaluates |nex for its side effects, but saves the unevaluated version in the file |name.'
		);
	} else {

		Builtin.createBuiltin(
			'package-edit',
			[ '_name@', '_nex...' ],
			function $packageEdit(env, executionEnvironment) {
				throw new Error('deprecated');
				// run part
				let packageName = env.lb('name').getTypedValue();
				let lst = env.lb('nex');
				BINDINGS.setPackageForBinding(packageName);
				let lastresult = new Nil();
				for (let i = 0; i < lst.numChildren(); i++) {
					let c = lst.getChildAt(i);
					lastresult = evaluateNexSafely(c, executionEnvironment);
					// not sure what to do about errors yet?
				}
				BINDINGS.setPackageForBinding(null);

				// save part
				// package file name is the name plus "-functions"
				let nm = packageName + '-functions';
				// in the file, we have to, of course, include the package itself.
				let args = [ new ESymbol(packageName) ];
				Command.pushListContentsIntoArray(lst);
				let val = Command.makeCommandWithArgs('package', args);
				let exp = new Expectation();
				exp.setExptextSetname('package-edit');
				exp.set(function(callback) {
					return function() {
						saveNex(nm, val, function(saveResult) {
							callback(saveResult);
						})
					}
				});
				let savingMessage = new EError(`editing package (in the file ${nm}) this data: ${val.prettyPrint()}`);
				savingMessage.setErrorType(ERROR_TYPE_INFO);
				exp.appendChild(savingMessage)
				return exp;
			},
			'creates the package |name, and also saves it in the the file "|name-functions".'
		);
	}
}

export { createFileBuiltins }

