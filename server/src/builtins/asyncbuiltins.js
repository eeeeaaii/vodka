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
		'chain',
		[
			{name:'lst...', type:'*', variadic:true}
		],
		function(env, argEnv) {
			// The first one can be any type of nex.
			// if it's an expectation, we treat it differently
			// than otherwise.
			let lst = env.lb('lst...');
			if (lst.numChildren() == 0) {
				return new EError("chain: cannot chain without at least one expectation")
			}
			let first = lst.getChildAt(0);
			if (lst.numChildren() == 1 && !(first.getTypeName() == '-expectation-')) {
				return new EError("chain: cannot chain without at least one expectation")				
			}
			let explist = [];
			if (first.getTypeName() == "-expectation-") {
				explist[0] = first;
			} else {
				let firstExp = new Expectation();
				firstExp.appendChild(first);
				explist[0] = firstExp;
			}
			for (let i = 1; i < lst.numChildren(); i++) {
				explist[i] = lst.getChildAt(i);
			}
			let toFF = explist[0];
			let p = toFF;
			for (let j = 1; j < explist.length; j++) {
				let e = explist[j];
				p.addCompletionListener(e);
				p.appendChild(e);
				p = e;
			}
			for (let k = explist.length - 1; k > 0; k--) {
				explist[k].appendChild(explist[k - 1]);
			}
			toFF.fulfill();
			return toFF;
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
			if (exp.isSet()) {
				return new EError('cannot set an already-set expectation');
			}
			exp.set(exp.createFulfillWithNex(val));
			return exp;
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
			if (exp.isSet()) {
				return new EError('cannot set an already-set expectation');
			}
			exp.set(exp.createFulfillWithLambda(lambda, argEnv));
			return exp;
		}
	);

	Builtin.createBuiltin(
		'ff-with-delay',
		[
			{name: 'exp,', type:'Expectation'},
			{name: 'time#', type:'Integer'}
		],
		function(env, argEnv) {
			let time = env.lb('time#').getTypedValue();
			let exp = env.lb('exp,');
			if (exp.isSet()) {
				return new EError('cannot set an already-set expectation');
			}
			exp.set(exp.createFulfillWithTimeout(time));
			return exp;
		}
	);

	Builtin.createBuiltin(
		'stop-next-ff',
		[
			{name: 'exp,', type:'Expectation', optional:true}
		],
		function(env, argEnv) {
			let exp = env.lb('exp,');
			if (exp == UNBOUND) {
				FF_GEN++;
				return new Nil();
			} else {
				exp.stop();
				return exp;
			}
		}
	);

	Builtin.createBuiltin(
		'set-repeatable-ff',
		[
			{name: 'exp,', type:'Expectation'}
		],
		function(env, argEnv) {
			let exp = env.lb('exp,');
			exp.setUnlimited();
			return exp;
		}
	);

	// everything below this is deprecated





	// deprecated, instead just make it so you can
	// chain an expectation to fulfill after itself, i.e.
	// (ff-after @foo @foo)
	// and make it so that it can be repeatedly fulfilled
	// by setting it to unlimited or neverending or whatever
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