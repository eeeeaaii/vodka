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
import { Builtin } from '../nex/builtin.js'
import { constructWavetable } from '../nex/wavetable.js'
import { constructInteger } from '../nex/integer.js'
import { constructFloat } from '../nex/float.js'
import { UNBOUND } from '../environment.js'

/*
The wave versions of the math builtins. Each one is the ordinary function
applied a sample at a time, and each takes numbers or waves anywhere: with no
wave in sight you get a number back, which is why w+ 3 4 is 7 rather than a
one sample wave saying 7.

Waves of different lengths loop, so the result is as long as the longest
argument. That is what makes w* @sound 0.5 a volume change and w* @sound @env
an envelope, without either being a separate builtin.

Comparisons are signals, not booleans: 1 where the comparison holds and 0 where
it does not. w< @ramp 0.25 is a pulse a quarter of the way through.
*/

function isWave(n) {
	return n.getTypeName() == '-wavetable-';
}

// The result is as long as the longest wave, and shorter ones repeat inside
// it. valueAtSample already wraps, so there is nothing to do but ask for a
// sample past the end.
function longestOf(nexes) {
	let dur = 0;
	for (let i = 0; i < nexes.length; i++) {
		if (isWave(nexes[i])) {
			let d = nexes[i].getDuration();
			if (d > dur) dur = d;
		}
	}
	return dur;
}

function sampleGetters(nexes) {
	let r = [];
	for (let i = 0; i < nexes.length; i++) {
		let n = nexes[i];
		if (isWave(n)) {
			r.push(function(t) { return n.valueAtSample(t); });
		} else {
			let v = n.getTypedValue();
			r.push(function(t) { return v; });
		}
	}
	return r;
}

/*
f takes the argument values for one sample and returns the value for that
sample. Called once when nothing is a wave, and once per sample when something
is. wantsFloat says whether the number case has to come back as a float even
when every argument was an integer -- true of everything that can produce a
fraction, false of the comparisons and of + - and *.
*/
function applyOverSamples(nexes, f, wantsFloat) {
	let dur = longestOf(nexes);
	let getters = sampleGetters(nexes);

	if (dur == 0) {
		let vals = [];
		for (let i = 0; i < getters.length; i++) {
			vals.push(getters[i](0));
		}
		let v = f(vals);
		let foundFloat = wantsFloat;
		for (let i = 0; !foundFloat && i < nexes.length; i++) {
			if (Utils.isFloat(nexes[i])) foundFloat = true;
		}
		return foundFloat ? constructFloat(v) : constructInteger(v);
	}

	let r = constructWavetable(dur);
	let data = r.getData();
	let vals = new Array(getters.length);
	for (let t = 0; t < dur; t++) {
		for (let i = 0; i < getters.length; i++) {
			vals[i] = getters[i](t);
		}
		data[t] = f(vals);
	}
	r.init();
	return r;
}

// A variadic wave builtin's arguments arrive in a list. Passing one actual
// list rather than loose arguments means the list itself, the way gain and mix
// have always taken it.
function argsFrom(lst) {
	if (lst.numChildren() == 1 && lst.getChildAt(0).isNexContainer()) {
		lst = lst.getChildAt(0);
	}
	let r = [];
	for (let i = 0; i < lst.numChildren(); i++) {
		r.push(lst.getChildAt(i));
	}
	return r;
}

