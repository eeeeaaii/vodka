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
import { autocomplete } from '../autocomplete.js'
import { NexContainer } from './nexcontainer.js'
import { BUILTINS, BINDINGS } from '../environment.js'
import { EError } from './eerror.js'
import { Closure } from './closure.js'
import { Org } from './org.js'
import { ContextType } from '../contexttype.js'
import { evaluateNexSafely } from '../evaluator.js'
import { RENDER_FLAG_SHALLOW, RENDER_FLAG_EXPLODED } from '../globalconstants.js'
import { Editor } from '../editors.js'
import { experiments } from '../globalappflags.js'
import { doTutorial } from '../help.js'
import { executeRunInfo, ArgContainer, Arg, RunInfo } from '../commandfunctions.js'


/**
 * Nex that represents a command (a {@link NexContainer} that can be executed/run)
 */
class Command extends NexContainer {
	constructor(val) {
		super();

		// temporary hack to help convert old files
		if (val) {
			val = val.replace(/--/g, ' ');
		}

		this.commandtext = (val ? val : "");
		this.cachedClosure = null;
		// a lot of the builtins and other code generate commands with null command strings
		// and append a lambda as the first argument - there's no need to attempt
		// caching in those cases and it's a real performance hit.
		if (this.commandtext) {
			this.cacheClosureIfCommandTextIsBound();
		}

		this.evalState = null;

		this.unparsableCommandName = '';


		this.searchingOn = null;
		this.previousMatch = null;
		this.skipAlert = false;
		this.ghostMatch = null;

		if (experiments.ASM_RUNTIME) {
			this.wasmSetup();
		}
	}

	wasmSetup() {
		this.runtimeId = Module.ccall("create_command",
			'number',
			[]);
		this.setWasmValue = Module.cwrap("set_command_value",
			'number',
			['number', 'string']);
		this.getWasmValue = Module.cwrap("get_command_value",
			'string',
			['number']);
	}

	getCommandText() {
		if (experiments.ASM_RUNTIME) {
			return this.getWasmValue(this.runtimeId);
		} else {
			return this.commandtext;
		}
	}

	setCommandText(t) {
		if (experiments.ASM_RUNTIME) {
			this.setWasmValue(this.runtimeId, t);
		} else {
	 		this.ghostMatch = null;
			this.commandtext = t;
			this.cacheClosureIfCommandTextIsBound();
			this.searchingOn = null;
			this.previousMatch = null;
			this.setDirtyForRendering(true);
		}
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
		// If the command contains characters that aren't parsable we put the command name
		// in the private data section instead.
		let re = /^[a-zA-Z0-9:.-]*$/;
		if (cmdPrefix == '' || re.test(cmdPrefix)) {
			if (cmdPrefix != '') {
				cmdPrefix = cmdPrefix + ' ';
			}
			return `~${this.toStringV2Literal()}${this.toStringV2PrivateDataSection()}${this.listStartV2()}${this.toStringV2TagList()}${cmdPrefix}${super.childrenToString('v2')}${this.listEndV2()}`;
		} else {
			// I only need this when serializing
			this.unparsableCommandName = cmdPrefix;
			let r = `~${this.toStringV2Literal()}${this.toStringV2PrivateDataSection()}${this.listStartV2()}${this.toStringV2TagList()}${super.childrenToString('v2')}${this.listEndV2()}`;
			this.unparsableCommandName = '';
			return r;
		}
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
		// if private data was stored with the command, it means that the command name
		// contained unparsable characters.
		if (data) {
			this.commandtext = data;
		}
	}

