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
		this.cachedBuiltin = null;
		this.cacheGlobalBuiltin();
		this.skipFirstArg = false;
	}

	getTypeName() {
		return '-command-';
	}

	cacheGlobalBuiltin() {
		try {
			let binding = BUILTINS.lookupBinding(this.commandtext);
			if (binding instanceof Builtin) {
				this.cachedBuiltin = binding;
			} else {
				this.cachedBuiltin = null;
			}
		} catch (e) {
			this.cachedBuiltin = null;
		}
	}

	makeCopy(shallow) {
		let r = new Command();
		this.copyFieldsTo(r);
		this.copyChildrenTo(r, shallow);
		return r;
	}

	toString() {
		return `~"${this.commandtext}"${this.vdir ? 'v' : 'h'}(${super.childrenToString()}~)`;
	}

	copyFieldsTo(nex) {
		super.copyFieldsTo(nex);
		nex.commandtext = this.commandtext;
		nex.cacheGlobalBuiltin();
	}

	debugString() {
		return `(~${this.commandtext} ${super.childrenDebugString()})`;
	}

	getKeyFunnel() {
		return new CommandKeyFunnel(this);
	}

	pushNexPhase(phaseExecutor, env, renderNode) {
		let lambda = this.getLambda(env);
		phaseExecutor.pushPhase(lambda.phaseFactory(phaseExecutor, this, env, renderNode))
	}

	isLambdaCommand(env) {
		let lambda = this.getLambda(env);
		return !(lambda instanceof Builtin);
	}

	getLambda(executionEnv) {
		if (this.cachedBuiltin) {
			return this.cachedBuiltin;
		}
		let cmdname = this.getCommandText();
		let lambda = null;
		this.skipFirstArg = false;
		if (cmdname) {
			lambda = executionEnv.lookupBinding(cmdname);
			if (!(lambda instanceof Lambda)) {
				throw new EError(`So we are trying to run a command, but`
					+ ` the command name you provided was ${cmdname},`
					+ ` which is bound to something that is not a lambda -`
					+ ` but command objects can only execute lambdas (i.e. code).`
					+ ` The symbol ${cmdname} is instead bound to an`
					+ ` object of type ${lambda.getTypeName()}.`
					+ ` If it helps, we can give you the textual representation`
					+ ` of that object as follows: ${lambda.debugString()}`);
			}
		} else if (this.numChildren() > 0) {
			let c = this.getChildAt(0);
			this.skipFirstArg = true;
			lambda = evaluateNexSafely(c, executionEnv);
			if (!(lambda instanceof Lambda)) {
				throw new EError(`So this is a command with no name,`
					+ ` which is fine, as long as the first child`
					+ ` (in other words, the first argument)`
					+ ` evaluates to a lambda. However, it doesn't.`
					+ ` Instead, what we got for the first argument`
					+ ` was an object of type ${lambda.getTypeName()}.`
					+ ` If it helps, we can give you the textual representation`
					+ ` of that object as follows: ${lambda.debugString()}`);
			}
		} else {
			throw new EError(`Commands with no name have to have`
				+ ` a lambda as their first argument. This tells the`
				+ ` command what code to run. However, this command had no children`
				+ ` at all! So we have to generate an error and we cannot continue.`);
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

	evaluate(executionEnv) {
		pushStackLevel();
		stackCheck(); // not for step eval, this is to prevent call stack overflow.
		if (this.enclosingClosure) {
			executionEnv = this.enclosingClosure;
		}
		let lambda = this.getLambda(executionEnv);
		if (CONSOLE_DEBUG) {
			console.log(`${INDENT()}evaluating command: ${this.debugString()}`);
			console.log(`${INDENT()}lambda is: ${lambda.debugString()}`);
		}
		let argContainer = new CopiedArgContainer(this, this.skipFirstArg);
		let closure = lambda.lexicalEnv.pushEnv();
		let argEvaluator = lambda.getArgEvaluator(argContainer, executionEnv, closure);
		argEvaluator.evaluateAndBindArgs();
		let r = lambda.executor(closure, executionEnv);
		if (CONSOLE_DEBUG) {
			console.log(`${INDENT()}command returned: ${r.debugString()}`);
		}
		popStackLevel();
		return r;
	}

	// deprecated
	renderInto(renderNode, renderFlags) {
		let domNode = renderNode.getDomNode();
		let codespan = null;
		if (!(renderFlags & RENDER_FLAG_SHALLOW)) {
			codespan = document.createElement("span");
			codespan.classList.add('codespan');
			domNode.appendChild(codespan);
		}			
		super.renderInto(renderNode, renderFlags); // will create children
		domNode.classList.add('command');
		domNode.classList.add('codelist');
		if (!(renderFlags & RENDER_FLAG_SHALLOW)) {
			if (renderFlags & RENDER_FLAG_EXPLODED) {
				codespan.classList.add('exploded');
			} else {
				codespan.classList.remove('exploded');
			}
			codespan.innerHTML = '<span class="tilde">&#8766;</span>' + this.commandtext;
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
		this.cacheGlobalBuiltin();
	}

	isEmpty() {
		return this.commandtext == null || this.commandtext == '';
	}

	deleteLastCommandLetter() {
		this.commandtext = this.commandtext.substr(0, this.commandtext.length - 1);
		this.cacheGlobalBuiltin();
	}

	appendCommandText(txt) {
		this.commandtext = this.commandtext + txt;
		this.cacheGlobalBuiltin();
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
		if (txt != '*' && isNormallyHandled(txt)) {
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
