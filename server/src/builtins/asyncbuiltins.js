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
import { Nil } from '../nex/nil.js'
import { EError } from '../nex/eerror.js'
import { Org } from '../nex/org.js'
import { UNBOUND } from '../environment.js'
import { Lambda } from '../nex/lambda.js'
import { experiments } from '../globalappflags.js'
import { Tag } from '../tag.js'
import { DeferredValue } from '../nex/deferredvalue.js'
import { incFFGen } from '../gc.js'
import { Bool } from '../nex/bool.js'; 
import { systemState } from '../systemstate.js'
import { evaluateNexSafely, wrapError } from '../evaluator.js'


import {
	ImmediateActivationFunctionGenerator,
	DelayActivationFunctionGenerator,
	ClickActivationFunctionGenerator,
	OnContentsChangedActivationFunctionGenerator,
	CallbackActivationFunctionGenerator,
	OnNextRenderActivationFunctionGenerator
} from '../asyncfunctions.js'



function createAsyncBuiltins() {

	Builtin.createBuiltin(
		'cancel-deferred',
		[ 'def*?' ],
		function $cancelDeferred(env, executionEnvironment) {
			let def = env.lb('def');
			if (def == UNBOUND) {
				incFFGen();
				return new Nil();
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
			let r = new Bool(isF);
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
			let dv = new DeferredValue();
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
			let dv = new DeferredValue();
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
			let dv = new DeferredValue();
			let afg = new ClickActivationFunctionGenerator(nex);
			dv.appendChild(nex);
			dv.set(afg);
			dv.activate();
			return dv;
		},
		'Returns a deferred value that settles every time |nex is clicked on.'
	);

	Builtin.createBuiltin(
		'wait-for-delay',
		[ 'time#' ],
		function $waitForDelay(env, executionEnvironment) {
			let timenex = env.lb('time');
			let time = timenex.getTypedValue();
			let dv = new DeferredValue();
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
			let dv = new DeferredValue();
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
			let dv = new DeferredValue();
			dv.appendChild(nex);
			let afg = new OnNextRenderActivationFunctionGenerator(nex);
			dv.set(afg);
			dv.activate();
			return dv;
		},
		'Returns a deferred value that finishes the next time |nex is rendered to the screen.'
	);
}

export { createAsyncBuiltins }

