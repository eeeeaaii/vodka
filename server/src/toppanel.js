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
THE TOP PANEL

A strip across the top of the window, opened from the caret in the status bar,
showing what is playing. The panel only sets a class on <html>; the stylesheet
turns that into --top-panel-h, and everything at the top of the window moves
by it (see vodka.css).

(comment by Claude)
*/

const STORAGE_KEY = 'vodka-top-panel-open';

let panel = null;
let canvas = null;
let playhead = null;
let open = false;

function ensurePanel() {
	if (panel) return;
	panel = document.createElement('div');
	panel.id = 'toppanel';
	let wave = document.createElement('div');
	wave.classList.add('toppanelwave');
	canvas = document.createElement('canvas');
	playhead = document.createElement('div');
	playhead.classList.add('toppanelplayhead');
	wave.appendChild(canvas);
	wave.appendChild(playhead);
	panel.appendChild(wave);
	document.body.appendChild(panel);
}

function remember(v) {
	try {
		localStorage.setItem(STORAGE_KEY, v ? '1' : '0');
	} catch (e) {}
}

function remembered() {
	try {
		return localStorage.getItem(STORAGE_KEY) == '1';
	} catch (e) {
		return false;
	}
}

function setTopPanelOpen(v) {
	open = !!v;
	ensurePanel();
	document.documentElement.classList.toggle('toppanelopen', open);
	remember(open);
}

function toggleTopPanel() {
	setTopPanelOpen(!open);
}

function isTopPanelOpen() {
	return open;
}

// opens it again if it was open when the page was last closed
function restoreTopPanel() {
	if (remembered()) setTopPanelOpen(true);
}

export { toggleTopPanel, isTopPanelOpen, restoreTopPanel }
