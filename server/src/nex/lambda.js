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
		this.codespan = document.createElement("span");
		this.codespan.classList.add('codespan');
		this.domNode.appendChild(this.codespan);
		this.lexicalEnv = null;
		this.cmdname = null;
		this.render();
	}

	makeCopy() {
		let r = new Lambda();
		this.copyFieldsTo(r);
		return r;
	}

	copyFieldsTo(r) {
		super.copyFieldsTo(r);
		r.amptext = this.amptext;
		r.lexicalEnv = this.lexicalEnv;
		r.cmdname = this.cmdname;
		r.needsEval = this.needsEval;
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

	// pushSubPhases(phaseExecutor, env) {
	// 	for (let i = this.children.length - 1; i >= 0; i--) {
	// 		let c = this.children[i];
	// 		c.pushPhases(phaseExecutor, env);
	// 	}
	// }

	render() {
		super.render();
		this.domNode.classList.add('lambda');
		this.domNode.classList.add('codelist');
		if (this.renderType == NEX_RENDER_TYPE_EXPLODED) {
			this.codespan.classList.add('exploded');
		} else {
			this.codespan.classList.remove('exploded');
		}
		this.codespan.innerHTML = '<span class="lambdasign">&#8907;</span>' + this.amptext.replace(/ /g, '&nbsp;');
	}

	setCmdName(nm) {
		this.cmdname = nm;
	}

	needsEvaluation() {
		return true;
	}

	/// deprecated?
	evaluate(env) {
		this.lexicalEnv = env;
		return this;
	}

//	close(env) {
//		this.closure = env.pushEnv();
//		return this.closure;
//	}

//	getClosure() {
//		return this.closure;
//	}

	getParamNames() {
		let s = this.amptext.split(' ');
		let p = [];
		for (let i = 0; i < s.length; i++) {
			if (s[i] !== '') {
				p.push(s[i]);
			}
		}
		return p;
	}

	executor(closure) {
		let r = new Nil();
		for (let i = 0; i < this.children.length; i++) {
			let c = this.children[i];
			r = c.evaluate(closure);
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
			argContainer, closure, argEnv);
	}

	getStepEvaluator(stepContainer, env) {
		return new StepEvaluator(stepContainer, env);
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
	getEventTable(context) {
		return null;
	}
	// TODO: move tables from these unused functions into getEventTable
	getKeyFunnelVector(context) {
		let defaultHandle = function(letter) {
			let allowedKeyRegex = /^[a-zA-Z0-9- ]$/;
			if (allowedKeyRegex.test(letter)) {
				this.appendText(letter);
			}
		}.bind(this);

		return {
			'ShiftEnter': 'execute',
			'ShiftTab': 'select-parent',
			'Tab': 'select-first-child-or-create-insertion-point',
			'ArrowUp': 'move-left-up',
			'ArrowLeft': 'move-left-up',
			'ArrowDown': 'move-right-down',
			'ArrowRight': 'move-right-down',
			'ShiftBackspace': 'remove-selected-and-select-previous-sibling',
			'Backspace': 'delete-last-letter-or-remove-selected-and-select-previous-sibling',
			'~': 'insert-or-append-command',
			'!': 'insert-or-append-bool',
			'@': 'insert-or-append-symbol',
			'#': 'insert-or-append-integer',
			'$': 'insert-or-append-string',
			'%': 'insert-or-append-float',
			'^': 'insert-or-append-nil',
			'(': 'insert-or-append-word',
			'[': 'insert-or-append-line',
			'{': 'insert-or-append-doc',
			'defaultHandle': defaultHandle
		};
	}
}



