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

import * as Utils from '../utils.js'

import { NexContainer, V_DIR, H_DIR, Z_DIR } from './nexcontainer.js'
import { wrapError } from '../evaluator.js'
import { experiments } from '../globalappflags.js'

class Org extends NexContainer {
	constructor() {
		super();
		// private data is currently unused but I want the logic for
		// handling it here so I can implement parsing and tests for it
		this.privateData = '';

		// temporary storage slot for drawfunction used during instantiation
		this.drawcheat = null;

		this.drawfunction = null;
		this.setVertical();
	}

	toString(version) {
		if (version == 'v2') {
			return this.toStringV2();
		}
		return `[org]`;
	}

	prettyPrintInternal(lvl, hdir) {
		return this.standardListPrettyPrint(lvl, '[org]', hdir);
	}

	setDrawCheat(dc) {
		this.drawcheat = dc;
	}

	getDrawCheat(dc) {
		return this.drawcheat;
	}

	setDrawFunction(f) {
		this.drawfunction = f;
	}

	toStringV2() {
		return `${this.toStringV2PrivateDataSection()}${this.listStartV2()}${this.toStringV2TagList()}${super.childrenToString('v2')}${this.listEndV2()}`;

	}

	/**
	 * Used by string conversion builtins.
	 */
	getValueAsString() {
		let s = '';
		for (let i = 0; i < this.numChildren(); i++) {
			if (s != '') {
				s += (this.dir == V_DIR ? '\n' : ' ');
			}
			let c = this.getChildAt(i);
			s += c.toString('v2');
		}
		return s;
	}

	deserializePrivateData(data) {
		this.privateData = data;
	}

	serializePrivateData(data) {
		return this.privateData;
	}


	getTypeName() {
		return '-org-';
	}

	makeCopy(shallow) {
		let r = new Org();
		this.copyChildrenTo(r, shallow);
		this.copyFieldsTo(r);
		return r;
	}

	hasChildTag(tag) {
		let r = false;
		this.doForEachChild(function(c) {
			if (c.hasTag(tag)) {
				r = true;
			}
		});
		return r;
	}

	getChildWithTag(tag) {
		let r = null;
		this.doForEachChild(function(c) {
			if (c.hasTag(tag)) {
				r = c;
			}
		});
		return r;
	}

	nextDir(dir) {
		switch(dir) {
			case H_DIR: return V_DIR;
			case V_DIR: return Z_DIR;
			case Z_DIR: return H_DIR;
		}
	}


	getDirtyForRendering() {
		if (this.drawfunction) {
			// we are doing custom drawing, which means figuring out whether this is dirty or not
			// is more or less intractable.
			return true;
		} else {
			return super.getDirtyForRendering();
		}
	}

	renderInto(renderNode, renderFlags, withEditor) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags, withEditor);
		domNode.classList.add('org');
		domNode.classList.add('data');
		if (experiments.ORG_Z) {
			domNode.classList.add('redorgs');
		}
		if (this.drawfunction) {
			let r = this.drawfunction(domNode.innerHTML);
			if (typeof(r) == 'string') {
				domNode.innerHTML = r;
			} else {
				domNode.appendChild(r);
			}
		}
	}

	doJobWithTag(jobname, args) {
		let job = this.getChildTagged(tag);
		if (!job) {
			throw new EError(`do: unknown job ${tag.getName()}`);
		}
		let cmd = new Command('');
		cmd.appendChild(job);
		for (let i = 0; i < args.numChildren(); i++) {
			cmd.appendChild(args.getChildAt(i));
		}

		let result = evaluateNexSafely(cmd, argEnv);
		if (Utils.isFatalError(result)) {
			return wrapError('&szlig;', `org: error doing job ${jobname}`, result);
		}
		return result;		
	}

	getDefaultHandler() {
		return 'orgDefault';
	}

	getEventTable(context) {
		if (experiments.BETTER_KEYBINDINGS) {
			return {};
		} else {
			return {
				'ShiftEnter': 'evaluate-nex-and-keep',
				'Enter': 'evaluate-nex',
				'ShiftSpace': 'toggle-dir',
			};
		}
	}

	static makeTaggedOrgWithContents(tag) {
		let org = new Org();
		org.addTag(tag);
		for (let i = 1; i < arguments.length; i++) {
			org.appendChild(arguments[i]);
		}
		return org;
	}
}



export { Org }

