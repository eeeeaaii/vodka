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

import { DeferredValue } from './deferredvalue.js'
import { Command, CommandEditor } from './command.js'
import { gc } from '../gc.js'
import { Editor } from '../editors.js'
import {
	RENDER_FLAG_SHALLOW,
	RENDER_FLAG_EXPLODED,
} from '../globalconstants.js'
import {
	DeferredCommandActivationFunctionGenerator,
} from '../asyncfunctions.js'
import { executeRunInfo } from '../commandfunctions.js'
import { eventQueueDispatcher } from '../eventqueuedispatcher.js'
import { ARGRESULT_LISTENING, ARGRESULT_SETTLED, ARGRESULT_FINISHED } from '../argevaluator.js'



class DeferredCommand extends Command {
	constructor(val) {
		super(val);

		this._activated = false;
		this._activationEnv = null;
		this._finished = false;
		this._returnedValue = null;
		this._runInfo = null;

		this._runInfo = null;

		gc.register(this);
	}

	isActivated() {
		return this._activated;
	}

	isFinished() {
		return this._finished;
	}

	isSet() {
		return true;
	}

	toString(version) {
		if (version == 'v2') {
			return this.toStringV2();
		}
		return `*(${super.childrenToString()}*)`;
	}

	toStringV2() {
		return `*${this.toStringV2Literal()}${this.toStringV2PrivateDataSection()}${this.listStartV2()}${this.toStringV2TagList()}${super.childrenToString('v2')}${this.listEndV2()}`;
	}

	deserializePrivateData(data) {
		if (data) {
			this.setCommandText(data);
		}
	}

	serializePrivateData() {
		let r = this.getCommandText();
		if (!r) return '';
		return r;
	}


	prettyPrintInternal(lvl, hdir) {
		return this.standardListPrettyPrint(lvl, '*', hdir);
	}

	getTypeName() {
		return '-deferredcommand-';
	}

	makeCopy(shallow) {
		let r = new DeferredCommand();
		this.copyChildrenTo(r, shallow);
		this.copyFieldsTo(r);
		return r;
	}

	copyFieldsTo(nex) {
		super.copyFieldsTo(nex);
	}

	evaluate(executionEnv) {
		// we have to make a copy, we can't store state with code in a lambda etc.

		// to copy, we follow the same algorithm as argContainer --
		// we do a shallow copy but then children are not copied.
		let copyOfSelf = this.makeCopy(true);
		for (let i = 0; i < this.numChildren(); i++) {
			copyOfSelf.appendChild(this.getChildAt(i));
		}


		let dv = new DeferredValue();
		copyOfSelf._runInfo = copyOfSelf.createRunInfo(executionEnv);

		// make it so the arg container in the runinfo updates the actual
		// children of the command copy so they can be rendered to the screen.
		// this would change if I created a separate/different object whose
		// purpose is to display to the user the in-process computation of the
		// deferred command
		copyOfSelf._runInfo.argContainer.makeUpdating(copyOfSelf);

		copyOfSelf._returnedValue = dv;

		dv.appendChild(copyOfSelf);
		let afg = new DeferredCommandActivationFunctionGenerator(copyOfSelf, executionEnv);
		dv.set(afg);
		dv.activate();


		return dv;
	}

	activate(executionEnv) {
		this._activationEnv = executionEnv;
		this._activated = true;
		this.tryToFinish();
	}

	tryToFinish() {
		let evaluationResult = null;
		try {
			evaluationResult = this._runInfo.argEvaluator.evaluatePotentiallyDeferredArgs(this);
			/*
			What should happen is the arg evaluator will try to evaluate the args, and return an enum instead of a boolean
			possible values:
			1. finished -- evaluate the function and finish the returned dv with whatever it returns
			2. settling -- one of the args settled but didn't finish, evaluate the function and settle the returned dv with whatever it returns
			3. waiting -- don't do anything

			note also that evaluating a settled (but not finished) dv returns the same dv,
			but when evaluating the function, we do want to pass in the contents of the settled dv.

			also: open question, if an arg settles, do we evaluate the args after it? The current logic stops evaluating args
			when it gets the first dv -- this is so that things like "begin" work intuitively if you put deferred functions
			in them. But if one of the deferred functions settles, do we progress?
			*/
		} catch (e) {
			if (Utils.isFatalError(e)) {
				this._returnedValue.finish(e);
			} else {
				throw e;
			}
		}
		if (evaluationResult == ARGRESULT_SETTLED || evaluationResult == ARGRESULT_FINISHED) {
			let executionResult = executeRunInfo(this._runInfo, this._activationEnv)
			if (evaluationResult == ARGRESULT_SETTLED) {
				this._returnedValue.settle(executionResult)
			} else {
				this._returnedValue.finish(executionResult)				
			}
		}
		this.setDirtyForRendering(true);
		eventQueueDispatcher.enqueueRenderOnlyDirty();

	}

	notify() {
		this.tryToFinish();
	}

	renderInto(renderNode, renderFlags, withEditor) {
		let domNode = renderNode.getDomNode();
		let dotspan = null;
		if (!(renderFlags & RENDER_FLAG_SHALLOW)) {
			dotspan = document.createElement("span");
			dotspan.classList.add('dotspan');
			domNode.appendChild(dotspan);
		}
		super.skipRenderInto(renderNode, renderFlags, withEditor);
		domNode.classList.add('deferredcommand');
		if (!(renderFlags & RENDER_FLAG_SHALLOW)) {
			if (renderFlags & RENDER_FLAG_EXPLODED) {
				dotspan.classList.add('exploded');
			} else {
				dotspan.classList.remove('exploded');
			}
			if (this.isEditing) {
				dotspan.classList.add('editing');
			} else {
				dotspan.classList.remove('editing');
			}
			dotspan.innerText = this.commandtext;
		}
	}

	renderAfterChild() {}

	callDeleteHandler() {
		// no op but use this if you need for cleanup
	}

	getEventTable(context) {
		// most of these have no tests?
		return {
			'ShiftBackspace': 'call-delete-handler-then-remove-selected-and-select-previous-sibling',
		}
	}

}

export { DeferredCommand }
