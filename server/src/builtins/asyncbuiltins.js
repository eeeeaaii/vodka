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
import { Expectation, incFFGen } from '../nex/expectation.js'
import { UNBOUND } from '../environment.js'
import { Lambda } from '../nex/lambda.js'
import { evaluateNexSafely } from '../evaluator.js'
import { experiments } from '../globalappflags.js'
import { Tag } from '../tag.js'

import {
	ImmediateActivationFunctionGenerator,
	DelayActivationFunctionGenerator,
	ClickActivationFunctionGenerator,
	ContentsChangedActivationFunctionGenerator
} from '../asyncfunctions.js'



function createAsyncBuiltins() {

	Builtin.createBuiltin(
		'activate',
		[ 'exp1*'],
		function $activate(env, executionEnvironment) {
			let exp1 = env.lb('exp1');
			exp1.activate();
			return exp1; // or 2?
		},
		'activates the expectation.'
	);

	Builtin.createBuiltin(
		'cancel-fulfill',
		[ 'exp*?' ],
		function $cancelFf(env, executionEnvironment) {
			let exp = env.lb('exp');
			if (exp == UNBOUND) {
				incFFGen();
				return new Nil();
			} else {
				exp.cancel();
				return exp;
			}
		},
		'cancels the optional argument |exp (it will never fulfill), or, if no args, cancels all unfulfilled expectations.'
	);
	Builtin.aliasBuiltin('cancel-ff', 'cancel-fulfill');


	Builtin.createBuiltin(
		'exp-gc',
		[],
		function $expGc(env, executionEnvironment) {
			eventQueueDispatcher.enqueueGC();
			return new Nil();
		},
		'attempts to cancel any unfulfilled expectations that are not visible on the screen.'
	);

	Builtin.createBuiltin(
		'get-and-then',
		[ 'exp*'],
		function $ffOf(env, executionEnvironment) {
			let exp = env.lb('exp');
			let c = exp.getFFClosure();
			if (!c) {
				return new Nil();
			} else {
				return c;
			}
		},
		'retrieves the and-then-function for |exp (or nil, if it doesn\'t have one).'
	);
	Builtin.aliasBuiltin('ff-of', 'get-and-then');


	Builtin.createBuiltin(
		'and-then',
		[ 'exp*', 'val' ],
		function $ffWith(env, executionEnvironment) {
			let ff = env.lb('val');
			if (ff.getTypeName() != '-closure-') {
				let argstring = ' a';
				let children = [ ff ];
				let lambda = Lambda.makeLambda(argstring, children);
				ff = evaluateNexSafely(lambda, executionEnvironment);
			}
			let exp = env.lb('exp');
			exp.ffWith(ff, executionEnvironment);
			return exp;
		},
		'sets the and-then-function of |exp to be |val (if it\'s a closure), or a closure that returns |val (if it\'s not).'
	);
	Builtin.aliasBuiltin('ff-with', 'and-then');

	Builtin.createBuiltin(
		'reset',
		[ 'exp*' ],
		function $reset(env, executionEnvironment) {
			let exp = env.lb('exp');
			exp.reset();
			return exp;
		},
		'if |exp has been fulfilled, resets it so that it can be activated again.'
	);

	Builtin.createBuiltin(
		'autoreset',
		[ 'exp*' ],
		function $setDelay(env, executionEnvironment) {
			let exp = env.lb('exp');
			exp.setAutoreset(true);
			return exp;
		},
		'makes it so that |exp automatically resets itself after being fulfilled (so it can be used again).'
	);

	Builtin.createBuiltin(
		'noautoreset',
		[ 'exp*' ],
		function $setDelay(env, executionEnvironment) {
			let exp = env.lb('exp');
			exp.setAutoreset(false);
			return exp;
		},
		'makes it so that |exp automatically resets itself after being fulfilled (so it can be used again).'
	);

	Builtin.createBuiltin(
		'wait-for-nothing',
		[ 'exp*'],
		function $setNothing(env, executionEnvironment) {
			let exp = env.lb('exp');
			let afg = new ImmediateActivationFunctionGenerator();
			exp.set(afg);
			return exp;
		},
		'wait-fors |exp to wait for nothing (fulfill immediately).'
	);
	Builtin.aliasBuiltin('set-immediate', 'wait-for-nothing');
	Builtin.aliasBuiltin('set-nothing', 'wait-for-nothing');


	Builtin.createBuiltin(
		'wait-for-delay',
		[ 'exp*', 'time#' ],
		function $setDelay(env, executionEnvironment) {
			let time = env.lb('time').getTypedValue();
			let exp = env.lb('exp');
			let afg = new DelayActivationFunctionGenerator(time);
			exp.set(afg);
			return exp;
		},
		'wait-fors |exp to fulfill after the specified delay (in milliseconds).'
	);
	Builtin.aliasBuiltin('set-delay', 'wait-for-delay');

	Builtin.createBuiltin(
		'wait-for-click',
		[ 'exp*' ],
		function $setClick(env, executionEnvironment) {
			let exp = env.lb('exp');
			if (exp.numChildren() > 1) {
				return new EError('wait-for-click: more than one clickable object unsupported');
			}
			if (exp.numChildren() == 0) {
				return new EError('wait-for-click: must have at least one clickable object');
			}
			let afg = new ClickActivationFunctionGenerator();
			exp.set(afg);
			return exp;
		},
		'wait-fors |exp to fulfill when clicked on.'
	);
	Builtin.aliasBuiltin('set-click', 'wait-for-click');

	Builtin.createBuiltin(
		'wait-for-contents-changed',
		[ 'exp*' ],
		function $setContentsChanged(env, executionEnvironment) {
			let exp = env.lb('exp');
			let afg = new ContentsChangedActivationFunctionGenerator();
			exp.set(afg);
			return exp;
		},
		'wait-fors |exp to fulfill when the contents of its children change.'
	);
	Builtin.aliasBuiltin('set-contents-changed', 'wait-for-contents-changed');

}

export { createAsyncBuiltins }

