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
import { evaluateNexSafely } from '../evaluator.js'
import { experiments } from '../globalappflags.js'
import { Tag } from '../tag.js'
import { DeferredValue } from '../nex/deferredvalue.js'
import { incFFGen } from '../gc.js'

import {
	ImmediateActivationFunctionGenerator,
	DelayActivationFunctionGenerator,
	ClickActivationFunctionGenerator
} from '../asyncfunctions.js'



function createAsyncBuiltins() {

	Builtin.createBuiltin(
		'activate',
		[ 'def*'],
		function $activate(env, executionEnvironment) {
			let def = env.lb('def');
			def.activate();
			return def; // or 2?
		},
		'Activates an unactivated deferred |def. Most deferreds are activated by default when they are created, so this is likely not needed in most cases.'
	);

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
		'cancels the optional deferred argument |def (it will never complete), or, if no arguments are provided, cancels all unfinished deferreds known by the system.'
	);

	// deprecated, whether something is visible on the screen or not is kind of irrelevant.
	// you might want to cancel ALL unfulfilled deferreds if you paint yourself in a corner.
	// Builtin.createBuiltin(
	// 	'exp-gc',
	// 	[],
	// 	function $expGc(env, executionEnvironment) {
	// 		eventQueueDispatcher.enqueueGC();
	// 		return new Nil();
	// 	},
	// 	'attempts to cancel any unfulfilled deferreds that are not visible on the screen.'
	// );

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
		'wait-for-click',
		[ 'nex'],
		function $setClick(env, executionEnvironment) {
			let nex = env.lb('nex');
			let dv = new DeferredValue();
			let afg = new ClickActivationFunctionGenerator(nex);
			dv.set(afg);
			dv.activate();
			return dv;
		},
		'returns a deferred value that settles every time |nex is clicked on.'
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
		'returns a deferred value that waits for |time milliseconds, then finishes.'
	);


}

export { createAsyncBuiltins }

