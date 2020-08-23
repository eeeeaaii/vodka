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

import { Closure } from './closure.js';
import { Nil } from './nil.js';
import { EError } from './eerror.js';
import { NexContainer } from './nexcontainer.js';
import { BUILTINS } from '../environment.js'
import { ParamParser } from '../paramparser.js';
import { BuiltinArgEvaluator } from '../builtinargevaluator.js'



class ForeignClosure extends Closure {
	constructor(paramstr, foreignfunction) {
		super(null /* lambda */, BUILTINS, 'foreignclosure');
		let paramParser = new ParamParser();
		paramParser.parseString(paramstr);
		this.paramstr = paramstr;
		this.paramsArray = paramParser.getParams();
		this.returnValueParam = paramParser.getReturnValue();		
		this.foreignfunction = foreignfunction;
	}
	
	setScopeForForeignFunction(scope) {
		this.foreignfunction = this.foreignfunction.bind(scope);
	}

	makeCopy() {
		let r = new ForeignClosure(this.paramstr, this.foreignfunction);
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
		return '*FOREIGN CLOSURE*';
	}

	doAlertAnimation() {}

	getReturnValueParam() {
		return this.returnValueParam;

	}

	getArgEvaluator(cmdname, argContainer, executionEnvironment) {
		return new BuiltinArgEvaluator(cmdname, this.paramsArray, argContainer, executionEnvironment);
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
			if (!this.paramsArray[i].convert) {
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
		if (!returnValue) {
			return new Nil();
		}
		switch (this.returnValueParam.typeString) {
			case '$':
				return new EString(returnValue);
			case '^':
				return new Nil();
			default:
				throw new Error('unsupported return value');
		}
	}	

	executor(executionEnvironment, argEvaluator, cmdname, commandTags) {
		// I don't have to create a binding.
		// I just have to get the evaluated arguments out of argEvaluator.

		let args = argEvaluator.putArgsInJSArray();
		let jsargs = this.convertToJSArgs(args);
		let rval = this.foreignfunction(jsargs);
		return this.convertToVodkaReturnValue(rval);
	}

	getTypeName() {
		return '-foreignclosure-';
	}
}



export { ForeignClosure }

