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
import { EError } from '../nex/eerror.js'
import { Bool } from '../nex/bool.js'
import { Word } from '../nex/word.js'
import { EString } from '../nex/estring.js'
import { Integer } from '../nex/integer.js'

function createStringBuiltins() {

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  



	Builtin.createBuiltin(
		'concatenate-strings',
		[ 'str$...' ],
		function $stringCat(env, executionEnvironment) {
			let r = '';
			let ar = env.lb('str');
			for (let i = 0; i < ar.numChildren(); i++) {
				let s = ar.getChildAt(i).getFullTypedValue();
				r += s;
			}
			return new EString(r);
		},
		'concatenates the passed-in strings and returns the result.'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	

	Builtin.createBuiltin(
		'char-at in-string',
		[ 'pos#', 'str$',  ],
		function $stringCharAt(env, executionEnvironment) {
			let s = env.lb('str').getFullTypedValue();
			let n = env.lb('pos').getTypedValue();
			if (n < 0 || n >= s.length) {
				return new EError(`string-char-at: index ${n} is out of bounds of string "${s}" (must be between 0 and ${s.length - 1} inclusive). Sorry!`);
			}
			let c = s.charAt(n);
			return new EString(c);
		},
		'returns the character in |str at index position |pos.'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	

	Builtin.createBuiltin(
		'index-of-string in-string',
		[ 'tofind$', 'str$' ],
		function $stringIndexOf(env, executionEnvironment) {
			let s = env.lb('str').getFullTypedValue();
			let tofind = env.lb('tofind').getFullTypedValue();
			let i = s.indexOf(tofind);
			return new Integer(i);
		},
		'returns the index position of |tofind in |str.'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	

	Builtin.createBuiltin(
		'join-strings on',
		[ 'strs()', 'on$' ],
		function $stringJoinOn(env, executionEnvironment) {
			let lst = env.lb('strs');
			let on = env.lb('on').getFullTypedValue();
			let r = '';
			for (let i = 0; i < lst.numChildren(); i++) {
				r = `${r}${i > 0 ? on : ''}${lst.getChildAt(i).getFullTypedValue()}`;
			}
			return new EString(r);
		},
		'joins the string elements of |strs into a single string on the separator |on.'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  



	Builtin.createBuiltin(
		'length-of-string',
		[ 'str$' ],
		function $stringLength(env, executionEnvironment) {
			let s = env.lb('str').getFullTypedValue();
			let len = s.length;
			return new Integer(len);
		},
		'returns the length of (number of characters in) |str'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	

	Builtin.createBuiltin(
		'listify-string',
		[ 'str$' ],
		function $stringListify(env, executionEnvironment) {
			let r = new Word();
			let s = env.lb('str').getFullTypedValue();
			for (let i = 0; i < s.length; i++) {
				let c = s.charAt(i);
				let cc = new EString(c);
				r.appendChild(cc);
			}
			return r;
		},
		'turns a string into a list of strings of one-letter each, one for each letter in |str.'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	

	Builtin.createBuiltin(
		'split-on in-string',
		[ 'on$', 'str$' ],
		function $stringSplitOn(env, executionEnvironment) {
			let str = env.lb('str').getFullTypedValue();
			let on = env.lb('on').getFullTypedValue();
			let lst = new Word();
			let a = str.split(on);
			for (let i = 0; i < a.length; i++) {
				let strnex = new EString(a[i]);
				lst.appendChild(strnex);
			}
			return lst;
		},
		'splits |str into separate strings on the separator |on.'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	

	Builtin.createBuiltin(
		'from to in-string',
		[ 'start#', 'len#', 'str$' ],
		function $stringSubstring(env, executionEnvironment) {
			let str = env.lb('str').getFullTypedValue();
			let start = env.lb('start').getTypedValue();
			let len = env.lb('len').getTypedValue();
			let s = str.substring(start, len);
			return new EString(s);
		},
		'retrieves a substring of |str from |start to |len'
	);

	Builtin.createBuiltin(
		'is-empty-string',
		[ 'str$' ],
		function $isEmptyString(env, executionEnvironment) {
			let str = env.lb('str').getFullTypedValue();
			return new Bool(str == '');
		},
		'returns true if |str is the empty string.'
	);
}

export { createStringBuiltins }

