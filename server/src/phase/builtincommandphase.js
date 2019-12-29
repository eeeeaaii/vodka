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
	}

	start() {
		this.builtinParamManager.reconcile();
		for (let i = this.nex.children.length - 1; i >= 0; i--) {
			if (!this.builtinParamManager.effectiveParams[i].skipeval) {
				this.nex.children[i].pushNexPhase(this.phaseExecutor, this.env);
			}
		}
		super.start();
	}

	getExpectationResult() {
		return this.nex.evaluate(this.env);
	}	
}
