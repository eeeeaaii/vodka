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

import * as Utils from './utils.js';

import { INDENT, systemState } from './systemstate.js'
import { ArgEvaluator } from './argevaluator.js'
import { perfmon, PERFORMANCE_MONITOR } from './perfmon.js'
import { CONSOLE_DEBUG } from './globalconstants.js'
import { experiments } from './globalappflags.js'
import { wrapError } from './evaluator.js'
import { EError } from './nex/eerror.js'

class Arg {
	constructor(nex) {
		this.nex = nex;
		this.processed = false;
		this.ref = null;
		this.refindex = null;
	}

	makeUpdating(ref, refindex) {
		this.ref = ref;
		this.refindex = refindex;
	}

	isProcessed() {
		return this.processed;
	}

	setProcessed(v) {
		this.processed = v;
	}

	getNex() {
		return this.nex;
	}

	// setPossiblePackageNameSymbol(symbol) {
	// 	this.packageSymbol = symbol;
	// }

	// hasPackageSymbol() {
	// 	return !!this.packageSymbol;
	// }

	// getPackageSymbol() {
	// 	return this.packageSymbol;
	// }

	setNex(n) {
		this.nex = n;
		if (this.ref) {
			this.ref.replaceChildAt(n, this.refindex);
		}
	}

	debugString() {
		return "|ARG|" + this.nex.debugString();
	}
}

/**
 * The reason you need an arg container is that if you are doing shift-enter
 * evaluation for the purposes of side effects, we don't want to alter the code
 * or change the contents of the command. So we store the args in a separate place
 * and they get evaluated (and replaced) there.
 */
class ArgContainer {
	constructor(nex) {
		this.args = [];
	}

	makeUpdating(ref) {
		for (let i = 0; i < this.args.length; i++) {
			this.args[i].makeUpdating(ref, i);
		}
	}

	addArg(arg) {
		this.args[this.args.length] = arg;
	}

	numArgs() {
		return this.args.length;
	}

	getArgAt(i) {
		return this.args[i];
	}

	setArgAt(newarg, i) {
		this.args[i] = newarg;
	}

	removeArgAt(i) {
		this.args[i].splice(i, 1);
	}
}

class RunInfo {
	constructor(closure, cmdname, expectedReturnType, argContainer, argEvaluator, commandDebugString, skipAlert, tags, packageName) {
		this.closure = closure;
		this.cmdname = cmdname;
		this.expectedReturnType = expectedReturnType;
		this.argContainer = argContainer;
		this.argEvaluator = argEvaluator;
		this.commandDebugString = commandDebugString;
		this.skipAlert = skipAlert;
		this.tags = tags;
		this.packageName = packageName;
	}

	isRunInfo() {
		return true;
	}
}

function executeRunInfo(runInfo, executionEnv) {
	let result = runCommand(runInfo, executionEnv);

	if (runInfo.expectedReturnType != null && !Utils.isFatalError(result)) {
		let typeChecksOut = ArgEvaluator.ARG_VALIDATORS[runInfo.expectedReturnType.type](result);
		if (!typeChecksOut) {
			result = new EError(`${runInfo.cmdname}: should return ${runInfo.expectedReturnType.type} but returned ${result.getTypeName()}`);

		}
	}

	return result;
}

function runCommand(runInfo, executionEnv) {
	systemState.pushStackLevel();
	systemState.stackCheck(); // not for step eval, this is to prevent call stack overflow.

	if (CONSOLE_DEBUG) {
		console.log(`${INDENT()}evaluating command: ${runInfo.commandDebugString}`);
		console.log(`${INDENT()}closure is: ${runInfo.closure.debugString()}`);
	}
	// the arg container holds onto the args and is used by the arg evaluator.
	// I think this is useful for step eval but I can't remember

	if (PERFORMANCE_MONITOR) {
		perfmon.logMethodCallStart(runInfo.closure.getCmdName());
	}

	if (!experiments.DISABLE_ALERT_ANIMATIONS && !runInfo.skipAlert) {
		runInfo.closure.doAlertAnimation();
	}

	// actually run the code.
	let r = runInfo.closure.closureExecutor(executionEnv, runInfo.argEvaluator, runInfo.cmdname, runInfo.tags, runInfo.packageName);

	if (PERFORMANCE_MONITOR) {
		perfmon.logMethodCallEnd(runInfo.closure.getCmdName());
	}

	if (CONSOLE_DEBUG) {
		console.log(`${INDENT()}command returned: ${r.debugString()}`);
	}
	systemState.popStackLevel();
	return r;
}


export { ArgContainer, Arg, RunInfo, executeRunInfo }


