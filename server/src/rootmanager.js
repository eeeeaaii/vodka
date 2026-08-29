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
import { RENDER_MODE_NORM } from './globalconstants.js'


class RootManager  {
	constructor() {
	}

	createNewRoot(args) {
		if (!args) {
			args = {};
		}
		if (!args.mode) {
			args.mode = RENDER_MODE_NORM;
		}
		if (!args.domNode) {
			args.domNode = document.getElementById(args.id ? args.id : 'vodkaroot');
		}
		let rootnex = new Root(true /* attached */);
		let root = new RenderNode(rootnex);
		root.setRenderMode(args.mode);
		root.setRenderDepth(0);
		document.vodkaroot = root; // for debugging in chrome dev tools
		root.setDomNode(args.domNode);
		rootnex.setDirtyForRendering(true);
		systemState.setRoot(root);
		return root;	
	}
}

const rootManager = new RootManager();

export { rootManager  }
