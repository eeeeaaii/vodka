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
			var argarray = [];
			// copy the array for reasons
			for (var i = 0; i < this.children.length; i++) {
				argarray[i] = this.children[i];
			}
			console.log(`${INDENT()}evaluating command: ${this.toString()}`);
			console.log(`${INDENT()}lambda is: ${lambda.toString()}`);
			// TODO: rather than passing the env here, I should be evaluating the arguments
			// here in this environment, then handing off the evaluated args to the lambda
			// which has its own lexical environment. However because of treating builtins
			// and special forms the same as lambdas, and me being a generally confused
			// person, this is not what I am doing
			var r = lambda.execute(argarray, env);
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

	someShit(env) {
		for (var i = 0; i < this.children.length; i++) {
			if (this.children[i].__unevaluated) {
				if (!this.children[i].needsEvaluation()) {
					this.children[i].__unevaluated = false;
					continue;
				}
				// we are not done evaluating so we push something right back
				// on the stack. We have to do this BEFORE evaluating
				// the child, but we can't make the hack function
				// until later
				var r = new Expectation(function() {
				});
				STEP_STACK.push(r);
				var thecopy = this.makeCopy();
				var newChild = thecopy.children[i].stepEvaluate(env);
				thecopy.replaceChildAt(newChild, i);
				for (var j = i + 1; j < thecopy.children.length; j++) {
					thecopy.children[j].__unevaluated = true;
				}
				// who even cares now
				r.hackfunction = function() {
					return thecopy.someShit(env);
				}
				r.appendChild(thecopy);
				return r;
			}
		}
		var lm = this.getLambda(env);
		var argarray = [];
		// copy the array for reasons
		for (var i = 0; i < this.children.length; i++) {
			argarray[i] = this.children[i];
		}
		if (lm instanceof Builtin) {
			var bresult = lm.execute(argarray, env);
			return bresult;			
		} else {
			// no idea
			lm.startStepExecute(argarray, env);
			var lresult = new Expectation(function() {
				return lm.doStepExecute(env);
			});
			STEP_STACK.push(lresult);
			lresult.appendChild(lm);
			return lresult;
		}
	}

	stepEvaluate(env) {
		// i don't even know at this point
		var t = this;
		var tcopy = this.makeCopy();
		var r = new Expectation(function() {
			return tcopy.someShit(env);
		});
		// this sucks
		for (var i = 0; i < tcopy.children.length; i++) {
			tcopy.children[i].__unevaluated = true;
		}
		r.appendChild(tcopy);
		STEP_STACK.push(r);
		return r;
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
}
