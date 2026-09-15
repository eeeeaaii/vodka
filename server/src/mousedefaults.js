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

/*
The browser thinks a vodka document is a web page, and a web page is a thing
you sweep a highlight across, drag words out of, and double click to pick a
word from. None of that means anything here: a document is a tree of nexes, the
pip is the cursor, and copying is a key. Left alone, those defaults fight every
gesture the editor has -- shift-click extends a selection over half the
document, a drag paints it blue, and holding control to nudge a number opens a
context menu on top of your hand.

So the document pane says no to all of it. Not the help panel, the dialogs or
the api reference, where the text really is text and you may well want to take
a copy of it -- those keep every default they have.

Some of this is CSS (user-select, which is what actually stops the highlight
appearing) and the rest is here, because a few of these are events rather than
styles. What cannot be stopped is left alone rather than fought: a browser is
allowed to refuse.

(comment by Claude)
*/

// everything in here is inside the document pane; the help panel is elsewhere
// in the tree and is deliberately untouched
// (comment by Claude)
const PANE = 'codepane';

function inDocumentPane(event) {
	let el = event.target;
	while (el) {
		if (el.id == PANE) return true;
		el = el.parentElement;
	}
	return false;
}

function stop(event) {
	event.preventDefault();
}

export function installMouseDefaults() {
	let pane = document.getElementById(PANE);
	if (!pane) return;

	// the highlight itself. user-select in the css stops it being drawn; this
	// stops the selection being made at all, which is what shift-click and a
	// double click are really doing
	// (comment by Claude)
	pane.addEventListener('selectstart', stop);

	// dragging a nex is not a thing you can do, and the browser's idea of it --
	// peeling off a ghost of the text -- lands in the middle of every gesture
	// that starts with a press and moves
	// (comment by Claude)
	pane.addEventListener('dragstart', stop);

	// the second click of a double click otherwise selects a word underneath
	// whatever the editor did with it
	// (comment by Claude)
	pane.addEventListener('dblclick', stop);

	pane.addEventListener('mousedown', (event) => {
		/*
		The middle button is a paste on linux and an autoscroll everywhere else,
		and the two extra buttons on a mouse are back and forward. All four are
		things you would only ever hit by accident while working in a document.

		(comment by Claude)
		*/
		if (event.button != 0 && event.button != 2) {
			event.preventDefault();
		}
	});

	/*
	A mac turns control-press into a right click, so every control gesture the
	editor has -- dragging a float by hundredths, for one -- would end under a
	context menu. A plain right click still gets its menu, because that is how
	you reach inspect and the browser's own commands, and losing those to make
	an editor feel native is a bad trade.

	(comment by Claude)
	*/
	pane.addEventListener('contextmenu', (event) => {
		if (event.ctrlKey || event.shiftKey || event.metaKey || event.altKey) {
			event.preventDefault();
		}
	});

	/*
	Dropping a file on the window navigates to it, which throws away the page
	and everything not yet saved with it. Nothing here accepts a drop, so the
	only drop that can happen is that mistake. On the window rather than the
	pane: the page is lost wherever the file lands.

	(comment by Claude)
	*/
	window.addEventListener('dragover', stop);
	window.addEventListener('drop', stop);
}
