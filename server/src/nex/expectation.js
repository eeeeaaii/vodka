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



class Expectation extends NexContainer {
	constructor(hackfunction) {
		super()
		this.hackfunction = hackfunction;
		this.dotspan = document.createElement("span");
		this.dotspan.classList.add('dotspan');
		this.domNode.appendChild(this.dotspan);
		this.render();
	}

	render() {
		super.render();
		this.domNode.classList.add('expectation');
		if (this.renderType == NEX_RENDER_TYPE_EXPLODED) {
			this.dotspan.classList.add('exploded');
		} else {
			this.dotspan.classList.remove('exploded');
		}
		this.dotspan.innerHTML = '...';
	}

	makeCopy() {
		var r = new Expectation();
		this.makeCopyChildren(r);
		r.hackfunction = this.hackfunction;
		return r;
	}

	toString() {
		return '...';
	}

	isEmpty() {
		return true;
	}

	getKeyFunnel() {
		return new ExpectationKeyFunnel(this);
	}

	deleteLastLetter() {}

	appendText(txt) {}

	fulfill(newnex) {
		if (this.hackfunction) {
			newnex = this.hackfunction(newnex);
		}
		this.getParent().replaceChildWith(this, newnex);
		newnex.setSelected();
	}
}