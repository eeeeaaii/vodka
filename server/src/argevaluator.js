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

import { evaluateNexSafely, wrapError } from './evaluator.js'
import { Org } from './nex/org.js'
import { EError } from './nex/eerror.js'
import { ERROR_TYPE_FATAL} from './nex/eerror.js'

const ARGRESULT_ALREADY_PROCESSED = 0;
const ARGRESULT_FINISHED = 1;
const ARGRESULT_SETTLED = 2;
const ARGRESULT_LISTENING = 3;

function getParameterInfo(params) {
	let info = {};
	info.hasoptionals = false;
	info.hasvariadics = false;
	info.minArgCount = 0;
	info.maxArgCount = 0;
	let didVariadic = false;
	for (let i = 0; i < params.length; i++) {
		if (info.hasvariadics) {
			throw new Error("variadic must be last arg");
		}
		let param = params[i];
		if (param.optional) {
			info.hasoptionals = true;
			info.maxArgCount++;
			continue;
		}
		if (param.variadic) {
			if (info.hasoptionals) {
				throw new Error("can't have variadics and also optionals.");
			}
			info.hasvariadics = true;
			info.maxArgCount = Infinity;
		} else {
			info.maxArgCount++;
			info.minArgCount++;
		}
	}
	return info;
}



/**
 * The job of the arg evaluator is to evaluate the arguments (if needed)
 * and bind them to variables in the new scope.
 */
class ArgEvaluator {
	constructor(name, params, argContainer, executionEnvironment) {
		this.name = name;
		this.params = params;
		this.argContainer = argContainer;
		this.executionEnvironment = executionEnvironment;
		this.paramInfo = getParameterInfo(this.params);
	}

	debugString() {
		let s = '';
		s += "arg evaluator\n";
		s += "   args:\n";
		for (let i = 0; i < this.params.length; i++) {
			let p = this.params[i];
			s += `      ${p.name}${p.debugName ? ` (${p.debugName})` : ``}\n`;
		}
		s += "   values:\n";
		for (let i = 0; i < this.argContainer.numArgs(); i++) {
			s += "      " + this.argContainer.getArgAt(i).debugString() + '\n';
		}
		return s;
	}

	checkMinNumArgs() {
		if (this.argContainer.numArgs() < this.paramInfo.minArgCount) {
			throw new EError(`when calling ${this.name}: not enough args. You needed ${this.paramInfo.minArgCount} but there were only ${this.argContainer.numArgs()}. Sorry!`);
		}
	}

	checkMaxNumArgs() {
		if (this.argContainer.numArgs() > this.effectiveParams.length) {
			throw new EError(`when calling ${this.name}: too many args. The max is ${this.effectiveParams.length} but you passed ${this.argContainer.numArgs()}. Sorry!`);
		}
	}

	padEffectiveParams() {
		this.effectiveParams = [];
		let i = 0;
		for (; i < this.params.length; i++) {
			this.effectiveParams[i] = this.params[i];
		}
		if (this.paramInfo.hasvariadics) {
			for(let lasti = i - 1; i < this.argContainer.numArgs(); i++) {
				this.effectiveParams[i] = this.params[lasti];
			}
		}
	}

	processSingleArg(i) {
		let param = this.effectiveParams[i];
		let arg = this.argContainer.getArgAt(i);
		let argnex = arg.getNex();
		if (!param.skipeval) {
			argnex = evaluateNexSafely(argnex, this.executionEnvironment, param.skipactivate);
			if (Utils.isFatalError(argnex)) {
				throw wrapError('&szlig;', `when calling ${this.name}: fatal error in argument ${i + 1} (expected type ${param.type}), cannot continue. Sorry!`, argnex);
			}
		}

		this.checkType(argnex, param, i);

		arg.setNex(argnex);
	}

	checkType(argnex, param, i) {
		let expectedType = param.type;
		let typeChecksOut = ArgEvaluator.ARG_VALIDATORS[expectedType](argnex);
		if (!typeChecksOut) {
			if (argnex.getTypeName() == '-error-') {
				throw wrapError('&szlig;', `when calling ${this.name}: non-fatal error in argument ${i + 1}, but stopping because expected type for this argument was ${expectedType}. Sorry!`, argnex);
			} else {
				throw new EError(`when calling ${this.name}: stopping because expected ${expectedType} for argnex ${i + 1} but got ${argnex.getTypeName()}. Sorry!`);
			}
		}		
	}


	// return true if we should continue processing args
	processSinglePotentiallyDeferredArg(i, listener) {
		let arg = this.argContainer.getArgAt(i);
		if (arg.isProcessed()) {
			return ARGRESULT_ALREADY_PROCESSED; // keep going
		}
		let param = this.effectiveParams[i];
		let argnex = arg.getNex();

		if (Utils.isDeferredValue(argnex) && argnex.isSettled() && !argnex.isFinished()) {
			let subargnex = argnex.getSettledValue();
			this.checkType(subargnex, param, i);
			arg.setSubstituteValue(subargnex);
			return ARGRESULT_SETTLED;
		}

		if (!param.skipeval) {
			argnex = evaluateNexSafely(argnex, this.executionEnvironment, param.skipactivate);
			arg.setNex(argnex);
			if (Utils.isFatalError(argnex)) {
				throw wrapError('&szlig;', `when calling ${this.name}: fatal error in argument ${i + 1} (expected type ${param.type}), cannot continue. Sorry!`, argnex);
			}
			if (Utils.isDeferredValue(argnex)) {
				argnex.addListener(listener);
				return ARGRESULT_LISTENING;
			}
		}

		this.checkType(argnex, param, i);

		arg.setProcessed(true);
		return ARGRESULT_FINISHED;
	}

