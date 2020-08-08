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

import * as Vodka from '../vodka.js'


// can return null if user clicks on some other thing
function getParentNexOfDomElement(elt) {
	while(elt && !elt.classList.contains('nex')) {
		elt = elt.parentNode;
	}
	return elt;
}

function respondToClickEvent(nex, renderNode, browserEvent) {
	if (nex.extraClickHandler) {
		nex.extraClickHandler();
		return;
	}
	let parentNexDomElt = getParentNexOfDomElement(browserEvent.target);
	if (Vodka.getGlobalSelectedNode().getDomNode() == parentNexDomElt) {
		return;
	}
	let insertAfterRemove = false;
	let oldSelectedNode = Vodka.getGlobalSelectedNode();
	if ((Vodka.getGlobalSelectedNode().getNex().getTypeName() == '-estring-'
		|| Vodka.getGlobalSelectedNode().getNex().getTypeName() == '-eerror-')
			&& Vodka.getGlobalSelectedNode().getNex().getMode() == MODE_EXPANDED) {
		Vodka.getGlobalSelectedNode().getNex().finishInput();
	} else if (Vodka.getGlobalSelectedNode().getNex().getTypeName() == '-insertionpoint-') {
		insertAfterRemove = true;
	}

	browserEvent.stopPropagation();
	renderNode.setSelected(false /*shallow-rerender*/);
	if (insertAfterRemove && Vodka.getGlobalSelectedNode() != oldSelectedNode) {
		manipulator.removeNex(oldSelectedNode);
	}
	Vodka.eventQueue.enqueueImportantTopLevelRender();
}

export { respondToClickEvent }
