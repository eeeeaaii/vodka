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

import { systemState } from './systemstate.js'

const UNDO_LIMIT = 10;

class Undo {
	constructor() {
		this.undobuffer = [];
		this.selectedNodeIdBuffer = [];
	}

	canUndo() {
		return this.undobuffer.length > 0;
	}

	saveStateForUndo(nex) {
		this.undobuffer.unshift(nex.makeCopy());
		let selectedNode = systemState.getGlobalSelectedNode();
		let selectedNodeId = selectedNode.getNex().getID();		
		this.selectedNodeIdBuffer.unshift(selectedNodeId);
		if (this.undobuffer.length > UNDO_LIMIT) {
			this.undobuffer.pop();
		}
	}

	eraseLastSavedState() {
		this.undobuffer.shift();
	}

	performUndo() {
		let r = this.undobuffer.shift();
		let idToSelect = this.selectedNodeIdBuffer.shift();

		var newRoot = new RenderNode(r);
		let rootDomNode = document.getElementById('mixroot');
		newRoot.setDomNode(rootDomNode);	
		systemState.setRoot(newRoot);

		// the id will actually be in copiedFromID
		newRoot.doOnRenderNodeTree(function(node) {
			if (node.getNex().copiedFromID == idToSelect) {
				node.setSelected();
				return true; // stops processing
			} else {
				return false;
			}
		});
	}
}

const undo = new Undo();

export { undo }