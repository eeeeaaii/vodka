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
import { manipulator } from '../vodka.js'
import { isNormallyHandled } from '../keyresponsefunctions.js'
import { ContextType } from '../contexttype.js'
import { wrapError } from '../evaluator.js'

// remove with deprecated defaultHandle
import { Letter } from './letter.js'
import { Separator } from './separator.js'

class Org extends NexContainer {
	constructor() {
		super()
	}

	toString(version) {
		if (version == 'v2') {
			return this.toStringV2();
		}
		return `[org]`;
	}

	toStringV2() {
		return '(' + super.childrenToString('v2') + ')';
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


	defaultHandle(txt, context) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let isCommand = (context == ContextType.COMMAND);
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);
		if (isSeparator) {
			manipulator.insertAfterSelectedAndSelect(new Separator(txt));
		} else {
			if (isCommand) {
				if (this.hasChildren()) {
					manipulator.insertAfterSelectedAndSelect(new Letter(txt));
				} else {
					manipulator.appendAndSelect(new Letter(txt));
				}							
			} else {
				manipulator.appendAndSelect(new Letter(txt));
			}
		}
		return true;
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

