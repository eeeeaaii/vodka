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
		if (val) {
			this.cacheGlobalBuiltin();
		}
		this.symbolversion = -1;
		this.symbol = null;
		this.firstLambdaChildHasAlreadyBeenEvaluated = false;
	}

	getTypeName() {
		return '-command-';
	}

	setFirstLambdaChildHasAlreadyBeenEvaluated(val) {
		this.firstLambdaChildHasAlreadyBeenEvaluated = val;
	}

	cacheGlobalBuiltin() {
		this.cachedBuiltin = null;
		try {
			let binding = BUILTINS.lookupBinding(this.commandtext);
			if (binding) {
				this.cachedBuiltin = binding;
			}
		} catch (e) {
			if (!(e instanceof EError)) {
				throw e;
			}
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

	// UNUSED BUT AT SOME POINT CONSIDER DOING IT THIS WAY INSTEAD
	getSymbol() {
		if (this.symbolversion >= 0) {
			return this.symbol;
		};
		let cmdtxt = this.getCommandText();
		if (cmdtxt) {
			return cmdtxt;
		} else if (this.numChildren() == 0) {
			throw new EError(`COMMAND: command with no name and no children has nothing to execute. Sorry!`);
		} else if (this.getChildAt(0).getTypeName() == '-symbol-') {
			return this.getChildAt(0).getTypedValue();
		} else {
			return null; // no symbol, first arg must just *be* a lambda.
		}
	}

	shouldSkipFirstArg() {
		return !this.getCommandText();
	}

	// UNUSED BUT AT SOME POINT CONSIDER DOING IT THIS WAY INSTEAD
	getLambda2(executionEnv) {
		// the last time the name of this command was modified, it mapped
		// to a builtin, so we just return that... we know the definition
		// of a builtin will not change.
		if (this.cachedBuiltin) {
			return this.cachedBuiltin;
		}
		// this may have a symbol mapping. if so, we need to get its binding,
		// check the version to make sure the version we have cached is correct
		// (unless we don't have it cached)
		let symbol = this.getSymbol();
		if (symbol) {
			let binding = executionEnv.lookupFullBinding(symbol);
			if (this.symbolversion < 0 || (this.symbolversion != binding.version)) {
				this.cachedLambda = binding.val;
				this.cachedLambda.setCmdName(symbol); // this is for debugging
				this.symbolversion = binding.version;
			}
			return this.cachedLambda;
		} else if (this.numChildren() > 0) {
			// we don't make a copy because we have to re-evaluate every time anyway
			let c = this.getChildAt(0);
			if (!this.firstLambdaChildHasAlreadyBeenEvaluated) {
				let lambda = evaluateNexSafely(c, executionEnv);
			}
			if (!(lambda instanceof Lambda)) {
				throw new EError(`COMMAND: stopping because first child of unnamed command is not a lambda. Sorry! Debug string for object of type ${lambda.getTypeName()} follows: ${lambda.debugString()}`)
			}
			return lambda;
		} else {
			throw new EError(`COMMAND: command with no name and no children has nothing to execute. Sorry!`)
		}
	}

	getLambda(executionEnv) {
		if (this.cachedBuiltin) {
			return this.cachedBuiltin;
		}
		let cmdname = this.getCommandText();
		let lambda = null;
//		this.skipFirstArg = false;
		if (cmdname) {
			lambda = executionEnv.lookupBinding(cmdname);
			if (!(lambda instanceof Lambda)) {
				throw new EError(`${cmdname}: stopping because command name not bound to lambda, so cannot execute. Sorry! Debug string for object bound to ${cmdname} of type ${lambda.getTypeName()} follows: ${lambda.debugString()}`)
			}
		} else if (this.numChildren() > 0) {
			let c = this.getChildAt(0);
//			this.skipFirstArg = true;
			lambda = evaluateNexSafely(c, executionEnv);
			if (!(lambda instanceof Lambda)) {
				throw new EError(`COMMAND: stopping because first child of unnamed command is not a lambda. Sorry! Debug string for object of type ${lambda.getTypeName()} follows: ${lambda.debugString()}`)
			}
		} else {
			throw new EError(`COMMAND: command with no name and no children has nothing to execute. Sorry!`)
		}
		if (lambda == null) {
			throw new Error("this shouldn't happen");
		}
		lambda.setCmdName(cmdname);
		this.doAlertAnimation(lambda);
		return lambda;
	}

	doAlertAnimation(lambda) {
		let rn = lambda.getRenderNodes();
		for (let i = 0; i < rn.length; i++) {
			eventQueue.enqueueAlertAnimation(rn[i]);
//			rn[i].doAlertAnimation();
		}
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
		let argContainer = new CopiedArgContainer(this, this.shouldSkipFirstArg());
		let closure = lambda.closure;
		// you need to make a new lexical environment every time you evaluate the lambda
		// but you ALSO need to make a new one every time you evaluate the command.
		// the lambda could be evaluated again if its codepath is covered again.
		// also a given command can be evaluated multiple times
		closure = closure.pushEnv();
		closure.usePackage(lambda.inPackage);
		let argEvaluator = lambda.getArgEvaluator(argContainer, executionEnv, closure);
		argEvaluator.evaluateAndBindArgs();
		if (PERFORMANCE_MONITOR) {
			perfmon.logMethodCallStart(lambda.getCmdName());
		}
		let r = lambda.executor(closure, executionEnv);
		if (PERFORMANCE_MONITOR) {
			perfmon.logMethodCallEnd(lambda.getCmdName());
		}
		if (CONSOLE_DEBUG) {
			console.log(`${INDENT()}command returned: ${r.debugString()}`);
		}
		popStackLevel();
		return r;
	}

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
		this.searchingOn = null;
		this.previousMatch = null;
//		this.symbolversion = -1;

	}

	isEmpty() {
		return this.commandtext == null || this.commandtext == '';
	}

	deleteLastCommandLetter() {
		this.commandtext = this.commandtext.substr(0, this.commandtext.length - 1);
		this.cacheGlobalBuiltin();
		this.searchingOn = null;
		this.previousMatch = null;
	}

	appendCommandText(txt) {
		this.commandtext = this.commandtext + txt;
		this.cacheGlobalBuiltin();
		this.searchingOn = null;
		this.previousMatch = null;
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

	autocomplete() {
		let searchText = this.searchingOn ? this.searchingOn : this.getCommandText();
		let match = autocomplete.findNextMatchAfter(searchText, this.previousMatch);
		this.setCommandText(match);
		this.searchingOn = searchText;
		this.previousMatch = match;
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
			'ShiftEnter': 'evaluate-nex-and-keep',
			'Enter': 'evaluate-nex',
			'Backspace': 'delete-last-command-letter-or-remove-selected-and-select-previous-sibling',
			'ShiftSpace': 'toggle-dir',
			'CtrlSpace': 'autocomplete'
		};
	}
}
