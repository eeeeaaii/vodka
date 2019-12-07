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



class ESymbol extends ValueNex {
	constructor(val) {
		super((val) ? val : '', '@', 'esymbol')
		this.render();
	}

	needsEvaluation() {
		return true;
	}


	getAsString() {
		return '' + this.value;
	}

	makeCopy() {
		return new ESymbol(this.getTypedValue());
	}

	getKeyFunnel() {
		return new SymbolKeyFunnel(this);
	}

	evaluate(env) {
		ILVL++;
		var b = env.lookupBinding(this.getTypedValue());
		console.log(`${INDENT()}symbol ${this.value} bound to ${b.toString()}`);
		ILVL--;
		return b;
	}

	stepEvaluate(env) {
		var tcopy = this.makeCopy();
		var r = new Expectation(function() {
			return tcopy.evaluate(env);
		});
		r.appendChild(tcopy);
		STEP_STACK.push(r);
		return r;
	}
}

