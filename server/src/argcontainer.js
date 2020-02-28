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

// so in a rendernodes world, this turns out to be a super important class.

class CopiedArgContainer {
	constructor(nex) {
		this.args = [];
		this.needsEval = [];
		for (let i = 0; i < nex.numChildren(); i++) {
			this.args[i] = nex.getChildAt(i);
		}
	}

	setNeedsEvalForArgAt(needsEval, i) {
		this.needsEval[i] = needsEval;
	}

	getNeedsEvalForArgAt(i) {
		return this.needsEval[i];
	}

	numArgs() {
		return this.args.length;
	}

	getArgAt(i) {
		return this.args[i];
	}

	setArgAt(newarg, i) {
		this.args[i] = newarg;
	}

	removeArgAt(i) {
		this.args[i].splice(i, 1);
	}
}


class NexChildArgContainer {
	constructor(nex) {
		this.nex = nex;
		this.needsEval = [];
	}

	setNeedsEvalForArgAt(needsEval, i) {
		this.needsEval[i] = needsEval;
	}

	getNeedsEvalForArgAt(i) {
		return this.needsEval[i];
	}

	numArgs() {
		return this.nex.numChildren();
	}

	getArgAt(i) {
		return this.nex.getChildAt(i);
	}

	setArgAt(newarg, i) {
		this.nex.replaceChildAt(newarg, i);
	}

	removeArgAt(i) {
		this.nex.removeChildAt(i);
	}
}

