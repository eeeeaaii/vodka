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
import { experiments } from '../globalappflags.js'

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

	prettyPrintInternal(lvl) {
		return this.standardListPrettyPrint(lvl, '[doc]');
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
			if (c.getTypeName() == '-line-') {
				if (index > 0) {
					s += '\n';
				}
				s += c.getValueAsString();
			} else {
				throw new EError(`Cannot convert doc to string, incorrect doc format (at line ${index}, has ${c.debugString()}). Sorry!`);
			}
			index++;
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

	doTabHack() {
		this.dotabhack = 2;
	}

	getEventTable(context) {
		if (experiments.V2_INSERTION) {
			if (experiments.V2_INSERTION_TAB_HACK) {
				if (this.dotabhack) {
					this.dotabhack--;
				}				
			}
			return {
				'Enter': 'do-line-break-always',
			}
		} else {
			return {
				'Enter': 'do-line-break-always',
				'(': 'insert-word-as-next-sibling',
				'[': 'insert-line-as-next-sibling',
				'{': 'insert-doc-as-next-sibling',
			}
		}
	}
}

export { Doc }

