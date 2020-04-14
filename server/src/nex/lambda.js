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
		this.phaseFactory = function(phaseExecutor, nex, env) {
			return new LambdaCommandPhase(phaseExecutor, nex, env);
		}
		this.amptext = val ? val : '';
		this.cachedParamNames = [];
		this.cacheParamNames();
//		this.lexicalEnv = null;
		this.cmdname = null;
	}

	getTypeName() {
		return '-lambda-';
	}

	makeCopy(shallow) {
		let r = new Lambda();
		this.copyFieldsTo(r);
		this.copyChildrenTo(r, shallow);
		return r;
	}

	copyFieldsTo(r) {
		super.copyFieldsTo(r);
		r.amptext = this.amptext;
		r.cacheParamNames();
		//r.lexicalEnv = this.lexicalEnv;
		r.closure = this.closure;
		r.cmdname = this.cmdname;
		r.needsEval = this.needsEval;
	}

	renderChildrenIfNormal() {
		return false;
	}

	toString() {
		return `&"${this.amptext}"${this.vdir ? 'v' : 'h'}(${super.childrenToString()}&)`;
	}

	debugString() {
		return `(&${this.amptext} ${super.childrenDebugString()})`;
	}

	getKeyFunnel() {
		return new LambdaKeyFunnel(this);
	}

	getSubPhaseFactory() {
		return new LambdaSubPhaseFactory(this);
	}

	getContextType() {
		return ContextType.COMMAND;
	}

	getSymbolForCodespan() {
		return '&#8907;';
	}


	renderInto(renderNode, renderFlags) {
		let domNode = renderNode.getDomNode();
		let codespan = null;
		if (!(renderFlags & RENDER_FLAG_SHALLOW)) {
			codespan = document.createElement("span");
			codespan.classList.add('codespan');
			domNode.appendChild(codespan);
		}
		super.renderInto(renderNode, renderFlags);
		domNode.classList.add('lambda');
		domNode.classList.add('codelist');
		if (!(renderFlags & RENDER_FLAG_SHALLOW)) {
			if (renderFlags & RENDER_FLAG_EXPLODED) {
				codespan.classList.add('exploded');
			} else {
				codespan.classList.remove('exploded');
			}
			codespan.innerHTML = '<span class="lambdasign">' + this.getSymbolForCodespan() + '</span>' + this.amptext.replace(/ /g, '&nbsp;');
		}
	}

	setCmdName(nm) {
		this.cmdname = nm;
	}

	getCmdName() {
		return this.cmdname;
	}

	needsEvaluation() {
		return true;
	}

	evaluate(env) {
		// why do I do this?
		// let's say you have a function f that has a lambda expression in it.
		// it takes the evaluated result of that lambda expression, and
		// passes it into another function. That other function holds onto
		// the function, then calls it asynchronously.
		// Meanwhile, you call function f again. You have now created a new
		// lexical environment -- usually the same bindings, but very likely
		// different values. Now you again, pass the returned lambda into
		// some other function, that then calls it asynchronously.
		// each async thread needs its own copy of:
		// -- not only the bindings that existed when the expectation callback was created
		// (i.e. ffWith)
		// -- but also all the bindings in all the parent environments, and their values at the
		// time the expectation was created
		// the previous code, which just set lexicalEnv to a new value via env.pushEnv(),
		// would essentially erase the old value, which the previous callback needed.
		//
		// making a copy of the lambda may seem like overkill, but if I don't do it,
		// then wherever this lambda gets passed, or whatever is done with it,
		// and in whatever order it gets called -- none of that matters because it
		// always gets the most recent version of the lexical env.
		//
		// if this becomes a performance issue I can have a unique wrapper with the
		// lambda inside but I don't see a way around it. The only other option would be,
		// for lambdas, if a lambda is stored in the env object, there is also a pointer
		// to its lexical env there, in the place where its reference is stored.
		// so it's like:
		//
		// symbol table in env:
		// {
		// 	'foo': {
		// 		val:integer object
		// 		version:1
		// 	},
		// 	'bar': {
		//      var: lambda object
		//      version:1
		//      closure: -> because 'bar' is a lambda, we have a pointer to its closure here
		// 	}
		// }
		// I just don't really know how that would fly with things like this:
		// (& f
		//   (let x f)
		// )
		// the param passed into f is a lambda. it gets evaluated
		// and then assigned to the x variable. I suppose the way it could work
		// is that when a lambda is bound to a variable, its lexical env is stored
		// and when it's retrieved from a var, the lexical env is set inside
		// the lambda based on what was stored in the env. That way if two different
		// closures point to the same lambda (which is what happened here)
		// they will point to the same thing, but when that thing is pulled out,
		// it will get a different closure. This is sort of a more aggressive version
		// of the code I currently have in expectation, where it just stores the closure
		// in the expectation object and restores it when different expectations get fulfilled.

		this.closure = env.pushEnv();
		return this;
		// let copyOfThis = this.makeCopy();
		// copyOfThis.lexicalEnv = env.pushEnv();
		// return copyOfThis;
	}

	cacheParamNames() {
		let s = this.amptext.trim().split(' ');
		let p = [];
		for (let i = 0; i < s.length; i++) {
			if (s[i] != "") {
				p.push(s[i]);
			}
		}
		this.cachedParamNames = p;
	}

	getParamNames() {
		return this.cachedParamNames;
	}

	executor(closure) {
		let r = new Nil();
		let i = 0;
		// need the try/catch because of the js lambda here
		try {
			this.doForEachChild(c => {
				r = evaluateNexSafely(c, closure);
				if (isFatalError(r)) {
					r = wrapError('&amp;', (this.boundName ? this.boundName : this.debugString()) + ' error in expr ' + (i+1), r);
					// because of =>
					throw r;
				}
				i++;
			});
		} catch (e) {
			if (e instanceof EError) {
				return e;
			} else {
				throw e;
			}
		}
		return r;
	}

	bind(args, closure) {
		let paramNames = this.getParamNames();
		// omfg please fix this fix binding
		if (args.length != paramNames.length) {
			// also thrown in lambdargevaluator but this is called directly by step eval :(
			throw new EError("lambda: not enough args passed to function.");
		}
		for (let i = 0; i < args.length; i++) {
			closure.bind(paramNames[i], args[i]);
		}
	}

	getArgEvaluator(argContainer, argEnv, closure) {
		return new LambdaArgEvaluator(
			this.getParamNames(),
			argContainer, closure, argEnv, this.boundName ? this.boundName : this.debugString());
	}

	getStepEvaluator(stepContainer, env) {
		return new StepEvaluator(stepContainer, env);
	}

	getAmpText() {
		return this.amptext;
	}

	isEmpty() {
		return this.amptext == null || this.amptext == '';
	}

	deleteLastAmpLetter() {
		this.amptext = this.amptext.substr(0, this.amptext.length - 1);
		this.cacheParamNames();
	}

	appendAmpText(txt) {
		this.amptext = this.amptext + txt;
		this.cacheParamNames();
	}

	defaultHandle(txt) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let allowedKeyRegex = /^[a-zA-Z0-9-_ ]$/;
		if (allowedKeyRegex.test(txt)) {
			this.appendAmpText(txt);
		} else {
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
			'Backspace': 'delete-last-amp-letter-or-remove-selected-and-select-previous-sibling',
			'ShiftSpace': 'toggle-dir',
		};
	}
}



