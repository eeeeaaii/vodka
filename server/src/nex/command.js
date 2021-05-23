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

import * as Utils from '../utils.js';

import { eventQueueDispatcher } from '../eventqueuedispatcher.js'
import { INDENT, systemState } from '../systemstate.js'
import { autocomplete } from '../autocomplete.js'
import { NexContainer } from './nexcontainer.js'
import { isNormallyHandled } from '../keyresponsefunctions.js'
import { BUILTINS, BINDINGS } from '../environment.js'
import { perfmon, PERFORMANCE_MONITOR } from '../perfmon.js'
import { EError } from './eerror.js'
import { CopiedArgContainer } from '../argcontainer.js'
import { Closure } from './closure.js'
import { Org } from './org.js'
import { NativeOrg } from './nativeorg.js'
import { ContextType } from '../contexttype.js'
import { evaluateNexSafely } from '../evaluator.js'
import { RENDER_FLAG_SHALLOW, RENDER_FLAG_EXPLODED, CONSOLE_DEBUG } from '../globalconstants.js'
import { Editor } from '../editors.js'
import { experiments } from '../globalappflags.js'


/**
 * Nex that represents a command (a {@link NexContainer} that can be executed/run)
 */
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
		this.searchingOn = null;
		this.previousMatch = null;
		this.skipAlert = false;
	}

	setSkipAlertAnimation(skipAlert) {
		this.skipAlert = skipAlert;
	}

	getTypeName() {
		return '-command-';
	}

	// this method also invalidates/deletes the existing cached closure,
	// and is meant to be called when the command text changes.
	cacheClosureIfCommandTextIsBound() {
		this.cachedClosure = null;
		// previously this function just tried to look up the binding
		// and caught the exception (and ignored it) if it failed. However
		// throwing exceptions is expensive and hurts performance so instead
		// we test directly for whether binding is here
		if (BUILTINS.hasBinding(this.commandtext)) {
			let closure = BUILTINS.lookupBinding(this.commandtext);
			if (closure) {
				// what if the name of the function gets rebound to a non-closure?
				this.cachedClosure = closure;
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
		// dead code , v2 always there?
	}

	toStringV2() {
		let cmdPrefix = Utils.convertMathToV2String(this.commandtext);
		if (cmdPrefix != '') {
			cmdPrefix = cmdPrefix + ' ';
		}
		return `~${this.toStringV2Literal()}${this.toStringV2PrivateDataSection()}${this.listStartV2()}${this.toStringV2TagList()}${cmdPrefix}${super.childrenToString('v2')}${this.listEndV2()}`;		
	}

	prettyPrintInternal(lvl, hdir) {
		// because of cmdPrefix we don't use standardListPrettyPrint
		let cmdPrefix = Utils.convertMathToV2String(this.commandtext);
		let fline = `${this.doTabs(lvl, hdir)}~${this.toStringV2PrivateDataSection()}${this.listStartV2()}${this.toStringV2TagList()}${cmdPrefix}`; // exp // \n`;
		let contents = this.prettyPrintChildren(lvl + 1);
		let lline = `${this.listEndV2()}` // exp
		return fline + contents + lline;
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

	getLambdaFromCachedClosure() {
		return this.cachedClosure.getLambda();
	}

	revertToCanonicalName() {
		let gclosure = this.getClosureForGhost();
		if (!gclosure) return;
		if (!Utils.isClosure(gclosure)) return;
		let lambda = gclosure.getLambda();
		if (!lambda) return;
		let canonicalName = lambda.getCanonicalName();
		if (!canonicalName) return;
		// wow we got one.
		this.setCommandText(canonicalName);
	}

	needsEvaluation() {
		return true;
	}

	getEvaluatedFirstChild() {
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
		let cmdname = this.getCommandText();
		let skipFirstArg = false;
		if (this.cachedClosure) {
			// it's cached, great. This is a builtin, so not skipping first arg.
			closure = this.cachedClosure;
		} else if (!!cmdname && cmdname.charAt(0) == '.') {
			// we are dereferencing the first child!
			if (this.numChildren() == 0) {
				throw new EError(`command: cannot dereference with expression "${cmdname}" without a first child to dereference into. Sorry!`)
			}
			let c = this.getChildAt(0);
			// evaluate the first arg, must eval to an org to deref
			let org = evaluateNexSafely(c, executionEnv);
			if (!(org instanceof Org || org instanceof NativeOrg)) {
				// oops it's not an org, can't dereference.
				throw new EError(`command: stopping because first child "${c.debugString()}" of is not an org so cannot be dereferenced by expression ${cmdname}. Sorry! Debug string for evaluted value of type ${org.getTypeName()} follows: ${org.debugString()}`)
			}				
			let derefArray = cmdname.substr(1).split('.');
			closure = executionEnv.dereference(org, derefArray);
			if (!(closure.getTypeName() == '-closure-')) {
				throw new EError(`command: stopping because org member dereferenced by "${cmdname}" is not a closure, so cannot execute. Sorry! Debug string for org follows: ${org.debugString()}`)
			}
			// we already evaluated the first arg, we don't pass it to the arg evaluator
			skipFirstArg = true;
		} else if (!!cmdname) {
			// environment will throw an exception if unbound
			closure = executionEnv.lookupBinding(cmdname);
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
		if (!cmdname) {
			// last ditch attempt to figure out command name, using boundName hack
			cmdname = closure.getBoundName();
		}
		if (!cmdname) {
			// we have to give them something
			cmdname = `\nunnamed function:\n${closure.getLambda().prettyPrint()}\n`;
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
		return this.runCommand(executionEnv);
	}

	runCommand(executionEnv) {
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
		if (!experiments.DISABLE_ALERT_ANIMATIONS && !this.skipAlert) {
			this.evalState.closure.doAlertAnimation();
		}
		// actually run the code.
		this.notReallyCachedClosure = this.evalState.closure;
		let r = this.evalState.closure.closureExecutor(executionEnv, argEvaluator, this.evalState.cmdname, this.tags);
		//let r = this.evalState.closure.closureStatementExecutor(executionEnv, argEvaluator, this.evalState.cmdname, this.tags);
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

	getClosureForGhost() {
		if (this.cachedClosure) {
			return this.cachedClosure;
		} else {
			// cachedClosure only contains builtins, not bindings.
			// The full eval commandname resolution takes into account the lexical
			// environment, etc.
			// for ghost display of command info, we do want to consult bindings,
			// but lexical env is not gonna happen (yet?)
			if (BINDINGS.hasBinding(this.commandtext)) {
				let closure = BINDINGS.lookupBinding(this.commandtext);
				if (closure) {
					return closure;
				}
			}			
		}
		return null;
	}

	createGhostDiv(gclosure) {
		let ghost = document.createElement('div');
		ghost.classList.add('ghost');
		let val = gclosure.getInnerHTMLForDisplay();
		ghost.innerHTML = val;
		let ghostline = document.createElement('div');
		ghostline.classList.add('ghostline')
		ghost.appendChild(ghostline);
		return ghost;
	}

	// isInfix(cmdname) {
	// 	return !!cmdname &&
	// 		(cmdname == '-' || Utils.convertMathToV2String(cmdname).indexOf('::') == 0);
	// }

	// Since we are supporting infix operators we want to support things like
	// IF something THEN something ELSE something
	// 
	getInfixPart(position, cmdname) {
		// each double hyphen in the name stands for a child.
		// but if there are n hyphens and less than n children,
		// the last time we call getInfixPart, we need to display
		// the entire remaining portion of the name.
		//
		// so if the name is foo--bar--baz, it's supposed to have 2 children.
		//
		// if there are zero children:
		//   getInfixPart(0, ...) returns 'foo--bar--baz'
		//   getInfixPart(1, ...) never gets called
		//
		// if there is one child
		//   getInfixPart(0, ...) returns 'foo'
		//   getInfixPart(1, ...) returns 'bar-baz'
		//   getInfixPart(2, ...) never gets called
		//
		// if there are two children
		//   getInfixPart(0, ...) returns 'foo'
		//   getInfixPart(1, ...) returns 'bar'
		//   getInfixPart(2, ...) returns 'baz'
		//   getInfixPart(3, ...) never gets called
		//
		// if there are three children
		//   getInfixPart(0, ...) returns 'foo'
		//   getInfixPart(1, ...) returns 'bar'
		//   getInfixPart(2, ...) returns 'baz'
		//   getInfixPart(3, ...) returns ''


		let a = (cmdname == "") ? [] : cmdname.split('--')
		if (position >= a.length) {
			return '';
		}
		if (a[a.length-1] == '') {
			a.pop();
			a[a.length-1] = a[a.length-1] + '--';
		}
		let nc = this.numChildren();
		if (a.length > nc + 1) {
			for (let i = nc + 1; i < a.length; i++) {
				a[nc] = a[nc] + '--' + a[i];
			}
		}
		if (position < a.length) {
			return a[position].replace(/--/g, '__');
//			return a[position];
		} else {
			return '';
		}
	}

	getGhostDiv(renderNode) {
		if (experiments.NEW_CLOSURE_DISPLAY && this.isEditing && renderNode.isSelected()) {
			let gclosure = this.getClosureForGhost();
			if (gclosure && Utils.isClosure(gclosure)) {
				return this.createGhostDiv(gclosure);
			}
		}
		return null;
	}

	getInitialCodespanContents(renderNode) {
		let codespanHtml = '<span class="tilde">&#8766;</span>';
		if (experiments.NO_TILDE && !this.isEditing) {
			codespanHtml = '';
		}
		if (experiments.INFIX_OPERATORS) {
			let gclosure = this.getClosureForGhost();
			let operatorInfix = (gclosure &&
					Utils.isClosure(gclosure) &&
					gclosure.getLambda().isInfix() &&
					this.numChildren() > 1);
			if (!operatorInfix) {
				codespanHtml += this.getInfixPart(0, this.commandtext);
			}
		} else {
			codespanHtml += this.commandtext;
		}
		return codespanHtml;
	}

	renderInto(renderNode, renderFlags, withEditor) {
		let domNode = renderNode.getDomNode();
		let codespan = null;
		let ghostDiv = this.getGhostDiv(renderNode);
		let codespanHtml = this.getInitialCodespanContents(renderNode);
		if (!(renderFlags & RENDER_FLAG_SHALLOW) && codespanHtml != '' || ghostDiv) {
			codespan = document.createElement("span");
			codespan.classList.add('codespan');
			codespan.innerHTML = codespanHtml;
			domNode.appendChild(codespan);
		}
		super.renderInto(renderNode, renderFlags, withEditor); // will create children
		domNode.classList.add('command');
		domNode.classList.add('codelist');
		if (!(renderFlags & RENDER_FLAG_SHALLOW)) {
			if (codespan) {
				if (renderFlags & RENDER_FLAG_EXPLODED) {
					codespan.classList.add('exploded');
				} else {
					codespan.classList.remove('exploded');
				}
				if (this.isEditing) {
					codespan.classList.add('editing');
				} else {
					codespan.classList.remove('editing');
				}
			}
			if (ghostDiv) {
				codespan.appendChild(ghostDiv);
			}
			// let codespanHtml = experiments.NO_TILDE ? '' : '<span class="tilde">&#8766;</span>';
			// if (experiments.INFIX_OPERATORS) {
			// 	let gclosure = this.getClosureForGhost();
			// 	if (gclosure && Utils.isClosure(gclosure) && gclosure.getLambda().isInfix() /*this.isInfix(this.commandtext)*/ && this.numChildren() > 1) {
			// 	} else {
			// 		codespanHtml += this.getInfixPart(0, this.commandtext);
			// 	}
			// } else {
			// 	codespanHtml += this.commandtext;
			// }
			// codespan.innerHTML = codespanHtml;
			// if (experiments.NEW_CLOSURE_DISPLAY && this.isEditing && renderNode.isSelected()) {
			// 	let gclosure = this.getClosureForGhost();
			// 	if (gclosure && Utils.isClosure(gclosure)) {
			// 		codespan.appendChild(this.createGhostDiv(gclosure));
			// 	}
			// }
		}
	}

	renderAfterChild(childNum, renderNode, renderFlags, withEditor) {
		if (experiments.INFIX_OPERATORS) {
			let gclosure = this.getClosureForGhost();
			let infixOperator = (gclosure
					&& Utils.isClosure(gclosure)
					&& gclosure.getLambda().isInfix()
					&& childNum < this.numChildren() - 1);
			let infixName = (!!this.getInfixPart(childNum + 1, this.commandtext));
			if (infixOperator || infixName) {
				let innercodespan = null;
				innercodespan = document.createElement("span");
				innercodespan.classList.add('innercodespan');
				if (this.isEditing) {
					innercodespan.classList.add('editing');
				} else {
					innercodespan.classList.remove('editing');
				}
				if (renderFlags & RENDER_FLAG_EXPLODED) {
					innercodespan.classList.add('exploded');
				} else {
					innercodespan.classList.remove('exploded');
				}
				if (infixOperator) {
					innercodespan.innerHTML = this.commandtext;
				} else { // infixName
					innercodespan.innerHTML = this.getInfixPart(childNum + 1, this.commandtext);
				}
				let domNode = renderNode.getDomNode();
				domNode.appendChild(innercodespan);
			}		
		}
	}

	renderTags(domNode, renderFlags, editor) {
		if (experiments.ORG_OVERHAUL) {
			let codespan = domNode.firstChild;
			super.renderTags(codespan, renderFlags, editor);			
		} else {
			super.renderTags(domNode, renderFlags, editor);
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

	getContextType() {
		return ContextType.COMMAND;
	}

	autocomplete() {
		let searchText = this.searchingOn ? this.searchingOn : this.getCommandText();
		let match = autocomplete.findNextMatchAfter(searchText, this.previousMatch);
		this.setCommandText(match);
		this.searchingOn = searchText;
		this.previousMatch = match;
		this.setDirtyForRendering(true);
	}

	static quote(item) {
		let q = new Command('quote');
		q.fastAppendChildAfter(item, null);
		return q;
	}

	// for performance reasons I have these hard coded functions where
	// you just pass N args

	static makeCommandWithClosureZeroArgs(closure) {
		let cmd = new Command();
		let appendIterator = null;
		appendIterator = cmd.fastAppendChildAfter(Command.quote(closure), appendIterator);
		return cmd;
	}

	static makeCommandWithClosureOneArg(closure, arg0) {
		let cmd = new Command();
		let appendIterator = null;
		appendIterator = cmd.fastAppendChildAfter(Command.quote(closure), appendIterator);
		appendIterator = cmd.fastAppendChildAfter(arg0, appendIterator);
		return cmd;
	}

	static makeCommandWithClosureTwoArgs(closure, arg0, arg1) {
		let cmd = new Command();
		let appendIterator = null;
		appendIterator = cmd.fastAppendChildAfter(Command.quote(closure), appendIterator);
		appendIterator = cmd.fastAppendChildAfter(arg0, appendIterator);
		appendIterator = cmd.fastAppendChildAfter(arg1, appendIterator);
		return cmd;
	}

	static makeCommandWithClosureThreeArgs(closure, arg0, arg1, arg2) {
		let cmd = new Command();
		let appendIterator = null;
		appendIterator = cmd.fastAppendChildAfter(Command.quote(closure), appendIterator);
		appendIterator = cmd.fastAppendChildAfter(arg0, appendIterator);
		appendIterator = cmd.fastAppendChildAfter(arg1, appendIterator);
		appendIterator = cmd.fastAppendChildAfter(arg2, appendIterator);
		return cmd;
	}

	static makeCommandWithClosure(closure, maybeargs) {
		let cmd = new Command();
		let appendIterator = null;
		appendIterator = cmd.fastAppendChildAfter(Command.quote(closure), appendIterator);

		// this little snippet lets you do varargs or array
		let args = [];
		if (Array.isArray(maybeargs)) {
			args = maybeargs;
		} else {
			args = Array.prototype.slice.call(arguments).splice(1);
		}
		for (let i = 0; i < args.length; i++) {
			appendIterator = cmd.fastAppendChildAfter(args[i], appendIterator);
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
		let appendIterator = null;
		for (let i = 0; i < args.length; i++) {
			appendIterator = cmd.fastAppendChildAfter(args[i], appendIterator);
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
		return 'standardDefault';
	}

	getEventTable(context) {
		if (experiments.BETTER_KEYBINDINGS) {
			return {
				'CtrlSpace': (
					experiments.THE_GREAT_MAC_WINDOWS_OPTION_CTRL_SWITCHAROO ? null
					: (experiments.BETTER_KEYBINDINGS ? 'autocomplete' : null)),
				'AltSpace': (
					(!experiments.THE_GREAT_MAC_WINDOWS_OPTION_CTRL_SWITCHAROO) ? null
					: (experiments.BETTER_KEYBINDINGS ? 'autocomplete' : null)),
			};
		} else {
			return {
				'ShiftEnter': 'evaluate-nex-and-keep',
				'Enter': 'evaluate-nex',
				'CtrlSpace': 'autocomplete',
				'ShiftSpace': 'toggle-dir',
				'Backspace': 'delete-last-command-letter-or-remove-selected-and-select-previous-sibling'
			};
		}
	}
}

class CommandEditor extends Editor {

	constructor(nex) {
		super(nex, 'CommandEditor');
	}

	finish() {
		super.finish();
		this.nex.revertToCanonicalName();
	}

	doBackspaceEdit() {
		this.nex.deleteLastCommandLetter();
	}

	doAppendEdit(text) {
		this.nex.appendCommandText(text);
	}

	hasContent() {
		return this.nex.getCommandText() != '';
	}

	shouldAppend(text) {
		if (/^[a-zA-Z0-9:.-]$/.test(text)) return true; // normal chars
		if (/^[/<>=+*]$/.test(text)) return true;
		return false;
	}

	shouldTerminateAndReroute(input) {
		if (super.shouldTerminateAndReroute()) return true;
		// don't terminate for math stuff, this is temporary
		if (/^[/<>=+*]$/.test(input)) return false;

		// command-friendly characters
		if (/^[a-zA-Z0-9:.-]$/.test(input)) return false;

		// anything else, pop out
		return true;
	}
}

export { Command, CommandEditor }
