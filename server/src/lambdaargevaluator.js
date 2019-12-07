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
	constructor(params, args, bindEnv, argEnv) {
		this.params = params;
		this.args = args;
		this.bindEnv = bindEnv;
		this.argEnv = argEnv;
		this.numRequiredParams = params.length;
	}

	checkNumParams() {
		if (this.args.length < this.numRequiredParams) {
			throw new EError("lambda: not enough args passed to function.");
		}
	}	

	processArgument(arg) {
		return arg.evaluate(this.env);
	}

	processAllArgs() {
		for (var i = 0; i < this.args.length; i++) {
			this.args[i] = this.processArgument(this.args[i]);
		}
	}

	bindArgs() {
		for (var i = 0; i < this.params.length; i++) {
			this.bindEnv.bind(this.params[i], this.args[i]);
		}
	}

	evaluateAndBindArgs() {
		this.checkNumParams();
		this.processAllArgs();
		this.bindArgs();
	}
}
