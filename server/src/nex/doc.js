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
	}

	getTypeName() {
		return '-doc-';
	}

	makeCopy(shallow) {
		let r = new Doc();
		this.copyFieldsTo(r);
		this.copyChildrenTo(r, shallow);
		return r;
	}

	getValueAsString() {
		let s = '';
		this.doForEachChild(c => {
			if (c instanceof Line) {
				s += c.getValueAsString();
			} else {
				throw new EError('cannot convert doc to string, invalid format');
			}
		});
		return s;
	}

	toString() {
		return '{' + super.childrenToString() + '}';
	}

	getContextType() {
		return ContextType.DOC;
	}

	getKeyFunnel() {
		return new DocKeyFunnel(this);
	}

	renderInto(renderNode, renderFlags) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags);
		domNode.classList.add('doc');
		domNode.classList.add('data');
	}

	defaultHandle(txt) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);
		if (isSeparator) {
			KeyResponseFunctions['append-separator-to-doc'](txt);
		} else {
			KeyResponseFunctions['append-letter-to-doc'](txt);
		}
		return true;
	}

	getEventTable(context) {
		return {
			'Enter': 'do-line-break-always',
			// wha
			'(': 'insert-word-as-next-sibling',
			'[': 'insert-line-as-next-sibling',
			'{': 'insert-doc-as-next-sibling',
		}
	}
}
