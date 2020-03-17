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


function createTypeConversionBuiltins() {
	Builtin.createBuiltin(
		'to-word',
		[
			{name: 'nex', type:'*'},
		],
		function(env, argEnv) {
			let v = env.lb('nex');

			let jsStringToDoc = (function(str) {
				var w = new Word();
				for (let i = 0; i < str.length; i++) {
					let lt = new Letter(str.charAt(i));
					w.appendChild(lt);
				}
				return w;
			});
			if (v instanceof Integer
				|| v instanceof Float
				|| v instanceof Bool
				) {
				return jsStringToDoc('' + v.getTypedValue())
			} else if (v instanceof EString) {
				return jsStringToDoc('' + v.getFullTypedValue())
			} else if (v instanceof Letter) {
				let w = new Word();
				w.appendChild(v.makeCopy());
				return w;
			} else if (v instanceof Line || v instanceof Doc) {
				return new EError('not yet implemented')
			} else {
				return new EError('Could not convert to word');
			}
		}
	)



	Builtin.createBuiltin(
		'to-float',
		[
			{name: 'nex', type:'*'},
		],
		function(env, argEnv) {
			let v = env.lb('nex');
			if (v instanceof Float) {
				return v;
			} else if (v instanceof Integer) {
				return new Float(v.getTypedValue());
			} else if (v instanceof Bool) {
				return v.getTypedValue() ? new Float(1): new Float(0);
			} else if (v instanceof EString) {
				let s = v.getFullTypedValue();
				let mayben = parseFloat(s);
				if (Number.isNaN(mayben)) {
					return new EError('Could not convert string to float');					
				} else {
					return new Float(mayben);
				}
			} else if (v instanceof Letter) {
				// could be a number.
				let s = v.getText();
				let mayben = parseFloat(s);
				if (Number.isNaN(mayben)) {
					return new EError('Could not convert letter to float');					
				} else {
					return new Float(mayben);
				}
			} else if (v instanceof Word || v instanceof Line || v instanceof Doc) {
				// could be a number.
				let s = v.getValueAsString();
				let mayben = parseFloat(s);
				if (Number.isNaN(mayben)) {
					// rofl
					let errstr = v instanceof Word
						? 'word'
						: ((v instanceof Line)
							? 'line'
							: 'doc');
					return new EError('Could not convert ' + errstr + ' to float');
				} else {
					return new Float(mayben);
				}
			} else {
				return new EError('Could not convert to float');
			}
		}
	)

	Builtin.createBuiltin(
		'to-integer',
		[
			{name: 'nex', type:'*'},
		],
		function(env, argEnv) {
			let v = env.lb('nex');
			if (v instanceof Integer) {
				return v;
			} else if (v instanceof Float) {
				return new Integer(Math.floor(v.getTypedValue()));
			} else if (v instanceof Bool) {
				return v.getTypedValue() ? new Integer(1): new Integer(0);
			} else if (v instanceof EString) {
				let s = v.getFullTypedValue();
				let mayben = parseInt(s);
				if (Number.isNaN(mayben)) {
					return new EError('Could not convert string to integer');					
				} else {
					return new Integer(mayben);
				}
			} else if (v instanceof Letter) {
				// could be a number.
				let s = v.getText();
				let mayben = parseInt(s);
				if (Number.isNaN(mayben)) {
					return new EError('Could not convert letter to integer');					
				} else {
					return new Integer(mayben);
				}
			} else if (v instanceof Word || v instanceof Line || v instanceof Doc) {
				// could be a number.
				let s = v.getValueAsString();
				let mayben = parseInt(s);
				if (Number.isNaN(mayben)) {
					// rofl
					let errstr = v instanceof Word
						? 'word'
						: ((v instanceof Line)
							? 'line'
							: 'doc');
					return new EError('Could not convert ' + errstr + ' to integer');
				} else {
					return new Integer(mayben);
				}
			} else {
				return new EError('Could not convert to integer');
			}
		}
	)

	Builtin.createBuiltin(
		'to-string',
		[
			{name:'nex', type:'*'},
		],
		function(env, argEnv) {
			let v = env.lb('nex');
			let s = "";
			if (v instanceof EString) {
				// nothing to do but should we copy the object?
				return v;
			} else if (v instanceof Bool) {
				s = v.getTypedValue() ? 'yes' : 'no';
			} else if (v instanceof Float) {
				s = '' + v.getTypedValue();
			} else if (v instanceof Integer) {
				s = '' + v.getTypedValue();
			} else if (v instanceof Letter) {
				s = '' + v.getText();
			} else if (v instanceof Separator) {
				s = '' + v.getText();
			} else if (v instanceof Word || v instanceof Line || v instanceof Doc) {
				try {
					s = v.getValueAsString();
				} catch (eerror) {
					// probably contained non-letters
				}
			}
			if (!s) {
				return new EError('Could not convert to string, invalid format');
			} else {
				return new EString(s);
			}

		}
	);
}