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

class StepEvaluator {
	constructor(stepContainer, env) {
		this.stepContainer = stepContainer;
		this.env = env;
	}

	startEvaluating() {
		for (let i = 0; i < this.stepContainer.numArgs(); i++) {
			this.stepContainer.setNeedsEvalForArgAt(true, i);
		}
	}

	doForEachArg(f) {
		for (let i = 0; i < this.stepContainer.numArgs(); i++) {
			let arg = this.stepContainer.getArgAt(i);
			f(arg, i);
		}
	}


	indexOfNextUnevaluatedExpression() {
		let ind = -1;
		this.doForEachArg(function(arg, i) {
			if (ind == -1 && this.stepContainer.getNeedsEvalForArgAt(i)) {
				ind = i;
			}
		}.bind(this));
		return ind;
	}

	evaluateNext(exp) {
		let stop = false;
		this.doForEachArg(function(arg, i) {
			if (stop) return;
			if (this.stepContainer.getNeedsEvalForArgAt(i)) {
				this.stepContainer.setNeedsEvalForArgAt(false, i);
				arg.stepEvaluate(this.env, exp);
				this.stepContainer.setArgAt(exp, i);
				exp.appendChild(arg);
				stop = true;
			}
		}.bind(this));
	}

	allExpressionsEvaluated() {
		let r = true;
		this.doForEachArg(function(arg, i) {
			if (this.stepContainer.getNeedsEvalForArgAt(i)) {
				r = false;
			}
		}.bind(this));
		return r;
	}

	finishEvaluating() {
	}	
}