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

class IfCommandPhase extends ExpectationPhase {
	constructor(phaseExecutor, nex, env) {
		super(nex);
		this.phaseExecutor = phaseExecutor;
		this.env = env;
		this.continued = false;
	}

	start() {
		let tmpChildren = this.nex.getChildrenForStepEval();
		tmpChildren[0].pushNexPhase(this.phaseExecutor, this.env);
		super.start();
	}

	continue() {
		let tmpChildren = this.nex.getChildrenForStepEval();
		this.test = tmpChildren[0].getTypedValue();
		if (this.test) {
			tmpChildren[1].pushNexPhase(this.phaseExecutor, this.env);
			this.nex.replaceChildAt(new Nil(), 2);
		} else {
			tmpChildren[2].pushNexPhase(this.phaseExecutor, this.env);
			this.nex.replaceChildAt(new Nil(), 1);
		}
		this.continued = true;
		return false;
	}

	isFinished() {
		return this.isStarted() && this.continued;
	}

	getExpectationResult() {
		let tmpChildren = this.nex.getChildrenForStepEval();
		if (this.test) {
			return tmpChildren[1];
		} else {
			return tmpChildren[2];
		}
	}
}
