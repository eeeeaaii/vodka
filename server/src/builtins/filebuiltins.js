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
import { DeferredValue } from '../nex/deferredvalue.js'
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
			deferredValue.activate();
			return deferredValue;
		},
		'Lists all user files available in current session.'
	);	

	Builtin.createBuiltin(
		'list-standard-function-files',
		[ ],
		function $load(env, executionEnvironment) {
			let def = new DeferredValue();
			def.set(new GenericActivationFunctionGenerator(
				'list-standard-function-files', 
				function(callback, def) {
					listStandardFunctionFiles(function(files) {
						// turn files into an org or whatever
						callback(files);
					})
				}
			));
			let loadingMessage = new EError(`listing standard function files`);
			loadingMessage.setErrorType(ERROR_TYPE_INFO);
			def.appendChild(loadingMessage)
			def.activate();
			return def;
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

			let def = new DeferredValue();
			def.set(new GenericActivationFunctionGenerator(
				'load', 
				function(callback, def) {
					loadNex(nm, function(loadResult) {
						callback(loadResult);
					})
				}
			));
			let loadingMessage = new EError(`load file ${nm}`);
			loadingMessage.setErrorType(ERROR_TYPE_INFO);
			def.appendChild(loadingMessage);
			def.activate();
			return def;
		},
		'loads the file |name as a nex/object (parsing it)'
	);
	
	Builtin.createBuiltin(
		'load-raw',
		[ '_name' ],
		function $loadFile(env, executionEnvironment) {
			let name = env.lb('name');
			let nametype = name.getTypeName();
			// need to look for illegal filename characters if it's a string?
			let nm = nametype == '-symbol-' ? name.getTypedValue() : name.getFullTypedValue();

			let def = new DeferredValue();
			def.set(new GenericActivationFunctionGenerator(
				'load-raw', 
				function(callback, def) {
					loadRaw(nm, function(loadResult) {
						callback(new EString(loadResult));
					})
				}
			));
			let loadingMessage = new EError(`load file ${nm}`);
			loadingMessage.setErrorType(ERROR_TYPE_INFO);
			def.appendChild(loadingMessage)
			def.activate();
			return def;
		},
		'Loads raw bytes from the file |name into a string, and returns it.'
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


			let def = new DeferredValue();
			def.set(new GenericActivationFunctionGenerator(
				'save', 
				function(callback, def) {
					saveNex(nm, val, function(saveResult) {
						
						callback(saveResult);
					})
				}
			));
			let savingMessage = new EError(`save in file ${nm} this data: ${val.prettyPrint()}`);
			savingMessage.setErrorType(ERROR_TYPE_INFO);
			def.appendChild(savingMessage)
			def.activate();
			return def;			

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

			let def = new DeferredValue();
			def.set(new GenericActivationFunctionGenerator(
				'save', 
				function(callback, def) {
					saveNex(nm, val, function(saveResult) {
						
						callback(saveResult);
					})
				}
			));
			let savingMessage = new EError(`save in file ${nm} this data: ${val.prettyPrint()}`);
			savingMessage.setErrorType(ERROR_TYPE_INFO);
			def.appendChild(savingMessage);
			def.activate();
			return def;			
		},
		'Saves |val in the file |name (without evaluating |val).'
	);


	Builtin.createBuiltin(
		'save-raw',
		[ '_name', 'val$'],
		function $saveFile(env, executionEnvironment) {
			let name = env.lb('name');
			let nametype = name.getTypeName();
			// need to look for illegal filename characters if it's a string?
			let nm = nametype == '-symbol-' ? name.getTypedValue() : name.getFullTypedValue();

			let val = env.lb('val');
			let saveval = val.getFullTypedValue();

			let def = new DeferredValue();
			def.set(new GenericActivationFunctionGenerator(
				'save-string-as', 
				function(callback, def) {
					saveRaw(nm, saveval, function(saveResult) {
						callback(saveResult);
					})
				}
			));
			let savingMessage = new EError(`save in file ${nm} this data: ${val}`);
			savingMessage.setErrorType(ERROR_TYPE_INFO);
			def.appendChild(savingMessage);
			def.activate();
			return def;
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

			let def = new DeferredValue();
			def.set(new GenericActivationFunctionGenerator(
				'import', 
				function(callback, def) {
					importNex(nm, function(importResult) {
						callback(importResult);
					})
				}
			));
			let importMessage = new EError(`import package ${nm}`);
			importMessage.setErrorType(ERROR_TYPE_INFO);
			def.appendChild(importMessage)
			// we activate because import is frequently used in the package
			// construct in an imperative style, and if I didn't do this
			// I'd have to put special logic in package() to do it and this
			// is easier.
			def.activate();
			return def;
		},
		'Imports the package in file |name, loading the file and binding the package contents into memory.'
	);

	
	// Before you go renaming the "package" builtin to something else!
	// the name of this builtin is hardcoded into servercommunication.js
	// idk if there is a better way, but be aware.
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

}

export { createFileBuiltins }

