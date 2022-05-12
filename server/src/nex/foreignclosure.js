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

import { Closure } from './closure.js';
import { Nil } from './nil.js';
import { Org } from './org.js'
import { EError } from './eerror.js';
import { NexContainer } from './nexcontainer.js';
import { BUILTINS } from '../environment.js'
import { ParamParser } from '../paramparser.js';
import { ArgEvaluator } from '../argevaluator.js'
import { experiments } from '../globalappflags.js'


/**
 * A closure that executes some javascript code directly instead of
 * executing vodka code.
 */
class ForeignClosure extends Closure {
	constructor(paramstr, foreignfunction, docstring) {
		super(null /* lambda */, BUILTINS, 'foreignclosure');
		let paramParser = new ParamParser();
		paramParser.parseString(paramstr);
		this.paramstr = paramstr;
		this.paramsArray = paramParser.getParams();
		this.returnValueParam = paramParser.getReturnValue();		
		this.foreignfunction = foreignfunction;
		this.docstring = docstring ? docstring : '-no doc string-';
	}
	
	setScopeForForeignFunction(scope) {
		this.foreignfunction = this.foreignfunction.bind(scope);
	}

	makeCopy() {
		let r = new ForeignClosure(this.paramstr, this.foreignfunction, this.docstring);
		this.copyFieldsTo(r);
		return r;
	}

	toString(version) {
		if (version == 'v2') {
			return `?"CLOSURE FOR FOREIGN"`;
		}
		return super.toString(version);
	}

	isBuiltin() {
		return false; //?
	}

	getLambdaDebugString() {
		return ' &"' + this.paramstr + '"';
	}

	getLambdaArgString() {
		return this.escape(this.paramstr);
	}

	getDocString() {
		return this.docstring;
	}

	doAlertAnimation() {}

	getReturnValueParam() {
		return this.returnValueParam;

	}

	renderInto(renderNode, renderFlags, withEditor) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags, withEditor);
		domNode.classList.add('closure');
	}

	getArgEvaluator(cmdname, argContainer, executionEnvironment) {
		return new ArgEvaluator(cmdname, this.paramsArray, argContainer, executionEnvironment);
	}

	copyFieldsTo(nex) {
		super.copyFieldsTo(nex);
	}

	nexChildrenToList(nx) {
		let a = [];
		for (let i = 0; i < nx.numChildren(); i++) {
			a[i] = nx.getChildAt(i);
		}
		return a;
	}

	// because of cycles, we only process up to 15 levels
	// wyd trying to pass in objects more complex than that?
	convertToJSArgs(nexlst, levels) {
		let a = [];
		if (!levels) {
			levels = 0;
		}
		if (levels > 15) {
			throw new EError("Error: arguments passed into foreign closure are too deeply nested (15 levels max)")
		}
		for (let i = 0; i < nexlst.length; i++) {
			let nx = nexlst[i];
			// we only allow raw non-converts at top level
			if (levels == 0 &&  !this.paramsArray[i].convert) {
				a[i] = nx;
				continue;
			}
			if (nx.getTypeName() == '-string-') {
				a[i] = nx.getFullTypedValue();
			} else if (nx instanceof NexContainer) {
				a[i] = this.convertToJSArgs(this.nexChildrenToList(nx), levels + 1);
			} else {
				a[i] = nx.getTypedValue();
			}
		}
		return a;
	}

	convertToVodkaReturnValue(returnValue) {
		if (typeof(returnValue) == 'undefined') {
			return new Nil();
		}
		if (Utils.isNex(returnValue)) {
			return returnValue;
		}
		switch (this.returnValueParam.typeString) {
			case '$':
				return new EString(returnValue);
			case '^':
				// fall through, nil already taken care of by first line
			default:
				throw new Error('unsupported return value');
		}
	}	

	closureExecutor(executionEnvironment, argEvaluator, cmdname, commandTags) {
		// I don't have to create a binding.
		// I just have to get the evaluated arguments out of argEvaluator.

		let args = argEvaluator.putArgsInJSArray();
		let jsargs = this.convertToJSArgs(args);
		let rval = this.foreignfunction(jsargs);
		return this.convertToVodkaReturnValue(rval);
	}

	// we don't override getTypeName because from the perspective of
	// vodka's type system these are just closures.

}



export { ForeignClosure }

