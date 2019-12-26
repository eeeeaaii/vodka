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
		return arg.evaluate(this.argEnv);
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

	startEvaluating() {
		this.checkNumParams();
		for (let i = 0; i < this.argContainer.numArgs(); i++) {
			let arg = this.argContainer.getArgAt(i);
			this.argContainer.setNeedsEvalForArgAt(arg.needsEvaluation(), i);
		}
	}

	doForEachArg(f) {
		for (let i = 0; i < this.argContainer.numArgs(); i++) {
			let arg = this.argContainer.getArgAt(i);
			f(arg, i);
		}
	}

	indexOfNextUnevaluatedExpression() {
		let ind = -1;
		this.doForEachArg(function(arg, i) {
			if (ind == -1 && this.argContainer.getNeedsEvalForArgAt(i)) {
				ind = i;
			}
		}.bind(this));
		return ind;
	}

	evaluateNext(exp) {
		let stop = false;
		this.doForEachArg(function(arg, i) {
			if (stop) return;
			if (this.argContainer.getNeedsEvalForArgAt(i)) {
				this.argContainer.setNeedsEvalForArgAt(false, i);
				arg.stepEvaluate(this.argEnv, exp);
				this.argContainer.setArgAt(exp, i);
				// hack
				if (arg.__haserror) {
					exp.appendChild(arg.__haserror);

				} else {
					exp.appendChild(arg);
				}
				stop = true;
			}
		}.bind(this));
	}

	allExpressionsEvaluated() {
		let r = true;
		this.doForEachArg(function(arg, i) {
			if (this.argContainer.getNeedsEvalForArgAt(i)) {
				r = false;
			}
		}.bind(this));
		return r;
	}

	finishEvaluating() {
		this.bindArgs();
	}
}
