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

class GarbageCollector {
	// right now I only do expectations, and I kill any expectations
	// that are not currently visible/rendering on the screen
	// (meaning that if you stored an expectation in an environment
	// somewhere it will get killed by this)
	// also this is only run manually.
	constructor() {
		this.expectations = {};
	}

	register(exp) {
		this.expectations[exp.getID()] = {
			exp:exp,
			isReachable:false
		};
	}

	markAndSweep() {
		for (let key in this.expectations) {
			let rec = this.expectations[key];
			rec.isReachable = false;
		}
		let nodesToProcess = [];
		nodesToProcess.push(root);
		while(nodesToProcess.length > 0) {
			let node = nodesToProcess.pop();
			let nex = node.getNex();
			if (nex.getTypeName() == '-expectation-') {
				this.expectations[nex.getID()].isReachable = true;
			}
			if (nex.isNexContainer()) {
				for (let i = 0; i < node.numChildren(); i++) {
					let c = node.getChildAt(i);
					nodesToProcess.push(c);
				}
			}
		}
		for (let key in this.expectations) {
			let rec = this.expectations[key];
			if (!rec.isReachable) {
				rec.exp.cancel();
			}
		}
	}
}
export { GarbageCollector }

