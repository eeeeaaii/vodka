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

class LambdaArgEvaluator {
	constructor(params, argContainer, bindEnv, argEnv) {
		this.params = params;
		this.argContainer = argContainer;
		this.bindEnv = bindEnv;
		this.argEnv = argEnv;
		this.numRequiredParams = params.length;
	}

	checkNumParams() {
		if (this.argContainer.numArgs() < this.numRequiredParams) {
			throw new EError("lambda: not enough args passed to function.");
		}
	}	

	processArgument(arg) {
		return evaluateNexSafely(arg, this.argEnv);
	}

	processAllArgs() {
		for (let i = 0; i < this.argContainer.numArgs(); i++) {
			this.argContainer.setArgAt(
				this.processArgument(this.argContainer.getArgAt(i)),
				i);
		}
	}

	bindArgs() {
		for (let i = 0; i < this.params.length; i++) {
			this.bindEnv.bind(this.params[i], this.argContainer.getArgAt(i));
		}
	}

	evaluateAndBindArgs() {
		this.checkNumParams();
		this.processAllArgs();
		this.bindArgs();
	}	
}
