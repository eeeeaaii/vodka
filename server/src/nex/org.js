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

class Org extends NexContainer {
	constructor() {
		super()
	}

	toString() {
		return `[org]`;
	}

	getTypeName() {
		return '-org-';
	}

	makeCopy() {
		let r = new Org();
		this.copyFieldsTo(r);
		return r;
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
		if (isFatalError(result)) {
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
}