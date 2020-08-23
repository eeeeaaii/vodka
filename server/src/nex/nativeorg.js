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

import { Org } from './org.js'
import { Lambda } from './lambda.js'
import { Command } from './command.js'
import { EString } from './estring.js'
import { Nil } from './nil.js'
import { ESymbol } from './esymbol.js'
import { Tag } from '../tag.js'
import { BUILTINS } from '../environment.js'
import { ParamParser } from '../paramparser.js'

class NativeOrg extends Org {
	constructor(name, methods, creator, drawfunction) {
		super();
		this.name = name;
		this.methods = methods;
		this.origCreator = creator;
		this.origDrawfunction = drawfunction;

		this.privateData = {};
		if (drawfunction) {
			this.drawfunction = drawfunction.bind(this);
		}
		if (creator) {
			creator.bind(this)();
		}
		this.setupMethods(methods);
	}

	setupMethods(methods) {
		for (let i = 0; i < methods.length; i++) {
			let rec = methods[i];
			let name = rec.name;
			let numargs = rec.numargs;
			let argstring = rec.argstring;
			let func = rec.func;

			let pp = new ParamParser();
			pp.parseString(argstring);
			let returnDataType = pp.getReturnValue();
			// by convention all the args are called a0, a1, a2
			let lm = new Lambda(argstring);
			let cmd = new Command('run-js');
			let str = new EString('*** WITH ATTACHED JS ***');
			str.setAttachedJS(function(args) {
				return this.convertToVodkaReturnValue(returnDataType, func.bind(this)(this.convertToJSArgs(args)));
			}.bind(this))
			cmd.appendChild(str);
			for (let i = 0; i < numargs; i++) {
				cmd.appendChild(new ESymbol('a' + i));
			}
			lm.appendChild(cmd);
			// we don't need to enforce here because again, somehow loading in a contract
			// that prevents you from creating API methods is not nice behavior.
			lm.addTag(new Tag(name));
			this.appendChild(lm);
		}
	}

	convertToJSArgs(nexlst) {
		let a = [];
		for (let i = 0; i < nexlst.numChildren(); i++) {
			let nx = nexlst.getChildAt(i);
			if (nx.getTypeName() == '-string-') {
				a[i] = nx.getFullTypedValue();
			} else {
				a[i] = nx.getTypedValue();
			}
		}
		return a;
	}

	convertToVodkaReturnValue(returnDataType, returnValue) {
		switch (returnDataType.typeString) {
			case '$':
				return new EString(returnValue);
			case '^':
				return new Nil();
			default:
				throw new Error('unsupported return value');
		}
	}

	toString() {
		return `[NATIVEORG]`;
	}

	getTypeName() {
		return '-nativeorg-';
	}

	makeCopy() {
		let r = new NativeOrg(this.name, this.methods, this.origCreator, this.origDrawfunction);
		// shouldn't have children but
		this.copyFieldsTo(r);
		return r;
	}

	renderInto(renderNode, renderFlags) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags);
		if (this.drawfunction) {
			this.drawfunction(renderNode, renderFlags);
		} else {
			domNode.classList.add('nativeorg');
			domNode.innerHTML = this.name;
		}
	}

	static createNativeOrg(name, methods, creator, drawfunction) {
		let nex = new NativeOrg(name, methods, creator, drawfunction);
		let copyCommand = new Command('copy');
		copyCommand.appendChild(nex);
		let constructor = new Lambda();
		constructor.appendChild(copyCommand);
		constructor = constructor.evaluate(BUILTINS);
		BUILTINS.bind("new-" + name, constructor);
	}
}

export { NativeOrg }

