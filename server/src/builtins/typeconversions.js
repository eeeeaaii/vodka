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


import { Nex } from '../nex/nex.js' 
import { NexContainer } from '../nex/nexcontainer.js' 
import { ValueNex } from '../nex/valuenex.js' 
import { Builtin } from '../nex/builtin.js' 
import { constructFatalError } from '../nex/eerror.js' 

import { constructEString } from '../nex/estring.js' 
import { constructFloat } from '../nex/float.js' 
import { constructInteger } from '../nex/integer.js' 
import { constructLetter } from '../nex/letter.js' 
import { constructWord } from '../nex/word.js' 

import { evaluateNexSafely } from '../evaluator.js'


import { ERROR_TYPE_WARN, ERROR_TYPE_FATAL, ERROR_TYPE_INFO, ERROR_TYPE_PREVIOUSLY_FATAL } from '../nex/eerror.js'

function createTypeConversionBuiltins() {

	Builtin.createBuiltin(
		'get-lambda',
		[ 'nex&' ],
		function $getLambda(env, executionEnvironment) {
			let n = env.lb('nex');
			return n.getLambda();
		},
		'Returns the lambda expression that is used by the passed-in closure to execute code. Warning: modifying this lambda will change the code of the closure.'
		)

	Builtin.createBuiltin(
		'no-fail',
		[ '_nex' ],
		function nofail(env, executionEnvironment) {
			let expr = env.lb('nex');
			let newresult = evaluateNexSafely(expr, executionEnvironment);
			if (Utils.isFatalError(newresult)) {
				newresult.setErrorType(ERROR_TYPE_PREVIOUSLY_FATAL);
			}
			return newresult;
		},
		'If evaluating |nex results in a fatal error, this converts the fatal error into the "previously fatal" error type, which doesn\'t trigger error cascading.'
	);

	Builtin.createBuiltin(
		'to-float',
		[ 'nex' ],
		function $toFloat(env, executionEnvironment) {
			let v = env.lb('nex');
			if (Utils.isFloat(v)) {
				return v;
			} else if (Utils.isInteger(v)) {
				return constructFloat(v.getTypedValue());
			} else if (Utils.isBool(v)) {
				return v.getTypedValue() ? constructFloat(1): constructFloat(0);
			} else if (Utils.isEString(v)) {
				let s = v.getFullTypedValue();
				let mayben = parseFloat(s);
				if (Number.isNaN(mayben)) {
					return constructFatalError(`to-float: could not convert "${s}". Sorry!`);
				} else {
					return constructFloat(mayben);
				}
			} else if (Utils.isLetter(v)) {
				// could be a number.
				let s = v.getText();
				let mayben = parseFloat(s);
				if (Number.isNaN(mayben)) {
					return constructFatalError(`to-float: could not convert "${s}". Sorry!`);
				} else {
					return constructFloat(mayben);
				}
			} else if (Utils.isWord(v) || Utils.isLine(v) || Utils.isDoc(v)) {
				// could be a number.
				let s = v.getValueAsString();
				let mayben = parseFloat(s);
				if (Number.isNaN(mayben)) {
					// rofl
					return constructFatalError(`to-float: could not convert "${s}" (object of type ${v.getTypeName()}). Sorry!`);
				} else {
					return constructFloat(mayben);
				}
			} else {
				return constructFatalError(`to-float: conversion of type ${v.getTypeName()} is unimplemented. Sorry!`);
			}
		},
		'Converts |nex to a float, or returns an error if this is impossible.'
	);

	Builtin.createBuiltin(
		'to-integer',
		[ 'nex' ],
		function $toInteger(env, executionEnvironment) {
			let v = env.lb('nex');
			if (Utils.isInteger(v)) {
				return v;
			} else if (Utils.isFloat(v)) {
				return constructInteger(Math.floor(v.getTypedValue()));
			} else if (Utils.isBool(v)) {
				return v.getTypedValue() ? constructInteger(1): constructInteger(0);
			} else if (Utils.isEString(v)) {
				let s = v.getFullTypedValue();
				let mayben = parseInt(s);
				if (Number.isNaN(mayben)) {
					return constructFatalError(`to-integer: could not convert "${s}". Sorry!`);
				} else {
					return constructInteger(mayben);
				}
			} else if (Utils.isLetter(v)) {
				// could be a number.
				let s = v.getText();
				let mayben = parseInt(s);
				if (Number.isNaN(mayben)) {
					return constructFatalError(`to-integer: could not convert "${s}". Sorry!`);
				} else {
					return constructInteger(mayben);
				}
			} else if (Utils.isWord(v) || Utils.isLine(v) || Utils.isDoc(v)) {
				// could be a number.
				let s = v.getValueAsString();
				let mayben = parseInt(s);
				if (Number.isNaN(mayben)) {
					// rofl
					return constructFatalError(`to-integer: could not convert "${s}" (object of type ${v.getTypeName()}). Sorry!`);
				} else {
					return constructInteger(mayben);
				}
			} else {
				return constructFatalError(`to-integer: conversion of type ${v.getTypeName()} is unimplemented. Sorry!`);
			}
		},
		'Converts |nex to an integer, or returns an error if this is impossible.'

	);

	Builtin.createBuiltin(
		'to-string',
		[ 'nex' ],
		function $toString(env, executionEnvironment) {
			let v = env.lb('nex');
			if (Utils.isEString(v)) {
				return constructEString(v.getFullTypedValue());
			} else if (Utils.isBool(v)) {
				return constructEString(v.getTypedValue() ? 'yes' : 'no');
			} else if (Utils.isFloat(v)) {
				return constructEString('' + v.getTypedValue());
			} else if (Utils.isInteger(v)) {
				return constructEString('' + v.getTypedValue());
			} else if (Utils.isLetter(v)) {
				return constructEString('' + v.getText());
			} else if (Utils.isSeparator(v)) {
				return constructEString('' + v.getText());
			} else if (Utils.isWord(v) || Utils.isLine(v) || Utils.isDoc(v)) {
				let ss = v.getValueAsString();
				if (typeof(ss) == 'string') {
					return constructEString(ss);
				} else {
					return constructFatalError(`to-string: could not convert "${ss}" (object of type ${v.getTypeName()}). Sorry!`);
				}
			} else if (Utils.isOrg(v)) {
				return constructEString('' + v.getValueAsString());
			} else {
				return constructFatalError(`to-string: conversion of type ${v.getTypeName()} is unimplemented. Sorry!`);

			}
		},
		'Converts |nex to a string, or returns an error if this is impossible.'

	);

	Builtin.createBuiltin(
		'to-word',
		[ 'nex' ],
		function $toWord(env, executionEnvironment) {
			let v = env.lb('nex');

			if (Utils.isWord(v)) {
				return v;
			}
			let jsStringToDoc = (function(str) {
				var w = constructWord();
				for (let i = 0; i < str.length; i++) {
					let lt = constructLetter(str.charAt(i));
					w.appendChild(lt);
				}
				return w;
			});
			if (Utils.isInteger(v)
				|| Utils.isFloat(v)
				|| Utils.isBool(v)
				) {
				return jsStringToDoc('' + v.getTypedValue())
			} else if (Utils.isEString(v)) {
				return jsStringToDoc('' + v.getFullTypedValue())
			} else if (Utils.isLetter(v)) {
				let w = constructWord();
				w.appendChild(v.makeCopy());
				return w;
			} else {
				// should at least be able to do lines and docs.
				// I feel like maybe to-word should just be in util-functions tho.
				return constructFatalError(`to-word: conversion of type ${v.getTypeName()} is unimplemented. Sorry!`);
			}
		},
		'Converts |nex to a word, or returns an error if this is impossible.'
	);

}

export { createTypeConversionBuiltins }

