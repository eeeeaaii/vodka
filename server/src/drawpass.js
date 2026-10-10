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

/*
Running the draw functions, before anything is drawn.

An org can say what it looks like, with a `:draw` member whose result becomes
its first child wearing the `:rendered` tag. Producing that result is
evaluation: it allocates, it can settle a deferred, it can fail. None of those
belong in a render pass, where asking for a render is how several of them
report themselves -- a render that evaluates is a render that asks for the
render that asks again, which is a tab that never comes back.

So drawing happens here instead, to completion, before the render pass starts.
By the time anything is painted, every drawing is a plain nex sitting in the
tree, and rendering is only rendering.

Each org is drawn at most once per pass. A draw function that writes to its own
org therefore redraws on the next pass rather than spinning on this one, and an
org that has gone stale while this pass was running is picked up by the render
its own change asked for.

(comment by Claude)
*/

const MAX_DEPTH = 100;

function doDrawPass() {
	let root = systemState.getRoot();
	if (!root) return;
	refreshDrawings(root.getNex(), new Set(), 0);
}

function refreshDrawings(nex, seen, depth) {
	if (!nex || depth > MAX_DEPTH || seen.has(nex)) return;
	seen.add(nex);
	if (Utils.isOrg(nex) && nex.getDrawFunction && nex.getDrawFunction()
			&& nex.shouldDraw()) {
		nex.refreshDrawing();
	}
	/*
	Into the drawing as well as into everything else, because a drawing can
	have a drawn org in it -- a row of buttons each of which draws itself. The
	drawing is an ordinary child, so this is the same walk either way; it is
	worth saying only because the drawing it walks into may have been made a
	moment ago by the call above.

	(comment by Claude)
	*/
	if (!nex.isNexContainer()) return;
	nex.doForEachChild(function(c) {
		refreshDrawings(c, seen, depth + 1);
	});
}

export { doDrawPass }
