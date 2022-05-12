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
import { Nil } from '../nex/nil.js'
import { Org } from '../nex/org.js'
import { ESymbol } from '../nex/esymbol.js'
import { ERROR_TYPE_INFO } from '../nex/eerror.js'
import { wrapError } from '../evaluator.js'
import { evaluateNexSafely } from '../evaluator.js'
import { BINDINGS } from '../environment.js'
import { experiments } from '../globalappflags.js'
import {
	GenericActivationFunctionGenerator
} from '../asyncfunctions.js'

import {
	saveShortcut,
	saveNex,
	loadNex,
	importNex,
	loadRaw,
	saveRaw,
	listFiles,
	listStandardFunctionFiles
} from '../servercommunication.js'


function createFileBuiltins() {

	Builtin.createBuiltin(
		'list-files',
		[ ],
		function $load(env, executionEnvironment) {
			let deferredValue = new DeferredValue();
			deferredValue.set(new GenericActivationFunctionGenerator(
				'list-files', 
				function(callback, deferredValue) {
					listFiles(function(files) {
						// turn files into an org or whatever
						callback(files);
					})
				}
			));
			let loadingMessage = new EError(`listing files`);
			loadingMessage.setErrorType(ERROR_TYPE_INFO);
			deferredValue.appendChild(loadingMessage)
			return deferredValue;
		},
		'Lists all user files available in current session.'
	);	

	Builtin.createBuiltin(
		'list-standard-function-files',
		[ ],
		function $load(env, executionEnvironment) {
			let exp = new DeferredValue();
			exp.set(new GenericActivationFunctionGenerator(
				'list-standard-function-files', 
				function(callback, exp) {
					listStandardFunctionFiles(function(files) {
						// turn files into an org or whatever
						callback(files);
					})
				}
			));
			let loadingMessage = new EError(`listing standard function files`);
			loadingMessage.setErrorType(ERROR_TYPE_INFO);
			exp.appendChild(loadingMessage)
			return exp;
		},
		'Lists the standard library function files available to all users.'
	);	

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  	

	Builtin.createBuiltin(
		'load',
		[ '_name' ],
		function $load(env, executionEnvironment) {
			let name = env.lb('name');
			let nametype = name.getTypeName();
			// need to look for illegal filename characters if it's a string?
			let nm = nametype == '-symbol-' ? name.getTypedValue() : name.getFullTypedValue();

			let exp = new DeferredValue();
			exp.set(new GenericActivationFunctionGenerator(
				'load', 
				function(callback, exp) {
					loadNex(nm, function(loadResult) {
						callback(loadResult);
					})
				}
			));
			let loadingMessage = new EError(`load file ${nm}`);
			loadingMessage.setErrorType(ERROR_TYPE_INFO);
			exp.appendChild(loadingMessage)
			return exp;
		},
		'loads the file |name as a nex/object (parsing it)'
	);

	Builtin.createBuiltin(
		'eval-and-save',
		[ '_name', 'val' ],
		function $evalAndSave(env, executionEnvironment) {
			let val = env.lb('val');
			let name = env.lb('name');

			let nametype = name.getTypeName();
			// need to look for illegal filename characters if it's a string?
			let nm = nametype == '-symbol-' ? name.getTypedValue() : name.getFullTypedValue();


			let exp = new DeferredValue();
			exp.set(new GenericActivationFunctionGenerator(
				'save', 
				function(callback, exp) {
					saveNex(nm, val, function(saveResult) {
						saveResult.appendChild(val);
						callback(saveResult);
					})
				}
			));
			let savingMessage = new EError(`save in file ${nm} this data: ${val.prettyPrint()}`);
			savingMessage.setErrorType(ERROR_TYPE_INFO);
			exp.appendChild(savingMessage)
			return exp;			

		},
		'saves |val in the file |name (|val is evaluated).'
	);

	Builtin.createBuiltin(
		'save',
		[ '_name', '_val' ],
		function $save(env, executionEnvironment) {

			let val = env.lb('val');

			let name = env.lb('name');
			let nametype = name.getTypeName();
			// need to look for illegal filename characters if it's a string?
			let nm = nametype == '-symbol-' ? name.getTypedValue() : name.getFullTypedValue();

			let exp = new DeferredValue();
			exp.set(new GenericActivationFunctionGenerator(
				'save', 
				function(callback, exp) {
					saveNex(nm, val, function(saveResult) {
						saveResult.appendChild(val);
						callback(saveResult);
					})
				}
			));
			let savingMessage = new EError(`save in file ${nm} this data: ${val.prettyPrint()}`);
			savingMessage.setErrorType(ERROR_TYPE_INFO);
			exp.appendChild(savingMessage)
			return exp;			
		},
		'Saves |val in the file |name (without evaluating |val).'
	);

	// Builtin.createBuiltin(
	// 	'eval-and-save',
	// 	[ '_name', '_nex' ],
	// 	function $save(env, executionEnvironment) {
	// 		let nex = env.lb('nex');

	// 		let name = env.lb('name');
	// 		let nametype = name.getTypeName();
	// 		// need to look for illegal filename characters if it's a string?
	// 		let nm = nametype == '-symbol-' ? name.getTypedValue() : name.getFullTypedValue();

	// 		let r = evaluateNexSafely(nex, executionEnvironment);
	// 		if (Utils.isFatalError(r)) {
	// 			// don't need to alert because for syncronous errors it's handled
	// 		} else {
	// 			saveShortcut(name, nex, function(result) {
	// 				if (result != null) {
	// 					alert('saveqr: save failed! Check result: ' + result.debugString());
	// 				}
	// 			});
	// 		}
	// 		return r;
	// 	},
	// 	'saves |nex in the file |name (without evaluating |nex), then evaluates nex and returns it. If the save fails, the user will see an alert message.'
	// );



	Builtin.createBuiltin(
		'load-raw',
		[ '_name' ],
		function $loadFile(env, executionEnvironment) {
			let name = env.lb('name');
			let nametype = name.getTypeName();
			// need to look for illegal filename characters if it's a string?
			let nm = nametype == '-symbol-' ? name.getTypedValue() : name.getFullTypedValue();

			let exp = new DeferredValue();
			exp.set(new GenericActivationFunctionGenerator(
				'load-raw', 
				function(callback, exp) {
					loadRaw(nm, 'loadraw', function(loadResult) {
						callback(new EString(loadResult));
					})
				}
			));
			let loadingMessage = new EError(`load file ${nm}`);
			loadingMessage.setErrorType(ERROR_TYPE_INFO);
			exp.appendChild(loadingMessage)
			return exp;
		},
		'Loads raw bytes from the file |name into a string, and returns it.'
	);


	Builtin.createBuiltin(
		'save-raw',
		[ 'val$', '_name'],
		function $saveFile(env, executionEnvironment) {
			let name = env.lb('name');
			let nametype = name.getTypeName();
			// need to look for illegal filename characters if it's a string?
			let nm = nametype == '-symbol-' ? name.getTypedValue() : name.getFullTypedValue();

			let val = env.lb('val');
			let saveval = val.getFullTypedValue();

			let exp = new DeferredValue();
			exp.set(new GenericActivationFunctionGenerator(
				'save-string-as', 
				function(callback, exp) {
					saveRaw(nm, saveval, function(saveResult) {
						callback(saveResult);
					})
				}
			));
			let savingMessage = new EError(`save in file ${nm} this data: ${val}`);
			savingMessage.setErrorType(ERROR_TYPE_INFO);
			exp.appendChild(savingMessage)
			return exp;
		},
		'Saves the raw bytes of string |val in the file |name.'
	);


	Builtin.createBuiltin(
		'import',
		[ '_name' ],
		function $import(env, executionEnvironment) {
			let name = env.lb('name');
			let nametype = name.getTypeName();
			// need to look for illegal filename characters if it's a string?
			let nm = nametype == '-symbol-' ? name.getTypedValue() : name.getFullTypedValue();

			let exp = new DeferredValue();
			exp.set(new GenericActivationFunctionGenerator(
				'import', 
				function(callback, exp) {
					importNex(nm, function(importResult) {
						callback(importResult);
					})
				}
			));
			let importMessage = new EError(`import package ${nm}`);
			importMessage.setErrorType(ERROR_TYPE_INFO);
			exp.appendChild(importMessage)
			// we activate because import is frequently used in the package
			// construct in an imperative style, and if I didn't do this
			// I'd have to put special logic in package() to do it and this
			// is easier.
			exp.activate();
			return exp;
		},
		'Imports the package in file |name, loading the file and binding the package contents into memory.'
	);

	
	// // TODO: reimplement this without all these nested command things
	// Builtin.createBuiltin(
	// 	'with-imports',
	// 	[ '_nexes...' ],
	// 	function $withImports(env, executionEnvironment) {
	// 		let nexes = env.lb('nexes');
	// 		let innerExpArgs = [];
	// 		let toReturn = new Nil();
	// 		for (let i = 0; i < nexes.numChildren(); i++) {
	// 			let nex = nexes.getChildAt(i);
	// 			if (i == nexes.numChildren() - 1) {
	// 				toReturn = nex;
	// 			} else {
	// 				if (!nex.getTypeName() == '-symbol-') {
	// 					return new EError(`Cannot import ${nex.prettyPrint()}.`);
	// 				}
	// 				innerExpArgs.push(Command.makeCommandWithArgs("import", nex));
	// 			}
	// 		}
	// 		// the reason for outer/inner exp is that
	// 		// if we set ff-with on the inner exp
	// 		// (the one that contains multiple items)
	// 		// we will get ff-with called for each item
	// 		let cmd =
	// 		//Command.makeCommandWithArgs(
	// 		//	"ff",
	// 			Command.makeCommandWithArgs(
	// 				"ff-with",
	// 				Command.makeCommandWithArgs(
	// 					"make-expectation",
	// 					Command.makeCommandWithArgs(
	// 						"make-expectation",
	// 						innerExpArgs)),
	// 				Lambda.makeLambda(
	// 					"n",
	// 					toReturn));
	// 		return evaluateNexSafely(cmd, executionEnvironment);
	// 	},
	// 	'imports the packages named in the args one after the other, and then executes the last arg with those packages imported and loaded.'
	// );

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	

	Builtin.createBuiltin(
		'package',
		[ '_name@', '_block...' ],
		function $package(env, executionEnvironment) {
			let packageName = env.lb('name').getTypedValue();
			let lst = env.lb('block');
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
		'Defines a package. All args in |block are evaluated, and any bindings are bound with |name as their package scope identifier.'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  
	// need to make it so that if it fails you don't lose all your work.

	// Builtin.createBuiltin(
	// 	'save-package as',
	// 	[ '_nex', '_name@' ],
	// 	function $savePackage(env, executionEnvironment) {
	// 		// figure out the real name
	// 		let namesym = env.lb('name');
	// 		let nametype = namesym.getTypeName();
	// 		let nm = '';
	// 		let val = env.lb('nex');
	// 		// evaluate the thing. It's probably a package but doesn't have to be.
	// 		let result = evaluateNexSafely(val, executionEnvironment);
	// 		if (Utils.isFatalError(result)) {
	// 			let r = new EError(`save-package: error evaluating package, see contents of this error`);
	// 			r.appendChild(result);					
	// 			r.appendChild(val);
	// 			return r;					
	// 		}

	// 		let exp = new DeferredValue();
	// 		exp.set(new GenericActivationFunctionGenerator(
	// 			'save-package-as', 
	// 			function(callback, exp) {
	// 				saveNex(nm, val, 'save', function(saveResult) {
	// 					callback(saveResult);
	// 				})
	// 			}
	// 		));
	// 		let savingMessage = new EError(`save in file ${nm} this data: ${val.prettyPrint()}`);
	// 		savingMessage.setErrorType(ERROR_TYPE_INFO);
	// 		exp.appendChild(savingMessage)
	// 		exp.appendChild(val)
	// 		return exp;
	// 	},
	// 	'evaluates |nex for its side effects, but saves the unevaluated version in the file |name.'
	// );

}

export { createFileBuiltins }

