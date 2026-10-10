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

import { RenderNode } from './rendernode.js'
import { RENDER_MODE_EXPLO, RENDER_FLAG_RERENDER } from './globalconstants.js'

/*
TOASTS

An error with nowhere to stand. Evaluating in place keeps the code and replaces
nothing, so a failure has no site in the document -- and a deferred value comes
back long after the code that started it has gone. These used to be put at the
top of the document, which meant that every failure left something behind in
the document to be deleted by hand.

So they are shown over the document instead, in a fixed layer that is where it
is however far down you have scrolled.

What is shown is the error nex itself, rendered the way the document would
render it. Not a second way of drawing an error: the same one, in a different
place. Which is also why the close button is the only thing this file draws.

The flow is two outcomes. You glance at it, you already know what it says, and
it goes away on its own. Or you want to read it, you click it, and it stays
until you close it -- anywhere on it, because hunting for a target defeats the
point of something that is about to disappear.

(comment by Claude)
*/

// quickly in, long enough to read a line of, quickly out
// (comment by Claude)
const FADE_IN_MS = 200;
const HOLD_MS = 2000;
const FADE_OUT_MS = 200;

/*
A runaway -- something failing on every audio callback -- would otherwise fill
the screen with toasts nobody asked for. The oldest unpinned one goes; a pinned
one is one somebody is reading and is never taken away from them.

(comment by Claude)
*/
const MOST_AT_ONCE = 6;

let layer = null;
let live = [];

function toastLayer() {
	if (layer && layer.parentNode) return layer;
	if (!document.body) return null;
	layer = document.createElement('div');
	layer.id = 'toastlayer';
	document.body.appendChild(layer);
	return layer;
}

/*
The same notice again, which is counted on the one already showing rather than
shown twice -- the way a console collapses a repeated message. Only an error
matches an error: two different kinds of notice that happen to read the same
are not the same notice.

(comment by Claude)
*/
function isSameNotice(a, b) {
	if (!a || !b || !a.getTypeName || !b.getTypeName) return false;
	if (a.getTypeName() != '-error-' || b.getTypeName() != '-error-') return false;
	return a.getErrorType() == b.getErrorType()
			&& a.getFullTypedValue() == b.getFullTypedValue();
}

function liveToastFor(notice) {
	for (let i = 0; i < live.length; i++) {
		if (isSameNotice(live[i].notice, notice)) return live[i];
	}
	return null;
}

function clearTimers(t) {
	if (t.fadeTimer) window.clearTimeout(t.fadeTimer);
	if (t.goneTimer) window.clearTimeout(t.goneTimer);
	t.fadeTimer = null;
	t.goneTimer = null;
}

// how long it has before it starts going, counted from now
// (comment by Claude)
function startCountdown(t) {
	clearTimers(t);
	t.fadeTimer = window.setTimeout(function() {
		t.element.classList.remove('toastshown');
		t.goneTimer = window.setTimeout(function() {
			removeToast(t);
		}, FADE_OUT_MS);
	}, FADE_IN_MS + HOLD_MS);
}

function removeToast(t) {
	clearTimers(t);
	let ix = live.indexOf(t);
	if (ix >= 0) live.splice(ix, 1);
	if (t.element.parentNode) t.element.parentNode.removeChild(t.element);
	if (live.length == 0 && layer && layer.parentNode) {
		layer.parentNode.removeChild(layer);
		layer = null;
	}
}

/*
Clicked, so it is being read: the fade stops where it is and comes back to
full, and a way to dismiss it appears. Clicking it again does nothing -- the
second click is the one that lands on the close button, and the rest of the
toast has no other job once it is pinned.

(comment by Claude)
*/
function pinToast(t) {
	if (t.pinned) return;
	t.pinned = true;
	clearTimers(t);
	t.element.classList.add('toastshown');
	t.element.classList.add('toastpinned');
	let close = document.createElement('div');
	close.classList.add('toastclose');
	close.innerHTML = '&times;';
	close.onclick = function(event) {
		event.stopPropagation();
		removeToast(t);
	};
	t.element.appendChild(close);
}

function makeToast(notice) {
	let node = new RenderNode(notice);
	/*
	Exploded explicitly, whatever the document is set to. A value nex is
	display:none unless it is exploded, so a notice left to inherit would be
	put in the layer correctly and then not shown at all.

	(comment by Claude)
	*/
	node.setRenderMode(RENDER_MODE_EXPLO);
	// the top of its own little tree, since it is not in the document's
	// (comment by Claude)
	node.setRenderDepth(0);
	node.render(RENDER_FLAG_RERENDER);

	let element = document.createElement('div');
	element.classList.add('toast');
	element.appendChild(node.getDomNode());

	let t = { notice: notice, node: node, element: element,
			pinned: false, fadeTimer: null, goneTimer: null };
	element.onclick = function(event) {
		// the document is underneath this and did not ask to be clicked
		// (comment by Claude)
		event.stopPropagation();
		pinToast(t);
	};
	return t;
}

function tooMany() {
	while (live.length > MOST_AT_ONCE) {
		let oldest = null;
		for (let i = 0; i < live.length; i++) {
			if (!live[i].pinned) { oldest = live[i]; break; }
		}
		if (!oldest) return;
		removeToast(oldest);
	}
}

/*
Show a notice over the document. Answers nothing: a toast is not in the
document, so there is no node for anybody to hold on to -- which is the whole
point of it.

(comment by Claude)
*/
function showNoticeToast(notice) {
	if (!notice) return null;
	let host = toastLayer();
	if (!host) return null;

	let already = liveToastFor(notice);
	if (already) {
		already.notice.incrementRepeatCount();
		already.node.render(RENDER_FLAG_RERENDER);
		// a repeat is news again, so an unpinned one gets its time back
		// (comment by Claude)
		if (!already.pinned) startCountdown(already);
		return null;
	}

	let t = makeToast(notice);
	live.push(t);
	host.appendChild(t.element);
	tooMany();
	/*
	On the frame after it is in the document, because a transition from no
	opacity to full needs the browser to have seen the first one. Added in the
	same breath and it is simply shown.

	(comment by Claude)
	*/
	window.requestAnimationFrame(function() {
		window.requestAnimationFrame(function() {
			t.element.classList.add('toastshown');
		});
	});
	startCountdown(t);
	return null;
}

export { showNoticeToast }
