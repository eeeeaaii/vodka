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

import { Builtin } from '../nex/builtin.js'
import { EError } from '/nex/eerror.js'
import { Word } from '/nex/word.js'
import { EString } from '/nex/estring.js'
import { Integer } from '/nex/integer.js'

function createStringBuiltins() {
	Builtin.createBuiltin(
		'string-listify',
		[ 'str$' ],
		function(env, executionEnvironment) {
			let r = new Word();
			let s = env.lb('str').getFullTypedValue();
			for (let i = 0; i < s.length; i++) {
				let c = s.charAt(i);
				let cc = new EString(c);
				r.appendChild(cc);
			}
			return r;
		}
	);

	Builtin.createBuiltin(
		'string-char-at',
		[ 'str$', 'pos#' ],
		function(env, executionEnvironment) {
			let s = env.lb('str').getFullTypedValue();
			let n = env.lb('pos').getTypedValue();
			if (n < 0 || n >= s.length) {
				return new EError(`So the function string-char-at`
					+ ` needs you to pass in the index of`
					+ ` the char you want to pull out.`
					+ ` The string you are working with here`
					+ ` is ${s}, which goes from index [0] to index [${s.length - 1}].`
					+ ` But you passed in [${n}], which is outside the bounds`
					+ ` of the string.`);
			}
			let c = s.charAt(n);
			return new EString(c);
		}
	);

	Builtin.createBuiltin(
		'string-index-of',
		[ 'str$', 'tofind$' ],
		function(env, executionEnvironment) {
			let s = env.lb('str').getFullTypedValue();
			let tofind = env.lb('tofind').getFullTypedValue();
			let i = s.indexOf(tofind);
			return new Integer(i);
		}
	);

	Builtin.createBuiltin(
		'string-length',
		[ 'str$' ],
		function(env, executionEnvironment) {
			let s = env.lb('str').getFullTypedValue();
			let len = s.length;
			return new Integer(len);
		}
	);

	Builtin.createBuiltin(
		'string-cat',
		[ 'str$...' ],
		function(env, executionEnvironment) {
			let r = '';
			let ar = env.lb('str');
			for (let i = 0; i < ar.numChildren(); i++) {
				let s = ar.getChildAt(i).getFullTypedValue();
				r += s;
			}
			return new EString(r);
		}
	);

	Builtin.createBuiltin(
		'string-join-on',
		[ 'strs()', 'on$' ],
		function(env, executionEnvironment) {
			let lst = env.lb('strs');
			let on = env.lb('on').getFullTypedValue();
			let r = '';
			for (let i = 0; i < lst.numChildren(); i++) {
				r = `${r}${i > 0 ? on : ''}${lst.getChildAt(i).getFullTypedValue()}`;
			}
			return new EString(r);
		}
	);

	Builtin.createBuiltin(
		'string-split-on',
		[ 'str$', 'on$' ],
		function(env, executionEnvironment) {
			let str = env.lb('str').getFullTypedValue();
			let on = env.lb('on').getFullTypedValue();
			let lst = new Word();
			let a = str.split(on);
			for (let i = 0; i < a.length; i++) {
				let strnex = new EString(a[i]);
				lst.appendChild(strnex);
			}
			return lst;
		}
	);

	Builtin.createBuiltin(
		'string-split-on',
		[ 'str$', 'on$' ],
		function(env, executionEnvironment) {
			let str = env.lb('str').getFullTypedValue();
			let on = env.lb('on').getFullTypedValue();
			let lst = new Word();
			let a = str.split(on);
			for (let i = 0; i < a.length; i++) {
				let strnex = new EString(a[i]);
				lst.appendChild(strnex);
			}
			return lst;
		}
	);

	Builtin.createBuiltin(
		'string-substring',
		[ 'str$', 'start#', 'len#' ],
		function(env, executionEnvironment) {
			let str = env.lb('str').getFullTypedValue();
			let start = env.lb('start').getTypedValue();
			let len = env.lb('len').getTypedValue();
			let s = str.substr(start, len);
			return new EString(s);
		}
	);}

export { createStringBuiltins }

