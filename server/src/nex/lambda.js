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

import { ContextType } from '../contexttype.js';
import { NexContainer } from './nexcontainer.js';
import { ParamParser } from '../paramparser.js';
import { Closure } from './closure.js';
import { RENDER_FLAG_SHALLOW, RENDER_FLAG_EXPLODED } from '../globalconstants.js'


class Lambda extends NexContainer {
	constructor(val) {
		super();
		this.amptext = val ? val : '';
		this.cachedParamNames = [];
		this.paramsArray = [];
		this.returnValueParam = null;
		this.cmdname = null;
		this.isEditing = false;
		if (this.amptext) {
			this.cacheParamNames();
		}
	}

	getTypeName() {
		return '-lambda-';
	}

	makeCopy(shallow) {
		let r = new Lambda();
		this.copyChildrenTo(r, shallow);
		this.copyFieldsTo(r);
		return r;
	}

	copyFieldsTo(r) {
		super.copyFieldsTo(r);
		r.amptext = this.amptext;
		// The params array is supposed to be immutable.
		// Can't really enforce that because it's javscript but
		// we will treat it as such for efficiency. Therefore
		// we can just copy the reference to it. The reference
		// changes every time the params are re-parsed.
		r.paramsArray = this.paramsArray
		r.returnValueParam = this.returnValueParam;
		r.cmdname = this.cmdname;
		r.needsEval = this.needsEval;
		r.cachedParamNames = this.cachedParamNames;
	}

	renderChildrenIfNormal() {
		return false;
	}

	toString(version) {
		if (version == 'v2') {
			return this.toStringV2();
		}
		return `&"${this.amptext}"${this.vdir ? 'v' : 'h'}(${super.childrenToString()}&)`;
	}

	toStringV2() {
		return `&(${super.childrenToString()})`;
	}

	debugString() {
		return `(&${this.amptext} ${super.childrenDebugString()})`;
	}

	getKeyFunnel() {
		return new LambdaKeyFunnel(this);
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
			if (this.isEditing) {
				codespan.classList.add('editing');
			} else {
				codespan.classList.remove('editing');
			}
			codespan.innerHTML = '<span class="lambdasign">' + this.getSymbolForCodespan() + '</span>' + this.amptext.replace(/ /g, '&nbsp;');
		}
	}

	needsEvaluation() {
		return true;
	}

	evaluate(env) {
		return new Closure(this, env);
	}

	cacheParamNames() {
		let trimmed = this.amptext.trim();
		let s = trimmed.split(' ');
		let p = [];
		for (let i = 0; i < s.length; i++) {
			if (s[i] != "") {
				p.push(s[i]);
			}
		}
		this.cachedParamNames = p;
		let paramParser = new ParamParser();
		paramParser.parseString(trimmed);
		this.paramsArray = paramParser.getParams();
		this.returnValueParam = paramParser.getReturnValue();
	}

	getReturnValueParam() {
		return this.returnValueParam;
	}

	getParamNames() {
		return this.cachedParamNames;
	}

	// is this dead code?
	// if this is dead code, then so is this.getParamNames
	// and this.cachedParamNames.
	// TODO: put in "throw Error" and run the test suite
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

	doNotProcess(key) {
		if (!(/^.$/.test(key))) {
			return true;
		}
		return false;
	}

	getDefaultHandler() {
		return 'justAppendLetterOrSeparator';
	}

	getEventTable(context) {
		return {
			'Enter': 'start-lambda-editor',
			'ShiftSpace': 'toggle-dir',
		};
	}

	static makeLambda(argstring, args) {
		let lambda = new Lambda(argstring);
		for (let i = 0; i < args.length; i++) {
			lambda.appendChild(args[i]);
		}
		return lambda;
	}
}

class LambdaEditor {
	constructor(lambda) {
		this._isEditing = false;
		this.lambda = lambda;
	}

	routeKey(text) {
		if (text == 'Enter') {
			this._isEditing = false;
			this.lambda.isEditing = false;			
		} else if (text == 'Tab') {
			this._isEditing = false;
			this.lambda.isEditing = false;
			return true; // reroute
		} else if (text == 'Backspace') {
			this.lambda.deleteLastAmpLetter();
		} else if (/^.$/.test(text)) {
			this.lambda.appendAmpText(text);
		}
		return false;
	}

	startEditing() {
		this._isEditing = true;
		this.lambda.isEditing = true;
	}

	isEditing() {
		return this._isEditing;
	}

	postNode() {
		return null;
	}

	preNode() {
		return null;
	}
}




export { Lambda, LambdaEditor }

