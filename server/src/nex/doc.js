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



class Doc extends NexContainer {
	constructor() {
		super();
		this.render();
	}

	makeCopy() {
		let r = new Doc();
		this.copyFieldsTo(r);
		return r;
	}

	getValueAsString() {
		let s = '';
		for (let i = 0; i < this.children.length; i++) {
			let c = this.children[i];
			if (c instanceof Line) {
				s += c.getValueAsString();
			} else {
				throw new EError('cannot convert doc to string, invalid format');
			}
		}
		return s;
	}

	toString() {
		return '{' + super.childrenToString() + '}';
	}

	getKeyContext() {
		return KeyContext.DOC;
	}

	getKeyFunnel() {
		return new DocKeyFunnel(this);
	}

	render() {
		super.render();
		this.domNode.classList.add('doc');
		this.domNode.classList.add('data');

	}
}
