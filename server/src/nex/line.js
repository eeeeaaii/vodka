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



class Line extends NexContainer {
	constructor() {
		super();
		this.render();
	}

	makeCopy() {
		let r = new Line();
		this.copyFieldsTo(r);
		return r;
	}

	toString() {
		return '[' + super.childrenToString() + ']';
	}

	getValueAsString() {
		let s = '';
		for (let i = 0; i < this.children.length; i++) {
			let c = this.children[i];
			if (c instanceof Letter) { // erm the space character is a letter ugh
				s += c.getText();
			} else if (c instanceof Word) {
				s += c.getValueAsString();
			} else {
				throw new EError('cannot convert line to string, invalid format');
			}
		}
		return s;
	}

	getKeyFunnelForContext(context) {
		if (context == KeyContext.DOC) {
			return new LineKeyFunnel(this);
		}
		return null;
	}

	// deprecated
	getKeyFunnel() {
		return new LineKeyFunnel(this);
	}

	render() {
		super.render();
		this.domNode.classList.add('line');
		this.domNode.classList.add('data');
	}
}
