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

import * as Utils from './utils.js'

import { systemState } from './systemstate.js'
import { Root } from './nex/root.js'
import { Org } from './nex/org.js'
import { evaluateNexSafely, wrapError } from './evaluator.js'
import { constructCommand } from './nex/command.js'

let isSetup = false;

let sroot = new Root();
let tempbin = new Org(); // should only have one thing at a time
let dvbin = new Org();

function setup() {
	sroot = new Root();
	sroot.appendChild(tempbin);
	sroot.appendChild(dvbin);
}

function sAttach(obj) {
	if (tempbin.hasChildren()) {
		let prevChild = tempbin.getChildAt(0);
		if (Utils.isDeferredValue(prevChild) && !(prevChild.isFinished() || prevChild.isCancelled())) {
			dvbin.appendChild(prevChild);
			prevChild.addListener({
					notify: () => {
						dvbin.removeChild(prevChild);
					}
				});
		}
		tempbin.removeChildAt(0);
	}
	tempbin.appendChild(obj);
	return obj;
}

function sEval(cmd, env, errmsg, shouldThrow) {
	cmd.setSkipAlertAnimation(true);
	let result = evaluateNexSafely(cmd, env);
	if (Utils.isFatalError(result)) {
		if (shouldThrow) {
			throw wrapError('&szlig;', `[sEva] ${errmsg}`, result);
		} else {
			return wrapError('&szlig;', `[sEva] ${errmsg}`, result);
		}
	}
	sAttach(result);
	return result;
}

class SyntheticCodeFactory {
	makeQuote(item) {
		let q = constructCommand('quote');
		q.fastAppendChildAfter(item, null);
		return q;
	}

	sEval2(cmd, env, errmsg, shouldThrow) {
		return sEval(cmd, env, errmsg, shouldThrow);
	}

	makeCommandWithClosureZeroArgs(closure) {
		let cmd = constructCommand();
		let appendIterator = null;
		appendIterator = cmd.fastAppendChildAfter(this.makeQuote(closure), appendIterator);
		sAttach(cmd);
		return cmd;
	}

	makeCommandWithClosureOneArg(closure, arg0) {
		let cmd = constructCommand();
		let appendIterator = null;
		appendIterator = cmd.fastAppendChildAfter(this.makeQuote(closure), appendIterator);
		appendIterator = cmd.fastAppendChildAfter(arg0, appendIterator);
		sAttach(cmd);
		return cmd;
	}

	makeCommandWithClosureTwoArgs(closure, arg0, arg1) {
		let cmd = constructCommand();
		let appendIterator = null;
		appendIterator = cmd.fastAppendChildAfter(this.makeQuote(closure), appendIterator);
		appendIterator = cmd.fastAppendChildAfter(arg0, appendIterator);
		appendIterator = cmd.fastAppendChildAfter(arg1, appendIterator);
		sAttach(cmd);
		return cmd;
	}

	makeCommandWithClosureThreeArgs(closure, arg0, arg1, arg2) {
		let cmd = constructCommand();
		let appendIterator = null;
		appendIterator = cmd.fastAppendChildAfter(this.makeQuote(closure), appendIterator);
		appendIterator = cmd.fastAppendChildAfter(arg0, appendIterator);
		appendIterator = cmd.fastAppendChildAfter(arg1, appendIterator);
		appendIterator = cmd.fastAppendChildAfter(arg2, appendIterator);
		sAttach(cmd);
		return cmd;
	}

	makeCommandWithClosure(closure, maybeargs) {
		let cmd = constructCommand();
		let appendIterator = null;
		appendIterator = cmd.fastAppendChildAfter(this.makeQuote(closure), appendIterator);

		// this little snippet lets you do varargs or array
		let args = [];
		if (Array.isArray(maybeargs)) {
			args = maybeargs;
		} else {
			args = Array.prototype.slice.call(arguments).splice(1);
		}
		for (let i = 0; i < args.length; i++) {
			appendIterator = cmd.fastAppendChildAfter(args[i], appendIterator);
		}
		sAttach(cmd);
		return cmd;
	}

	makeCommandWithArgs(cmdname, maybeargs) {
		let cmd = constructCommand(cmdname);

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
		sAttach(cmd);
		return cmd;
	}
}

let syntheticCodeFactory = new SyntheticCodeFactory();
systemState.setSCF(syntheticCodeFactory);



export {
		sEval,
		sAttach
	}