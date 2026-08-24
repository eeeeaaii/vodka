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
This is the seam between the rendering engine (plain ES modules) and the
help system (the one component island in the project, in ./components).

Nothing in here touches the DOM. It holds the two things the engine and the
island have to agree on:

  1. the tutorial bridge -- engine code all over the place calls doTutorial()
     to say "the user just did X", and that gets forwarded to the island.
  2. help policy -- whether help starts open, and what the session URLs are.
*/

import * as Utils from './utils.js'

import { experiments } from './globalappflags.js'
import { systemState } from './systemstate.js'

import { getFeatureVector } from './featurevector.js';


// --------------------------------------------------------------------------
// tutorial bridge
// --------------------------------------------------------------------------

let reactTutorialCallback = null;

// Called by the island when the tutorial starts, so that doTutorial() below
// has somewhere to forward to.
function startReactTutorial(callback) {
	reactTutorialCallback = callback;
}

function endReactTutorial() {
	reactTutorialCallback = null;
}

// Called from all over the engine (manipulator, evaluator, rendernode, the
// nex types) whenever the user does something the tutorial has a page for.
// Returns whether the tutorial actually showed a page for it, because some
// callers use that to decide whether to show a second, related page.
function doTutorial(pageId) {
	if (!reactTutorialCallback) {
		return false;
	}
	return reactTutorialCallback(pageId);
}


// --------------------------------------------------------------------------
// help policy
// --------------------------------------------------------------------------

// How the help system should look when the app starts up.
const HELP_HIDDEN = 'hidden';        // no panel, no button (tests, opted-out users)
const HELP_MINIMIZED = 'minimized';  // just the button in the corner
const HELP_OPEN = 'open';            // panel showing

function isFirstVisit() {
	return !Utils.getCookie('userhasvisited');
}

function markVisited() {
	if (isFirstVisit()) {
		document.cookie = 'userhasvisited=true';
	}
}

function hasShowHelpInQueryString() {
	let params = new URLSearchParams(window.location.search);
	return params.has('help');
}

function userAskedToHideHelpButton() {
	return (Utils.getCookie('hidehelpbutton') == 'true');
}

// This is the old maybeShowHelp() logic. Order matters: NO_SPLASH is what the
// test harness sets, and it has to win over everything else so that tests get
// a clean screen.
function getInitialHelpState() {
	if (experiments.NO_SPLASH) {
		return HELP_HIDDEN;
	}
	if (hasShowHelpInQueryString()) {
		return HELP_OPEN;
	}
	if (isFirstVisit()) {
		return HELP_OPEN;
	}
	if (userAskedToHideHelpButton()) {
		return HELP_HIDDEN;
	}
	return HELP_MINIMIZED;
}

// Builds a link back into this app with some things changed -- used for the
// session sharing links in the welcome panel. Pass null for a key to leave it
// out entirely (e.g. sessionId:null when making a brand new session).
function buildURL(obj) {
	// Note the 'in' checks: passing an explicit null means "leave this key out
	// of the URL entirely", which is how the new-session link says "don't send
	// a session id". Testing truthiness here instead would clobber that null
	// with the current session, and the server answers a new= request that
	// carries an existing session id with a 401.
	if (!('theme' in obj)) {
		obj.theme = CSS_THEME;
	}
	if (!('sessionId' in obj)) {
		obj.sessionId = systemState.getSessionId();
	}

	let r = `http://${getFeatureVector().hostname}`;
	let first = true;
	for (let k in obj) {
		if (obj[k] == null) {
			continue;
		}
		r += (first ? '?' : '&');
		r += k;
		r += '=';
		r += obj[k];
		first = false;
	}
	return r;
}


export {
	doTutorial, startReactTutorial, endReactTutorial,
	getInitialHelpState, markVisited, buildURL,
	HELP_HIDDEN, HELP_MINIMIZED, HELP_OPEN
}
