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

import { RENDER_FLAG_NORMAL } from './globalconstants.js'

class SystemState {
	constructor() {
		this.selectedNode = null;
		this.current_default_render_flags = RENDER_FLAG_NORMAL;
		this.renderPassNumber = 0;
		this.overrideOnNextRender = false;
		this.selectWhenYouFindIt = null;
		this.root = null;
		this.key_funnel_active = true;
		this.stackLevel = 0;
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

	getRoot() {
		return this.root;
	}

	setRoot(r) {
		this.root = r;
	}

	isKeyFunnelActive() {
		return this.key_funnel_active;
	}

	setKeyFunnelActive(val) {
		this.key_funnel_active = val;
	}

	resetStack() {
		this.stackLevel = 0;
	}

	pushStackLevel() {
		this.stackLevel++;
	}

	popStackLevel() {
		this.stackLevel--;
	}

	stackCheck() {
		if (this.stackLevel > 10000) {
			throw new Error('stack overflow');
		}
	}
}

// This function is here because it depends on stacklevel, which is stored here, no other reason
function INDENT() {
	let s = '';
	for (var i = 0; i < systemState.stackLevel; i++) {
		s = s + '  ';
	}
	return s;
}

const systemState = new SystemState();

export { systemState, INDENT }