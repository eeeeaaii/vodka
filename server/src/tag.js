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

/**
 * Represents a tag.
 */
class Tag  {
	constructor(name) {
		// can't have backticks in tags
		this.name = name.replace(/\`/g, '');
		this.isEditing = false;
		this.isGhost = false;
	}

	copy() {
		let r = new Tag(this.name);
		r.isEditing = this.isEditing;
		r.isGhost = this.isGhost;
		return r;
	}

	setName(text) {
		this.name = text;
	}

	setIsEditing(val) {
		this.isEditing = val;
	}

	setIsGhost(val) {
		this.isGhost = val;
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


	draw(parentNode, isExploded) {
		this.tagDomNode = document.createElement("div");
		this.tagDomNode.classList.add('tag');
		if (isExploded) {
			this.tagDomNode.classList.add('exploded');
		}
		if (this.isEditing) {
			this.tagDomNode.classList.add('tag-editing');
		}
		if (this.isGhost) {
			this.tagDomNode.classList.add('tag-ghost');
		}
		this.tagDomNode.innerHTML = this.name;
		parentNode.appendChild(this.tagDomNode);
	}

	copy() {
		let t = new Tag(this.name);
		return t;
	}
}

export { Tag  }