	processArgs() {
		for (let i = 0; i < this.argContainer.numArgs(); i++) {
			this.processSingleArg(i);
		}
	}

	processPotentiallyDeferredArgs(listener) {
		let lastIndex = this.argContainer.numArgs();
		let i = 0;
		let foundSettled = false;
		let result = null;
		for (; i < lastIndex; i++) {
			result = this.processSinglePotentiallyDeferredArg(i, listener);
			if (result == ARGRESULT_LISTENING) {
				break;
			}
			if (result == ARGRESULT_SETTLED) {
				foundSettled = true;
			}
		}
		if (i == lastIndex) {
			// we got to the end, but the last argument might not be settled or finished.
			if (result == ARGRESULT_LISTENING) {
				return result;
			} else {
				return foundSettled ? ARGRESULT_SETTLED : ARGRESULT_FINISHED;
			}
		} else {
			return ARGRESULT_LISTENING;
		}
		return r;
	}

	putArgsInJSArray() {
		let r = [];
		for (let i = 0; i < this.params.length; i++) {
			let param = this.params[i];
			if (param.variadic) {
				let r2 = [];
				for (let j = i; j < this.argContainer.numArgs(); j++) {
					r2.push(this.argContainer.getArgAt(j).getNex());
				}
				r.push(r2);
			} else if (param.optional) {
				if (i < this.argContainer.numArgs()) {
					r.push(this.argContainer.getArgAt(i).getNex());
				}
			} else {
				r.push(this.argContainer.getArgAt(i).getNex());
			}
		}
		return r;
	}

	bindArgs(scope) {
		for (let i = 0; i < this.params.length; i++) {
			let param = this.params[i];
			if (param.variadic) {
				let org = new Org();
				for (let j = i; j < this.argContainer.numArgs(); j++) {
					org.appendChild(this.argContainer.getArgAt(j).getNexOrSubstitute());
				}
				scope.bind(param.name, org);
			} else if (param.optional) {
				if (i < this.argContainer.numArgs()) {
					scope.bind(param.name, this.argContainer.getArgAt(i).getNexOrSubstitute());
				}
			} else {
				scope.bind(param.name, this.argContainer.getArgAt(i).getNexOrSubstitute());
			}
		}
	}

	prepareToEvaluate() {
		this.checkMinNumArgs();
		this.padEffectiveParams();
		this.checkMaxNumArgs();
		this.prepared = true;	
	}

	evaluatePotentiallyDeferredArgs(listener) {
		if (!this.prepared) {
			this.prepareToEvaluate();
		}
		return this.processPotentiallyDeferredArgs(listener);
	}

	evaluateArgs() {
		this.prepareToEvaluate();
		this.processArgs();
	}
}


ArgEvaluator.ARG_VALIDATORS = {
	'*': arg => true,
	'NexContainer': arg => (arg.isNexContainer()),
	'Bool': arg => (arg.getTypeName() == '-bool-'),
	'Command': arg => (arg.getTypeName() == '-command-'),
	'Deferred': arg => (arg.getTypeName() == '-deferredcommand-' || arg.getTypeName() == '-deferredvalue-'),
	'Doc': arg => (arg.getTypeName() == '-doc-'),
	'EString': arg => (arg.getTypeName() == '-string-'),
	'ESymbol': arg => (arg.getTypeName() == '-symbol-'),
	'EError': arg => {
		// errors can only be passed as arguments if they are not fatal
		return (arg.getTypeName() == '-error-' && arg.getErrorType() != ERROR_TYPE_FATAL);
	},
	'Float': arg => (arg.getTypeName() == '-float-'),
	'Number': arg => (arg.getTypeName() == '-integer-' || arg.getTypeName() == '-float-'),
	'Integer': arg => (arg.getTypeName() == '-integer-'),
	'Letter': arg => (arg.getTypeName() == '-letter-'),
	'Line': arg => (arg.getTypeName() == '-line-'),
	'Nil': arg => (arg.getTypeName() == '-nil-'),
	'Instantiator': arg => (arg.getTypeName() == '-instantiator-'),
	'Word': arg => (arg.getTypeName() == '-word-'),
	'Lambda': arg => (arg.getTypeName() == '-lambda-'),
	'Closure': arg => (arg.getTypeName() == '-closure-'),
};

export { ArgEvaluator, getParameterInfo, ARGRESULT_LISTENING, ARGRESULT_SETTLED, ARGRESULT_FINISHED }

