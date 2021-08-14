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

import * as Utils from './utils.js'
import { eventQueueDispatcher } from './eventqueuedispatcher.js'
import { RenderNode } from './rendernode.js'
import { manipulator } from './manipulator.js'
import { EError } from './nex/eerror.js'
import { ArgEvaluator } from './argevaluator.js'
import { BINDINGS } from './environment.js'
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


/**
 * This method is used for when you want to evaluate the Nex inside a RenderNode
 * and replace the RenderNode with the result of the computation. If it returns
 * an expectation we activate it. We also emit a beep if it's an error.
 *
 * @param {RenderNode} s - the RenderNode to evaluate and replace (probably the selected node)
 */
function evaluateAndReplace(s) {
	let n = evaluateNexSafely(s.getNex(), BINDINGS);
	if (Utils.isFatalError(n)) {
		Utils.beep();
	} else if (n.getTypeName() == '-expectation-' && !n.isActivated()) {
	// ONLY AT TOP LEVEL we activate expectations.
		n.activate();
	} else if (shouldConvertToNonmutable(n)) {
		n.setMutable(false);
	}
	if (n) {
		manipulator.replaceSelectedWith(new RenderNode(n));
	}
}

function shouldConvertToNonmutable(nex) {
	return nex && (Utils.isBool(nex) ||
			Utils.isEString(nex) ||
			Utils.isFloat(nex) ||
			Utils.isInteger(nex))
}

/**
 * This method is used to evaluate a Nex and throw away the result. Obviously only
 * useful if evaluating the Nex has side effects. If it returns an error, the error
 * will be prepended to the parent of the selected node before the selected node.
 * If an expectation is returned, it is activated.
 *
 * This currently has a hack where it looks for errors in the children of returned
 * expectations. It's not clear this is the right way to do this since the expectation could have an
 * arbitrary number of children
 *
 * @param {RenderNode} s = the RenderNode to evaluate
 */
function evaluateAndKeep(s) {
	let n = evaluateNexSafely(s.getNex(), BINDINGS);
	if (Utils.isFatalError(n)) {
		Utils.beep();
		manipulator.insertBeforeSelectedAndSelect(n);
	} else if (Utils.isExpectation(n)) {
		if (!n.isActivated()) {
			// ONLY AT TOP LEVEL we activate expectations.
			n.activate();
		}
		n.addPendingCallback(function() {
			if (n.hasChildren() && Utils.isFatalError(n.getChildAt(0))) {
				Utils.beep();
				manipulator.insertBeforeSelectedAndSelect(n);
				//eventQueueDispatcher.enqueueTopLevelRender();
				eventQueueDispatcher.enqueueRenderOnlyDirty()
			}
		})
	}
	eventQueueDispatcher.enqueueAlertAnimation(s);
}

function evaluateAndCopy(s) {
	let n = evaluateNexSafely(s.getNex(), BINDINGS);
	if (n) {
		manipulator.replaceSelectedWith(new RenderNode(n));
	}
}

// used by the repl
function evaluateAndReturn(nex) {
	let n = evaluateNexSafely(nex, BINDINGS);
	return n;
}

export {
	evaluateAndReplace,
	evaluateAndCopy,
	evaluateAndKeep,
	evaluateNexSafely,
	wrapError,
	evaluateAndReturn
}

