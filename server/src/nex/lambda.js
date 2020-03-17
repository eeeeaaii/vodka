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
		this.lexicalEnv = null;
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
		r.lexicalEnv = this.lexicalEnv;
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

	needsEvaluation() {
		return true;
	}

	evaluate(env) {
		this.lexicalEnv = env;
		return this;
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
				if (r.getTypeName() == '-error-' && r.getErrorType() == ERROR_TYPE_FATAL) {
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



