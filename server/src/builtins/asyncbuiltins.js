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

import { eventQueueDispatcher } from '../eventqueuedispatcher.js'
import { Builtin } from '../nex/builtin.js'
import { constructNil } from '../nex/nil.js'
import { EError } from '../nex/eerror.js'
import { Org } from '../nex/org.js'
import { UNBOUND } from '../environment.js'
import { Lambda } from '../nex/lambda.js'
import { experiments } from '../globalappflags.js'
import { Tag } from '../tag.js'
import { constructDeferredValue } from '../nex/deferredvalue.js'
import { incFFGen } from '../gc.js'
import { constructInteger } from '../nex/integer.js'
import { constructFatalError } from '../nex/eerror.js'
import { BINDINGS } from '../environment.js'
import { constructBool } from '../nex/bool.js'; 
import { systemState } from '../systemstate.js'
import { evaluateNexSafely, wrapError } from '../evaluator.js'


import {
	ImmediateActivationFunctionGenerator,
	DelayActivationFunctionGenerator,
	EveryActivationFunctionGenerator,
	ClickActivationFunctionGenerator,
	OnContentsChangedActivationFunctionGenerator,
	CallbackActivationFunctionGenerator,
	OnNextRenderActivationFunctionGenerator
} from '../asyncfunctions.js'



// running `do every` loops, so the stop button can end them
// (comment by Claude)
const runningLoops = {};
let nextLoopId = 1;

function stopAllLoops() {
	for (let id in runningLoops) {
		runningLoops[id].stop();
		delete runningLoops[id];
	}
}

function anyLoopsRunning() {
	for (let id in runningLoops) {
		return true;
	}
	return false;
}

