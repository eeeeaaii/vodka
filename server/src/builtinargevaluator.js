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

/*

ways you can do args:
1. A A A V
a set of required args then a variadic (could be zero A's)
1. A A A O O
a set of required args then some optional ones (could be zero A's)

variadics are packaged up inside a list of some type (maybe a word)
*/

class ParamParser {
	constructor(isBuiltin) {
		this.isBuiltin = isBuiltin;
	}

	parse(paramList) {
		let rParams = [];
		for (let i = 0; i < paramList.length; i++) {
			rParams.push(this.parseParam(paramList[i]))
		}
		return rParams;
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
			name = BUILTIN_ARG_PREFIX + name;
		}
		return {
			name: s,
			debugName: originals,
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

class BuiltinArgEvaluator {
	constructor(name, params, argContainer, executionEnvironment) {
		this.name = name;
		this.params = params;
		this.argContainer = argContainer;
		this.executionEnvironment = executionEnvironment;
		this.verifyParameterCorrectness();
	}

	debugString() {
		let s = '';
		s += "arg evaluator\n";
		s += "   args:\n";
		for (let i = 0; i < this.params.length; i++) {
			let p = this.params[i];
			s += `      ${p.name}${p.debugName ? ` (${p.debugName})` : ``}\n`;
		}
		s += "   values:\n";
		for (let i = 0; i < this.argContainer.numArgs(); i++) {
			s += "      " + this.argContainer.getArgAt(i).debugString() + '\n';
		}
		return s;
	}

	verifyParameterCorrectness() {
		this.hasoptionals = false;
		this.hasvariadics = false;
		this.numRequiredParams = 0;
		for (let i = 0; i < this.params.length; i++) {
			let param = this.params[i];
			if (param.optional) {
				if (this.hasvariadics) {
					throw new Error("can't have variadics and also optionals.");
				}
				this.hasoptionals = true;
				continue;
			}
			if (param.variadic) {
				if (this.hasoptionals) {
					throw new Error("can't have variadics and also optionals.");
				}
				if (this.hasvariadics) {
					throw new Error("can't have multiple variadics");
				}
				this.hasvariadics = true;
				continue;
			}
			this.numRequiredParams++;
		}
	}

	checkMinNumArgs() {
		if (this.argContainer.numArgs() < this.numRequiredParams) {
			throw new EError(`${this.name}: not enough args. You needed ${this.numRequiredParams} but there were only ${this.argContainer.numArgs()}. Sorry!`);
		}
	}

	checkMaxNumArgs() {
		if (this.argContainer.numArgs() > this.effectiveParams.length) {
			throw new EError(`${this.name}: too many args. The max is ${this.effectiveParams.length} but you passed ${this.argContainer.numArgs()}. Sorry!`);
		}
	}

	padEffectiveParams() {
		this.effectiveParams = [];
		let i = 0;
		for (; i < this.params.length; i++) {
			this.effectiveParams[i] = this.params[i];
		}
		if (this.hasvariadics) {
			for(let lasti = i - 1; i < this.argContainer.numArgs(); i++) {
				this.effectiveParams[i] = this.params[lasti];
			}
		}
	}

	processSingleArg(i) {
		let param = this.effectiveParams[i];
		let expectedType = param.type;
		let arg = this.argContainer.getArgAt(i);
		if (!param.skipeval) {
			arg = evaluateNexSafely(arg, this.executionEnvironment, param.skipactivate);
			if (isFatalError(arg)) {
				throw wrapError('&szlig;', `${this.name}: fatal error in argument ${i + 1} (expected type ${param.type}), cannot continue. Sorry!`, arg);
			}
		}
		let typeChecksOut = BuiltinArgEvaluator.ARG_VALIDATORS[expectedType](arg);

		if (!typeChecksOut) {
			if (arg.getTypeName() == '-error-') {
				throw wrapError('&szlig;', `${this.name}: non-fatal error in argument ${i + 1}, but stopping because expected type for this argument was ${expectedType}. Sorry!`, arg);
			} else {
				throw new EError(`${this.name}: stopping because expected ${expectedType} for arg ${i + 1} but got ${arg.getTypeName()}. Sorry!`);
			}
		}
		this.argContainer.setArgAt(arg, i);
	}

	processArgs() {
		for (let i = 0; i < this.argContainer.numArgs(); i++) {
			this.processSingleArg(i);
		}
	}

	bindArgs(scope) {
		for (let i = 0; i < this.params.length; i++) {
			let param = this.params[i];
			if (param.variadic) {
				let w = new Word();
				for (let j = i; j < this.argContainer.numArgs(); j++) {
					w.appendChild(this.argContainer.getArgAt(j));
				}
				scope.bind(param.name, w);
			} else if (param.optional) {
				if (i < this.argContainer.numArgs()) {
					scope.bind(param.name, this.argContainer.getArgAt(i));
				}
			} else {
				scope.bind(param.name, this.argContainer.getArgAt(i));
			}
		}
	}

	evaluateArgs() {
		this.checkMinNumArgs();
		this.padEffectiveParams();
		this.checkMaxNumArgs();
		this.processArgs();
	}
}


BuiltinArgEvaluator.ARG_VALIDATORS = {
	'*': arg => true,
	'NexContainer': arg => (arg instanceof NexContainer),
	'Bool': arg => (arg.getTypeName() == '-bool-'),
	'Command': arg => (arg.getTypeName() == '-command-'),
	'Expectation': arg => (arg.getTypeName() == '-expectation-'),
	'Doc': arg => (arg.getTypeName() == '-doc-'),
	'EString': arg => (arg.getTypeName() == '-string-'),
	'ESymbol': arg => (arg.getTypeName() == '-symbol-'),
	'EError': arg => {
		// errors can only be passed as arguments if they are not fatal
		return (arg.getTypeName() == '-error-' && arg.getErrorType() != ERROR_TYPE_FATAL);
	},
	'Float': arg => (arg.getTypeName() == '-float-'),
	'Number': arg => (arg.getTypeName() == '-integer-' || arg.getTypeName() == '-float-'),
	'Integer': arg => (arg.getTypeName() == '-integer-'),
	'Letter': arg => (arg.getTypeName() == '-letter-'),
	'Line': arg => (arg.getTypeName() == '-line-'),
	'Nil': arg => (arg.getTypeName() == '-nil-'),
	'Word': arg => (arg.getTypeName() == '-word-'),
	'Lambda': arg => (arg.getTypeName() == '-lambda-'),
	'Closure': arg => (arg.getTypeName() == '-closure-'),
};
