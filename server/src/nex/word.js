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
import { ContextType } from '../contexttype.js'
import { experiments } from '../globalappflags.js'
import { evaluateNexSafely } from '../evaluator.js'


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
		return `[word]${this.toStringV2PrivateDataSection()}${this.listStartV2()}${this.toStringV2TagList()}${super.childrenToString('v2')}${this.listEndV2()}`;
	}

 	prettyPrintInternal(lvl, hdir) {
		return this.standardListPrettyPrint(lvl, '[word]', hdir);
	}

	evaluate(env) {
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
	}


	toggleDir() {} // can only be horizontal
	setVertical() {}

	getContextType() {
		return ContextType.WORD;
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
		super.renderInto(renderNode, renderFlags, withEditor);
		domNode.classList.add('word');
		domNode.classList.add('data');
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


	getEventOverrides() {
		return {
			'ShiftBackspace': 'remove-selected-and-select-previous-leaf-v2',
			'Backspace': 'remove-selected-and-select-previous-leaf-v2'
		}
	}

	getDefaultHandler() {
		return 'insertAtWordLevel';
	}

	getEventTable(context) {
		return {
			'Enter': 'do-line-break-always',
			'ArrowUp': 'move-to-corresponding-letter-in-previous-line',
			'ArrowDown': 'move-to-corresponding-letter-in-next-line',
		}
	}
}

export { Word }

