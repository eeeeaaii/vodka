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
import { EError } from './eerror.js'
import { ContextType } from '../contexttype.js'
import { experiments } from '../globalappflags.js'
import { evaluateNexSafely } from '../evaluator.js'
import { Editor } from '../editors.js'
import { templateStore } from '../templates.js'
import { RENDER_FLAG_SHALLOW, RENDER_FLAG_EXPLODED, CONSOLE_DEBUG } from '../globalconstants.js'

/**
 * An expression that instantiates an org.
 */
class Instantiator extends NexContainer {
	constructor(orgname) {
		super();
		this.orgname = (orgname ? orgname : '');
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
		return this.orgname;
	}

	prettyPrintInternal(lvl, hdir) {
		return this.standardListPrettyPrint(lvl, '^', hdir);
	}

	getTypeName() {
		return '-instantiator-';
	}

	makeCopy(shallow) {
		let r = new Instantiator();
		this.copyChildrenTo(r, shallow);
		this.copyFieldsTo(r);
		return r;
	}

	copyFieldsTo(nex) {
		super.copyFieldsTo(nex);
		nex.orgname = this.orgname;
	}

	evaluate(env) {
			let a = [];
			this.doForEachChild(function(c) {
				a.push(c);
			});
			let r = templateStore.instantiateWithNameString(this.orgname, a);
			return r;
	}

	setOrgName(n) {
		this.orgname = n;
		this.setDirtyForRendering(true);
	}

	getOrgName() {
		return this.orgname;
	}

	deleteLastOrgNameLetter() {
		this.orgname = this.orgname.substr(0, this.orgname.length - 1);
	}

	appendOrgNameText(txt) {
		this.orgname = this.orgname + txt;
	}

	getContextType() {
		return ContextType.COMMAND;
	}

	renderInto(renderNode, renderFlags, withEditor) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags, withEditor);
		domNode.classList.add('instantiator');
	}

	maybeGetTemplate(name) {
		return templateStore.getTemplate(name);
	}

	getGhostForTemplate(template) {
		let ghost = document.createElement('div');
		ghost.classList.add('ghost');
		let val = template.getDocs();
		ghost.innerHTML = val;
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
			html += this.orgname;
			if (!this.isEditing) {
				html += '<span class="caret glyphright">^</span>'
			}
			codespan.innerHTML = html;
			if (this.isEditing && renderNode.isSelected()) {
				let template = this.maybeGetTemplate(this.orgname);
				if (template) {
					codespan.appendChild(this.getGhostForTemplate(template));
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
		if (/^[/<>=+*]$/.test(text)) return true;
		return false;
	}

	shouldTerminateAndReroute(input) {
		if (super.shouldTerminateAndReroute()) return true;
		// don't terminate for math stuff, this is temporary
		if (/^[/<>=+*]$/.test(input)) return false;

		// command-friendly characters
		if (/^[a-zA-Z0-9:_-]$/.test(input)) return false;

		// anything else, pop out
		return true;
	}
}

export { Instantiator, InstantiatorEditor }

