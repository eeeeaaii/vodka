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
import { BuiltinArgEvaluator } from './builtinargevaluator.js'
import { BINDINGS } from './environment.js'

// use this wrapper to handle exceptions correctly, this
// saves us from having to put exception handling in every
// location where we evaluate nexes.

/**
 * This is the main workhorse function that evaluates bits of vodka code.
 *
 * @param {Nex} nex - the code to evaluate
 * @param {Environment} executionEnvironment - the environment to use to look up symbols in the code (for example, the closure's captured scope if this code is evaluated inside a closure)
 */
function evaluateNexSafely(nex, executionEnvironment, skipActivation /* TODO: remove this param */) {
	let result;
	try {
		nex.evalSetup(executionEnvironment);
		let returnValueParam = nex.getExpectedReturnType();
		let cmdname = nex.maybeGetCommandName();
		result = nex.evaluate(executionEnvironment);

		if (returnValueParam != null) {
			let typeChecksOut = BuiltinArgEvaluator.ARG_VALIDATORS[returnValueParam.type](result);
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

function wrapError(prefix, message, inner) {
	let e = new EError(message, prefix);
	e.appendChild(inner);
	return e;
}


function evaluateAndReplace(s) {
	let n = evaluateNexSafely(s.getNex(), BINDINGS);
	if (Utils.isFatalError(n)) {
		Utils.beep();
	} else if (n.getTypeName() == '-expectation-' && !n.isActivated()) {
	// ONLY AT TOP LEVEL we activate expectations.
		n.activate();
	}

	if (n) {
		manipulator.replaceSelectedWith(new RenderNode(n));
	}
}

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
				eventQueueDispatcher.enqueueTopLevelRender();
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

export {
	evaluateAndReplace,
	evaluateAndCopy,
	evaluateAndKeep,
	evaluateNexSafely,
	wrapError
}