	serializePrivateData() {
		if (this.unparsableCommandName) {
			return this.unparsableCommandName;
		}
		return '';
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

	commitMatch() {
		if (this.ghostMatch) {
			this.setCommandText(this.ghostMatch.name);
			this.ghostMatch = null;
		}
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

	// used for deprecated step executation
	needsEvaluation() {
		return true;
	}

	createRunInfo(executionEnv) {
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
		let packageName = '';
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
			if (!(org instanceof Org)) {
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
			let binding = executionEnv.lookupFullBinding(cmdname);
			closure = binding.val;
			packageName = binding.packageName;
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

		let argContainer = new ArgContainer(this);
		let start = skipFirstArg ? 1 : 0;
		for (let i = start; i < this.numChildren(); i++) {
			argContainer.addArg(new Arg(this.getChildAt(i)));
		}

		let argEvaluator = closure.getArgEvaluator(cmdname, argContainer, executionEnv);

		return new RunInfo(
			closure,
			cmdname,
			closure.getReturnValueParam(),
			argContainer,
			argEvaluator,
			this.debugString(),
			this.skipAlert,
			this.getAllTags(),
			packageName);
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

	evaluate(executionEnv) {
		let runInfo = this.createRunInfo(executionEnv);
		// the job of the evaluator is to evaluate the args AND bind them to variables in the new scope.
		runInfo.argEvaluator.evaluateArgs(runInfo.cmdname);
		return executeRunInfo(runInfo, executionEnv);
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
			let txt = this.commandtext;
			if (this.ghostMatch) {
				txt = this.ghostMatch.name;
			}
			if (BINDINGS.hasBinding(txt)) {
				let closure = BINDINGS.lookupBinding(txt);
				if (closure) {
					return closure;
				}
			}			
		}
		return null;
	}

	createGhostDiv(gclosure) {
		doTutorial('tooltip');
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
	getInfixPart(position) {
		// each space in the name stands for a child.
		// but if there are n spaces and less than n children,
		// the last time we call getInfixPart, we need to display
		// the entire remaining portion of the name.
		//
		// so if the name is "foo bar baz", it's supposed to have 2 children.
		//
		// if there are zero children:
		//   getInfixPart(0) returns 'foo bar baz'
		//   getInfixPart(1) never gets called
		//
		// if there is one child
		//   getInfixPart(0) returns 'foo'
		//   getInfixPart(1) returns 'bar baz'
		//   getInfixPart(2) never gets called
		//
		// if there are two children
		//   getInfixPart(0) returns 'foo'
		//   getInfixPart(1) returns 'bar'
		//   getInfixPart(2) returns 'baz'
		//   getInfixPart(3) never gets called
		//
		// if there are three children
		//   getInfixPart(0) returns 'foo'
		//   getInfixPart(1) returns 'bar'
		//   getInfixPart(2) returns 'baz'
		//   getInfixPart(3) returns ''

		let rightglyph = '<span class="tilde glyphright">&#8766;</span>';
//		let rightglyph = '<span class="tilde glyphleft faint">·</span>';
		let spacechar = ' '; // it was going to be bullet.

		let isGhost = !!this.ghostMatch;
		let cmdtext = this.commandtext;
		if (this.ghostMatch) {
			cmdtext = this.ghostMatch.name;
		}
//		cmdtext = cmdtext.replace(/--/g, spacechar).replace(/__/g, spacechar).replace(/ /g, spacechar);
		cmdtext = cmdtext.replace(/ /g, spacechar);

		// words is an array of arrays of letters.
		// where 'letters' are these objects describing the letter.
		let words = [];
		words[0] = [];
		let currentWord = 0;

		if (cmdtext.length == 0) {
			return (!this.isEditing && position == 0) ? rightglyph : '';
		}

		if (this.isEditing && position == 0) {
			for (let i = 0; i < cmdtext.length; i++) {
				let letter = cmdtext.charAt(i);
				let ltobj = {
					letter: letter,
					ghost: (isGhost && (i < this.ghostMatch.matchStart || i >= this.ghostMatch.matchEnd)),
					doTilde: i == cmdtext.length - 1
				};
				words[0].push(ltobj)
			}
		} else {
			for (let i = 0; i < cmdtext.length; i++) {
				let letter = cmdtext.charAt(i);
				if (letter == spacechar) {
					currentWord++;
					words[currentWord] = [];
					continue;
				}
				let ltobj = {
					letter: letter,
					ghost: (isGhost && (i < this.ghostMatch.matchStart || i >= this.ghostMatch.matchEnd)),
					doTilde: i == cmdtext.length - 1
				};
				words[currentWord].push(ltobj)
			}

			for (let i = words.length - 1; i > 0 ; i--) {
				let w = words[i];
				if (i > this.numChildren()) {
					let pw = words[i - 1];
					let space_is_ghost = false;
					if (pw.length > 0) {
						space_is_ghost = pw[pw.length - 1].ghost;
					}
					pw.push({
						letter: spacechar,
						ghost: space_is_ghost,
					});
					for (let j = 0 ; j < w.length ; j++) {
						pw.push(w[j]);
					}
				}
			}
		}

		if (position >= words.length) {
			return '';
		}


		let theword = words[position];

		let r = '';
		for (let i = 0; i < theword.length; i++) {
			let w = theword[i];
			let letter = w.letter;
//			let letter = (w.letter == spacechar) ? '&nbsp;' : w.letter
			if (letter == ' ') {
				letter = '&nbsp;';
			}
			if (w.ghost) {
				r += '<span class="ghost-match">' + letter + '</span>'
			} else {
				r += letter;
			}
			if (!this.isEditing && w.doTilde) {
				r += rightglyph;
			}
		}

		return r;
	}

	getGhostDiv(renderNode) {
		if (this.isEditing && renderNode.isSelected()) {
			let gclosure = this.getClosureForGhost();
			if (gclosure && Utils.isClosure(gclosure)) {
				return this.createGhostDiv(gclosure);
			}
		}
		return null;
	}

	getInitialCodespanContents(renderNode) {
		let lefttilde = '<span class="tilde glyphleft">&#8766;</span>';
		let faintlefttilde = '<span class="tilde glyphleft faint">&#8766;</span>';
		let faintleftdot = '<span class="tilde glyphleft faint">·</span>';
//		let righttilde = '<span class="tilde glyphright">&#8766;</span>';
		let codespanHtml = (this.isEditing ? lefttilde : faintleftdot);
		let gclosure = this.getClosureForGhost();
		let operatorInfix = (gclosure &&
				Utils.isClosure(gclosure) &&
				gclosure.getLambda().isInfix() &&
				this.numChildren() > 1);
		if (!operatorInfix) {
			// argh
			codespanHtml += this.getInfixPart(0);
		}

		return codespanHtml;
	}

	// I guess there should be an abstract command superclass
	skipRenderInto(renderNode, renderFlags, withEditor) {
		super.renderInto(renderNode, renderFlags, withEditor);
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
		}
	}

	renderAfterChild(childNum, renderNode, renderFlags, withEditor) {
		let gclosure = this.getClosureForGhost();
		if (this.isEditing) {
			return;
		}
		let infixOperator = (gclosure
				&& Utils.isClosure(gclosure)
				&& gclosure.getLambda().isInfix()
				&& childNum < this.numChildren() - 1);
		let infixName = (!!this.getInfixPart(childNum + 1));
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
				innercodespan.innerHTML = this.getInfixPart(childNum + 1);
			}
			let domNode = renderNode.getDomNode();
			domNode.appendChild(innercodespan);
		}		
	}

	getTagHolder(domNode) {
		return domNode.firstChild;
	}

	renderChildrenIfNormal() {
		return false;
	}

	isEmpty() {
		return this.commandtext == null || this.commandtext == '';
	}

	deleteLastCommandLetter() {
		this.ghostMatch = null;
		this.commandtext = this.commandtext.substr(0, this.commandtext.length - 1);
		this.cacheClosureIfCommandTextIsBound();
		this.searchingOn = null;
		this.previousMatch = null;
	}

	appendCommandText(txt) {
		this.ghostMatch = null;
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
		if (match) {
			this.ghostMatch = null;
			this.setCommandText(match.name);
			this.searchingOn = searchText;
			this.previousMatch = match;
			this.setDirtyForRendering(true);
		}
	}

	ghostedAutocomplete() {
		let searchText = this.searchingOn ? this.searchingOn : this.getCommandText();
		this.ghostMatch = autocomplete.findNextMatchAfter(searchText, this.previousMatch);

		this.searchingOn = searchText;
		this.previousMatch = this.ghostMatch;
		this.setDirtyForRendering(true);

		// if (match.length > searchText.length) {
		// 	let ghostMatch = match.substr(searchText.length, match.length);
		// 	this.ghostMatch = ghostMatch;
		// } else {
		// 	this.ghostMatch = null;
		// }
		// this.searchingOn = searchText;
		// this.previousMatch = match;
		// this.setDirtyForRendering(true);
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
		return {
			'AltSpace': 'autocomplete'
		};
	}
}

class CommandEditor extends Editor {

