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

function createAsyncBuiltins() {
	Builtin.createBuiltin(
		'ff',
		[
			{name: 'exp,', type:'Expectation'},
		],
		function(env, argEnv) {
			// normalize exp
			let exp = env.lb('exp,');
			if (exp.ffed) {
				return new EError('ff: cannot fulfill an already-filled expectation');
			}
			exp.fulfill();
			return exp;
		}
	);

	Builtin.createBuiltin(
		'ff-with',
		[
			{name: 'exp,', type:'Expectation'},
			{name: 'nex', type:'*'}
		],
		function(env, argEnv) {
			// normalize exp
			let exp = env.lb('exp,');
			let val = env.lb('nex');

			let newexp = exp.makeCopy();
			newexp.checkChildren();
			newexp.setFFObject(val);
			return newexp;
		}
	);

	Builtin.createBuiltin(
		'ff-after-delay',
		[
			{name: 'exp,', type:'Expectation'},
			{name: 'time#', type:'Integer'}
		],
		function(env, argEnv) {
			let time = env.lb('time#').getTypedValue();
			let exp = env.lb('exp,');
			let newexp = exp.makeCopy();
			newexp.setTimeout(time);
			return newexp;
		}
	);

	Builtin.createBuiltin(
		'ff-after',
		[
			{name: 'exp1,', type:'Expectation'},
			{name: 'exp2,', type:'Expectation'}
		],
		function(env, argEnv) {
			let exp1 = env.lb('exp1,');
			let exp2 = env.lb('exp2,');
			exp2.addCompletionListener(exp1);
			return exp1;
		}
	);


	Builtin.createBuiltin(
		'ff-stop',
		[
			{name: 'exp,', type:'Expectation', optional:true}
		],
		function(env, argEnv) {
			let exp = env.lb('exp,');
			if (exp == UNBOUND) {
				TIMEOUTS_GEN++;
				return new Nil();
			} else {
				exp.stop();
				return exp;
			}
		}
	);

	Builtin.createBuiltin(
		'ff-unlimited',
		[
			{name: 'exp,', type:'Expectation'}
		],
		function(env, argEnv) {
			let exp = env.lb('exp,').makeCopy();
			exp.setUnlimited();
			return exp;
		}
	);

	Builtin.createBuiltin(
		'ff-every',
		[
			{name: 'exp,', type:'Expectation'},
			{name: 'time#', type:'Integer'}
		],
		function(env, argEnv) {
			let time = env.lb('time#').getTypedValue();
			let exp = env.lb('exp,');
			let newexp = exp.makeCopy();
			newexp.setUnlimited();
			newexp.setTimeoutEvery(time);
			return newexp;
		}
	);

	Builtin.createBuiltin(
		'ff-with-function',
		[
			{name: 'exp,', type:'Expectation'},
			{name: 'func&', type:'Lambda'}
		],
		function(env, argEnv) {
			let lambda = env.lb('func&');
			let exp = env.lb('exp,');
			// because we are making a copy, we check children
			// immediately - if we were not copying, we could
			// check children upon fulfillment
			let newexp = exp.makeCopy();
			newexp.checkChildren();
			newexp.setupFFWith(lambda, argEnv);
			return newexp;
		}
	);

	Builtin.createBuiltin(
		'ff-chain-after-child',
		[
			{name: 'exp1,', type:'Expectation'}
		],
		function(env, argEnv) {
			let exp1 = env.lb('exp1,');
			if (exp1.numChildren() == 0) {
				throw new EError("Hey so ff-after-child is used to chain an expectation after"
				+ " another one. This means that the expectation you pass into it"
				+ " needs to have one child. But the one you passed in is empty.");
			}
			if (exp1.numChildren() > 1) {
				throw new EError("Hey so ff-after-child is used to chain an expectation after"
				+ " another one. This means that the expectation you pass into it"
				+ " needs to have just one child. But the one you passed in has more than"
				+ " one child, so it's not clear which one we should chain it after.");

			}
			let exp2 = exp1.getChildAt(0);
			exp2.addCompletionListener(exp1);
			return exp1;
		}
	);

	Builtin.createBuiltin(
		'ff-chain-after',
		[
			{name: 'exp1,', type:'Expectation'},
			{name: 'exp2,', type:'Expectation'}
		],
		function(env, argEnv) {
			let exp1 = env.lb('exp1,');
			let exp2 = env.lb('exp2,');
			exp2.addCompletionListener(exp1);
			return exp1;
		}
	);
}