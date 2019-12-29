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

function createStringBuiltins() {
	Builtin.createBuiltin(
		'string-listify',
		[
			{name:'a0', type:'EString'}
		],
		function(env, argEnv) {
			let r = new Word();
			let s = env.lb('a0').getFullTypedValue();
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
		[
			{name:'a0', type:'EString'},
			{name:'a1', type:'Integer'}
		],
		function(env, argEnv) {
			let s = env.lb('a0').getFullTypedValue();
			let n = env.lb('a1').getTypedValue();
			if (n < 0 || n >= s.length) {
				return new EError(`string index out of bounds: ${n} for string "${s}"`)
			}
			let c = s.charAt(n);
			return new EString(c);
		}
	);

	Builtin.createBuiltin(
		'string-index-of',
		[
			{name:'a0', type:'EString'},
			{name:'a1', type:'EString'}
		],
		function(env, argEnv) {
			let s = env.lb('a0').getFullTypedValue();
			let tofind = env.lb('a1').getFullTypedValue();
			let i = s.indexOf(tofind);
			if (i == -1) {
				return new EError(`did not find "${tofind}" in "${s}"`)
			} else {
				return new Integer(i);
			}
		}
	);

	Builtin.createBuiltin(
		'string-length',
		[
			{name:'a0', type:'EString'}
		],
		function(env, argEnv) {
			let s = env.lb('a0').getFullTypedValue();
			let len = s.length;
			return new Integer(len);
		}
	);

	Builtin.createBuiltin(
		'string-cat',
		[
			{name:'a0', type: 'EString', variadic:true}
		],
		function(env, argEnv) {
			let r = '';
			let ar = env.lb('a0');
			for (let i = 0; i < ar.numChildren(); i++) {
				let s = ar.getChildAt(i).getFullTypedValue();
				r += s;
			}
			return new EString(r);
		}
	);

	Builtin.createBuiltin(
		'string-eq',
		[
			{name:'a0', type: 'EString'},
			{name:'a1', type: 'EString'}
		],
		function(env, argEnv) {
			let s1 = env.lb('a0').getFullTypedValue();
			let s2 = env.lb('a1').getFullTypedValue();
			return new Bool(s1 === s2);
		}
	);
}