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
	}

	getTypeName() {
		return '-command-';
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
		return `(~${this.commandtext} ${super.childrenDebugString()})`;
	}

	getKeyFunnel() {
		return new CommandKeyFunnel(this);
	}

	// if not RENDERNODES third arg null
	pushNexPhase(phaseExecutor, env, renderNode) {
		let lambda = this.getLambda(env);
		phaseExecutor.pushPhase(lambda.phaseFactory(phaseExecutor, this, env, renderNode))
	}

	isLambdaCommand(env) {
		let lambda = this.getLambda(env);
		return !(lambda instanceof Builtin);	
	}

	getLambda(executionEnv) {
		let cmdname = this.getCommandText();
		let lambda = null;
		if (cmdname) {
			lambda = executionEnv.lookupBinding(cmdname);
			if (!(lambda instanceof Lambda)) {
				throw new EError(`attempting to run command but "${cmdname}"" is bound to something that is not a lambda`);
			}
		} else if (this.numChildren() > 0) {
			let c = this.getChildAt(0);
			this.removeChildAt(0);
			lambda = evaluateNexSafely(c, executionEnv);
			if (!(lambda instanceof Lambda)) {
				throw new EError(`first argument ${lambda.debugString()} to command is not a lambda.`);
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

	doStep() {
		//
	}

	evaluate(executionEnv) {
		ILVL++;
		stackCheck(); // not for step eval, this is to prevent call stack overflow.
		if (this.enclosingClosure) {
			executionEnv = this.enclosingClosure;
		}
		let lambda = this.getLambda(executionEnv);
		if (CONSOLE_DEBUG) {
			console.log(`${INDENT()}evaluating command: ${this.debugString()}`);
			console.log(`${INDENT()}lambda is: ${lambda.debugString()}`);
		}
//		let argContainer = new NexChildArgContainer(this);
		let argContainer = (RENDERNODES ? new CopiedArgContainer(this) : new NexChildArgContainer(this));
		let closure = lambda.lexicalEnv.pushEnv();
		let argEvaluator = lambda.getArgEvaluator(argContainer, executionEnv, closure);
		argEvaluator.evaluateAndBindArgs();
		let r = lambda.executor(closure, executionEnv);
		if (CONSOLE_DEBUG) {
			console.log(`${INDENT()}command returned: ${r.debugString()}`);
		}
		ILVL--;
		return r;
	}

	// deprecated
	renderInto(domNode, shallow) {
		let toPassToSuperclass = domNode;
		if (RENDERNODES) {
			// change param name
			domNode = domNode.getDomNode();
		}
		if (RENDERFLAGS || RENDERNODES) {
			var renderFlags = shallow;
		}
		let codespan = null;
		if (RENDERFLAGS) {
			if (!(renderFlags & RENDER_FLAG_SHALLOW)) {
				codespan = document.createElement("span");
				codespan.classList.add('codespan');
				domNode.appendChild(codespan);
			}			
		} else {
			if (!shallow) {
				codespan = document.createElement("span");
				codespan.classList.add('codespan');
				domNode.appendChild(codespan);
			}
		}
		super.renderInto(toPassToSuperclass, shallow /* also renderFlags */); // will create children
		domNode.classList.add('command');
		domNode.classList.add('codelist');
		if (RENDERFLAGS) {
			if (!(renderFlags & RENDER_FLAG_SHALLOW)) {
				if (renderFlags & RENDER_FLAG_EXPLODED) {
					codespan.classList.add('exploded');
				} else {
					codespan.classList.remove('exploded');
				}
				codespan.innerHTML = '<span class="tilde">&#8766;</span>' + this.commandtext;
			}
		} else {
			if (!shallow) {
				if (this.renderType == NEX_RENDER_TYPE_EXPLODED) {
					codespan.classList.add('exploded');
				} else {
					codespan.classList.remove('exploded');
				}
				codespan.innerHTML = '<span class="tilde">&#8766;</span>' + this.commandtext;
			}
		}
		if (!RENDERNODES) {
			this.renderTags(domNode, shallow);
		}
	}

	renderChildrenIfNormal() {
		return false;
	}

	getCommandText() {
		return this.commandtext;
	}

	setCommandText(t) {
		this.commandtext = t;
	}

	isEmpty() {
		return this.commandtext == null || this.commandtext == '';
	}

	deleteLastCommandLetter() {
		this.commandtext = this.commandtext.substr(0, this.commandtext.length - 1);
	}

	appendCommandText(txt) {
		this.commandtext = this.commandtext + txt;
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

	getContextType() {
		return ContextType.COMMAND;
	}

	defaultHandle(txt) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let allowedKeyRegex = /^[a-zA-Z0-9-_=+/*<>:]$/;
		let isLetterRegex = /^.$/;
		if (allowedKeyRegex.test(txt)) {
			this.appendCommandText(txt);
		} else if (isLetterRegex.test(txt)) {
			if (this.hasChildren()) {
				manipulator.insertAfterSelectedAndSelect(new Letter(txt))
			} else {
				manipulator.appendAndSelect(new Letter(txt));
			}
		}
		return true;
	}

	getEventTable(context) {
		return {
			'Enter': 'do-line-break-always',
			'Backspace': 'delete-last-command-letter-or-remove-selected-and-select-previous-sibling',
			'ShiftSpace': 'toggle-dir',
		};
	}
}
