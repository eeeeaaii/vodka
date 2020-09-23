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
import * as Utils from '../utils.js'

class Tag  {
	constructor(name) {
		// can't have backticks in tags
		this.name = name.replace('`', '');
		this.isEditing = false;
	}

	setName(text) {
		this.name = text;
	}

	setIsEditing(val) {
		this.isEditing = val;
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

	checkForContractError(nex) {
		let errorMessage = contractEnforcer.enforce(this, nex);
		if (errorMessage) {
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
		if (this.isEditing) {
			this.tagDomNode.classList.add('tag-editing');
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
		super(nex, 'TagEditor');
		this.managedTag = new Tag('');
		this.managedTag.setIsEditing(true);
		this.nex = nex;
		this.previousValue = null; // only used if you arrow around
		nex.addTag(this.managedTag);
	}

	doBackspaceEdit() {
		if (this.managedTag.getName() == '') {
			// this should never be null because of the check in shouldBackspace
			let newManagedTag = this.nex.getTagBefore(this.managedTag);
			this.nex.removeTag(this.managedTag);
			this.manageNewTag(newManagedTag);
		} else {
			let oldval = this.managedTag.getName();
			let newval = oldval.substr(0, oldval.length - 1);
			this.managedTag.setName(newval);
		}
	}

	doAppendEdit(text) {
		let oldval = this.managedTag.getName();
		let newval = oldval + '' + text;
		this.managedTag.setName(newval);
	}

	shouldTerminate(text) {
		return super.shouldTerminate(text)
			|| text == '`';
	}

	shouldBackspace(text) {
		// if the tag is empty and you backspace,
		// but there is a tag BEFORE this tag,
		// we go to it
		return text == 'Backspace'
			&& 
			( this.hasContent()
				|| this.nex.getTagBefore(this.managedTag)); 
	}

	hasContent() {
		return this.managedTag.getName() != '';
	}

	shouldAppend(text) {
		// append if a single character, otherwise it's special
		return (/^.$/.test(text));
	}

	manageNewTag(newManagedTag) {
		this.managedTag = newManagedTag;
		newManagedTag.setIsEditing(true);
		this.previousValue = newManagedTag.getName();
	}

	performSpecialProcessing(text) {
		let newManagedTag = null;
		if (text == 'ShiftBackspace') {
			newManagedTag = this.nex.getTagBefore(this.managedTag);
			this.nex.removeTag(this.managedTag);
			if (newManagedTag) {
				this.manageNewTag(newManagedTag);
			} else {
				this.managedTag = null;
				this.finish();
			}

		} else if ((text == 'ArrowRight' || text == 'ArrowLeft')) {
			if (text == 'ArrowRight') {
				newManagedTag = this.nex.getTagAfter(this.managedTag);
				if (!newManagedTag) {
					if (this.hasContent()) {
						newManagedTag = new Tag('');
						this.nex.addTag(newManagedTag);						
					}
				}
			} else if (text == 'ArrowLeft') {
				newManagedTag = this.nex.getTagBefore(this.managedTag);
				if (!newManagedTag) {
					if (this.hasContent()) {
						newManagedTag = new Tag('');
						this.nex.addTagAtStart(newManagedTag);
					}
				}
			}
			if (newManagedTag) {
				// throws error if contract fail, just returns false if dupe tag
				this.validateNewTagValue();
				this.managedTag.setIsEditing(false);
				if (this.managedTag.getName() == '') {
					this.nex.removeTag(this.managedTag);
				}
				this.manageNewTag(newManagedTag);
			}
		}
		return false;
	}

	revertInvalidTagEntry() {
		if (this.previousValue) {
			this.managedTag.setName(this.previousValue);
			this.managedTag.setIsEditing(false);
		} else {
			this.nex.removeTagByReference(this.managedTag);
		}		
	}

	validateNewTagValue() {
		if (this.nex.numTagsEqualTo(this.managedTag) > 1) {
			// tried to enter a duplicate tag.
			this.revertInvalidTagEntry();
			return false;
		}
		try {
			this.managedTag.checkForContractError(this.nex);
		} catch (e) {
			if (Utils.isFatalError(e)) {
				this.revertInvalidTagEntry();
			}
			throw(e);
		}
		return true;		
	}

	finish() {
		super.finish();
		if (!this.managedTag) return;
		if (this.managedTag.getName() == '') {
			this.nex.removeTag(this.managedTag);
		} else {
			// throws error if fail
			this.validateNewTagValue();
			this.managedTag.setIsEditing(false);
		}
	}

	postNode() {
		return this.editorDomNode;
	}
}

export { Tag, TagEditor  }

