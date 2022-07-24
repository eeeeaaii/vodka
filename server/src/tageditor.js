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

import { contractEnforcer } from './contractfunctions.js';
import { throwOOM, newTagOrThrowOOM, constructFatalError } from './nex/eerror.js'
import { Editor } from './editors.js'
import { Tag } from './tag.js'
import * as Utils from './utils.js'


class TagEditor extends Editor {
	constructor(nex) {
		super(nex, 'TagEditor');
		this.managedTag == null;
		this.nex = nex;
		this.previousValue = null; // only used if you arrow around
	}

	getStateForUndo() {
		return this.nex.getAllTags();
	}
	setStateForUndo(val) {
		this.nex.setAllTags(val);
	};

	createManagedTagIfNone() {
		if (!this.managedTag) {
			this.managedTag = newTagOrThrowOOM('', 'should not happen, creating empty tag in tag editor');
			this.managedTag.setIsEditing(true);
			this.nex.addTag(this.managedTag);
		}
	}

	doBackspaceEdit() {
		this.createManagedTagIfNone();
		if (this.managedTag.getTagString() == '') {
			// this should never be null because of the check in shouldBackspace
			let newManagedTag = this.nex.getTagBefore(this.managedTag);
			this.nex.removeTag(this.managedTag);
			this.manageNewTag(newManagedTag);
		} else {
			let oldval = this.managedTag.getTagString();
			let newval = oldval.substr(0, oldval.length - 1);
			this.managedTag.setTagString(newval) || throwOOM('Editing tag');
		}
	}

	doAppendEdit(text) {
		this.createManagedTagIfNone();
		let oldval = this.managedTag.getTagString();
		let newval = oldval + '' + text;
		this.managedTag.setTagString(newval) || throwOOM('Editing tag');
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

	lastBackspaceReroute(text) {
		return false;
	}


	hasContent() {
		this.createManagedTagIfNone();
		return this.managedTag.getTagString() != '';
	}

	shouldAppend(text) {
		// append if a single character, otherwise it's special
		return (/^.$/.test(text));
	}

	manageNewTag(newManagedTag) {
		this.managedTag = newManagedTag;
		newManagedTag.setIsEditing(true);
		this.previousValue = newManagedTag.getTagString();
	}

	performSpecialProcessing(text) {
		this.createManagedTagIfNone();
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
						newManagedTag = newTagOrThrowOOM('', 'should not happen, creating empty tag in tag editor');
						this.nex.addTag(newManagedTag);						
					}
				}
			} else if (text == 'ArrowLeft') {
				newManagedTag = this.nex.getTagBefore(this.managedTag);
				if (!newManagedTag) {
					if (this.hasContent()) {
						newManagedTag = newTagOrThrowOOM('', 'should not happen, creating empty tag in tag editor');
						this.nex.addTagAtStart(newManagedTag);
					}
				}
			}
			if (newManagedTag) {
				// throws error if contract fail, just returns false if dupe tag
				this.validateNewTagValue();
				this.managedTag.setIsEditing(false);
				if (this.managedTag.getTagString() == '') {
					this.nex.removeTag(this.managedTag);
				}
				this.manageNewTag(newManagedTag);
			}
		}
		return null;
	}

	revertInvalidTagEntry() {
		this.createManagedTagIfNone();
		if (this.previousValue) {
			this.managedTag.setTagString(this.previousValue) || throwOOM('Editing tag');
			this.managedTag.setIsEditing(false);
		} else {
			this.nex.removeTagByReference(this.managedTag);
		}		
	}


	checkForContractError(tag, nex) {
		let errorMessage = contractEnforcer.enforce(tag, nex);
		if (errorMessage) {
			let e = constructFatalError(errorMessage);
			e.appendChild(nex);
			throw e;
		}		
	}

	validateNewTagValue() {
		if (this.nex.numTagsEqualTo(this.managedTag) > 1) {
			// tried to enter a duplicate tag.
			this.revertInvalidTagEntry();
			return false;
		}
		try {
			this.checkForContractError(this.managedTag, this.nex);
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
		if (this.managedTag.getTagString() == '') {
			this.nex.removeTag(this.managedTag);
		} else {
			// throws error if fail
			this.validateNewTagValue();
			this.managedTag.setIsEditing(false);
		}
	}
}

export { TagEditor }
