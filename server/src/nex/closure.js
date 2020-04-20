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

class Closure extends ValueNex {
	constructor(lambda, lexicalEnvironment) {
		super('', '&', 'closure')
		this.lambda = lambda;
		this.cmdname = '*** not set ***';
		this.lexicalEnvironment = lexicalEnvironment;
		this.boundName = null;
	}

	setBoundName(name) {
		this.boundName = name;
	}

	getBoundName() {
		return this.boundName;
	}

	getLexicalEnvironment() {
		return this.lexicalEnvironment;
	}

	setLexicalEnvironment(env) {
		// used by bind primitive because otherwise order matters and you have to
		// define things before using them
		this.lexicalEnvironment = env;
	}

	getLambda() {
		return this.lambda;
	}

	makeCopy() {
		let r = new Closure();
		this.copyFieldsTo(r);
		return r;
	}

	copyFieldsTo(nex) {
		super.copyFieldsTo(nex);
		nex.lambda = this.lambda;
		nex.lexicalEnvironment = this.lexicalEnvironment.copy();
		nex.boundName = this.boundName;
	}

	setCmdName(nm) {
		this.cmdname = nm;
	}

	getCmdName() {
		return this.cmdname;
	}

	getArgEvaluator(cmdname, argContainer, executionEnvironment) {
		if (this.lambda instanceof Builtin) {
			return new BuiltinArgEvaluator(cmdname, this.lambda.params, argContainer, executionEnvironment);
		} else {
			return new LambdaArgEvaluator(
				this.lambda.getParamNames(),
				argContainer, executionEnvironment, cmdname);
		}
	}

	executor(executionEnvironment, argEvaluator, cmdname, commandTags) {
		let newScope = this.lexicalEnvironment.pushEnv();
		argEvaluator.bindArgs(newScope);
		if (this.lambda instanceof Builtin) {
			return this.lambda.executor(newScope, executionEnvironment, commandTags);
		}
		let r = new Nil();
		let i = 0;
		for (let i = 0; i < this.lambda.numChildren(); i++) {
			let c = this.lambda.getChildAt(i);
			r = evaluateNexSafely(c, newScope);
			if (isFatalError(r)) {
				r = wrapError('&amp;', `${cmdname}: error in expr ${i+1}`, r);
				return r;
			}			
		}
		return r;
	}

	getTypeName() {
		return '-closure-';
	}
}


