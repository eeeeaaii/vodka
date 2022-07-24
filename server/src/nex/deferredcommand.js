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

import { constructDeferredValue } from './deferredvalue.js'
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
import { heap } from '../heap.js'
import { constructFatalError } from './eerror.js'


class DeferredCommand extends Command {
	constructor(val) {
		super(val);

		// note, you could have code that infinitely queues up unfinished
		// deferred commands, meaning that you could run out of memory
		// with things like the runInfo -- so this needs to be looked at.
		this._activated = false;
		this._finished = false;
		this._cancelled = false;

		this._activationEnv = null;
		this._returnedValue = null;
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
		let r = constructDeferredCommand();
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

		// it's a bit messy that runinfo is initialized when we evaluate.
		// should this happen when activated?

		let dv = constructDeferredValue();
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

		// I'm returning dv/_returnedValue so I don't need to (and shouldn't) ref count it

		return dv;
	}

	activate(executionEnv) {
		heap.addEnvReference(executionEnv);
		this._activationEnv = executionEnv;
		this._activated = true;
		this.tryToFinish();
	}

	tryToFinish() {
		if (this._cancelled) {
			return;
		}
		if (this._returnedValue.wasFreed) {
			return;
		}
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
				this.finish(e);
			} else {
				throw e;
			}
		}
		if (evaluationResult == ARGRESULT_SETTLED || evaluationResult == ARGRESULT_FINISHED) {
			let executionResult = executeRunInfo(this._runInfo, this._activationEnv);
			if (Utils.isFatalError(executionResult)) {
				this.finish(executionResult);
			} else if (evaluationResult == ARGRESULT_SETTLED) {
				this.settle(executionResult);
			} else {
				this.finish(executionResult);
			}
		}
		this.setDirtyForRendering(true);
		eventQueueDispatcher.enqueueRenderOnlyDirty();

	}

	finish(result) {
		heap.removeEnvReference(this._activationEnv);
		this._runInfo.finalize();
		this._runInfo = null;

		this._finished = true;
		// this._finished needs to be set to true before calling finish on
		// the returned value. When we call finish on the returned value,
		// this deferred command will be removed as the child of that deferred value
		// and replaced with the result of the computation. When that happens,
		// memory cleanup happens. When memory cleanup happens on a deferred command,
		// it will check this._finished and try to cancel the deferred value if it's
		// not finished. So we have to make sure this is marked as finished first
		// so we don't try to cancel something that was already finished.
		this._returnedValue.finish(result);
	}

	settle(result) {
		// don't remove ref
		this._returnedValue.settle(result)
	}

	cancel() {
		heap.removeEnvReference(this._activationEnv);
		this._runInfo.finalize();
		this._runInfo = null;
		this._cancelled = true;
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
			dotspan.innerText = this.getCommandText(); // superclass method
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

	static makeDeferredCommandWithArgs(cmdname, maybeargs) {
		let cmd = constructDeferredCommand(cmdname);

		// this little snippet lets you do varargs or array
		let args = [];
		if (Array.isArray(maybeargs)) {
			args = maybeargs;
		} else {
			args = Array.prototype.slice.call(arguments).splice(1);
		}
		let appendIterator = null;
		for (let i = 0; i < args.length; i++) {
			appendIterator = cmd.fastAppendChildAfter(args[i], appendIterator);
		}
		return cmd;
	}

	memUsed() {
		let r = heap.sizeDeferredCommand();
		if (this._runInfo) {
			r += this._runInfo.memUsed();
		}
		return r + super.memUsed();
	}

	cleanupOnMemoryFree() {
		if (this._activated && !this._finished) {
			this.cancel();
		}
		// because we initialize runinfo at evaluation time not activation time,
		// there is the possibility that even after canceling there will still be runinfo
		if (this._runInfo) {
			this._runInfo.finalize();
		}
	}
}

function constructDeferredCommand(val) {
	if (!heap.requestMem(heap.sizeDeferredCommand())) {
		throw constructFatalError(`OUT OF MEMORY: cannot allocate DeferredCommand.
stats: ${heap.stats()}`)
	}
	return heap.register(new DeferredCommand(val));
}

export { DeferredCommand, constructDeferredCommand}
