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



class BuiltinArgEvaluator {
	constructor(name, params, args, env, bindEnv) {
		this.name = name;
		this.params = params;
		this.args = args;
		this.env = env;
		this.bindEnv = bindEnv;
		this.numRequiredParams = 0;
		for (var i = 0; i < params.length; i++) {
			if (!params[i].optional && !params[i].variadic) {
				this.numRequiredParams++;
			}
		}
	}


	checkNumParams() {
		if (this.args.length < this.numRequiredParams) {
			throw new EError(this.name + ": not enough args passed to function.");
		}
	}	

	collectVariadics() {
		var endi = this.params.length - 1;
		if (endi < 0) {
			// no params, hence no variadics.
			return;
		}
		if (this.params[endi].variadic) {
			var variadicArray = [];
			for (var i = endi; i < this.args.length; i++) {
				variadicArray.push(this.args[i]);
			}
			//          endi
			// p: 0, 1, 2v
			// a: 0, 1, 2, 3, 4
			// a: 0, 1, [2, 3, 4]
			// 
			this.args[endi] = variadicArray;
			var toRemove = this.args.length - (endi + 1);
			if (toRemove > 0) {
				this.args.splice(endi + 1, toRemove)
			}
		}
	}

	padOptionals() {
		var endi = this.args.length;
		for (var i = endi; i < this.params.length; i++) {
			if (this.params[i].optional) {
				this.args[i] = null;
			} else {
				throw new EError(this.name + ": non-optional param omitted");
			}
		}
	}

	processArgument(param, arg) {
		if (param.optional && arg == null) {
			return arg;
		}

		if (!param.skipeval) {
			arg = arg.evaluate(this.env);
		}

		var typeChecksOut = BuiltinArgEvaluator.ARG_VALIDATORS[param.type](arg);

		if (!typeChecksOut) {
			throw new EError(this.name + ": expects a " + param.type + " for argument ");
		}
		return arg;
	}

	processVariadicArgument(param, arg) {
		for (var i = 0; i < arg.length; i++) {
			var realarg = arg[i];
			arg[i] = this.processArgument(param, realarg, arg[i]);
		}
	}

	processAllArgs() {
		var resultArgs = [];
		for (var i = 0; i < this.args.length; i++) {
			var param = this.params[i];
			var arg = this.args[i];
			if (param.variadic) {
				this.processVariadicArgument(param, arg);
			} else {
				arg = this.processArgument(param, arg);
			}
			resultArgs[i] = arg;
		}
		return resultArgs;
	}

	evaluateAndBindArgs() {
		this.checkNumParams();
		this.collectVariadics();
		this.padOptionals();
		var resultArgs = this.processAllArgs();
		for (var i = 0; i < this.params.length; i++) {
			this.bindEnv.bind(this.params[i], resultArgs[i]);
		}

	}
}


BuiltinArgEvaluator.ARG_VALIDATORS = {
	'*': arg => true,
	'NexContainer': arg => (arg instanceof NexContainer),
	'Bool': arg => (arg instanceof Bool),
	'Command': arg => (arg instanceof Command),
	'Doc': arg => (arg instanceof Doc),
	'EString': arg => (arg instanceof EString),
	'ESymbol': arg => (arg instanceof ESymbol),
	'Float': arg => (arg instanceof Float),
	'Number': arg => (arg instanceof Integer || arg instanceof Float),
	'Integer': arg => (arg instanceof Integer),
	'Letter': arg => (arg instanceof Letter),
	'Line': arg => (arg instanceof Line),
	'Nil': arg => (arg instanceof Nil),
	'Word': arg => (arg instanceof Word),
};
