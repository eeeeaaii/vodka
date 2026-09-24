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

// can return null if user clicks on some other thing
function getParentNexOfDomElement(elt) {
	while(elt && !elt.classList.contains('nex')) {
		elt = elt.parentNode;
	}
	return elt;
}

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
		let parentNexDomElt = getParentNexOfDomElement(browserEvent.target);
		let mode = insertionModeForClick(renderNode, browserEvent);
		/*
		Clicking what is already selected used to be nothing to do. It is
		something to do now: the third of the nex the click landed in says where
		the pip goes, so clicking lower down the same nex moves it. Still
		nothing to do when the pip would not move.

		(comment by Claude)
		*/
		let selected = systemState.getGlobalSelectedNode();
		if (selected.getDomNode() == parentNexDomElt
				&& (!mode || mode == selected.getInsertionMode())) {
			return;
		}
		browserEvent.stopPropagation();
		// on the undo stack, the same as moving the selection with the keyboard
		// (comment by Claude)
		enqueueAndPerformAction(new ClickSelectAction(renderNode, mode));
	}
}

/*
Where in a nex you clicked says where the pip goes. Near the start of it, the
pip goes before; near the end, after; in the middle, inside.

Along whichever way the container it sits in is laid out -- top to bottom in a
vertical one, left to right in a horizontal one -- because that is the direction
"before" and "after" mean anything in. A z directional container stacks its
children on top of each other and neither axis says anything, so a click there
is left to mean what it always did.

Inside is only offered by something that can hold a pip inside it. Anywhere
else the middle third is split down the middle and reads as before or after,
which is the nearest honest answer.

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
	if (where < 1 / 3) return INSERT_BEFORE;
	if (where > 2 / 3) return INSERT_AFTER;

	let nex = renderNode.getNex();
	let canGoInside = nex && nex.isNexContainer && nex.isNexContainer()
			&& nex.canDoInsertInside && nex.canDoInsertInside();
	if (canGoInside) return INSERT_INSIDE;
	return where < 0.5 ? INSERT_BEFORE : INSERT_AFTER;
}

export { respondToClickEvent }
