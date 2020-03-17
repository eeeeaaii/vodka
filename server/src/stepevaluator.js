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

class StepEvaluator {
	doStep() {
		// it would be so much simpler if step evaluating actually changed
		// the selected node to be the next node that needs to be changed
		// or evaluated. then I don't need to maintain a stack!



		// if you are step-evaluating a given command somewhere,
		// you are going to destructively alter the contents of it.
		// that command may be (probably is) bound to some symbol,
		// so we want to copy it.
		// The nex that it's inside will also be destructively changed,
		// but can we assume that that nex is unimportant (i.e. not
		// bound to anything)? or do we want to walk up the tree
		// until we find something we are sure isn't bound (like the
		// root doc)?
		if (!selectedNode.isStepEvaluating()) {
			selectedNode.startStepEvaluation();
		}
		selectedNode.doStep();
	}
}