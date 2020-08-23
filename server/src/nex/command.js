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

import { eventQueueDispatcher } from '../eventqueuedispatcher.js'
import { INDENT, systemState } from '../systemstate.js'
import { autocomplete } from '../autocomplete.js'
import { NexContainer } from './nexcontainer.js'
import { isNormallyHandled } from '../keyresponsefunctions.js'
import { BUILTINS } from '../environment.js'
import { perfmon, PERFORMANCE_MONITOR } from '../perfmon.js'
import { EError } from './eerror.js'
import { CopiedArgContainer } from '../argcontainer.js'
import { Closure } from './closure.js'
import { ContextType } from '../contexttype.js'
import { evaluateNexSafely } from '../evaluator.js'
import { RENDER_FLAG_SHALLOW, RENDER_FLAG_EXPLODED, CONSOLE_DEBUG } from '../globalconstants.js'

// remove with deprecated defaultHandle
import { Letter } from './letter.js'


class Command extends NexContainer {
	constructor(val) {
		super();
		this.commandtext = (val ? val : "");
		this.cachedClosure = null;
		this.notReallyCachedClosure = null; // a wonderful hack
		// a lot of the builtins and other code generate commands with null command strings
		// and append a lambda as the first argument - there's no need to attempt
		// caching in those cases and it's a real performance hit.
		if (this.commandtext) {
			this.cacheClosureIfCommandTextIsBound();
		}

		this.evalState = null;

		// private data is currently unused but I want the logic for
		// handling it here so I can implement parsing and tests for it
		this.privateData = '';
	}

	getTypeName() {
		return '-command-';
	}

	// this method also invalidates/deletes the existing cached closure,
	// and is meant to be called when the command text changes.
	cacheClosureIfCommandTextIsBound() {
		this.cachedClosure = null;
		try {
			let closure = BUILTINS.lookupBinding(this.commandtext);
			if (closure) {
				this.cachedClosure = closure;
			}
		} catch (e) {
			if (!(e instanceof EError)) {
				throw e;
			}
		}
	}

	makeCopy(shallow) {
		let r = new Command();
		this.copyChildrenTo(r, shallow);
		this.copyFieldsTo(r);
		return r;
	}

	toString(version) {
		if (version == 'v2') {
			return this.toStringV2();
		}
		return `~"${this.commandtext}"${this.vdir ? 'v' : 'h'}(${super.childrenToString()}~)`;
	}

	convertMathToV2String(val) {
		switch(val) {
			case '*': return '::ti::';
			case '/': return '::ov::';
			case '+': return '::pl::';
			case '=': return '::eq::';
			case '<': return '::lt::';
			case '>': return '::gt::';
			case '<=': return '::lte::';
			case '>=': return '::gte::';
			case '<>': return '::ne::';
			default: return val;
		}
	}

	static convertV2StringToMath(val) {
		switch(val) {
			case '::ti::': return '*' ;
			case '::ov::': return '/' ;
			case '::pl::': return '+' ;
			case '::eq::': return '=' ;
			case '::lt::': return '<' ;
			case '::gt::': return '>' ;
			case '::lte::': return '<=' ;
			case '::gte::': return '>=' ;
			case '::ne::': return '<>' ;
			default: return val;
		}
	}

	toStringV2() {
		let cmdPrefix = this.convertMathToV2String(this.commandtext);
		if (cmdPrefix != '') {
			cmdPrefix = cmdPrefix + ' ';
		}
		return `~${this.toStringV2PrivateDataSection()}${this.listStartV2()}${this.toStringV2TagList()}${cmdPrefix}${super.childrenToString('v2')}${this.listEndV2()}`;		
	}

	deserializePrivateData(data) {
		this.privateData = data;
	}

	serializePrivateData() {
		return this.privateData;
	}

	copyFieldsTo(nex) {
		super.copyFieldsTo(nex);
		nex.commandtext = this.commandtext;
		nex.cacheClosureIfCommandTextIsBound();
	}

	debugString() {
		return `(~${this.commandtext} ${super.childrenDebugString()})`;
	}

	isLambdaCommand(env) {
		let closure = this.getClosure(env);
		return !(closure.isBuiltin());
	}

	getCommandName() {
		let r = this.getCommandText();
		if (r) {
			return r;
		} else if (this.numChildren() > 0) {
			let c = this.getChildAt(0);
			if (c.getTypeName() == '-symbol-') {
				return c.getTypedValue();
			}
		} else {
			return null;
		}
	}

	hasCachedClosure() {
		return !!this.cachedClosure;
	}

	needsEvaluation() {
		return true;
	}

