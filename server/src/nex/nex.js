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



class Nex {
	constructor() {
		this.domNode = document.createElement("div");
		this.domNode.onclick = (e) => {
			this.setSelected();
			e.stopPropagation();
		}
		this.domNode.classList.add('nex');
		this.parent = null;
		this.selected = false;
		this.renderType = current_render_type;
		this.keyfunnel = null;
		this.currentStyle = "";
	}

	copyFieldsTo(nex) {
		nex.currentStyle = this.currentStyle;
	}

	needsEvaluation() {
		return false;
	}

	evaluate(env) {
		return this;
	}

	stepEvaluate(env) {
		return this;
	}

	makeCopy() {
		throw new Error("unimplemented copy");
	}

	exportToString() {
		throw new Error("unimplemented export to string");
	}

	getLeftX() {
		return this.domNode.getBoundingClientRect().left;
	}

	getRightX() {
		return this.domNode.getBoundingClientRect().right;
	}

	setCurrentStyle(s) {
		this.currentStyle = s;
	}

	getCurrentStyle() {
		return this.currentStyle;
	}

	toString() {}

	debugString() {
		return this.toString();
	}

	setRenderType(newType) {
		this.renderType = newType;
	}

	getInputFunnel() {
		if (!this.keyfunnel) {
			this.keyfunnel = this.getKeyFunnel();
		}
		return this.keyfunnel;
	}

	getKeyFunnel() {}

	getPositionInParent() {
		var p = this.getParent();
		if (!p) return -1;
		for (var i = 0; i < p.children.length; i++) {
			if (p.children[i] == this) {
				return i;
			}
		}
	}

	render() {
		if (this.selected) {
			this.domNode.classList.add('selected');		
		} else {
			this.domNode.classList.remove('selected');
		}
		if (this.renderType == NEX_RENDER_TYPE_EXPLODED) {
			this.domNode.classList.add('exploded');
		} else {
			this.domNode.classList.remove('exploded');
		}
		this.domNode.setAttribute("style", this.currentStyle);
	}

	setParent(p) {
		this.parent = p;
	}

	getParent(evenIfRoot) {
		var p = this.parent;
		if (p instanceof Root && !evenIfRoot) {
			return null;
		}
		return this.parent;
	}

	isLeaf() {
		return true;
	}

	isSelected() {
		return this.selected;
	}

	setSelected() {
		if (selectedNex) {
			selectedNex.setUnselected();
		}
		selectedNex = this;
		this.selected = true;
		this.render();
	}

	setUnselected() {
		this.selected = false;
		this.render();
	}
}


