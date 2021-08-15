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

import { EError } from './nex/eerror.js'
import { ArgEvaluator } from './argevaluator.js'
import { experiments } from './globalappflags.js'

/** @module evaluator */

/**
 * This is the main workhorse function that evaluates bits of vodka code. This should be used
 * instead of calling evaluate() on a Nex directly, because it handles exceptions correctly.
 *
 * @param {Nex} nex - the code to evaluate
 * @param {Environment} executionEnvironment - the environment to use to look up symbols in the code (for example, the closure's captured scope if this code is evaluated inside a closure)
 * @returns {Nex} what this code evaluates to (can be an error)
 */
function evaluateNexSafely(nex, executionEnvironment, skipActivation /* TODO: remove this param */) {
	if (experiments.ASM_RUNTIME) {
		Module.ccall("evaluate")
	}

	let result;
	try {
		nex.evalSetup(executionEnvironment);
		let returnValueParam = nex.getExpectedReturnType();
		let cmdname = nex.maybeGetCommandName();
		result = nex.evaluate(executionEnvironment);

		if (returnValueParam != null) {
			let typeChecksOut = ArgEvaluator.ARG_VALIDATORS[returnValueParam.type](result);
			if (!typeChecksOut) {
				return wrapError('&amp;', `${cmdname}: should return ${returnValueParam.type} but returned ${result.getTypeName()}`, result);
				// if (arg.getTypeName() == '-error-') {
				// 	throw wrapError('&szlig;', `${this.name}: non-fatal error in argument ${i + 1}, but stopping because expected type for this argument was ${expectedType}. Sorry!`, arg);
				// }
			}
		}

		// if (result.getTypeName() == '-expectation-' && nex.getTypeName() == '-command-' && !skipActivation) {
		// 	result.activate();
		// }
		let tn = result.getTypeName();
		if (tn == '-org-' || tn == '-nativeorg-') {
			// forget multiple dereference for now we will do that soon/someday/sometime
			// just find a tag
			for (let i = 0; i < nex.numTags(); i++) {
				let tag = nex.getTag(i);
				if (result.hasChildTag(tag)) {
					let child = result.getChildWithTag(tag);
					let childResult = evaluateNexSafely(child, executionEnvironment);
					result = childResult;
				}
			}
		}
	} catch (e) {
		if (e instanceof EError) {
			result = e;
		} else {
			throw e;
		}
	}
	return result;
}

/**
 * This function is a convenience method for the process of creating a new EError
 * and inserting a previously existing EError as its first child. Used for
 * creating a stack trace of EErrors. If you have some code that calls
 * evaluateNexSafely and it returns an EError, you can use this method to wrap
 * the returned error in another error that gives more information about where
 * the error happened, then return the wrapped error.
 *
 * @param {string} prefix - a code indicating the context type where this is happening
 * @param {string} message - the description for the new EError we are creating
 * @param {EError} inner - the inner EError we are wrapping
 * @returns {EError} the wrapper error
 */
function wrapError(prefix, message, inner) {
	let e = new EError(message, prefix);
	e.appendChild(inner);
	return e;
}



export {
	evaluateNexSafely,
	wrapError
}

