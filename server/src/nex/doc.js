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

import * as Utils from '../utils.js'

import { NexContainer } from './nexcontainer.js'
import { EError } from './eerror.js'
import { ContextType } from '../contexttype.js'
import { experiments } from '../globalappflags.js'
import { evaluateNexSafely } from '../evaluator.js'
import { RENDER_FLAG_SHALLOW, RENDER_FLAG_EXPLODED, CONSOLE_DEBUG } from '../globalconstants.js'

/**
 * Represents a document with text in it.
 */
class Doc extends NexContainer {
	constructor() {
		super();
		this.pfstring = null;
		this.setVertical();
	}

	toString(version) {
		if (version == 'v2') {
			return this.toStringV2();
		}
		return '{' + super.childrenToString() + '}';
	}

	toStringV2() {
		return `[${this.toStringV2Literal()}doc]${this.toStringV2PrivateDataSection()}${this.listStartV2()}${this.toStringV2TagList()}${super.childrenToString('v2')}${this.listEndV2()}`;
	}

	toggleDir() {} // can only be vertical
	setHorizontal() {}

	prettyPrintInternal(lvl, hdir) {
		return this.standardListPrettyPrint(lvl, '[doc]', hdir);
	}

	setPfont(pfstring) {
		this.pfstring = pfstring;
		this.doForEachChild(function(c) {
			c.setPfont(pfstring);
		})
	}

	serializePrivateData(data) {
		return `${this.getCurrentStyle()}`;
	}

	deserializePrivateData(data) {
		this.setCurrentStyle(data);
	}

	insertChildAt(c, i) {
		if (this.pfstring) {
			c.setPfont(this.pfstring);
		}
		super.insertChildAt(c, i);
	}

	getTypeName() {
		return '-page-';
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

/*
	// maybe put this back if we want evaluating docs to do this

	evaluate(env) {
		if (!experiments.MUTABLES || this.mutable) {
			// shallow copy, then evaluate children.
			let doccopy = this.makeCopy(true);
			let iterator = null;
			this.doForEachChild(function(child) {
				let newchild = evaluateNexSafely(child, env);
				// we don't throw exceptions. We just embed them. We don't want to erase someone's doc
				// because they put bad code in it.
				iterator = doccopy.fastAppendChildAfter(child.evaluate(env), iterator);
			})
			return doccopy;
		} else {
			return this;
		}
	}
*/

	getContextType() {
		if (this.isMutable()) {
			return ContextType.DOC;
		} else {
			return ContextType.IMMUTABLE_DOC;
		}
	}

	renderInto(renderNode, renderFlags, withEditor) {
		let domNode = renderNode.getDomNode();
		// let docspan = null;
		// if (experiments.MUTABLES && !(renderFlags & RENDER_FLAG_SHALLOW)) {
		// 	docspan = document.createElement("span");
		// 	docspan.classList.add('docspan');
		// 	domNode.appendChild(docspan);
		// }
		super.renderInto(renderNode, renderFlags, withEditor);
		domNode.classList.add('doc');
		domNode.classList.add('data');
		if (experiments.MUTABLES) {
			domNode.classList.add('newdoc');
		}

		// if (experiments.MUTABLES && !(renderFlags & RENDER_FLAG_SHALLOW)) {
		// 	if (renderFlags & RENDER_FLAG_EXPLODED) {
		// 		docspan.classList.add('exploded');
		// 	} else {
		// 		docspan.classList.remove('exploded');
		// 	}
		// }
	}

	setMutable(val) {
		super.setMutable(val)
		// make doc-type children also have the same mutability
		this.doForEachChild(c => {
			if (Utils.isDocElement(c)) {
				c.setMutable(val);
			}
		})
	}

	getDefaultHandler() {
		return 'docDefault';
	}

	getEventTable(context) {
		if (experiments.BETTER_KEYBINDINGS) {
			return {
				'ShiftSpace' : 'do-nothing',
			}			
		} else {
			return {
				'Enter': 'do-line-break-always',
			}			
		}
	}
}

export { Doc }

