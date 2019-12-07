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



class Builtin extends Lambda {
	constructor(name, params) {
		super();
		this.name = name;
		this.params = params;
		this.f = null;
	}

	toString() {
		return `[BUILTIN:${this.name}]`;
	}

	setF(f) {
		this.f = f.bind(this);
	}

/*
	startEvaluatingArgs(args, argEnv) {
		this.args = args;
		this.argEnv = argEnv;
		for (var i = 0; i < this.args.length; i++) {
			this.args[i].__unevaluated = true;
		}
	}

	nextArgToEval() {
		for (var i = 0; i < this.args.length; i++) {
			if (this.args[i].__unevaluated) {
				return i;
			}
		}
		return -1;
	}

	evaluateArg(i) {
		this.args[i] = this.args[i].evaluate(this.argEnv);
		return this.args[i];
	}

	isFinishedEvaluatingArgs() {
		return (this.nextArgToEval() == -1);
	}	*/

	static createBuiltin(name, params, f) {
		for (var i = 0; i < params.length; i++) {
			params[i].name = BUILTIN_ARG_PREFIX + params[i].name;
		}
		var nex = new Builtin(name, params);
		nex.setF(f);
		BUILTINS.bindUnique(name, nex);
		nex.evaluate(BUILTINS);
	}

	executor() {
		return this.f(this.closure, this.argEnv);
	}

	// getParamNames() {
	// 	var p = [];
	// 	for (var i = 0; i < this.params.length; i++) {
	// 		p.push(this.params[i].name);
	// 	}
	// 	return p;
	// }

	getArgEvaluator(args, argEnv) {
		return new BuiltinArgEvaluator(this.name, this.params, args, argEnv, this.closure);
	}

	// evaluateArgs(args, argEnv) {
	// 	var evaluator = new BuiltinArgEvaluator(this.name, this.params, args, argEnv);
	// 	return evaluator.evaluateArgs();
	// }

}

