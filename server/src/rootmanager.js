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
import { Root } from './nex/root.js'
import { systemState } from './systemstate.js'
import {
	RENDER_MODE_EXPLO,
	RENDER_MODE_NORM
} from './globalconstants.js'


/**
 * The hidden root controller is used for the awkward situation where we want to be
 * able to get information about a nex that pertains to the way it will be rendered
 * (for example, its width and height). Nexes are technically in a lower-level-layer
 * than the rendering code, so in some cases you might ask for rendering info about
 * a nex that *has never been rendered*. So, to get that information, it has to be
 * rendered in "secret" (invisibly).
 */
class RootManager  {
	constructor() {
	}

	// This is currently unused, instead get-pixel-height and get-pixel-width just return
	// zero if something's never been rendered -- fine for now but we might bring
	// back this class at some point?

	createNewRoot(args) {
		if (!args) {
			args = {};
		}
		if (!args.mode) {
			args.mode = RENDER_MODE_NORM;
		}
		if (!args.id) {
			args.id = 'vodkaroot';
		}
		let rootnex = new Root(true /* attached */);
		let root = new RenderNode(rootnex);
		root.setRenderMode(args.mode);
		root.setRenderDepth(0);
		document.vodkaroot = root; // for debugging in chrome dev tools
		let rootDomNode = document.getElementById(args.id);
		root.setDomNode(rootDomNode);
		rootnex.setDirtyForRendering(true);
		systemState.setRoot(root);
		return root;	
	}

	renderInHiddenRoot(nex, rendermode) {
		let wasDirty = nex.getDirtyForRendering();
		let hiddenRoot = this.createNewRoot({
			mode: rendermode,
			id: 'hiddenroot'
		})

		// render pass has to monotonically increase but it can skip, so when this is
		// called, the main (visible) render pass number will skip numbers.
		systemState.setGlobalRenderPassNumber(systemState.getGlobalRenderPassNumber() + 1);
		// has to be synchronous so we can measure
		hiddenRoot.render();
		// if it was dirty before, re-dirty it
		nex.setDirtyForRendering(wasDirty);
		return nex.getRenderNodes()[0];
	}
}

const rootManager = new RootManager();

export { rootManager  }

