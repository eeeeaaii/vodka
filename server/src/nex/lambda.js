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
		this.lexicalEnv = null;
		this.cmdname = null;
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


	renderInto(domNode, shallow) {
		if (RENDERFLAGS) {
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
		super.renderInto(domNode, shallow /* renderFlags */);
		domNode.classList.add('lambda');
		domNode.classList.add('codelist');
		if (RENDERFLAGS) {
			if (!(renderFlags & RENDER_FLAG_SHALLOW)) {
				if (renderFlags & RENDER_FLAG_EXPLODED) {
					codespan.classList.add('exploded');
				} else {
					codespan.classList.remove('exploded');
				}
				codespan.innerHTML = '<span class="lambdasign">' + this.getSymbolForCodespan() + '</span>' + this.amptext.replace(/ /g, '&nbsp;');
			}
		} else {
			if (!shallow) {
				if (this.renderType == NEX_RENDER_TYPE_EXPLODED) {
					codespan.classList.add('exploded');
				} else {
					codespan.classList.remove('exploded');
				}
				codespan.innerHTML = '<span class="lambdasign">' + this.getSymbolForCodespan() + '</span>' + this.amptext.replace(/ /g, '&nbsp;');
			}
		}
		this.renderTags(domNode, renderFlags);
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
			r = evaluateNexSafely(c, closure);
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
	}

	appendAmpText(txt) {
		this.amptext = this.amptext + txt;
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



