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

class Tag  {
	constructor(name) {
		this.name = name;
	}

	getName() {
		return this.name;
	}

	equals(tag) {
		return this.name == tag.name;
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

class TagEditor {
	constructor(nex) {
		this.editorDomNode = document.createElement("div");
		this.editorDomNode.classList.add('tag');
		this.editorDomNode.classList.add('tag-editing');
		this.editorDomNode.classList.add('exploded');
		this.tagText = '';
		this._isEditing = false;
		this.nex = nex;
	}

	finish() {
		let tag = new Tag(this.tagText);
		// TODO: implement contract enforcing.
		// if (contractEnforcer.enforce(tag, this.nex)) {
			this.nex.addTag(new Tag(this.tagText));
		// } else {
		// 	this.nex.addTag(new Tag(`[TAG ERROR: cannot add tag ${tag.getName()} to this nex, does not satisfy contract.]`));
		// }

		this._isEditing = false;

	}

	routeKey(text) {
		if (text == 'Enter') {
			this.finish();
			return false;
		} else if (text == 'Tab') {
			this.finish();
			return true;
		} else if (text == 'Backspace') {
			this.tagText = this.tagText.substr(0, this.tagText.length - 1);
			this.editorDomNode.innerHTML = this.tagText;			
		} else if (/^.$/.test(text)) {
			this.tagText = this.tagText + text;
			this.editorDomNode.innerHTML = this.tagText;			
		}
		return false;
	}

	startEditing() {
		this._isEditing = true;
	}

	isEditing() {
		return this._isEditing;
	}

	postNode() {
		return this.editorDomNode;
	}

	preNode() {
		return null;
	}
}

export { Tag, TagEditor  }

