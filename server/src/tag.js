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

import { contractEnforcer } from './contract.js';
import { EError } from './nex/eerror.js'
import { Editor } from './editors.js'

class Tag  {
	constructor(name) {
		// can't have backticks in tags
		this.name = name.replace('`', '');
	}

	getName() {
		return this.name;
	}

	equals(tag) {
		return this.name == tag.name;
	}

	toString() {
		return this.name;
	}

	addTagToNexWithEnforcement(nex) {
		if (nex.hasTag(this)) return; // nex also checks this but let's optimize I guess
		// check contract
		let errorMessage = contractEnforcer.enforce(this, nex);
		if (!errorMessage) {
			nex.addTag(this);
		} else {
			let e = new EError(errorMessage);
			e.appendChild(nex);
			throw e;
		}
	}

	draw(parentNode, isExploded) {
		this.tagDomNode = document.createElement("div");
		this.tagDomNode.classList.add('tag');
		if (isExploded) {
			this.tagDomNode.classList.add('exploded');
		}
		this.tagDomNode.innerHTML = this.name;
		parentNode.appendChild(this.tagDomNode);
	}

	copy() {
		let t = new Tag(this.name);
		return t;
	}
}

class TagEditor extends Editor {
	constructor(nex) {
		super(nex);
		this.editorDomNode = document.createElement("div");
		this.editorDomNode.classList.add('tag');
		this.editorDomNode.classList.add('tag-editing');
		this.editorDomNode.classList.add('exploded');
		this.tagText = '';
	}

	doBackspaceEdit() {
		this.tagText = this.tagText.substr(0, this.tagText.length - 1);
		this.editorDomNode.innerHTML = this.tagText;
	}

	doAppendEdit(text) {
		this.tagText = this.tagText + text;
		this.editorDomNode.innerHTML = this.tagText;			
	}

	shouldTerminate(text) {
		return super.shouldTerminate(text)
			|| text == '`';
	}

	hasContent() {
		return this.tagText != '';
	}

	shouldAppend(text) {
		return true;
	}

	finish() {
		super.finish();
		if (!this.tagText == '') {
			let tag = new Tag(this.tagText);
			tag.addTagToNexWithEnforcement(this.nex);
		}
	}

	postNode() {
		return this.editorDomNode;
	}
}

export { Tag, TagEditor  }

