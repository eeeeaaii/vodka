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



class ValueNex extends Nex {
	constructor(val, prefix, className) {
		super();
		this.value = '' + val;
		this.prefix = prefix;
		this.className = className;
	}

	isEmpty() {
		return this.value == '';
	}

	toString() {
		return '' + this.prefix + this.value;
	}

	getKeyFunnel() {
		return new ValueKeyFunnel(this);
	}

	renderValue() {
		return this.value;
	}

	render(parentDomNode, thisDomNode) {
		super.render(parentDomNode, thisDomNode);
		this.domNode.classList.add(this.className);
		this.domNode.classList.add('valuenex');
		this.domNode.innerHTML = '' + this.prefix + this.renderValue();
		this.renderTags();
	}

	getTypedValue() {
		return this.value;
	}

	setValue(v) {
		this.value = v;
		if (!DEFER_DRAW) {
			this.render();
		}
	}

	deleteLastLetter() {
		let v = this.value;
		if (v == '') return;
		v = v.substr(0, v.length - 1);
		this.value = v;
		if (!DEFER_DRAW) {
			this.render();
		}
	}

	appendText(txt) {
		let v = this.value;
		v = v + txt;
		this.value = v;
		if (!DEFER_DRAW) {
			this.render();
		}
	}
}
