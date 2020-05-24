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
import { InsertionPoint } from '../nex/insertionpoint.js' 
import { Integer } from '../nex/integer.js' 
import { Lambda } from '../nex/lambda.js' 
import { Letter } from '../nex/letter.js' 
import { Line } from '../nex/line.js' 
import { NativeOrg } from '../nex/nativeorg.js' 
import { Newline } from '../nex/newline.js' 
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
		'to-word',
		[ 'nex' ],
		function(env, executionEnvironment) {
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
				return new EError('Sorry, our bad - calling to-work on a Line or Doc is not yet implemented :(')
			} else {
				return new EError('Okay, so to-word was called on an object of'
					+ `type "${v.getTypeName()}". This is not supported -- sorry about that.`);
			}
		}
	)



	Builtin.createBuiltin(
		'to-float',
		[ 'nex' ],
		function(env, executionEnvironment) {
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
					return new EError('Okay so to-float tried to turn this string'
						+ ` "${s}" into a float, but it couldn't.`
						+ ` There might be characters in that string`
						+ ` that aren't numeric.`);					
				} else {
					return new Float(mayben);
				}
			} else if (v instanceof Letter) {
				// could be a number.
				let s = v.getText();
				let mayben = parseFloat(s);
				if (Number.isNaN(mayben)) {
					return new EError('Okay so to-float tried to turn a letter object'
						+ ` "${s}" into a float, but it couldn't.`
						+ ` The letter objects that you can realistically turn into`
						+ ` a float are the single digits 0-9.`);					
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
					return new EError('So we tried to convert an object of type'
						+ ` ${v.getTypeName()} into a float, but it didn't work.`
						+ ` When we converted that object into a string representation,`
						+ ` we got ${mayben}. There might be non-numeric characters`
						+ ` or something like that.`);
				} else {
					return new Float(mayben);
				}
			} else {
				return new EError('You wanted us to convert an object of type'
					+ ` ${v.getTypeName()} to a float, but we haven't implemented`
					+ ` any conversion logic for that type yet. Sorry about that!`);
			}
		}
	)

	Builtin.createBuiltin(
		'to-integer',
		[ 'nex' ],
		function(env, executionEnvironment) {
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
					return new EError(`Sorry, we tried to convert the string ${mayben}`
						+ ` into an integer, but it didn't work. Maybe there are non-digit`
						+ ` characters in it.`);					
				} else {
					return new Integer(mayben);
				}
			} else if (v instanceof Letter) {
				// could be a number.
				let s = v.getText();
				let mayben = parseInt(s);
				if (Number.isNaN(mayben)) {
					return new EError(`So you asked us to convert the letter`
						+ ` ${mayben} into an integer, but we can't.`
						+ ` The only letters we can really convert into`
						+ ` integers are the letters 0-9.`);
				} else {
					return new Integer(mayben);
				}
			} else if (v instanceof Word || v instanceof Line || v instanceof Doc) {
				// could be a number.
				let s = v.getValueAsString();
				let mayben = parseInt(s);
				if (Number.isNaN(mayben)) {
					// rofl
					return new EError('So we tried to convert an object of type'
						+ ` ${v.getTypeName()} into an integer, but it didn't work.`
						+ ` When we converted that object into a string representation,`
						+ ` we got ${mayben}. There might be non-numeric characters`
						+ ` or something like that.`);
				} else {
					return new Integer(mayben);
				}
			} else {
				return new EError('You wanted us to convert an object of type'
					+ ` ${v.getTypeName()} to an integer, but we haven't implemented`
					+ ` any conversion logic for that type yet. Sorry about that!`);
			}
		}
	)

	Builtin.createBuiltin(
		'to-string',
		[ 'nex' ],
		function(env, executionEnvironment) {
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
					return new EError(`to-string: object of type ${v.getTypeName()} failed to convert into a string. Result was ${'' + ss}. No more information available. Sorry!`)
				}
			} else {
				return new EError(`to-string: unimplemented for type ${v.getTypeName()}. Sorry!`);

			}
		}
	);


	// TODO: actually what I should do is tag it with something like "not fatal"
	Builtin.createBuiltin(
		'convert-type-if-error',
		[ 'errtype$', '_nex' ],
		function(env, executionEnvironment) {
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
		}
	);	
}

export { createTypeConversionBuiltins }