function createWaveMathBuiltins() {

	// f folds left across the arguments, so w- and w/ subtract and divide in
	// the order you wrote them.
	// identity is what you get for no arguments at all, the way + with nothing
	// to add is 0
	function variadic(name, f, identity, wantsFloat, docs) {
		Builtin.createBuiltin(
			name,
			[ 'args#%_...' ],
			function(env, executionEnvironment) {
				let args = argsFrom(env.lb('args'));
				if (args.length == 0) return constructInteger(identity);
				return applyOverSamples(args, function(v) {
					let acc = v[0];
					for (let i = 1; i < v.length; i++) {
						acc = f(acc, v[i]);
					}
					return acc;
				}, wantsFloat);
			},
			docs,
			true /* is infix */
		);
	}

	function unary(name, f, docs) {
		Builtin.createBuiltin(
			name,
			[ 'wt#%_' ],
			function(env, executionEnvironment) {
				return applyOverSamples([ env.lb('wt') ], function(v) {
					return f(v[0]);
				}, true /* a function of one number nearly always gives a fraction */);
			},
			docs
		);
	}

	function binary(name, f, wantsFloat, docs) {
		Builtin.createBuiltin(
			name,
			[ 'lhs#%_', 'rhs#%_' ],
			function(env, executionEnvironment) {
				return applyOverSamples([ env.lb('lhs'), env.lb('rhs') ], function(v) {
					return f(v[0], v[1]);
				}, wantsFloat);
			},
			docs,
			true /* is infix */
		);
	}

	// 1 where it holds and 0 where it does not, so a comparison is something
	// you can multiply by.
	function comparison(name, f, docs) {
		binary(name, function(a, b) { return f(a, b) ? 1 : 0; }, false, docs);
	}

	variadic('w+', function(a, b) { return a + b; }, 0, false,
		'Adds numbers and waves sample by sample. Shorter waves loop. With no waves at all you get a number.');
	variadic('w*', function(a, b) { return a * b; }, 1, false,
		'Multiplies numbers and waves sample by sample. Shorter waves loop. This is how you change volume and how you apply an envelope.');

	// one argument negates, the same as the number version
	Builtin.createBuiltin(
		'w-',
		[ 'min#%_', 'sub#%_?' ],
		function(env, executionEnvironment) {
			let a = env.lb('min');
			let b = env.lb('sub');
			if (b == UNBOUND) {
				return applyOverSamples([ a ], function(v) { return -v[0]; }, false);
			}
			return applyOverSamples([ a, b ], function(v) { return v[0] - v[1]; }, false);
		},
		'Subtracts |sub from |min sample by sample, or negates |min if |sub is left out. Shorter waves loop.',
		true /* is infix */
	);

	binary('w/', function(a, b) { return a / b; }, true,
		'Divides |lhs by |rhs sample by sample. Shorter waves loop.');

	comparison('w<', function(a, b) { return a < b; },
		'1 where |lhs is less than |rhs and 0 where it is not, sample by sample. Turns a ramp into a pulse.');
	comparison('w>', function(a, b) { return a > b; },
		'1 where |lhs is greater than |rhs and 0 where it is not, sample by sample.');
	comparison('w<=', function(a, b) { return a <= b; },
		'1 where |lhs is less than or equal to |rhs and 0 where it is not, sample by sample.');
	comparison('w>=', function(a, b) { return a >= b; },
		'1 where |lhs is greater than or equal to |rhs and 0 where it is not, sample by sample.');
	comparison('w=', function(a, b) { return a == b; },
		'1 where |lhs equals |rhs and 0 where it does not, sample by sample.');
	comparison('w<>', function(a, b) { return a != b; },
		'1 where |lhs differs from |rhs and 0 where it does not, sample by sample.');

	unary('wsin', Math.sin, 'The sine of every sample, in radians.');
	unary('wcos', Math.cos, 'The cosine of every sample, in radians.');
	unary('wtan', Math.tan, 'The tangent of every sample, in radians.');
	unary('wasin', Math.asin, 'The arcsine of every sample, in radians.');
	unary('wacos', Math.acos, 'The arccosine of every sample, in radians.');
	unary('watan', Math.atan, 'The arctangent of every sample, in radians.');
	unary('wexp', Math.exp, 'e raised to the power of every sample.');
	unary('wlog-e', Math.log, 'The natural logarithm of every sample.');
	unary('wlog-10', Math.log10, 'The base 10 logarithm of every sample.');
	unary('wlog-2', Math.log2, 'The base 2 logarithm of every sample.');
	unary('wsquare-root', Math.sqrt, 'The square root of every sample.');
	unary('wfloor', Math.floor, 'Every sample rounded down.');
	unary('wceiling', Math.ceil, 'Every sample rounded up.');
	unary('wround', Math.round, 'Every sample rounded to the nearest whole number.');

	binary('watan2', Math.atan2, true,
		'The arctangent of |lhs over |rhs, sample by sample, in radians.');
	binary('wpower', Math.pow, true,
		'|lhs raised to the power of |rhs, sample by sample.');
	binary('wnth-root', function(a, b) { return Math.pow(a, 1 / b); }, true,
		'The |rhs-th root of |lhs, sample by sample.');
	binary('wmodulo', function(a, b) { return a % b; }, false,
		'The remainder of |lhs divided by |rhs, sample by sample.');

	// These predate the w names and did exactly this, so they stay as the
	// names people already have in their documents.
	Builtin.aliasBuiltin('mix', 'w+');
	Builtin.aliasBuiltin('gain', 'w*');
}

export { createWaveMathBuiltins }
