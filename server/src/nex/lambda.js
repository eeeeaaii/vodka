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
		this.closure = null;
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
		r.closure = this.closure;
		r.cmdname = this.cmdname;
		r.needsEval = this.needsEval;
	}

	toString() {
		return `&"${this.amptext}"${this.vdir ? 'v' : 'h'}(${super.childrenToString()}&)`;
	}

	debugString() {
		return `&${this.amptext}(${super.childrenDebugString()})`;
	}

	getKeyFunnel() {
		return new LambdaKeyFunnel(this);
	}

	getSubPhaseFactory() {
		return new LambdaSubPhaseFactory(this);
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
		this.closure = env.pushEnv();
		return this;
	}

	close(env) {
		this.closure = env.pushEnv();
		return this.closure;
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

	/* argEnv param is deprecated, used only by builtin */
	executor(argEnv) {
		let r = new Nil();
		for (let i = 0; i < this.children.length; i++) {
			let c = this.children[i];
			r = c.evaluate(this.closure);
		}
		return r;
	}

	bind(args) {
		let paramNames = this.getParamNames();
		for (let i = 0; i < args.length; i++) {
			this.closure.bind(paramNames[i], args[i]);
		}
	}

	getArgEvaluator(argContainer, argEnv) {
		return new LambdaArgEvaluator(
			this.getParamNames(),
			argContainer, this.closure, argEnv);
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
}



