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


import { NexContainer } from './nexcontainer.js'
import { ContextType } from '../contexttype.js'
import { experiments } from '../globalappflags.js'
import { evaluateNexSafely } from '../evaluator.js'
import {
	RENDER_FLAG_INSERT_AFTER,
	RENDER_FLAG_INSERT_BEFORE,
	RENDER_FLAG_INSERT_INSIDE,
	RENDER_FLAG_INSERT_AROUND,
 } from '../globalconstants.js'
import { RENDER_FLAG_SHALLOW, RENDER_FLAG_EXPLODED } from '../globalconstants.js'



class Word extends NexContainer {
	constructor() {
		super();
		this.pfstring = null;
		this.setHorizontal();
	}

	getTypeName() {
		return '-word-';
	}

	makeCopy(shallow) {
		let r = new Word();
		this.copyChildrenTo(r, shallow);
		this.copyFieldsTo(r);
		return r;
	}

	toString(version) {
		if (version == 'v2') {
			return this.toStringV2();
		}
		return '(' + super.childrenToString() + ')';
	}

	toStringV2() {
		return `[${this.toStringV2Literal()}word]${this.toStringV2PrivateDataSection()}${this.listStartV2()}${this.toStringV2TagList()}${super.childrenToString('v2')}${this.listEndV2()}`;
	}

 	prettyPrintInternal(lvl, hdir) {
		return this.standardListPrettyPrint(lvl, '[word]', hdir);
	}

/*
	// maybe put this back if we want evaluating docs to do this

	evaluate(env) {
		if (!experiments.MUTABLES || this.mutable) {
			// shallow copy, then evaluate children.
			let wordcopy = this.makeCopy(true);
			let iterator = null;
			this.doForEachChild(function(child) {
				let newchild = evaluateNexSafely(child, env);
				// we don't throw exceptions. We just embed them. We don't want to erase someone's doc
				// because they put bad code in it.
				iterator = wordcopy.fastAppendChildAfter(child.evaluate(env), iterator);
			})
			return wordcopy;
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

	getContextType() {
		if (this.isMutable()) {
			return ContextType.WORD;
		} else {
			return ContextType.IMMUTABLE_WORD;
		}
	}

	getValueAsString() {
		let s = '';
		this.doForEachChild(function(c) {
			if (!(c.getTypeName() == '-letter-')) {
				throw new EError('cannot convert word to string, invalid format');
			}
			s += c.getText();
		})
		return s;
	}

	getKeyFunnel() {
		return new WordKeyFunnel(this);
	}

	serializePrivateData(data) {
		return `${this.getCurrentStyle()}`;
	}

	deserializePrivateData(data) {
		this.setCurrentStyle(data);
	}



	renderInto(renderNode, renderFlags, withEditor) {
		let domNode = renderNode.getDomNode();

		let wordspan = null;
		// if (experiments.MUTABLES && !(renderFlags & RENDER_FLAG_SHALLOW)) {
		// 	wordspan = document.createElement("span");
		// 	wordspan.classList.add('wordspan');
		// 	domNode.appendChild(wordspan);
		// }

		super.renderInto(renderNode, renderFlags, withEditor);
		domNode.classList.add('word');
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
		if (experiments.MUTABLES) {
			domNode.classList.add('newword');
		}

		// if (experiments.MUTABLES && !(renderFlags & RENDER_FLAG_SHALLOW)) {
		// 	if (renderFlags & RENDER_FLAG_EXPLODED) {
		// 		wordspan.classList.add('exploded');
		// 	} else {
		// 		wordspan.classList.remove('exploded');
		// 	}
		// }
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

	getDefaultHandler() {
		return 'wordDefault';
	}

	getEventTable(context) {
		if (experiments.BETTER_KEYBINDINGS) {
			return {
				'ShiftSpace' : 'do-nothing',
			}
		} else {
			return {
				'Enter': 'do-line-break-always',
				'ArrowUp': 'move-to-corresponding-letter-in-previous-line-v2',
				'ArrowDown': 'move-to-corresponding-letter-in-next-line-v2',
			}
		}
	}
}

export { Word }

