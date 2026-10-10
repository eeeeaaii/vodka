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

import { eventQueueDispatcher } from './eventqueuedispatcher.js'
import { systemState } from './systemstate.js'
import { manipulator } from './manipulator.js'
import { enqueueAndPerformAction, MultiSelectAction, ClickSelectAction } from './actions.js'
import { INSERT_BEFORE, INSERT_AFTER, INSERT_INSIDE } from './rendernode.js'
import { evaluateAndKeep } from './evaluatorinterface.js'
import * as Utils from './utils.js'

function respondToClickEvent(nex, renderNode, atTarget, browserEvent) {
	// ctrl-shift-click, and command-shift-click on a mac, selects whatever
	// contains both this and what is already selected
	if (atTarget && browserEvent.shiftKey
			&& (browserEvent.ctrlKey || browserEvent.metaKey)) {
		browserEvent.stopPropagation();
		/*
		The browser reads shift with a click as "extend the text selection from
		wherever the last one was", and it does that on mousedown before anyone
		gets a say. Stopping propagation keeps it away from vodka's own
		handlers, but the browser's default is a separate thing and has to be
		refused separately -- otherwise picking two nexes also paints a
		selection across everything between them.
		*/
		browserEvent.preventDefault();
		if (window.getSelection) {
			// one may already have been started by an earlier press
			let sel = window.getSelection();
			if (sel && sel.removeAllRanges) sel.removeAllRanges();
		}
		let plan = manipulator.planMultiSelect(renderNode);
		if (plan) {
			enqueueAndPerformAction(new MultiSelectAction(plan));
			eventQueueDispatcher.enqueueImportantTopLevelRender();
		}
		return;
	}
	if (nex.extraClickHandler) {
		nex.extraClickHandler(browserEvent.clientX, browserEvent.clientY);
		return;
	}
	if (systemState.isMouseFunnelActive() && atTarget) {
		// the second click of a double click on a command runs it in place,
		// the same as shift-enter; the first click already selected it
		if (browserEvent.detail == 2 && Utils.isCommand(nex)
				&& !renderNode.getCurrentEditor()) {
			browserEvent.stopPropagation();
			browserEvent.preventDefault();
			evaluateAndKeep(renderNode);
			return;
		}
		/*
		A finished doc is picked as a whole. Clicking a word inside one selects
		the doc it belongs to, because that is the only thing in there you are
		allowed to have: see RenderNode.isSealed.

		(comment by Claude)
		*/
		let target = renderNode.selectionTarget();
		let mode = insertionModeForClick(target, browserEvent);
		/*
		Clicking what is already selected used to be nothing to do. It is
		something to do now: the half of the nex the click landed in says where
		the pip goes, so clicking lower down the same nex moves it. Still
		nothing to do when the pip would not move.

		(comment by Claude)
		*/
		let selected = systemState.getGlobalSelectedNode();
		if (selected.getDomNode() == target.getDomNode()
				&& (!mode || mode == selected.getInsertionMode())) {
			return;
		}
		browserEvent.stopPropagation();
		// on the undo stack, the same as moving the selection with the keyboard
		// (comment by Claude)
		enqueueAndPerformAction(new ClickSelectAction(target, mode));
	}
}

/*
Where in a nex you clicked says where the pip goes. The first half puts it
inside, the second half after. Something that cannot hold a pip inside gets
before instead, which is the nearest honest answer.

Halves along whichever way the container it sits in is laid out -- top to
bottom in a vertical one, left to right in a horizontal one -- because that is
the direction "before" and "after" mean anything in. A z directional container
stacks its children on top of each other and neither axis says anything, so a
click there is left to mean what it always did.

(comment by Claude)
*/
function insertionModeForClick(renderNode, browserEvent) {
	let dom = renderNode.getDomNode();
	let parent = renderNode.getParent();
	if (!dom || !parent || !browserEvent) return null;
	let parentNex = parent.getNex();
	if (!parentNex || !parentNex.isNexContainer || !parentNex.isNexContainer()) return null;
	if (parentNex.isZdirectional && parentNex.isZdirectional()) return null;

	let vertical = parentNex.isVertical && parentNex.isVertical();
	let rect = dom.getBoundingClientRect();
	let along = vertical ? (browserEvent.clientY - rect.top) : (browserEvent.clientX - rect.left);
	let size = vertical ? rect.height : rect.width;
	if (!(size > 0)) return null;

	let where = along / size;
	if (where >= 0.5) return INSERT_AFTER;

	let nex = renderNode.getNex();
	let canGoInside = nex && nex.isNexContainer && nex.isNexContainer()
			&& nex.canDoInsertInside && nex.canDoInsertInside();
	return canGoInside ? INSERT_INSIDE : INSERT_BEFORE;
}

export { respondToClickEvent }
