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
import { constructFatalError } from './eerror.js'
import { ContextType } from '../contexttype.js'
import { experiments } from '../globalappflags.js'
import { Editor } from '../editors.js'
import { templateStore } from '../templates.js'
import { RENDER_FLAG_SHALLOW, RENDER_FLAG_EXPLODED, CONSOLE_DEBUG } from '../globalconstants.js'
import { systemState } from '../systemstate.js';
import { BINDINGS } from '../environment.js'
import { heap, HeapString } from '../heap.js'

/**
 * An expression that instantiates an org.
 */
class Instantiator extends NexContainer {
	constructor(orgname) {
		super();
		this.orgname = new HeapString();
		if (orgname) {
			this.orgname.set(orgname);
		}
	}

	toString(version) {
		if (version == 'v2') {
			return this.toStringV2();
		}
		return 'blerp';
	}

	toStringV2() {
		return `^${this.toStringV2Literal()}${this.toStringV2PrivateDataSection()}${this.listStartV2()}${this.toStringV2TagList()}${super.childrenToString('v2')}${this.listEndV2()}`;
	}

	deserializePrivateData(data) {
		this.setOrgName(data);
	}

	serializePrivateData() {
		return this.orgname.get();
	}

	prettyPrintInternal(lvl, hdir) {
		return this.standardListPrettyPrint(lvl, '^', hdir);
	}

	getTypeName() {
		return '-instantiator-';
	}

	makeCopy(shallow) {
		let r = constructInstantiator();
		this.copyChildrenTo(r, shallow);
		this.copyFieldsTo(r);
		return r;
	}

	copyFieldsTo(nex) {
		super.copyFieldsTo(nex);
		nex.orgname.set(this.orgname.get());
	}

	evaluate(env) {
		systemState.pushStackLevel();
		let b = env.lookupBinding(this.orgname.get());
		if (this.hasTags()) {
			b = b.makeCopy();
			for (let i = 0; i < this.numTags(); i++) {
				b.addTag(this.getTag(i));
			}
		}
		let a = [];
		this.doForEachChild(function(c) {
			a.push(c);
		});
		let r = templateStore.instantiateWithPotentialTemplate(this.orgname.get(), b, a, env);
		systemState.popStackLevel();
		return r;
	}

	setOrgName(n) {
		this.orgname.set(n);
		this.setDirtyForRendering(true);
	}

	getOrgName() {
		return this.orgname.get();
	}

	deleteLastOrgNameLetter() {
		this.orgname.removeFromEnd(1);
	}

	appendOrgNameText(txt) {
		this.orgname.append(txt);
	}

	getContextType() {
		return ContextType.COMMAND;
	}

	renderInto(renderNode, renderFlags, withEditor) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags, withEditor);
		domNode.classList.add('instantiator');
	}

	getGhost(name) {
		if (!BINDINGS.hasBinding(this.orgname.get())) {
			return '';
		}
		let b = BINDINGS.lookupBinding(this.orgname.get());
		let docs = templateStore.getTemplateDocs(b);
		if (!docs) {
			return '';
		}
		let ghost = document.createElement('div');
		ghost.classList.add('ghost');
		ghost.innerHTML = docs;
		let ghostline = document.createElement('div');
		ghostline.classList.add('ghostline')
		ghost.appendChild(ghostline);
		return ghost;
	}

	renderInto(renderNode, renderFlags, withEditor) {
		let domNode = renderNode.getDomNode();
		let codespan = null;
		if (!(renderFlags & RENDER_FLAG_SHALLOW)) {
			codespan = document.createElement("span");
			codespan.classList.add('codespan');
			domNode.appendChild(codespan);
		}			
		super.renderInto(renderNode, renderFlags, withEditor); // will create children
		domNode.classList.add('instantiator');
		domNode.classList.add('codelist');
		if (!(renderFlags & RENDER_FLAG_SHALLOW)) {
			if (renderFlags & RENDER_FLAG_EXPLODED) {
				codespan.classList.add('exploded');
			} else {
				codespan.classList.remove('exploded');
			}
			if (this.isEditing) {
				codespan.classList.add('editing');
			} else {
				codespan.classList.remove('editing');
			}
			let html = this.isEditing ? '<span class="caret glyphleft">^</span>' : '';
			html += this.orgname.get();
			if (!this.isEditing) {
				html += '<span class="caret glyphright">^</span>'
			}
			codespan.innerHTML = html;
			if (this.isEditing && renderNode.isSelected()) {
				let ghost = this.getGhost(this.orgname.get());
				if (ghost) {
					codespan.appendChild(ghost);
				}
			}
		}
	}

	getTagHolder(domNode) {
		return domNode.firstChild;
	}

	getDefaultHandler() {
		return 'standardDefault';
	}

	memUsed() {
		return super.memUsed() + heap.sizeInstantiator() + this.orgname.memUsed();
	}
}

class InstantiatorEditor extends Editor {

	constructor(nex) {
		super(nex, 'InstantiatorEditor');
	}

	getStateForUndo() {
		return this.nex.getOrgName();
	}

	setStateForUndo(val) {
		this.nex.setOrgName(val);
	}


	doBackspaceEdit() {
		this.nex.deleteLastOrgNameLetter();
	}

	doAppendEdit(text) {
		this.nex.appendOrgNameText(text);
	}

	hasContent() {
		return this.nex.getOrgName() != '';
	}

	startEditing() {
		super.startEditing();
		this.oldVal = this.nex.getOrgName();
	}

	abort() {
		this.nex.setOrgName(this.oldVal);
	}

	shouldAppend(text) {
		if (/^[a-zA-Z0-9:_-]$/.test(text)) return true; // normal chars
		return false;
	}

	shouldTerminateAndReroute(input) {
		if (super.shouldTerminateAndReroute()) return true;
		// don't terminate for math stuff, this is temporary
		if (/^[a-zA-Z0-9:_-]$/.test(input)) return false;

		// anything else, pop out
		return true;
	}
}

function constructInstantiator(orgname) {
	if (!heap.requestMem(heap.sizeInstantiator())) {
		throw constructFatalError(`OUT OF MEMORY: cannot allocate Instantiator.
stats: ${heap.stats()}`)
	}
	return heap.register(new Instantiator(orgname));
}

export { Instantiator, InstantiatorEditor, constructInstantiator }

