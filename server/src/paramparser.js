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

// add validation here?


/*

ways you can do args:
1. A A A V
a set of required args then a variadic (could be zero A's)
1. A A A O O
a set of required args then some optional ones (could be zero A's)

variadics are packaged up inside a list of some type (maybe a word)
*/

import { BUILTIN_ARG_PREFIX } from './environment.js'

class ParamParser {
	constructor(isBuiltin) {
		this.isBuiltin = isBuiltin;
		this.parsedParams = null;
		this.returnValue = null;
	}

	getParams() {
		return this.parsedParams;
	}

	getReturnValue() {
		return this.returnValue;
	}

	parseString(str) {
		let hasReturnVal = /^[~!@#$%^&*?(),.]+/.test(str);
		let a = str.split(' ');
		if (hasReturnVal) {
			a[0] = '\\' + a[0];
		}
		// in case someone double spaces I guess
		let b = [];
		let j = 0;
		for (let i = 0; i < a.length; i++) {
			if (a[i] != '') {
				b[j++] = a[i];
			}
		}
		this.parse(b);
	}

	parse(paramList) {
		this.parsedParams = [];
		for (let i = 0; i < paramList.length; i++) {
			let p = paramList[i];
			if (p.indexOf('\\') >= 0) {
				this.returnValue = this.parseParam(p);
			} else {
				this.parsedParams.push(this.parseParam(p))
			}
		}
	}

	parseParam(s) {
		let originals = s;
		let skipeval = false;
		let variadic = false;
		let optional = false;
		let skipactivate = false;
		// we re-parse every time the user changes the args
		// when they are editing the args -- this means that there are transition states
		// while they are typing when the args may not make sense and it's just okay.
		if (s.charAt(0) == '_') {
			skipeval = true;
			s = s.substring(1);
			if (s == '') return null;
		}

		if (s.length >= 3 && s.substring(s.length - 3, s.length) == '...') {
			variadic = true;
			s = s.substring(0, s.length - 3);
			if (s == '') return null;
		}
		if (s.charAt(s.length - 1) == '?') {
			optional = true;
			s = s.substring(0, s.length - 1);
			if (s == '') return null;
		}
		let typeString = this.getTypeCode(s);
		let typeValidator = this.getTypeValidator(typeString);
		if (typeString == ',') {
			skipactivate = true;
		}
		if (typeValidator != '*') {
			s = s.substring(0, s.length - typeString.length);
			if (s == '') return null;
		}
		if (this.isBuiltin) {
			s = BUILTIN_ARG_PREFIX + s;
		}
		return {
			name: s,
			debugName: originals,
			typeString: typeString,
			type: typeValidator,
			skipeval: skipeval,
			skipactivate: skipactivate,
			variadic: variadic,
			optional: optional
		}
	}

	getTypeCode(s) {
		let end = s.charAt(s.length - 1);
		let other = s.charAt(s.length - 2);
		if (other == '(' || other == '%' || other == '#') {
			return other + end;
		} else {
			return end;
		}
	}

	getTypeValidator(typechar) {
		switch(typechar) {
			case '!': return 'Bool';
			case '~': return 'Command';
			case '*': return 'Expectation';
			case ',': return 'Expectation';
			case '()': return 'NexContainer';
			case '$': return 'EString';
			case '@': return 'ESymbol';
			case '?': return 'EError';
			case '%': return 'Float';
			case '#%': return 'Number';
			case '%#': return 'Number';
			case '#': return 'Integer';
			case '^': return 'Nil';
			case '&': return 'Closure';
		}
		return '*';
	}
}

export { ParamParser }

