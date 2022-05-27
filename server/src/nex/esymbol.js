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

import { ValueNex } from './valuenex.js'
import { CONSOLE_DEBUG } from '../globalconstants.js'
import { INDENT, systemState } from '../systemstate.js'
import { Editor } from '../editors.js'
import { autocomplete } from '../autocomplete.js'


/**
 * Represents a symbol.
 */
class ESymbol extends ValueNex {
	constructor(val) {
		super((val) ? val.replace(/--/g, ' ') : '', '@', 'esymbol')
		this.searchingOn = null;
		this.previousMatch = null;
	}

	/** @override */
	getTypeName() {
		return '-symbol-';
	}

	/** @override */
	makeCopy() {
		let r = new ESymbol(this.getTypedValue());
		this.copyFieldsTo(r);
		return r;
	}

	/** @override */
	toString(version) {
		if (version == 'v2') {
			return this.toStringV2();
		}
		return super.toString(version);
	}

	/** @override */
	toStringV2() {
		let val = this.value.replace(/ /g, '--')
		return `@${this.toStringV2Literal()}${this.toStringV2TagList()}${val}`;
	}

	/** @override */
	needsEvaluation() {
		return true;
	}

	renderValue() {
		return this.value;
	}

	pushNexPhase(phaseExecutor, env) {
	 	phaseExecutor.pushPhase(new SymbolLookupPhase(this, env));
	}

	getAsString() {
		return '' + this.value;
	}

	getKeyFunnel() {
		return new SymbolKeyFunnel(this);
	}

	setValue(v) {
		super.setValue(v);
		this.searchingOn = null;
		this.previousMatch = null;
	}


	appendText(txt) {
		super.appendText(txt);
		this.searchingOn = null;
		this.previousMatch = null;
	}

	deleteLastLetter() {
		super.deleteLastLetter();
		this.searchingOn = null;
		this.previousMatch = null;
	}

	autocomplete() {
		let searchText = this.searchingOn ? this.searchingOn : this.getAsString();
		let match = autocomplete.findNextMatchAfter(searchText, this.previousMatch);
		if (match) {
			this.setValue(match.name);
			this.searchingOn = searchText;
			this.previousMatch = match;
		}
	}

	evaluate(env) {
		systemState.pushStackLevel();
		let b = env.lookupBinding(this.getTypedValue());
		if (this.hasTags()) {
			b = b.makeCopy();
			for (let i = 0; i < this.numTags(); i++) {
				b.addTag(this.getTag(0));
			}
		}
		if (CONSOLE_DEBUG) {
			console.log(`${INDENT()}symbol ${this.value} bound to ${b.debugString()}`);
		}
		systemState.popStackLevel();
		return b;
	}

	renderInto(renderNode, renderFlags, withEditor) {
		super.renderInto(renderNode, renderFlags, withEditor);
		let domNode = renderNode.getDomNode();
		if (this.isEditing) {
			domNode.classList.add('editing');
		} else {
			domNode.classList.remove('editing');
		}
	}


	getDefaultHandler() {
		return 'standardDefault';
	}

	getEventTable(context) {
		return {
			'AltSpace': 'autocomplete'
		};
	}
}

class ESymbolEditor extends Editor {
	constructor(nex) {
		super(nex, 'ESymbolEditor');
	}

	getStateForUndo() {
		return this.nex.getValue();
	}

	setStateForUndo(val) {
		this.nex.setValue(val);
	}

	hasContent() {
		return this.nex.getValue() != '';
	}

	doBackspaceEdit() {
		this.nex.deleteLastLetter();
	}

	startEditing() {
		super.startEditing();
		this.oldVal = this.nex.getValue();
	}

	abort() {
		this.nex.setValue(this.oldVal);
	}

	hasContent() {
		return this.nex.getValue() != '';
	}

	doAppendEdit(text) {
		this.nex.appendText(text);
	}

	shouldAppend(text) {
		let firstLetter = (this.nex.getValue().length == 0);
		if (firstLetter) {
			return /^[a-zA-Z:. _-]$/.test(text);
		} else {
			return /^[a-zA-Z0-9:. _-]$/.test(text);
		}
	}

	shouldTerminateAndReroute(text) {
		return super.shouldTerminateAndReroute()
			|| !this.shouldAppend(text);
	}
}


export { ESymbol, ESymbolEditor }

