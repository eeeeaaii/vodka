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
import { Word } from '../nex/word.js'
import { EString } from '../nex/estring.js'
import { Integer } from '../nex/integer.js'

function createStringBuiltins() {

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $stringCat(env, executionEnvironment) {
		let r = '';
		let ar = env.lb('str');
		for (let i = 0; i < ar.numChildren(); i++) {
			let s = ar.getChildAt(i).getFullTypedValue();
			r += s;
		}
		return new EString(r);
	}

	Builtin.createBuiltin(
		'string-cat',
		[ 'str$...' ],
		$stringCat,
		'concatenates the passed-in strings and returns the result.'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $stringCharAt(env, executionEnvironment) {
		let s = env.lb('str').getFullTypedValue();
		let n = env.lb('pos').getTypedValue();
		if (n < 0 || n >= s.length) {
			return new EError(`string-char-at: index ${n} is out of bounds of string "${s}" (must be between 0 and ${s.length - 1} inclusive). Sorry!`);
		}
		let c = s.charAt(n);
		return new EString(c);
	}

	Builtin.createBuiltin(
		'string-char-at',
		[ 'str$', 'pos#' ],
		$stringCharAt,
		'returns the character in |str at index position |pos.'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $stringIndexOf(env, executionEnvironment) {
		let s = env.lb('str').getFullTypedValue();
		let tofind = env.lb('tofind').getFullTypedValue();
		let i = s.indexOf(tofind);
		return new Integer(i);
	}

	Builtin.createBuiltin(
		'string-index-of',
		[ 'str$', 'tofind$' ],
		$stringIndexOf,
		'returns the index position of |tofind in |str.'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $stringJoinOn(env, executionEnvironment) {
		let lst = env.lb('strs');
		let on = env.lb('on').getFullTypedValue();
		let r = '';
		for (let i = 0; i < lst.numChildren(); i++) {
			r = `${r}${i > 0 ? on : ''}${lst.getChildAt(i).getFullTypedValue()}`;
		}
		return new EString(r);
	}

	Builtin.createBuiltin(
		'string-join-on',
		[ 'strs()', 'on$' ],
		$stringJoinOn,
		'joins the string elements of |strs into a single string on the separator |on.'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $stringLength(env, executionEnvironment) {
		let s = env.lb('str').getFullTypedValue();
		let len = s.length;
		return new Integer(len);
	}

	Builtin.createBuiltin(
		'string-length',
		[ 'str$' ],
		$stringLength,
		'returns the length of (number of characters in) |str'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $stringListify(env, executionEnvironment) {
		let r = new Word();
		let s = env.lb('str').getFullTypedValue();
		for (let i = 0; i < s.length; i++) {
			let c = s.charAt(i);
			let cc = new EString(c);
			r.appendChild(cc);
		}
		return r;
	}

	Builtin.createBuiltin(
		'string-listify',
		[ 'str$' ],
		$stringListify,
		'turns a string into a list of strings of one-letter each, one for each letter in |str.'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

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
	}

	Builtin.createBuiltin(
		'string-split-on',
		[ 'str$', 'on$' ],
		$stringSplitOn,
		'splits |str into separate strings on the separator |on.'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $stringSubstring(env, executionEnvironment) {
		let str = env.lb('str').getFullTypedValue();
		let start = env.lb('start').getTypedValue();
		let len = env.lb('len').getTypedValue();
		let s = str.substr(start, len);
		return new EString(s);
	}

	Builtin.createBuiltin(
		'string-substring',
		[ 'str$', 'start#', 'len#' ],
		$stringSubstring,
		'retrieves a substring of |str that is |len characters long starting at |start'
	);
}

export { createStringBuiltins }

