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


class Lambda extends NexContainer {
	constructor(val) {
		super();
		this.amptext = val ? val : '';
		this.codespan = document.createElement("span");
		this.codespan.classList.add('codespan');
		this.domNode.appendChild(this.codespan);
		this.closure = null;
		this.cmdname = null;
		this.render();
	}

	makeCopy() {
		var r = new Lambda();
		this.makeCopyChildren(r);
		r.amptext = this.amptext;
		r.closure = this.closure;
		r.cmdname = this.cmdname;
		return r;
	}

	toString() {
		return `&"${this.amptext}"${this.vdir ? 'v' : 'h'}(${super.childrenToString()}&)`;
	}

	getKeyFunnel() {
		return new LambdaKeyFunnel(this);
	}

	render() {
		super.render();
		this.domNode.classList.add('lambda');
		this.domNode.classList.add('codelist');
		if (this.renderType == NEX_RENDER_TYPE_EXPLODED) {
			this.codespan.classList.add('exploded');
		} else {
			this.codespan.classList.remove('exploded');
		}
		this.codespan.innerHTML = '&amp;' + this.amptext.replace(/ /g, '&nbsp;');
	}

	setCmdName(nm) {
		this.cmdname = nm;
	}

	needsEvaluation() {
		return true;
	}

	// startEvaluatingArgs(args, argEnv) {
	// 	this.args = args;
	// 	this.argEnv = argEnv;
	// 	for (var i = 0; i < this.args.length; i++) {
	// 		this.args[i].__unevaluated = true;
	// 	}
	// }

	// nextArgToEval() {
	// 	for (var i = 0; i < this.args.length; i++) {
	// 		if (this.args[i].__unevaluated) {
	// 			return i;
	// 		}
	// 	}
	// 	return -1;
	// }

	// evaluateArg(i) {
	// 	this.args[i] = this.args[i].evaluate(this.argEnv);
	// 	return this.args[i];
	// }

	// isFinishedEvaluatingArgs() {
	// 	return (this.nextArgToEval() == -1);
	// }

	evaluate(env) {
		this.closure = env.pushEnv();
		return this;
	}

	// evaluateArgs(args, argEnv) {
	// 	var evaluatedArgs = [];
	// 	for (var i = 0; i < args.length; i++) {
	// 		evaluatedArgs[i] = args[i].evaluate(argEnv);
	// 	}
	// 	return evaluatedArgs;
	// }

	getParamNames() {
		var s = this.amptext.split(' ');
		var p = [];
		for (var i = 0; i < s.length; i++) {
			if (s[i] !== '') {
				p.push(s[i]);
			}
		}
		return p;
	}

	startStepExecute(args, env) {
		//idfk
		this.closure = env.pushEnv();
		var paramNames = this.getParamNames();
		for (var i = 0; i < paramNames.length; i++) {
			this.closure.bind(paramNames[i], args[i]);
		}		
		for (var i = 0; i < this.children.length; i++) {
			this.children[i].__unevaluated = true;
		}
	}

	doStepExecute() {
		var env = this.closure;
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
					return thecopy.doStepExecute(env);
				}
				r.appendChild(thecopy);
				return r;
			}
		}
		return this.children[this.children.length - 1];

	}

	executor() {
		var r = new Nil();
		for (var i = 0; i < this.children.length; i++) {
			var c = this.children[i];
			r = c.evaluate(this.closure);
		}
		return r;
	}

	execute(args, argEnv) {
		var argEvaluator = this.getArgEvaluator(args, argEnv);
		argEvaluator.evaluateAndBindArgs();
		return this.executor();
	}

	getArgEvaluator(args, argEnv) {
		return new LambdaArgEvaluator(this.getParamNames(), args, this.closure, argEnv);
	}

	getAmpText() {
		return this.amptext;
	}

	deleteLastAmpLetter() {
		this.amptext = this.amptext.substr(0, this.amptext.length - 1);
		this.render();	
	}

	appendAmpText(txt) {
		this.amptext = this.amptext + txt;
		this.render();
	}
}

