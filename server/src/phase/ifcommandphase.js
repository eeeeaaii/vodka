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
		this.nex.children[0].pushNexPhase(this.phaseExecutor, this.env);
		super.start();
	}

	continue() {
		this.test = this.nex.children[0].getTypedValue();
		if (this.test) {
			this.nex.children[1].pushNexPhase(this.phaseExecutor, this.env);
			this.nex.replaceChildAt(new Nil(), 2);
		} else {
			this.nex.children[2].pushNexPhase(this.phaseExecutor, this.env);
			this.nex.replaceChildAt(new Nil(), 1);
		}
		this.continued = true;
		return 'skip'; //hack
	}

	isFinished() {
		return this.isStarted() && this.continued;
	}

	getExpectationResult() {
		if (this.test) {
			return this.nex.children[1];
		} else {
			return this.nex.children[2];
		}
	}
}
