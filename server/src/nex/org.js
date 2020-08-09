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

import { NexContainer } from './nexcontainer.js'
import { wrapError } from '../evaluator.js'

class Org extends NexContainer {
	constructor() {
		super();
		// private data is currently unused but I want the logic for
		// handling it here so I can implement parsing and tests for it
		this.privateData = '';
	}

	toString(version) {
		if (version == 'v2') {
			return this.toStringV2();
		}
		return `[org]`;
	}

	toStringV2() {
		return `${this.toStringV2PrivateDataSection()}(${this.toStringV2TagList()}${super.childrenToString('v2')})`;

	}

	deserializePrivateData(data) {
		// TODO: this is probably not sustainable - the only way this knows that
		// the data is not "for it" is that it's not 'v' indicating vertical
		if (data && data.length > 0 && data[0] != 'v') {
			this.privateData = data[0];
			data.splice(0, 1);
		}
		super.deserializePrivateData(data);
	}

	serializePrivateData(data) {
		if (this.privateData != '') {
			data.push(this.privateData);
		}
		super.serializePrivateData(data);
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
		// TODO: make more efficient I guess
		for (let i = 0; i < this.numChildren(); i++) {
			if (this.getChildAt(i).hasTag(tag)) {
				return true;
			}
		}
		return false;
	}

	getChildWithTag(tag) {
		// TODO: make more efficient
		for (let i = 0; i < this.numChildren(); i++) {
			if (this.getChildAt(i).hasTag(tag)) {
				return this.getChildAt(i);
			}
		}
		return false;
	}

	renderInto(renderNode, renderFlags) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags);
		domNode.classList.add('org');
		domNode.classList.add('data');
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
		return {
			'ShiftEnter': 'evaluate-nex-and-keep',
			'Enter': 'evaluate-nex',
			'ShiftSpace': 'toggle-dir', // doesn't work
		};
	}
}



export { Org }

