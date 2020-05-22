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
import * as Vodka from '/vodka.js';

class ForeignClosure extends Closure {
	constructor(lambda, foreignfunction) {
		super(lambda, Vodka.BUILTINS, 'foreignclosure')
		this.foreignfunction = foreignfunction;
	}

	makeCopy() {
		let r = new ForeignClosure();
		this.copyFieldsTo(r);
		return r;
	}

	copyFieldsTo(nex) {
		super.copyFieldsTo(nex);
		nex.foreignfunction = this.foreignfunction;
	}

	convertToJSArgs(nexlst) {
		let a = [];
		for (let i = 0; i < nexlst.length; i++) {
			let nx = nexlst[i];
			if (nx.getTypeName() == '-string-') {
				a[i] = nx.getFullTypedValue();
			} else {
				a[i] = nx.getTypedValue();
			}
		}
		return a;
	}

	convertToVodkaReturnValue(returnDataType, returnValue) {
		if (!returnValue) {
			return new Nil();
		}
		switch (returnDataType.typeString) {
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

