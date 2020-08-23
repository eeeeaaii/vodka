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
import { Expectation } from '../nex/expectation.js'
import { Nil } from '../nex/nil.js'
import { ESymbol } from '../nex/esymbol.js'
import { ERROR_TYPE_INFO } from '../nex/eerror.js'
import { wrapError } from '../evaluator.js'
import { saveNex, loadNex, importNex } from '../servercommunication.js'
import { evaluateNexSafely } from '../evaluator.js'
import { BINDINGS } from '../environment.js'

function createFileBuiltins() {

	Builtin.createBuiltin(
		'import',
		[ '_name@' ],
		function(env, executionEnvironment) {
			let namesym = env.lb('name');
			let nm = namesym.getTypedValue();
			let exp = new Expectation();
			exp.set(function(callback) {
				return function() {
					importNex(nm, function(importResult) {
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
		}
	);

	// this could be a util function I guess
	Builtin.createBuiltin(
		'with-imports',
		[ '_nexes...' ],
		function(env, executionEnvironment) {
			let nexes = env.lb('nexes');
			let innerExpArgs = [];
			let toReturn = new Nil();
			for (let i = 0; i < nexes.numChildren(); i++) {
				let nex = nexes.getChildAt(i);
				if (i == nexes.numChildren() - 1) {
					toReturn = nex;
				} else {
					if (!nex.getTypeName() == '-symbol-') {
						return new EError(`Cannot import ${nex.debugString}.`);
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
		}
	);

	Builtin.createBuiltin(
		'load',
		[ '_name@' ],
		function(env, executionEnvironment) {
			let namesym = env.lb('name');
			let nm = namesym.getTypedValue();
			let exp = new Expectation();
			exp.set(function(callback) {
				return function() {
					loadNex(nm, function(loadResult) {
						callback(loadResult);
					})
				}
			})
			let loadingMessage = new EError(`loading the file ${nm}`);
			loadingMessage.setErrorType(ERROR_TYPE_INFO);
			exp.appendChild(loadingMessage)
			return exp;
		}
	);

	Builtin.createBuiltin(
		'package',
		[ '_name@', '_nex...' ],
		function(env, executionEnvironment) {
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
		}
	);

	// run it AND save it *mind=blown*
	// need to make it so that if it fails you don't lose all your work.
	Builtin.createBuiltin(
		'package-edit',
		[ '_name@', '_nex...' ],
		function(env, executionEnvironment) {
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
			exp.set(function(callback) {
				return function() {
					saveNex(nm, val, function(saveResult) {
						callback(saveResult);
					})
				}
			});
			let savingMessage = new EError(`editing package (in the file ${nm}) this data: ${val.debugString()}`);
			savingMessage.setErrorType(ERROR_TYPE_INFO);
			exp.appendChild(savingMessage)
			return exp;
		}
	);

	

	Builtin.createBuiltin(
		'save',
		[ '_name@', '_nex' ],
		function(env, executionEnvironment) {
			let namesym = env.lb('name');
			let nm = namesym.getTypedValue();
			let val = env.lb('nex');			
			let exp = new Expectation();
			exp.set(function(callback) {
				return function() {
					saveNex(nm, val, function(saveResult) {
						callback(saveResult);
					})
				}
			});
			let savingMessage = new EError(`saving (in the file ${nm}) this data: ${val.debugString()}`);
			savingMessage.setErrorType(ERROR_TYPE_INFO);
			exp.appendChild(savingMessage)
			return exp;
		}
	);


	Builtin.createBuiltin(
		'use',
		[ '_name@' ],
		function(env, executionEnvironment) {
			let packageName = env.lb('name').getTypedValue();
			if (!BINDINGS.isKnownPackageName(packageName)) {
				return new EError(`use: invalid package name ${packageName}. Sorry!`);
			}
			executionEnvironment.usePackage(packageName);
			return new Nil();
		}
	);	

	Builtin.createBuiltin(
		'using',
		[ 'namelist()', '_nex...' ],
		function(env, executionEnvironment) {
			let packageList = env.lb('namelist');
			for (let i = 0; i < packageList.numChildren(); i++) {
				let c = packageList.getChildAt(i);
				if (!(c.getTypeName() == '-symbol-')) {
					return new EError(`using: first arg must be a list of symbols that denote package names, but ${c.debugString()} is not a symbol. Sorry!`);
				}
				let packageName = c.getTypedValue();
				if (!BINDINGS.isKnownPackageName(packageName)) {
					return new EError(`using: invalid package name ${packageName}. Sorry!`);
				}
				env.usePackage(packageName);
			}
			let lst = env.lb('nex');
			let result = new Nil();
			for (let j = 0; j < lst.numChildren(); j++) {
				let c = lst.getChildAt(j);
				result = evaluateNexSafely(c, executionEnvironment);
				if (Utils.isFatalError(result)) {
					result = wrapError('&szlig;', `using: error in expression ${j+1}, cannot continue. Sorry!`);
					return result;
				}
			}
			return result;
		}
	);	


}

export { createFileBuiltins }

