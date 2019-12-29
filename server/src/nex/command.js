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
		let r = new Command();
		this.copyFieldsTo(r);
		return r;
	}

	toString() {
		return `~"${this.commandtext}"${this.vdir ? 'v' : 'h'}(${super.childrenToString()}~)`;
	}

	copyFieldsTo(nex) {
		super.copyFieldsTo(nex);
		nex.commandtext = this.commandtext;
	}

	debugString() {
		return `~${this.commandtext}(${super.childrenDebugString()})`;
	}

	getKeyFunnel() {
		return new CommandKeyFunnel(this);
	}

	pushNexPhase(phaseExecutor, env) {
		let lambda = this.getLambda(env);
		phaseExecutor.pushPhase(lambda.phaseFactory(phaseExecutor, this, env))
	}

	isLambdaCommand(env) {
		let lambda = this.getLambda(env);
		return !(lambda instanceof Builtin);	
	}

	getLambda(env) {
		let cmdname = this.getCommandText();
		let lambda = null;
		if (cmdname) {
			lambda = env.lookupBinding(cmdname);
		} else if (this.numChildren() > 0) {
			let c = this.getChildAt(0);
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
					throw new EError('lambda already evaluated!');

				}
				this.removeChildAt(0);
				cmdname = 'LAMBDA';
			} else {
				throw new EError(`first argument ${c.debugString()} to command is not a lambda.`);
			}
		} else {
			throw new EError("no-name command must provide a lambda in first argument.");		
		}
		if (lambda == null) {
			throw new Error("this shouldn't happen");
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
			let lambda = this.getLambda(env);
			console.log(`${INDENT()}evaluating command: ${this.debugString()}`);
			console.log(`${INDENT()}lambda is: ${lambda.debugString()}`);
			let argContainer = new NexChildArgContainer(this);
			let argEvaluator = lambda.getArgEvaluator(argContainer, env);
			argEvaluator.evaluateAndBindArgs();
			let r = lambda.executor(env);
			console.log(`${INDENT()}command returned: ${r.debugString()}`);
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

	render() {
		super.render();
		this.domNode.classList.add('command');
		this.domNode.classList.add('codelist');
		if (this.renderType == NEX_RENDER_TYPE_EXPLODED) {
			this.codespan.classList.add('exploded');
		} else {
			this.codespan.classList.remove('exploded');
		}
		this.codespan.innerHTML = '<span class="tilde">&#8766;</span>' + this.commandtext;
	}

	getCommandText() {
		return this.commandtext;
	}

	setCommandText(t) {
		this.commandtext = t;
		this.render();
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
