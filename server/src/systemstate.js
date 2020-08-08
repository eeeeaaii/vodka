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

// any system state that isn't in BINDINGS or BUILTINS,
// i.e. intrinsic engine state that is non-user-visible

class SystemState {
	constructor() {
		this.selectedNode = null;
		this.current_default_render_flags = 0; // should be Vodka.RENDER_FLAG_NORMAL;
		this.renderPassNumber = 0;
		this.overrideOnNextRender = false;
		this.selectWhenYouFindIt = null;
	}

	setGlobalSelectedNode(newNode) {
		this.selectedNode = newNode;
	}

	getGlobalSelectedNode() {
		return this.selectedNode;
	}

	setGlobalCurrentDefaultRenderFlags(f) {
		this.current_default_render_flags = f;
	}

	getGlobalCurrentDefaultRenderFlags() {
		return this.current_default_render_flags;
	}

	setGlobalSelectWhenYouFindIt(node) {
		this.selectWhenYouFindIt = node;
	}

	getGlobalSelectWhenYouFindIt() {
		return this.selectWhenYouFindIt;
	}

	setGlobalOverrideOnNextRender(t) {
		this.overrideOnNextRender = t;
	}

	getGlobalOverrideOnNextRender() {
		return this.overrideOnNextRender;
	}

	setGlobalRenderPassNumber(n) {
		this.renderPassNumber = n;
	}

	getGlobalRenderPassNumber() {
		return this.renderPassNumber;
	}

}

const systemState = new SystemState();

export { systemState }