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

class LambdaCommandPhase extends ExpectationPhase {
	constructor(phaseExecutor, nex, env) {
		super(nex);
		this.env = env;
		this.phaseExecutor = phaseExecutor;
		this.initialized = false;
	}

	init() {
		if (!this.initialized) {
			this.lambda = this.exp.children[0];
			this.needsEval = [];
			for (let i = 0; i < this.lambda.children.length; i++) {
				this.needsEval[i] = this.lambda.children[i].needsEvaluation();
			}
			this.lambdaClosure = this.lambda.getClosure();
			this.initialized = true;
		}
	}

	anyNeedEvaluation() {
		for (let i = 0; i < this.needsEval.length; i++) {
			if (this.needsEval[i]) {
				return true;
			}
		}
		return false;
	}

	start() {
		this.phaseExecutor.pushPhase(new LambdaBindingPhase(this.phaseExecutor, this.nex, this.env));
		for (let i = this.nex.children.length - 1; i >= 0; i--) {
			this.nex.children[i].pushNexPhase(this.phaseExecutor, this.env);
		}
		super.start();
	}

	continue() {
		this.init();
		// there should be at least one that needs evaluation
		for (let i = 0; i < this.needsEval.length; i++) {
			if (this.needsEval[i]) {
				let f = function() {
					this.lambda.children[i].pushNexPhase(this.phaseExecutor, this.lambdaClosure);
				}.bind(this);
				this.needsEval[i] = false;
				return f;
			}
		}
	}

	isFinished() {
		this.init();
		return !this.anyNeedEvaluation();
	}

	getExpectationResult() {
		let result = this.lambda.children[this.lambda.children.length - 1];
		return result;
	}
}
