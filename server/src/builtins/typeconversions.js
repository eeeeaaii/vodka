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


import { Nex } from '../nex/nex.js' 
import { NexContainer } from '../nex/nexcontainer.js' 
import { ValueNex } from '../nex/valuenex.js' 
import { Bool } from '../nex/bool.js' 
import { Builtin } from '../nex/builtin.js' 
import { Closure } from '../nex/closure.js' 
import { Command } from '../nex/command.js' 
import { Doc } from '../nex/doc.js' 
import { EError } from '../nex/eerror.js' 
import { EString } from '../nex/estring.js' 
import { ESymbol } from '../nex/esymbol.js' 
import { Expectation } from '../nex/expectation.js' 
import { Float } from '../nex/float.js' 
import { Integer } from '../nex/integer.js' 
import { Lambda } from '../nex/lambda.js' 
import { Letter } from '../nex/letter.js' 
import { Line } from '../nex/line.js' 
import { NativeOrg } from '../nex/nativeorg.js' 
import { Nil } from '../nex/nil.js' 
import { Org } from '../nex/org.js' 
import { Root } from '../nex/root.js' 
import { Separator } from '../nex/separator.js' 
import { Word } from '../nex/word.js' 
import { Zlist } from '../nex/zlist.js' 
import { evaluateNexSafely } from '../evaluator.js'


import { ERROR_TYPE_WARN, ERROR_TYPE_FATAL, ERROR_TYPE_INFO } from '../nex/eerror.js'

function createTypeConversionBuiltins() {

	Builtin.createBuiltin(
		'get-lambda',
		[ 'nex&' ],
		function $getLambda(env, executionEnvironment) {
			let n = env.lb('nex');
			return n.getLambda().makeCopy();
		},
		'returns a lambda expression identical to the one used to create the passed-in closure (does not modify the closure)'
		)

	// TODO: actually what I should do is tag it with something like "not fatal"
	Builtin.createBuiltin(
		'convert-type-if-error',
		[ 'errtype$', '_nex' ],
		function $convertTypeIfError(env, executionEnvironment) {
			let expr = env.lb('nex');
			let newresult = evaluateNexSafely(expr, executionEnvironment);
			if (newresult.getTypeName() != '-error-') {
				// you might think this function would throw an
				// error if you tried to pass it something that's
				// not an error, but the problem with doing that
				// is that you can't test for whether something is
				// an error WITHOUT using this function. So non-errors
				// are passed unchanged.
				return newresult;
			}

			let etstring = env.lb('errtype').getFullTypedValue();
			let errtype = ERROR_TYPE_FATAL;
			switch(etstring) {
				case "warn":
					errtype = ERROR_TYPE_WARN;
					break;
				case "info":
					errtype = ERROR_TYPE_INFO;
					break;
				case "fatal":
					break;
				default:
					return new EError(`convert-type-if-error: cannot continue because unrecognized type ${etstring} (valid types are 'info', 'warn', and 'fatal'). Sorry!`);
			}

			newresult.setErrorType(errtype);
			return newresult;
		},
		'if |nex is an error, converts the error type to |errtype (allowed values are "warn", "info", and "fatal"), otherwise just returns |nex.'
	);

	Builtin.createBuiltin(
		'to-float',
		[ 'nex' ],
		function $toFloat(env, executionEnvironment) {
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
					return new EError(`to-float: could not convert "${s}". Sorry!`);
				} else {
					return new Float(mayben);
				}
			} else if (v instanceof Letter) {
				// could be a number.
				let s = v.getText();
				let mayben = parseFloat(s);
				if (Number.isNaN(mayben)) {
					return new EError(`to-float: could not convert "${s}". Sorry!`);
				} else {
					return new Float(mayben);
				}
			} else if (v instanceof Word || v instanceof Line || v instanceof Doc) {
				// could be a number.
				let s = v.getValueAsString();
				let mayben = parseFloat(s);
				if (Number.isNaN(mayben)) {
					// rofl
					return new EError(`to-float: could not convert "${s}" (object of type ${v.getTypeName()}). Sorry!`);
				} else {
					return new Float(mayben);
				}
			} else {
				return new EError(`to-float: conversion of type ${v.getTypeName()} is unimplemented. Sorry!`);
			}
		},
		'converts |nex to a float, or returns an error if this is impossible.'
	);

	Builtin.createBuiltin(
		'to-integer',
		[ 'nex' ],
		function $toInteger(env, executionEnvironment) {
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
					return new EError(`to-integer: could not convert "${s}". Sorry!`);
				} else {
					return new Integer(mayben);
				}
			} else if (v instanceof Letter) {
				// could be a number.
				let s = v.getText();
				let mayben = parseInt(s);
				if (Number.isNaN(mayben)) {
					return new EError(`to-integer: could not convert "${s}". Sorry!`);
				} else {
					return new Integer(mayben);
				}
			} else if (v instanceof Word || v instanceof Line || v instanceof Doc) {
				// could be a number.
				let s = v.getValueAsString();
				let mayben = parseInt(s);
				if (Number.isNaN(mayben)) {
					// rofl
					return new EError(`to-integer: could not convert "${s}" (object of type ${v.getTypeName()}). Sorry!`);
				} else {
					return new Integer(mayben);
				}
			} else {
				return new EError(`to-integer: conversion of type ${v.getTypeName()} is unimplemented. Sorry!`);
			}
		},
		'converts |nex to an integer, or returns an error if this is impossible.'

	);

	Builtin.createBuiltin(
		'to-string',
		[ 'nex' ],
		function $toString(env, executionEnvironment) {
			let v = env.lb('nex');
			if (v instanceof EString) {
				return new EString(v.getFullTypedValue());
			} else if (v instanceof Bool) {
				return new EString(v.getTypedValue() ? 'yes' : 'no');
			} else if (v instanceof Float) {
				return new EString('' + v.getTypedValue());
			} else if (v instanceof Integer) {
				return new EString('' + v.getTypedValue());
			} else if (v instanceof Letter) {
				return new EString('' + v.getText());
			} else if (v instanceof Separator) {
				return new EString('' + v.getText());
			} else if (v instanceof Word || v instanceof Line || v instanceof Doc) {
				let ss = v.getValueAsString();
				if (typeof(ss) == 'string') {
					return new EString(ss);
				} else {
					return new EError(`to-string: could not convert "${ss}" (object of type ${v.getTypeName()}). Sorry!`);
				}
			} else if (v instanceof Org) {
				return new EString('' + v.getValueAsString());
			} else {
				return new EError(`to-string: conversion of type ${v.getTypeName()} is unimplemented. Sorry!`);

			}
		},
		'converts |nex to a string, or returns an error if this is impossible.'

	);

	Builtin.createBuiltin(
		'to-word',
		[ 'nex' ],
		function $toWord(env, executionEnvironment) {
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
			} else {
				// should at least be able to do lines and docs.
				// I feel like maybe to-word should just be in util-functions tho.
				return new EError(`to-word: conversion of type ${v.getTypeName()} is unimplemented. Sorry!`);
			}
		},
		'converts |nex to a word, or returns an error if this is impossible.'
	);

}

export { createTypeConversionBuiltins }

