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



class Command extends NexContainer {
	constructor(val) {
		super();
		this.commandtext = (val ? val : "");
		this.codespan = document.createElement("span");
		this.codespan.classList.add('codespan');
		this.domNode.appendChild(this.codespan);
		this.render();
	}

	makeCopy() {
		var r = new Command();
		this.makeCopyChildren(r);
		r.commandtext = this.commandtext;
		return r;
	}

	toString() {
		return `~"${this.commandtext}"${this.vdir ? 'v' : 'h'}(${super.childrenToString()}~)`;
	}

	getKeyFunnel() {
		return new CommandKeyFunnel(this);
	}

	getLambda(env) {
		var cmdname = this.getCommandText();		
		if (cmdname) {
			var lambda = env.lookupBinding(cmdname);
		} else if (this.numChildren() > 0) {
			var c = this.getChildAt(0);
			if (c instanceof ESymbol) {
				lambda = env.lookupBinding(c.getTypedValue());			
				cmdname = c.getTypedValue();
				this.removeChildAt(0);
			} else if (c instanceof Lambda) {
				if (!c.evaluated) {
					lambda = c.evaluate(env);
				} else {
					// this is the weird thing where you could evaluate it
					// in one place then execute it somewhere else via
					// copy and paste - should I allow this?
					return new EError('lambda already evaluated!');

				}
				this.removeChildAt(0);
				cmdname = 'LAMBDA';
			} else {
				throw new EError(`first argument ${c.toString()} to command is not a lambda.`);
			}
		} else {
			throw new EError("no-name command must provide a lambda in first argument.");		
		}
		lambda.setCmdName(cmdname);
		return lambda;
	}

	needsEvaluation() {
		return true;
	}

	evaluate(env) {
		try {
			ILVL++;
			stackCheck();
			var lambda = this.getLambda(env);
			console.log(`${INDENT()}evaluating command: ${this.toString()}`);
			console.log(`${INDENT()}lambda is: ${lambda.toString()}`);
			var argContainer = new NexChildArgContainer(this);
			var argEvaluator = lambda.getArgEvaluator(argContainer, env);
			argEvaluator.evaluateAndBindArgs();
			var r = lambda.executor(env);
			console.log(`${INDENT()}command returned: ${r.toString()}`);
			ILVL--;
			return r;

		} catch (e) {
			if (e instanceof EError) {
				return e;
			} else {
				// real error.
				throw e;
			}
		}
	}

	resolveCommandExpectation(env, lambda, argEvaluator, exp) {
		if (!argEvaluator.allExpressionsEvaluated()) {
			var ind = argEvaluator.indexOfNextUnevaluatedExpression();
			var innerexp = new Expectation();
			STEP_STACK.push(exp);
			argEvaluator.evaluateNext(innerexp);
			this.replaceChildAt(innerexp, ind);
			return exp;
		} else {
			argEvaluator.finishEvaluating();
			if (lambda instanceof Builtin) {
				return lambda.executor(env);
			} else {
				var stepContainer = new NexChildArgContainer(lambda);
				var stepEvaluator = lambda.getStepEvaluator(stepContainer, lambda.closure);
				stepEvaluator.startEvaluating();
				var lambdaExp = new Expectation();
				var result;
				lambdaExp.hackfunction = function() {
					if (!stepEvaluator.allExpressionsEvaluated()) {
						var ind = stepEvaluator.indexOfNextUnevaluatedExpression();
						var innerinnerexp = new Expectation();
						STEP_STACK.push(lambdaExp);
						stepEvaluator.evaluateNext(innerinnerexp);
						lambda.replaceChildAt(innerinnerexp, ind);
						return lambdaExp;
					} else {
						result = lambda.getLastChild();
						return result;
//							return lambda.getLastChild(); // or something
					}

				}.bind(this); // not really needed
				lambdaExp.appendChild(lambda);
//					return lambdaExp;
				exp.replaceChildAt(lambdaExp, 0);
				exp.hackfunction = function() {
					return result;
				}.bind(this);
				STEP_STACK.push(exp);
				STEP_STACK.push(lambdaExp);
				return exp;
			}
		}
	}

	stepEvaluate(env, exp) {
		try {
			var lambda = this.getLambda(env);
			var argContainer = new NexChildArgContainer(this);
			var argEvaluator = lambda.getArgEvaluator(argContainer, env);
			argEvaluator.startEvaluating();
			exp.hackfunction = function() {
				return this.resolveCommandExpectation(env, lambda, argEvaluator, exp);
			}.bind(this);
			STEP_STACK.push(exp);
		} catch (e) {
			// could happen if lambda can't be found, for example.
			if (e instanceof EError) {
				exp.hackfunction = function() {
					return e;
				}
				// hack
				this.__haserror = e;
				STEP_STACK.push(exp);
			} else {
				throw e;
			}

		}
	}

	render() {
		super.render();
		this.domNode.classList.add('command');
		this.domNode.classList.add('codelist');
		if (this.renderType == NEX_RENDER_TYPE_EXPLODED) {
			this.codespan.classList.add('exploded');
		} else {
			this.codespan.classList.remove('exploded');
		}
		this.codespan.innerHTML = '~' + this.commandtext;
	}

	getCommandText() {
		return this.commandtext;
	}

	deleteLastCommandLetter() {
		this.commandtext = this.commandtext.substr(0, this.commandtext.length - 1);
		this.render();	
	}

	appendCommandText(txt) {
		this.commandtext = this.commandtext + txt;
		this.render();
	}

	// expression list interface

	getExpressionAt(i) {
		return this.getChildAt(i);
	}

	getNumExpressions() {
		return this.getNumChildren();
	}

	replaceExpressionAt(newarg, i) {
		this.replaceChildAt(newarg, i);
	}
}
