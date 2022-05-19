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


class DeferredCommand extends Command {
	constructor(val) {
		super(val);

		this._activated = false;
		this._activationEnv = null;
		this._fulfilled = false;
		this._returnedValue = null;
		this._runInfo = null;

		this._runInfo = null;

		gc.register(this);
	}

	isActivated() {
		return this._activated;
	}

	isFulfilled() {
		return this._fulfilled;
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

		let copyOfSelf = this.makeCopy(true);

		let dv = new DeferredValue();
		copyOfSelf._runInfo = this.createRunInfo(executionEnv);
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

	// these will break horribly if deferred commands/values don't form a DAG...

	isSettled() {
		let allSettled = true;
		for (let i = 0; i < this._runInfo.argContainer.numArgs(); i++) {
			let nex = this._runInfo.argContainer.getArgAt(i).getNex();
			if (Utils.isDeferred(nex)) {
				if (!nex.isSettled()) {
					allSettled = false;
				}
			}
		}	
		return allSettled;	
	}

	isFinished() {
		let allFinished = true;
		for (let i = 0; i < this._runInfo.argContainer.numArgs(); i++) {
			let nex = this._runInfo.argContainer.getArgAt(i).getNex();
			if (Utils.isDeferred(nex)) {
				if (!nex.isFinished()) {
					allFinished = false;
				}
			}
		}	
		return allFinished;	
	}

	addSelfAsListenerIfNotAlready() {
		for (let i = 0; i < this._runInfo.argContainer.numArgs(); i++) {
			let arg = this._runInfo.argContainer.getArgAt(i).getNex();
			if (Utils.isDeferred(arg) && !arg.hasListener(this)) {
				arg.addListener(this);
			}
		}
	}


	tryToFinish() {
		this._runInfo.argEvaluator.evaluatePotentiallyDeferredArgs();
		this.addSelfAsListenerIfNotAlready();
		let executionResult = null;
		if (this.isSettled()) {
			executionResult = executeRunInfo(this._runInfo, this._activationEnv)
		}
		if (Utils.isError(executionResult) || this.isFinished() || (executionResult && executionResult.hasTagWithString('finish'))) {
			this._returnedValue.finish(executionResult)			
		}
	}

	notify() {
		this.tryToFinish();
	}

	getRenderableChildAt(i, useDefault) {
		if (this._activated && !this._fulfilled) {
			return this._runInfo.argContainer.getArgAt(i).getNex();
		} else {
			return this.getChildAt(i, useDefault);
		}
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
