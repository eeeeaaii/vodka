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

import * as Utils from '../utils.js';

import { ContextType } from '../contexttype.js'
import { NexContainer } from './nexcontainer.js'
import { EError } from './eerror.js'
import { experiments } from '../globalappflags.js'
import { RENDER_FLAG_SHALLOW, RENDER_FLAG_EXPLODED } from '../globalconstants.js'
import { evaluateNexSafely } from '../evaluator.js'
import {
	RENDER_FLAG_INSERT_AFTER,
	RENDER_FLAG_INSERT_BEFORE,
	RENDER_FLAG_INSERT_INSIDE,
	RENDER_FLAG_INSERT_AROUND,
 } from '../globalconstants.js'


/**
 * Represents a line in a document.
 * @extends NexContainer
 */
class Line extends NexContainer {

	/**
	 * Creates a line.
	 */
	constructor() {
		super();
		this.pfstring = null;
		this.setHorizontal();
	}

	/** @override */
	getTypeName() {
		return '-line-';
	}

	makeCopy(shallow) {
		let r = new Line();
		this.copyChildrenTo(r, shallow);
		this.copyFieldsTo(r);
		return r;
	}

	toString(version) {
		if (version == 'v2') {
			return this.toStringV2();
		}
		return '[' + super.childrenToString() + ']';
	}

	toStringV2() {
		return `[${this.toStringV2Literal()}line]${this.toStringV2PrivateDataSection()}${this.listStartV2()}${this.toStringV2TagList()}${super.childrenToString('v2')}${this.listEndV2()}`;
	}

	prettyPrintInternal(lvl, hdir) {
		return this.standardListPrettyPrint(lvl, '[line]', hdir);
	}
	
	serializePrivateData(data) {
		return `${this.getCurrentStyle()}`;
	}

	deserializePrivateData(data) {
		this.setCurrentStyle(data);
	}

/*
	// maybe put this back if we want evaluating docs to do this

	evaluate(env) {
		if (!experiments.MUTABLES || this.mutable) {
			// shallow copy, then evaluate children.
			let linecopy = this.makeCopy(true);
			let iterator = null;
			this.doForEachChild(function(child) {
				let newchild = evaluateNexSafely(child, env);
				// we don't throw exceptions. We just embed them. We don't want to erase someone's doc
				// because they put bad code in it.
				iterator = linecopy.fastAppendChildAfter(child.evaluate(env), iterator);
			})
			return linecopy;
		} else {
			return this;
		}
	}
*/
	setMutable(val) {
		super.setMutable(val)
		// make doc-type children also have the same mutability
		this.doForEachChild(c => {
			if (Utils.isDocElement(c)) {
				c.setMutable(val);
			}
		})
	}

	toggleDir() {} // can only be horizontal
	setVertical() {}

	getValueAsString() {
		let s = '';
		this.doForEachChild(c => {
			if (c.getTypeName() == '-letter-') {
				s += c.getText();
			} else if (c.getTypeName() == '-separator-') {
				s += c.getText();
			} else if (c.getTypeName() == '-newline-') {
				s += '\n';
			} else if (c.getTypeName() == '-word-') {
				s += c.getValueAsString();
			} else {
				throw new EError('cannot convert line to string, invalid format');
			}
		});
		return s;
	}

	getKeyFunnelForContext(context) {
		if (context == KeyContext.DOC) {
			return new LineKeyFunnel(this);
		}
		return null;
	}

	setPfont(pfstring) {
		this.pfstring = pfstring;
		this.doForEachChild(function(c) {
			c.setPfont(pfstring);
		})
	}

	insertChildAt(c, i) {
		if (this.pfstring) {
			c.setPfont(this.pfstring);
		}
		super.insertChildAt(c, i);
	}

	getContextType() {
		if (this.isMutable()) {
			return ContextType.LINE;
		} else {
			return ContextType.IMMUTABLE_LINE;
		}
	}

	// deprecated
	getKeyFunnel() {
		return new LineKeyFunnel(this);
	}

	renderInto(renderNode, renderFlags, withEditor) {
		let domNode = renderNode.getDomNode();

		// let linespan = null;
		// if (experiments.MUTABLES && !(renderFlags & RENDER_FLAG_SHALLOW)) {
		// 	linespan = document.createElement("span");
		// 	linespan.classList.add('linespan');
		// 	domNode.appendChild(linespan);
		// }

		super.renderInto(renderNode, renderFlags, withEditor);
		domNode.classList.add('line');
		domNode.classList.add('data');
		if (renderFlags & RENDER_FLAG_INSERT_AFTER) {
			domNode.classList.add('rightinsert');
		} else if (renderFlags & RENDER_FLAG_INSERT_BEFORE) {
			domNode.classList.add('leftinsert');			
		} else if (renderFlags & RENDER_FLAG_INSERT_AROUND) {
			domNode.classList.add('topinsert');			
		} else if (renderFlags & RENDER_FLAG_INSERT_INSIDE) {
			domNode.classList.add('bottominsert');			
		}
		// weird
		let hasDocChild = false;
		for (let i = 0; i < this.numChildren() ;i++) {
			let c = this.getChildAt(i);
			if (Utils.isDocElement(c)) {
				hasDocChild = true;
				break;
			}
		}
		if ((!(renderFlags & RENDER_FLAG_EXPLODED)) && !hasDocChild) {
			domNode.classList.add('emptyline');
		} else {
			domNode.classList.remove('emptyline');
		}
		if (experiments.MUTABLES) {
			domNode.classList.add('newversionofline');
		}
	}

	getDefaultHandler() {
		return 'lineDefault';
	}

	getEventTable(context) {
		if (experiments.BETTER_KEYBINDINGS) {
			return {
				'ShiftSpace' : 'do-nothing',
				'Enter': 'do-line-break-or-eval',
				'Backspace': 'delete-line-v2',
			}
		} else {
			return {
				'ShiftBackspace': 'remove-selected-and-select-previous-leaf-v2',
				'Backspace': 'remove-selected-and-select-previous-leaf-v2',
				'Enter': 'do-line-break-from-line-v2',
				'ArrowUp': 'move-to-corresponding-letter-in-previous-line-v2',
				'ArrowDown': 'move-to-corresponding-letter-in-next-line-v2',
				'ArrowLeft': 'move-to-previous-leaf-v2',
				'ArrowRight': 'move-to-next-leaf-v2',
			}
		}
	}
}

export { Line }

