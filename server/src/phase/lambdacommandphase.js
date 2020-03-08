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
		this.bindingpushed = false;
	}

	init() {
		if (!this.initialized) {
			this.processed = [];
			let tmpChildren = this.nex.getChildrenForStepEval();
			for (let i = 0; i < tmpChildren.length; i++) {
				this.processed[i] = false;
			}
			this.initialized = true;
		}
	}

	continue() {
		this.init();
		let tmpChildren = this.nex.getChildrenForStepEval();
		for (var i = 0; i < tmpChildren.length; i++) {
			if (!this.processed[i]) {
				this.processed[i] = true;
				let c = tmpChildren[i];
				let needsEval = c.needsEvaluation();
				if (needsEval) {
					tmpChildren[i].pushNexPhase(this.phaseExecutor, this.env);
					return true;
				}
			}
		}
		// didn't find any more args to eval, now let's convert to a lambda
		this.bindingpushed = true;
		let lambdaBindingPhase = new LambdaBindingPhase(this.phaseExecutor, this.nex, this.env);
		lambdaBindingPhase.setCommandCallback(this);
		this.phaseExecutor.pushPhase(lambdaBindingPhase);
		return true;
	}

	setLambda(lambda) {
		this.lambda = lambda;
	}

	start() {
		let tmpChildren = this.nex.getChildrenForStepEval();
		for (let i = 0; i < tmpChildren.length; i++) {
			tmpChildren[i].setEnclosingClosure(this.env);
		}
		super.start();
	}

	isFinished() {
		this.init();
		return (this.bindingpushed);
	}

	getExpectationResult() {
		let tmpChildren = this.exp.getChildrenForStepEval();
		return tmpChildren[0]; // erm
	}
}
