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

import * as Utils from './utils.js'

import { systemState } from './systemstate.js'
import { eventQueueDispatcher } from './eventqueuedispatcher.js'
import { RENDER_MODE_EXPLO } from './globalconstants.js'
import { scrollWindowToTop } from './rendernode.js'

/*
Errors with nowhere to stand.

The ordinary case is an error that replaces something: you evaluate a command,
it fails, and the error stands where the result would have. Some failures have
no such site. Shift-enter keeps the code and replaces nothing. Undo's warning
that side effects were not undone is about the undo, not about any nex. A
deferred value nobody is holding comes back with an error long after the code
that started it has gone. Each of these used to be dropped next to whatever
happened to be selected, which from where you are sitting is a random place in
the document.

They all go to one place instead: the top. It is the only position that is the
same every time, so it is the only one you can learn to look at.

A repeat of what is already at the top is counted on the error that is there
rather than pushing another line in, the way a console collapses a repeated
message. Only the top one is compared, so two failures alternating still both
show.

Errors scroll the document to the top every time, because an error is news
whether or not you have seen one like it before. Warnings scroll only when they
are new: being thrown back to the top on every undo would be worse than the
warning is useful. Both flash, so a repeat reads as something that happened
again rather than something that was already sitting there.

(comment by Claude)
*/

function isSameNotice(a, b) {
	if (!a || !b || !a.getTypeName || !b.getTypeName) return false;
	if (a.getTypeName() != '-error-' || b.getTypeName() != '-error-') return false;
	return a.getErrorType() == b.getErrorType()
			&& a.getFullTypedValue() == b.getFullTypedValue();
}

function topNoticeNode() {
	let root = systemState.getRoot();
	if (!root || root.numChildren() == 0) return null;
	return root.getChildAt(0);
}

/*
Put an error or warning at the top of the document. Returns the render node
carrying the report -- the new one, or the one already there that counted it --
or null if there is no document yet.
*/
function reportSitelessError(notice) {
	let root = systemState.getRoot();
	if (!root || !notice) {
		return null;
	}
	let topNode = topNoticeNode();
	let top = topNode ? topNode.getNex() : null;
	if (isSameNotice(top, notice)) {
		top.incrementRepeatCount();
		announce(topNode, Utils.isFatalError(top));
		return topNode;
	}
	let node = root.prependChild(notice);
	/*
	Exploded explicitly, whatever the document is set to. A value nex is
	display:none unless it is exploded, and a document in normal mode is the
	usual case, so an error left to inherit is put in the document correctly
	and then not shown at all. This one is an alert; it has to be legible from
	wherever it lands.
	*/
	node.setRenderMode(RENDER_MODE_EXPLO);
	announce(node, true);
	return node;
}

function announce(node, shouldScroll) {
	/*
	A top level render, not just the dirty nodes: a node that has this moment
	been added to the root has never been rendered, and the exploded flag is
	worked out on the way down from the root. Rendering it on its own leaves it
	display:none in an exploded document -- present, correct, and invisible.
	*/
	rerenderFromRoot();
	if (shouldScroll) {
		scrollWindowToTop();
	}
	eventQueueDispatcher.enqueueAlertAnimation(node);
}

function rerenderFromRoot() {
	let root = systemState.getRoot();
	if (!root) return;
	root.setRenderNodeDirtyForRendering(true);
	eventQueueDispatcher.enqueueTopLevelRender();
}

export { reportSitelessError }