function createAsyncBuiltins() {

	/*
	The value a deferred thing has produced so far, which is not the same
	question as what it evaluates to. Evaluating a deferred value hands back the
	deferred value itself until it has finished for good -- it is still in the
	middle of its work, and saying otherwise would be a lie about whether more
	is coming. Asking for the latest is the explicit way to look at what it has
	got to so far, whether or not it is done.

	Anything that is not deferred has a latest: itself. The question is whether
	a value exists yet, not what kind of thing is being asked, so a number is
	trivially its own most recent value and only something still waiting for its
	first result has nothing to give.
	*/
	function hasLatest(nex) {
		if (Utils.isDeferredCommandValue(nex)) {
			return nex.hasLatest();
		}
		// settled or finished; the state is the question, not whether it
		// happens to be holding anything -- a deferred that finished with
		// nothing has still finished, and nothing is what it produced
		return Utils.isDeferredValue(nex) ? nex.isSettled() : true;
	}

	function latestOf(nex) {
		if (Utils.isDeferredCommandValue(nex)) {
			return nex.getLatest();
		}
		if (!Utils.isDeferredValue(nex)) {
			return nex;
		}
		// the same answer evaluating a finished one gives
		return nex.numChildren() > 0 ? nex.getChildAt(0) : constructNil();
	}

	Builtin.createBuiltin(
		'latest',
		[ 'nex' ],
		function $latest(env, executionEnvironment) {
			let nex = env.lb('nex');
			if (!hasLatest(nex)) {
				return constructFatalError(
						'latest: that has not produced a value yet. Sorry!');
			}
			return latestOf(nex);
		},
		'The value |nex has produced so far. A deferred value gives what it holds; anything else gives itself. It is an error to ask before there is one, so ask has-latest first.'
	);

	Builtin.createBuiltin(
		'has-latest',
		[ 'nex' ],
		function $hasLatest(env, executionEnvironment) {
			return constructBool(hasLatest(env.lb('nex')));
		},
		'True if |nex has produced a value, and so whether latest can be asked. Anything not deferred always has one.'
	);

	Builtin.createBuiltin(
		'cancel-deferred',
		[ 'def*?' ],
		function $cancelDeferred(env, executionEnvironment) {
			let def = env.lb('def');
			if (def == UNBOUND) {
				incFFGen();
				return constructNil();
			} else {
				def.cancel();
				return def;
			}
		},
		'Cancels |def, which then never completes. Given no argument, cancels every unfinished deferred.'
	);

	Builtin.createBuiltin(
		'settle',
		[ 'dv*', 'result?'],
		function settle(env, executionEnvironment) {
			let dv = env.lb('dv');
			let result = env.lb('result')
			if (result == UNBOUND) {
				// if we finish with a Nil, Nil replaces the contents
				// but if we pass null, then the dv will keep the contents.
				result = null;
			}
			dv.startSettle(result);
			return dv;
		},
		'Settles |dv with |nex. A settled value can settle again.'
	);

	Builtin.createBuiltin(
		'finish',
		[ 'dv*', 'result?'],
		function $settle(env, executionEnvironment) {
			let dv = env.lb('dv');
			let result = env.lb('result')
			if (result == UNBOUND) {
				// if we finish with a Nil, Nil replaces the contents
				// but if we pass null, then the dv will keep the contents.
				result = null;
			}
			dv.startFinish(result);
			return dv;
		},
		'Finishes |dv with |nex. A finished value produces nothing more.'
	);

	Builtin.createBuiltin(
		'is-finished',
		[ 'dv*'],
		function $isFinished(env, executionEnvironment) {
			let dv = env.lb('dv');
			let isF = dv.isFinished();
			let r = constructBool(isF);
			return r;
		},
		'True if |dv has finished.'
	);

	Builtin.createBuiltin(
		'report-async-error',
		[ '_dv'],
		function $reportError(env, executionEnvironment) {
			let dv = env.lb('dv');
			let thing = evaluateNexSafely(dv, executionEnvironment);
			if (Utils.isDeferredValue(thing)) {
				thing.addListener({
					notify: () => {
						let z = thing.getChildAt(0);
						if (Utils.isFatalError(z)) {
							let r = systemState.getRoot();
							r.prependChild(wrapError('&szlig;', 'report-async-error: error found', z));
						}
					}
				})
			}
			return thing;
		},
		'Puts |nex at the top of the document if it is a fatal error. An error from something computing in the background has nowhere else to appear.'
	);

	Builtin.createBuiltin(
		'wait-for-nothing',
		[ ],
		function $waitForNothing(env, executionEnvironment) {
			let dv = constructDeferredValue();
			let afg = new ImmediateActivationFunctionGenerator();
			dv.set(afg);
			dv.activate();
			return dv;
		},
		'A deferred value that is already finished.'
	);

	Builtin.createBuiltin(
		'wait',
		[ 'nex?' ],
		function $wait(env, executionEnvironment) {
			let nex = env.lb('nex');
			let dv = constructDeferredValue();
			let afg = new CallbackActivationFunctionGenerator(nex);
			dv.set(afg);
			dv.activate();
			if (nex != UNBOUND) {
				dv.appendChild(nex);
			}
			return dv;
		},
		'A deferred value that waits until something settles or finishes it. |nex is its initial contents.'
	);
	Builtin.aliasBuiltin('wait-forever', 'wait');



	Builtin.createBuiltin(
		'wait-for-click',
		[ 'nex'],
		function $setClick(env, executionEnvironment) {
			let nex = env.lb('nex');
			let dv = constructDeferredValue();
			let afg = new ClickActivationFunctionGenerator(nex);
			dv.appendChild(nex);
			dv.set(afg);
			dv.activate();
			return dv;
		},
		'A deferred value that settles each time |nex is clicked.'
	);


	Builtin.createBuiltin(
		'do every',
		[ 'f&', 'interval#' ],
		function $doEvery(env, executionEnvironment) {
			let f = env.lb('f');
			let intervalnex = env.lb('interval');
			let ms = intervalnex.getTypedValue();
			if (!(ms > 0)) {
				return constructFatalError('do every: interval must be more than zero. Sorry!');
			}

			let id = nextLoopId++;
			let seq = 0;
			let afg = new EveryActivationFunctionGenerator(ms, function() {
				let cmd = systemState.getSCF().makeCommandWithClosureOneArg(f, constructInteger(seq));
				let r = systemState.getSCF().sEval2(cmd, BINDINGS, 'do every');
				seq++;
				if (Utils.isFatalError(r)) {
					afg.stop();
					delete runningLoops[id];
				}
				return r;
			}, f);

			let dv = constructDeferredValue();
			// a deferred renders and serializes through its first child
			// (comment by Claude)
			dv.appendChild(intervalnex);
			dv.set(afg);
			dv.activate();
			runningLoops[id] = afg;
			return dv;
		},
		'A deferred value that settles every |interval milliseconds with the result of |f. |f is given the iteration number.'
	);

	Builtin.createBuiltin(
		'wait-for-delay',
		[ 'time#' ],
		function $waitForDelay(env, executionEnvironment) {
			let timenex = env.lb('time');
			let time = timenex.getTypedValue();
			let dv = constructDeferredValue();
			dv.appendChild(timenex);
			let afg = new DelayActivationFunctionGenerator(time);
			dv.set(afg);
			dv.activate();
			return dv;
		},
		'A deferred value that finishes after |time milliseconds.'
	);

	Builtin.createBuiltin(
		'wait-for-contents-changed',
		[ 'nex()' ],
		function $waitForContentsChanged(env, executionEnvironment) {
			let nex = env.lb('nex');
			let dv = constructDeferredValue();
			dv.appendChild(nex);
			let afg = new OnContentsChangedActivationFunctionGenerator(nex);
			dv.set(afg);
			dv.activate();
			return dv;
		},
		'A deferred value that settles whenever the contents of |nex change.'
	);

	Builtin.createBuiltin(
		'wait-for-next-render',
		[ 'nex' ],
		function $waitForNextRender(env, executionEnvironment) {
			let nex = env.lb('nex');
			let dv = constructDeferredValue();
			dv.appendChild(nex);
			let afg = new OnNextRenderActivationFunctionGenerator(nex);
			dv.set(afg);
			dv.activate();
			return dv;
		},
		'A deferred value that finishes the next time |nex is drawn.'
	);
}

export { createAsyncBuiltins, stopAllLoops, anyLoopsRunning }

