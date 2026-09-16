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
		'The value |nex has produced so far. A deferred value that has settled or finished gives what it holds; anything that is not deferred is its own latest value. Something still waiting for its first result has no latest, and asking is an error -- use has-latest to find out first. Note this is not the same as evaluating |nex, which hands back the deferred value itself until it has finished for good.'
	);

	Builtin.createBuiltin(
		'has-latest',
		[ 'nex' ],
		function $hasLatest(env, executionEnvironment) {
			return constructBool(hasLatest(env.lb('nex')));
		},
		'Whether |nex has produced a value yet, which is what says whether latest can be asked. True for anything that is not deferred, and for a deferred value that has settled or finished. False only while something is still waiting for its first result.'
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
		'Cancels the optional deferred argument |def (it will never complete), or, if no arguments are provided, cancels all unfinished deferreds known by the system.'
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
		'Settles the deferred value.'
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
		'Finishes the deferred value.'
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
		'Returns true if the deferred value is finished.'
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
		'If the argument evaluates to a fatal error, this function reports that error in an obvious place at the root level so the user can see it. Useful for situations where a process is computing asynchronously and may or may not return an error.'
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
		'Returns a deferred value that finishes immediately.'
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
		'Returns a deferred value that waits forever until manually settled or finished. If passed in, |nex will be the initial contents of the deferred value.'
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
		'Returns a deferred value that settles every time |nex is clicked on.'
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
		'Returns a deferred value that settles every |interval milliseconds with whatever |f returned. |f is passed the iteration number.'
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
		'Returns a deferred value that waits for |time milliseconds, then finishes.'
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
		'Returns a deferred value that settles when contents of |nex are changed.'
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
		'Returns a deferred value that finishes the next time |nex is rendered to the screen.'
	);
}

export { createAsyncBuiltins, stopAllLoops, anyLoopsRunning }

