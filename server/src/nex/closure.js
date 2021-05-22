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

import * as Utils from '../utils.js'

import { ValueNex } from './valuenex.js'
import { ArgEvaluator } from '../argevaluator.js'
import { Nil } from './nil.js'
import { Org } from './org.js'
import { wrapError, evaluateNexSafely } from '../evaluator.js'
import { BINDINGS, BUILTINS } from '../environment.js'
import { experiments } from '../globalappflags.js'

/**
 * Nex that represents a "compiled" or evaluated function. Both
 * {@link Lambda} and {@link Builtin} nexes become Closures when evaluated.
 */
class Closure extends ValueNex {
	constructor(lambda, lexicalEnvironment, name) {
		super('', '&', name ? name : 'closure')
		this.lambda = lambda;
		this.cmdname = '|';
		this.lexicalEnvironment = lexicalEnvironment;
		this.boundName = null;
	}

	toString(version) {
		if (version == 'v2') {
			return `[CLOSURE FOR: ${this.lambda.prettyPrint()}]`;
		}
		return super.toString(version);
	}

	// According to what I wrote in my blog, I should not really copy
	// closures. However it doesn't matter as long as I don't really
	// copy the contents of the closures -- i.e. the lambda, memory, etc.
	// the closure obj itself can just be a ref to those things,
	// which means that i can do things later that are more display-oriented

	makeCopy() {
		let r = new Closure();
		this.copyFieldsTo(r);
		return r;
	}

	copyFieldsTo(nex) {
		super.copyFieldsTo(nex);
		nex.lambda = this.lambda;
		nex.lexicalEnvironment = this.lexicalEnvironment;
		nex.boundName = this.boundName;
	}

	setBoundName(name) {
		this.boundName = name;
	}

	getBoundName() {
		return this.boundName;
	}

	getLexicalEnvironment() {
		return this.lexicalEnvironment;
	}

	setLexicalEnvironment(env) {
		// used by bind primitive because otherwise order matters and you have to
		// define things before using them
		this.lexicalEnvironment = env;
	}

	getReturnValueParam() {
		return this.lambda.getReturnValueParam();
	}

	isBuiltin() {
		return (this.lambda instanceof Builtin);
	}

	doAlertAnimation() {
		this.lambda.doAlertAnimation();
	}

	getLambdaDebugString() {
		return this.escape(this.lambda.prettyPrint());
	}

	getLambdaArgString() {
		let name = this.getLambda().getCanonicalName();
		if (!name) {
			name = this.cmdname;
		}
		return this.escape(this.lambda.getArgString(name));
	}

	setCmdName(nm) {
		this.cmdname = nm;
	}

	getLambda() {
		return this.lambda;
	}

	getCmdName() {
		return this.cmdname;
	}

	getDocString() {
		return this.escape(this.getLambda().getDocString(), true);
	}

	getArgEvaluator(cmdname, argContainer, executionEnvironment) {
		return new ArgEvaluator(cmdname, this.lambda.paramsArray, argContainer, executionEnvironment);
	}

	closureline(n, s) {
		return `<div class="closureline${n}">${s.trim()}</div>`
	}

	getSummaryLine() {
		// the cmdname and tags
		let name = this.getLambda().getCanonicalName();
		if (!name) {
			name = this.cmdname;
		}
		let r = name;
		for (let i = 0; i < this.numTags(); i++) {
			r += '[' + this.getTag(i).getName(i) + ']';
		}
		return this.escape(r);		
	}

	getEnvironmentLine() {
		if (this.lexicalEnvironment == BUILTINS) {
			return 'BUILTINS';
		} else if (this.lexicalEnvironment == BINDINGS) {
			return 'BINDINGS';
		} else {
			let r = '{\n';
			this.lexicalEnvironment.doForEachBinding(function(binding) {
				r += '  ' + binding.name + ': ' + binding.val.debugString() + '\n';
			})
			r += '}';
			return this.escape(r);
		}
	}

	getRenderedHTML() {
		return this.closureline('0', this.prefix) +
		    this.closureline('1', this.getSummaryLine()) +
			this.closureline('2', this.getLambdaArgString()) +
			this.closureline('3', this.getDocString()) +
			this.closureline('4', this.getLambdaDebugString()) +
			this.closureline('5', this.getEnvironmentLine());
	}

	renderValue() {
		// this is called by the superclass but we rewrite the contents later.
		return '';
	}

	oldRenderValue() {
		let r = this.cmdname;
		for (let i = 0; i < this.numTags(); i++) {
			r += '[' + this.getTag(i).getName(i) + ']';
		}
		r += '\n';
		r += '  ' + this.getDocString() + '\n';
		r += ' ' + this.getLambdaDebugString() + '\n';
		if (this.lexicalEnvironment == BUILTINS) {
			r += '  BUILTINS\n';
		} else if (this.lexicalEnvironment == BINDINGS) {
			r += '  BINDINGS\n';
		} else {
			r += '  {\n';
			this.lexicalEnvironment.doForEachBinding(function(binding) {
				r += '    ' + binding.name + ': ' + binding.val.debugString() + '\n';
			})
			r += '  }';
		}
		return r;
	}

	getInnerHTMLForDisplay() {
		if (experiments.NEW_CLOSURE_DISPLAY) {
			return this.getRenderedHTML();
		} else {
			return '' + this.prefix + this.escape(this.oldRenderValue());
		}		
	}

	renderInto(renderNode, renderFlags, withEditor) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags, withEditor);
		domNode.classList.add(this.className);
		domNode.classList.add('valuenex');
		domNode.innerHTML = this.getInnerHTMLForDisplay();
	}

	shouldActivateReturnedExpectations() {
		let rvp = this.lambda.getReturnValueParam();
		if (rvp && rvp.skipactivate) {
			return false;
		}
		return true;
	}

	closureExecutor(executionEnvironment, argEvaluator, cmdname, commandTags) {
		if (this.lambda.getTypeName() == '-builtin-') {
			return this.builtinClosureExecutor(executionEnvironment, argEvaluator, cmdname, commandTags);
		} else {
			return this.lambdaClosureExecutor(executionEnvironment, argEvaluator, cmdname, commandTags);
		}
	}

	builtinClosureExecutor(executionEnvironment, argEvaluator, cmdname, commandTags) {
		let scope = this.lexicalEnvironment.pushEnv();
		argEvaluator.bindArgs(scope);
		return this.lambda.f(scope, executionEnvironment, commandTags);
	}

	lambdaClosureExecutor(executionEnvironment, argEvaluator, cmdname, commandTags) {
		let scope = this.lexicalEnvironment.pushEnv();
		argEvaluator.bindArgs(scope);
		let r = experiments.ORG_OVERHAUL ? new Org() : new Nil();
		let i = 0;
		let numc = this.lambda.numChildren();
		for (let i = 0; i < numc; i++) {
			let c = this.lambda.getChildAt(i);
			r = evaluateNexSafely(c, scope, true /* skipactivate */);
			if (Utils.isFatalError(r)) {
				r = wrapError('&amp;', `${cmdname}: error in expr ${i+1} of lambda`, r);
				return r;
			}
		}
		return r;
	}

	getTypeName() {
		return '-closure-';
	}
}

export { Closure }
