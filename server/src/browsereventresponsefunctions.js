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
import { enqueueAndPerformAction, MultiSelectAction } from './actions.js'

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
		if (systemState.getGlobalSelectedNode().getDomNode() == parentNexDomElt) {
			return;
		}
		let insertAfterRemove = false;
		let oldSelectedNode = systemState.getGlobalSelectedNode();
		if ((systemState.getGlobalSelectedNode().getNex().getTypeName() == '-estring-'
			|| systemState.getGlobalSelectedNode().getNex().getTypeName() == '-eerror-')
				&& systemState.getGlobalSelectedNode().getNex().getMode() == MODE_EXPANDED) {
			systemState.getGlobalSelectedNode().getNex().finishInput();
		} else if (systemState.getGlobalSelectedNode().getNex().getTypeName() == '-insertionpoint-') {
			insertAfterRemove = true;
		}

		browserEvent.stopPropagation();
		/*
		setSelected already marks the node losing selection, the node gaining
		it, and both their parents, and asks for a render of what is dirty.
		Rendering the whole document on top of that is the cost of every click,
		and it grows with the size of the document rather than with what
		changed.
		*/
		renderNode.setSelected();
		if (insertAfterRemove && systemState.getGlobalSelectedNode() != oldSelectedNode) {
			let wasIn = oldSelectedNode.getParent();
			manipulator.removeNex(oldSelectedNode);
			if (wasIn) wasIn.setRenderNodeDirtyForRendering(true);
		}
		eventQueueDispatcher.enqueueRenderOnlyDirty();
	}
}

export { respondToClickEvent }
