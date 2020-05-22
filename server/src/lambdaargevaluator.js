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

import * as Utils from '/utils.js'
import { manipulator } from '/vodka.js'

// DEPRECATED
class LambdaArgEvaluator {
	constructor(params, argContainer, executionEnvironment, debugstr) {
		this.params = params;
		this.argContainer = argContainer;
		this.executionEnvironment = executionEnvironment;
		this.numRequiredParams = params.length;
		this.debugstr = debugstr;
	}

	checkNumParams() {
		if (this.argContainer.numArgs() < this.numRequiredParams) {
			throw new EError(`${this.debugstr}: stopping because not enough arguments (${this.numRequiredParams} required, got ${this.argContainer.numArgs()}). Sorry!`);
		}
	}	

	processArgument(arg) {
		let r = evaluateNexSafely(arg, this.executionEnvironment);
		return r;
	}

	processAllArgs() {
		for (let i = (this.skipFirstArg ? 1 : 0); i < this.argContainer.numArgs(); i++) {
			let arg = this.argContainer.getArgAt(i)
			let argval = this.processArgument(arg);
			if (Utils.isFatalError(argval)) {
				throw wrapError('&#8907;', `${this.debugstr}: fatal error in arg ${i + 1}, stopping. Sorry!`, argval);
			}
			this.argContainer.setArgAt(
				argval,
				i);
		}
	}

	bindArgs(scope) {
		for (let i = 0; i < this.params.length; i++) {
			scope.bind(this.params[i], this.argContainer.getArgAt(i));
		}
	}

	evaluateArgs() {
		this.checkNumParams();
		this.processAllArgs();
	}	
}
export { LambdaArgEvaluator }

