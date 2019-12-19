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
		this.params = params;
		this.f = null;
	}

	toString() {
		return `[BUILTIN:${this.name}]`;
	}

	setF(f) {
		this.f = f.bind(this);
	}

	static createBuiltin(name, params, f) {
		for (var i = 0; i < params.length; i++) {
			params[i].name = BUILTIN_ARG_PREFIX + params[i].name;
		}
		var nex = new Builtin(name, params);
		nex.setF(f);
		Builtin.bindBuiltinObject(name, nex);
	}

	static bindBuiltinObject(name, nex) {
		BUILTINS.bindUnique(name, nex);
		nex.evaluate(BUILTINS);
	}

	/* argEnv param is deprecated, trying to eliminate */
	executor(argEnv) {
		return this.f(this.closure, argEnv);
	}

	getArgEvaluator(args, argEnv) {
		return new BuiltinArgEvaluator(this.name, this.params, args, argEnv, this.closure);
	}

}

