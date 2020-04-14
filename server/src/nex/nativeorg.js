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

class NativeOrg extends Org {
	constructor(name, initdata, methods) {
		super();
		this.name = name;
		this.initdata = initdata;
		this.methods = methods;
	}

	toString() {
		return `[NATIVEORG]`;
	}

	getTypeName() {
		return '-nativeorg-';
	}

	makeCopy() {
		let r = new NativeOrg();
		this.copyFieldsTo(r);
		return r;
	}

	doJobWithTag(jobname, args) {
		let f = this.methods[jobname.name];
		if (!f) {
			throw new EError(`${this.name}: unknown method ${jobname.name}`);
		}
		// args not implemented yet
		f();
	}


	renderInto(renderNode, renderFlags) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags);
		domNode.classList.add('nativeorg');
		domNode.innerHTML = this.name;
	}

	static createNativeOrg(name, initdata, methods) {
		let nex = new NativeOrg(name, initdata, methods);
		let constructor = new Lambda();
		constructor = constructor.evaluate(BUILTINS);
		constructor.appendChild(nex);
		BUILTINS.bind("new-" + name, constructor);
	}
}