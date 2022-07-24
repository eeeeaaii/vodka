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

import { systemState } from './systemstate.js';

/*
FF_GEN is a cheap way to cancel all pending deferred computations. It's a "generation"
number, so basically if the current generation is zero, then any newly created deferred
computation is given that generation number when it's kicked off. If the generation is
incremented at any point (so that we are now on generation 1), then when that deferred
computation attempts to complete, it will see that it's from an old generation, and it
won't complete.
*/

let FF_GEN = 0;

function getFFGen() {
	return FF_GEN;
}

function incFFGen() {
	FF_GEN++;
}

// UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE 
// UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE 
// UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE 

// This "garbage collector" is deprecated and unused. It's also misnamed, what it really is
// is something that looks for orphan deferreds. However I don't think even this is needed
// anymore because I can do deferred cancelling in the call to cleanupOnMemoryFree that
// heap makes when freeing memory. Need to look at the mark and sweep algo below and see
// if applies to now

/**
 * Cancels any deferreds that are not visible on the screen. This is of questionable usefulness.
 */
class GarbageCollector {
	// right now I only do deferred, and I kill any deferreds
	// that are not currently visible/rendering on the screen
	// (meaning that if you stored an deferred in an environment
	// somewhere it will get killed by this)
	// also this is only run manually.
	constructor() {
		this.deferreds = {};
	}

	register(def) {
		this.deferreds[def.getID()] = {
			def:def,
			isReachable:false
		};
	}

	markAndSweep() {
		for (let key in this.deferreds) {
			let rec = this.deferreds[key];
			rec.isReachable = false;
		}
		let nodesToProcess = [];
		nodesToProcess.push(systemState.getRoot());
		while(nodesToProcess.length > 0) {
			let node = nodesToProcess.pop();
			let nex = node.getNex();
			if (nex.getTypeName() == '-deferredvalue-' || nex.getTypeName() == '-deferredcommand-') {
				this.deferreds[nex.getID()].isReachable = true;
			}
			if (nex.isNexContainer()) {
				for (let i = 0; i < node.numChildren(); i++) {
					let c = node.getChildAt(i);
					nodesToProcess.push(c);
				}
			}
		}
		for (let key in this.deferreds) {
			let rec = this.deferreds[key];
			if (!rec.isReachable) {
				rec.def.cancel();
			}
		}
	}
}

const gc = new GarbageCollector();

export { gc, incFFGen, getFFGen }

