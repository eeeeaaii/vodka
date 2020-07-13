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

import * as Vodka from './vodka.js'
import * as Utils from './utils.js'
import { RenderNode } from './rendernode.js'
import { manipulator } from './vodka.js'
import { EError } from './nex/eerror.js'
import { BuiltinArgEvaluator } from '../builtinargevaluator.js'

// use this wrapper to handle exceptions correctly, this
// saves us from having to put exception handling in every
// location where we evaluate nexes.
function evaluateNexSafely(nex, executionEnvironment, skipActivation) {
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

		if (result.getTypeName() == '-expectation-' && nex.getTypeName() == '-command-' && !skipActivation) {
			result.activate();
		}
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
	let n = evaluateNexSafely(s.getNex(), Vodka.BINDINGS);
	if (Utils.isFatalError(n)) {
		Vodka.beep();
	}
	if (n) {
		Vodka.manipulator.replaceSelectedWith(new RenderNode(n));
	}
}

function evaluateAndKeep(s) {
	let n = evaluateNexSafely(s.getNex(), Vodka.BINDINGS);
	Vodka.eventQueue.enqueueAlertAnimation(s);
	if (Utils.isFatalError(n)) {
		Vodka.beep();
		Vodka.manipulator.insertBeforeSelectedAndSelect(n);
	}
}

function evaluateAndCopy(s) {
	let n = evaluateNexSafely(s.getNex(), Vodka.BINDINGS);
	if (n) {
		Vodka.manipulator.replaceSelectedWith(new RenderNode(n));
	}
}

export {
	evaluateAndReplace,
	evaluateAndCopy,
	evaluateAndKeep,
	evaluateNexSafely,
	wrapError
}

