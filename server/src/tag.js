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

import { heap } from './heap.js'

/**
 * Represents a tag.
 */
class Tag  {
	constructor() {
		this.tagString = '';
		this.isEditing = false;
		this.isGhost = false;
	}

	// TODO: figure out a way to signal failure when
	// a tag is copied and there isn't enough memory for the copy.
	// because of the dependency structure I can't import eerror here,
	// so I can't throw an error :(
	copy() {
		if (heap.requestMem(this.memUsed())) {
			let r = new Tag();
			r.tagString = this.tagString;
			r.isEditing = this.isEditing;
			r.isGhost = this.isGhost;
			return r;
		} else {
			throw Error('CONVERT TO EERROR: Could not allocate memory for copy of tag.');
		}
	}

	// this is only called in two places:
	// 1. the tag editor
	// 2. at tag creation time in newTagOrThrowOOM
	// so tags are de facto immutable however I feel like this isn't the most secure situation
	// so should get rid of this method and have the tag editor just create new tag objects every time
	setTagString(text) {
		// no backticks allowed
		text = text.replace(/\`/g, '');
		if (this.tagString) {
			heap.freeMem(this.tagString.length * heap.incrementalSizeString());
		}
		if (!heap.requestMem(text.length * heap.incrementalSizeString())) {
			return false;
		}
		this.tagString = text;
		return true;
	}

	setIsEditing(val) {
		this.isEditing = val;
	}

	setIsGhost(val) {
		this.isGhost = val;
	}

	getTagString() {
		return this.tagString;
	}

	equals(tag) {
		return this.tagString == tag.tagString;
	}

	toString() {
		return this.tagString;
	}

	memUsed() {
		return heap.incrementalSizeString() * this.tagString.length;
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
		this.tagDomNode.innerHTML = this.tagString;
		parentNode.appendChild(this.tagDomNode);
	}

}

export { Tag  }