	constructor(nex) {
		super(nex, 'CommandEditor');
	}

	shouldIgnore(text) {
		return false; // don't ignore autocomplete
	}

	getStateForUndo() {
		return this.nex.getCommandText();
	}

	setStateForUndo(val) {
		this.nex.setCommandText(val);
	}

	finish() {
		super.finish();
		this.nex.commitMatch();
		if (experiments.SHOULD_REVERT_TO_CANONICAL_NAME) {
			this.nex.revertToCanonicalName();
		}
	}

	startEditing() {
		super.startEditing();
		this.oldVal = this.nex.getCommandText();
	}

	abort() {
		this.nex.setCommandText(this.oldVal);
	}

	doBackspaceEdit() {
		this.nex.deleteLastCommandLetter();
	}

	doAppendEdit(text) {
		if (text == 'AltSpace') {
			this.nex.ghostedAutocomplete();
			return;
		}
		this.nex.appendCommandText(text);
	}

	hasContent() {
		return this.nex.getCommandText() != '';
	}

	shouldAppend(text) {
		if (text == 'AltSpace') return true;
		if (/^[a-zA-Z0-9:. _-]$/.test(text)) return true; // normal chars
		if (/^[/<>=+*]$/.test(text)) return true;
		return false;
	}

	shouldTerminateAndReroute(input) {
		if (input == 'AltSpace') return false;
		if (super.shouldTerminateAndReroute()) return true;
		// don't terminate for math stuff, this is temporary
		if (/^[/<>=+*]$/.test(input)) return false;

		// command-friendly characters
		if (/^[a-zA-Z0-9:. _-]$/.test(input)) return false;

		// anything else, pop out
		return true;
	}
}

export { Command, CommandEditor }
