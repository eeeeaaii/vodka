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
import { constructBool } from '../nex/bool.js'
import { constructFatalError } from '../nex/eerror.js'
import { markWorksOnWaves } from '../documentation.js'
import { hasCommandTag } from '../wavetablefunctions.js'

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

/*
A wave shorter than the longest one has to answer for samples it does not have.
By default it cycles -- a one bar drum part under a four bar line plays four
times, which is nearly always what was meant, and padding with silence is how
you ask for it to stop.

Tagged nocycle it reads as silence past its end instead, for the times you want
the shorter one to happen once.

Not called nowrap: wrap already means something else on a wave, which is the
tail of a delay coming back round to the beginning rather than the whole wave
repeating to fill a length.

(comment by Claude)
*/
function sampleGetters(nexes, nocycle) {
	let r = [];
	for (let i = 0; i < nexes.length; i++) {
		let n = nexes[i];
		if (isWave(n)) {
			if (nocycle) {
				let dur = n.getDuration();
				r.push(function(t) { return t < dur ? n.valueAtSample(t) : 0; });
			} else {
				r.push(function(t) { return n.valueAtSample(t); });
			}
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
function applyOverSamples(nexes, f, wantsFloat, nocycle) {
	let dur = longestOf(nexes);
	let getters = sampleGetters(nexes, nocycle);

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

/*
Every one of these is registered under its ordinary name -- +, sin, modulo --
and the w-prefixed name is kept as an alias. There is no such thing as wave
arithmetic separate from arithmetic: a wave is a thing you can add, and having
two families of operator meant remembering which one you were holding.

What a wave does to the result is decided per operation rather than by a rule.
Giving a wave to something makes the answer a wave, and everything else follows
the number version exactly: dividing two whole numbers still floors, comparing
two numbers still gives you a bool rather than a 1.
*/
function registerAsBoth(name, waveName) {
	Builtin.aliasBuiltin(waveName, name);
	markWorksOnWaves(name);
}

/*
Scalars go one way and waves the other. Without this a comparison of two
numbers would come back as 1 or 0 rather than as a bool, and if would stop
taking it.
*/
function scalarOrWave(nexes, sampleFn, scalarFn, wantsFloat, nocycle) {
	for (let i = 0; i < nexes.length; i++) {
		if (isWave(nexes[i])) {
			return applyOverSamples(nexes, sampleFn, wantsFloat, nocycle);
		}
	}
	return scalarFn(nexes);
}

function createWaveMathBuiltins() {

	// f folds left across the arguments, so w- and w/ subtract and divide in
	// the order you wrote them.
	// identity is what you get for no arguments at all, the way + with nothing
	// to add is 0
	function variadic(name, waveName, f, identity, wantsFloat, docs) {
		Builtin.createBuiltin(
			name,
			[ 'args#%_...' ],
			function(env, executionEnvironment, commandTags) {
				let args = argsFrom(env.lb('args'));
				if (args.length == 0) return constructInteger(identity);
				return applyOverSamples(args, function(v) {
					let acc = v[0];
					for (let i = 1; i < v.length; i++) {
						acc = f(acc, v[i]);
					}
					return acc;
				}, wantsFloat, hasCommandTag(commandTags, 'nocycle'));
			},
			docs,
			true /* is infix */
		);
		registerAsBoth(name, waveName);
	}

	// wantsFloat because a function of one number nearly always gives a
	// fraction -- but not always, and abs of a whole number is a whole number
	function unary(name, waveName, f, docs, wantsFloat) {
		Builtin.createBuiltin(
			name,
			[ 'wt#%_' ],
			function(env, executionEnvironment) {
				return applyOverSamples([ env.lb('wt') ], function(v) {
					return f(v[0]);
				}, wantsFloat === undefined ? true : wantsFloat);
			},
			docs
		);
		registerAsBoth(name, waveName);
	}

	function binary(name, waveName, f, wantsFloat, docs, scalarFn) {
		Builtin.createBuiltin(
			name,
			[ 'lhs#%_', 'rhs#%_' ],
			function(env, executionEnvironment, commandTags) {
				let nexes = [ env.lb('lhs'), env.lb('rhs') ];
				let sample = function(v) { return f(v[0], v[1]); };
				let nocycle = hasCommandTag(commandTags, 'nocycle');
				if (!scalarFn) {
					return applyOverSamples(nexes, sample, wantsFloat, nocycle);
				}
				return scalarOrWave(nexes, sample, scalarFn, wantsFloat, nocycle);
			},
			docs,
			true /* is infix */
		);
		registerAsBoth(name, waveName);
	}

	/*
	Two numbers give a bool, the way comparing numbers always has -- if takes
	one of those and would not know what to do with a 1.

	Bring a wave into it and there is no bool that could describe the answer,
	so it is 1 where the comparison holds and 0 where it does not: a wave you
	can multiply by, which is what makes it useful for gating.
	*/
	function comparison(name, waveName, f, docs) {
		binary(name, waveName, function(a, b) { return f(a, b) ? 1 : 0; }, false, docs,
			function(nexes) {
				return constructBool(f(nexes[0].getTypedValue(), nexes[1].getTypedValue()));
			});
	}

	variadic('+', 'w+', function(a, b) { return a + b; }, 0, false,
		'Adds the arguments. A wave anywhere gives a wave, added sample by sample, shorter ones cycling to fill. Tag the command nocycle to read a short wave as silence past its end.');
	variadic('*', 'w*', function(a, b) { return a * b; }, 1, false,
		'Multiplies the arguments. A wave anywhere gives a wave, multiplied sample by sample, shorter ones cycling to fill. On waves this is volume, and this is how an envelope is applied. Tag the command nocycle to read a short wave as silence past its end.');

	// one argument negates, the same as the number version
	Builtin.createBuiltin(
		'-',
		[ 'min#%_', 'sub#%_?' ],
		function(env, executionEnvironment) {
			let a = env.lb('min');
			let b = env.lb('sub');
			if (b == UNBOUND) {
				return applyOverSamples([ a ], function(v) { return -v[0]; }, false);
			}
			return applyOverSamples([ a, b ], function(v) { return v[0] - v[1]; }, false);
		},
		'Subtracts |sub from |min, or negates |min if |sub is left out. A wave anywhere gives a wave, subtracted sample by sample, shorter ones cycling to fill. Tag the command nocycle to read a short wave as silence past its end.',
		true /* is infix */
	);
	registerAsBoth('-', 'w-');

	/*
	Two whole numbers still give a whole number, and dividing by zero is still
	an error -- that is the number version and it does not change because the
	same name can now take a wave. Sample by sample there is no zero to check
	for and nothing sensible to do about one, so a wave divides the way
	javascript divides.
	*/
	binary('/', 'w/', function(a, b) { return a / b; }, true,
		'Divides |lhs by |rhs. Two whole numbers give a whole number, rounded down; a float anywhere gives a float. A wave anywhere gives a wave, shorter ones cycling to fill. Tag the command nocycle to read a short wave as silence past its end.',
		function(nexes) {
			let a = nexes[0];
			let b = nexes[1];
			if (b.getTypedValue() == 0) {
				return constructFatalError('divide: cannot divide by zero, Sorry!');
			}
			let result = a.getTypedValue() / b.getTypedValue();
			if (Utils.isFloat(a) || Utils.isFloat(b)) {
				return constructFloat(result);
			}
			return constructInteger(Math.floor(result));
		});

	comparison('<', 'w<', function(a, b) { return a < b; },
		'1 where |lhs is less than |rhs and 0 where it is not, sample by sample. Turns a ramp into a pulse.');
	comparison('>', 'w>', function(a, b) { return a > b; },
		'1 where |lhs is greater than |rhs and 0 where it is not, sample by sample.');
	comparison('<=', 'w<=', function(a, b) { return a <= b; },
		'1 where |lhs is less than or equal to |rhs and 0 where it is not, sample by sample.');
	comparison('>=', 'w>=', function(a, b) { return a >= b; },
		'1 where |lhs is greater than or equal to |rhs and 0 where it is not, sample by sample.');
	comparison('=', 'w=', function(a, b) { return a == b; },
		'1 where |lhs equals |rhs and 0 where it does not, sample by sample.');
	comparison('<>', 'w<>', function(a, b) { return a != b; },
		'1 where |lhs differs from |rhs and 0 where it does not, sample by sample.');

	unary('sin', 'wsin', Math.sin, 'The sine of every sample, in radians.');
	unary('cos', 'wcos', Math.cos, 'The cosine of every sample, in radians.');
	unary('tan', 'wtan', Math.tan, 'The tangent of every sample, in radians.');
	unary('asin', 'wasin', Math.asin, 'The arcsine of every sample, in radians.');
	unary('acos', 'wacos', Math.acos, 'The arccosine of every sample, in radians.');
	unary('atan', 'watan', Math.atan, 'The arctangent of every sample, in radians.');
	unary('exp', 'wexp', Math.exp, 'e raised to the power of every sample.');
	unary('log-e', 'wlog-e', Math.log, 'The natural logarithm of every sample.');
	unary('log-10', 'wlog-10', Math.log10, 'The base 10 logarithm of every sample.');
	unary('log-2', 'wlog-2', Math.log2, 'The base 2 logarithm of every sample.');
	unary('square-root', 'wsquare-root', Math.sqrt, 'The square root of every sample.');
	unary('floor', 'wfloor', Math.floor, 'Every sample rounded down.');
	unary('ceiling', 'wceiling', Math.ceil, 'Every sample rounded up.');
	unary('round', 'wround', Math.round, 'Every sample rounded to the nearest whole number.');
	unary('abs', 'wabs', Math.abs,
		'The absolute value of |wt, so anything below zero is flipped above it. A whole number gives a whole number; a wave gives a wave.',
		false /* whole number in, whole number out, the way the number version has always behaved */);

	binary('atan2', 'watan2', Math.atan2, true,
		'The arctangent of |lhs over |rhs, sample by sample, in radians.');
	binary('power', 'wpower', Math.pow, true,
		'|lhs raised to the power of |rhs, sample by sample.');
	binary('nth-root', 'wnth-root', function(a, b) { return Math.pow(a, 1 / b); }, true,
		'The |rhs-th root of |lhs, sample by sample.');
	binary('modulo', 'wmodulo', function(a, b) { return a % b; }, false,
		'The remainder of |lhs divided by |rhs, sample by sample.');

	/*
	These predate the w names and did exactly this a sample at a time, so they
	stay as the names people already have in their documents rather than as
	four more copies of the same loop.

	offset gains a fix by becoming an alias: its loop started at sample 1, so
	the first sample of anything it returned was always zero.
	*/
	Builtin.aliasBuiltin('mix', 'w+');
	Builtin.aliasBuiltin('gain', 'w*');
	Builtin.aliasBuiltin('offset', 'w+');
	Builtin.aliasBuiltin('invert', 'w-');
	Builtin.aliasBuiltin('full-rectify', 'wabs');
}

export { createWaveMathBuiltins }
