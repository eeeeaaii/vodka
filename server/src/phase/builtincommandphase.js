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

class BuiltinCommandPhase extends ExpectationPhase {
	constructor(phaseExecutor, nex, env) {
		super(nex);
		this.env = env;
		this.phaseExecutor = phaseExecutor;
		this.builtin = nex.getLambda(env);
		this.params = this.builtin.params;
		this.builtinParamManager = new BuiltinParamManager(this.params, nex.children);

		this.initialized = false;
	}

	init() {
		if (!this.initialized) {
			this.processed = [];
			for (let i = 0; i < this.nex.children.length; i++) {
				this.processed[i] = false;
			}
			this.builtinParamManager.reconcile();
			this.initialized = true;
		}
	}

	continue() {
		this.init();
		for (var i = 0; i < this.nex.children.length; i++) {
			if (!this.processed[i]) {
				this.processed[i] = true;
				let c = this.nex.children[i];
				let needsEval = c.needsEvaluation();
				if (needsEval && !this.builtinParamManager.effectiveParams[i].skipeval) {
					this.nex.children[i].pushNexPhase(this.phaseExecutor, this.env);
					return true;
				}
			}
		}
		// always keep going because if we don't find one, we finish this phase.
		return true;
	}

	isFinished() {
		this.init();
		for (var i = 0; i < this.nex.children.length; i++) {
			let c = this.nex.children[i];
			let needsEval = c.needsEvaluation();
			if (!this.processed[i] && needsEval) {
				return false;
			}
		}
		return true;
	}

	start() {
		this.builtinParamManager.reconcile();
		for (let i = this.nex.children.length - 1; i >= 0; i--) {
			this.nex.children[i].setEnclosingClosure(this.env);
		}
		super.start();
		return false;
	}

	getExpectationResult() {
		return evaluateNexSafely(this.nex, this.env);
	}	
}
