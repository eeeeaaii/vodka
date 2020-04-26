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



class Builtin extends Lambda {
	constructor(name, params) {
		super();
		this.name = name;
		this.paramsArray = params;
		let amp = ' ' + name;
		for (let i = 0; i < params.length; i++) {
			amp += ' ' + params[i].name;
		}
		this.amptext = amp;
		this.f = null;
		this.closure = BUILTINS;
	}

	toString() {
		return `[BUILTIN:${this.name}]`;
	}

	getCmdName() {
		return this.name;
	}

	getTypeName() {
		return '-builtin-';
	}

	makeCopy(shallow) {
		let r = new Builtin(this.name, this.paramsArray);
		this.copyFieldsTo(r);
		this.copyChildrenTo(r, shallow);
		return r;
	}

	getSymbolForCodespan() {
		return '&szlig;';
	}

	renderInto(renderNode, renderFlags) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags);
		domNode.classList.add('builtin');
	}

	setF(f) {
		this.f = f.bind(this);
	}

	evaluate(executionEnvironment) {
		let r = super.evaluate(executionEnvironment);
		r.setCmdName(this.name);
		return r;
	}

	static createBuiltin(name, paramsArray, f) {
		let parser = new ParamParser(true /* isBuiltin */);
		let params = parser.parse(paramsArray);
		let builtin = new Builtin(name, params);
		if (PERFORMANCE_MONITOR) {
			perfmon.registerMethod(name);
		}
		builtin.setF(f);
		let closure = builtin.evaluate(BUILTINS);
		// rip out the copied closure and replace with global env because
		// builtins (though they typically do not evaluate each other)
		// still should be mutally able to see each other, much like
		// stuff in a package.
		closure.setLexicalEnvironment(BUILTINS);
		Builtin.bindBuiltinObject(name, closure);
	}

	static bindBuiltinObject(name, nex) {
		BUILTINS.bind(name, nex);
	}

	executor(lexicalEnvironment, executionEnv, commandTags) {
		return this.f(lexicalEnvironment, executionEnv, commandTags);
	}

	getEventTable(context) {
		return null;
	}
}

