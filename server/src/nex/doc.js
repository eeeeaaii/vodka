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

import { NexContainer } from './nexcontainer.js'
import { EError } from './eerror.js'
import { ContextType } from '../contexttype.js'

class Doc extends NexContainer {
	constructor() {
		super();
	}

	toString(version) {
		if (version == 'v2') {
			return this.toStringV2();
		}
		return '{' + super.childrenToString() + '}';
	}

	toStringV2() {
		return `[doc]${this.listStartV2()}${this.toStringV2TagList()}${super.childrenToString('v2')}${this.listEndV2()}`;
	}

	getTypeName() {
		return '-doc-';
	}

	makeCopy(shallow) {
		let r = new Doc();
		this.copyChildrenTo(r, shallow);
		this.copyFieldsTo(r);
		return r;
	}

	getValueAsString() {
		let s = '';
		let index = 0;
		this.doForEachChild(c => {
			index++;
			if (c.getTypeName() == '-line-') {
				s += c.getValueAsString();
			} else {
				throw new EError(`We are trying to convert this document`
					+ ` to a string, but we can't, because `
					+ ` the document has a child that's not a Line.`
					+ ` A document normally should contain only Lines.`
					+ ` Instead, this document has an object of type ${c.getTypeName()}`
					+ ` at position ${index}. If it helps, we can give the`
					+ ` textual representation of that object as ${c.debugString()}`);
			}
		});
		return s;
	}

	getContextType() {
		return ContextType.DOC;
	}

	renderInto(renderNode, renderFlags) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags);
		domNode.classList.add('doc');
		domNode.classList.add('data');
	}

	getDefaultHandler() {
		return 'docHandle';
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

export { Doc }