	evalSetup(executionEnv) {
		// do not cache the entire eval state by doing
		// something like if (this.evalState) return;
		//
		// we need to reevaluate the evalState every
		// time we evaluate. The only thing
		// we want to cache with commands
		// is cachedClosure and even that presupposes
		// we can't re-bind symbols to the same
		// names as builtins (we don't prevent this)

		// we need a closure, we need a name to use for error messages, and we need to know if skip first arg.
		let closure = null;
		let cmdname = null;
		let skipFirstArg = false;
		if (this.cachedClosure) {
			// it's cached, great. This is a builtin, so not skipping first arg.
			closure = this.cachedClosure;
			cmdname = this.getCommandText();
		} else if (!!this.getCommandText()) {
			// there is command text -- look this up and see if it's bound to something.
			cmdname = this.getCommandText();
			// environment will throw an exception if unbound
			closure = executionEnv.lookupBinding(this.getCommandText());
			// but we also have to make sure it's bound to a closure
			if (!(closure.getTypeName() == '-closure-')) {
				throw new EError(`command: stopping because "${cmdname}" not bound to closure, so cannot execute. Sorry! Debug string for object bound to ${cmdname} of type ${closure.getTypeName()} follows: ${closure.debugString()}`)
			}
		} else if (this.numChildren() > 0) {
			// okay alternate plan, we look at the first child of the command
			let c = this.getChildAt(0);
			// if it's a symbol we can incidentally get the command name
			if (c.getTypeName() == '-symbol-') {
				cmdname = c.getTypedValue();
			}
			// evaluate the first arg, could be a symbol bound to a closure, a lamba, a command that returns a closure, etc.
			closure = evaluateNexSafely(c, executionEnv);
			if (!(closure instanceof Closure)) {
				// oops it's not a closure.
				throw new EError(`command: stopping because first child "${c.debugString()}" of unnamed command does not evaluate to a closure. Sorry! Debug string for evaluted value of type ${closure.getTypeName()} follows: ${closure.debugString()}`)
			}				
			// we already evaluated the first arg, we don't pass it to the arg evaluator
			skipFirstArg = true;
		} else {
			// someone tried to evaluate (~ )
			throw new EError(`command: command with no name and no children has nothing to execute. Sorry!`)			
		}
		if (cmdname == null) {
			// last ditch attempt to figure out command name, using boundName hack
			cmdname = closure.getBoundName();
		}
		if (cmdname == null) {
			// we have to give them something
			cmdname = `<br>*** unnamed function, function body follows **** <br>${closure.getLambdaDebugString()}<br>*** end function body ***<br>`;
		}

		this.evalState = {
			closure: closure,
			cmdname: cmdname,
			skipFirstArg: skipFirstArg
		}
	}

	getExpectedReturnType() {
		return this.evalState.closure.getReturnValueParam();
	}

	maybeGetCommandName() {
		return this.evalState.cmdname;
	}

	evalCleanup() {
		this.evalState = null;
	}

	// the executionEnv is captured and becomes the lexical environment of any closures that are
	//   created by evaluating lambdas.
	// it is also used for special forms that have skipeval = true
	// it is also used to look up symbol bindings

	evaluate(executionEnv) {
		systemState.pushStackLevel();
		systemState.stackCheck(); // not for step eval, this is to prevent call stack overflow.

		if (CONSOLE_DEBUG) {
			console.log(`${INDENT()}evaluating command: ${this.debugString()}`);
			console.log(`${INDENT()}closure is: ${this.evalState.closure.debugString()}`);
		}
		// the arg container holds onto the args and is used by the arg evaluator.
		// I think this is useful for step eval but I can't remember
		let argContainer = new CopiedArgContainer(this, this.evalState.skipFirstArg);
		// in the future there will be one arg evaluator used by both builtins and lambdas.
		// the job of the evaluator is to evaluate the args AND bind them to variables in the new scope.
		let argEvaluator = this.evalState.closure.getArgEvaluator(this.evalState.cmdname, argContainer, executionEnv);
		argEvaluator.evaluateArgs();
		if (PERFORMANCE_MONITOR) {
			perfmon.logMethodCallStart(this.evalState.closure.getCmdName());
		}
		this.evalState.closure.doAlertAnimation();
		// actually run the code.
		this.notReallyCachedClosure = this.evalState.closure;
		let r = this.evalState.closure.executor(executionEnv, argEvaluator, this.evalState.cmdname, this.tags);
		if (PERFORMANCE_MONITOR) {
			perfmon.logMethodCallEnd(this.evalState.closure.getCmdName());
		}
		if (CONSOLE_DEBUG) {
			console.log(`${INDENT()}command returned: ${r.debugString()}`);
		}
		systemState.popStackLevel();
		return r;
	}

	shouldActivateReturnedExpectations() {
		return this.notReallyCachedClosure.shouldActivateReturnedExpectations();
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
		this.cacheClosureIfCommandTextIsBound();
		this.searchingOn = null;
		this.previousMatch = null;
	}

	isEmpty() {
		return this.commandtext == null || this.commandtext == '';
	}

	deleteLastCommandLetter() {
		this.commandtext = this.commandtext.substr(0, this.commandtext.length - 1);
		this.cacheClosureIfCommandTextIsBound();
		this.searchingOn = null;
		this.previousMatch = null;
	}

	appendCommandText(txt) {
		this.commandtext = this.commandtext + txt;
		this.cacheClosureIfCommandTextIsBound();
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

	static quote(item) {
		let q = new Command('quote');
		q.appendChild(item);
		return q;
	}

	static makeCommandWithClosure(closure, maybeargs) {
		let cmd = new Command();
		cmd.appendChild(Command.quote(closure));

		// this little snippet lets you do varargs or array
		let args = [];
		if (Array.isArray(maybeargs)) {
			args = maybeargs;
		} else {
			args = Array.prototype.slice.call(arguments).splice(1);
		}
		for (let i = 0; i < args.length; i++) {
			cmd.appendChild(args[i]);
		}
		return cmd;
	}

	static makeCommandWithArgs(cmdname, maybeargs) {
		let cmd = new Command(cmdname);

		// this little snippet lets you do varargs or array
		let args = [];
		if (Array.isArray(maybeargs)) {
			args = maybeargs;
		} else {
			args = Array.prototype.slice.call(arguments).splice(1);
		}
		for (let i = 0; i < args.length; i++) {
			cmd.appendChild(args[i]);
		}
		return cmd;
	}

	// used by above static helper functions
	static pushListContentsIntoArray(array, list) {
		for (let i = 0; i < list.numChildren(); i++) {
			array.push(list.getChildAt(i));
		}
	}

	getDefaultHandler() {
		return 'insertAfterCommand';
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

export { Command }
