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

class LambdaExecutePhase extends Phase {
	constructor(phaseExecutor, lambda, closure) {
		super();
		this.lambda = lambda;
		this.closure = closure;
		this.phaseExecutor = phaseExecutor;
		this.initialized = false;
		this.processed = [];
	}

	anyNeedEvaluation() {
		let tmpChildren = this.lambda.getChildrenForStepEval();
		for (let i = 0; i < tmpChildren.length; i++) {
			if (!this.processed[i] && tmpChildren[i].needsEvaluation()) {
				return true;
			}
		}
		return false;
	}

	start() {
		super.start();
		let tmpChildren = this.lambda.getChildrenForStepEval();
		for (let i = 0; i < tmpChildren.length; i++) {
			tmpChildren[i].setEnclosingClosure(this.closure);
			this.processed[i] = false;
		}
		// start is really a no-op, other than setting closure, because this is not an expectation
		// phase, so there is no visual evidence that "start" happened -- so we return true so that
		// PhaseExecutor will go right into continue().
		return true;
	}

	continue() {
		if (this.anyNeedEvaluation()) {
			let tmpChildren = this.lambda.getChildrenForStepEval();
			for (let i = 0; i < tmpChildren.length; i++) {
				if (!this.processed[i] && tmpChildren[i].needsEvaluation()) {
					this.processed[i] = true;
					tmpChildren[i].pushNexPhase(this.phaseExecutor, this.closure);
					return true;
				}
			}
		}
		return true; // will either finish this up, or run a subphase for one of the expressions inside the lambda
	}

	isFinished() {
		return !this.anyNeedEvaluation();
	}

	finish() {
		let tmpChildren = this.lambda.getChildrenForStepEval();
		let result = tmpChildren[tmpChildren.length - 1];
		let parent = this.lambda.getRenderNodes()[0].getParent().getNex();
		parent.replaceChildWith(this.lambda, result);

	}
}
