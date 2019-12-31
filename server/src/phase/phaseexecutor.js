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

class PhaseExecutor {
	constructor() {
		this.phaseStack = [];
	}

	pushPhase(newPhase) {
		this.phaseStack.push(newPhase);
	}

	finished() {
		return this.phaseStack.length == 0;
	}

	doNextStep() {
		if (this.finished()) {
			throw new Error('tried to do step on finished phase executor');
		}
		let top = this.phaseStack[this.phaseStack.length - 1];
		if (!top.isStarted()) {
			top.start();
		} else if (top.isFinished()) {
			this.phaseStack.pop();
			top.finish();
		} else {
			var callback = top.continue();
			if (callback != 'skip') { // hack until I get rid of the thing where if turns the clause to nil
				if (callback) {
					callback();
				}
				this.doNextStep();
			}
		}
	}
}
