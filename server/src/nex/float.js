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



class Float extends ValueNex {
	constructor(val) {
		super((val) ? val : '', '%', 'float')
		this.render();
	}

	makeCopy() {
		var r = new Float(this.value);
		this.copyFieldsTo(r);
		return r;
	}

	isValid() {
		return !isNaN(this.value);
	}

	evaluate() {
		if (!this.isValid()) {
			throw new EError('Tried to evaluate incomplete float: "' + this.value + '"');
		}
		return this;
	}

	renderValue() {
		return this.value;
	}

	getKeyFunnel() {
		return new FloatKeyFunnel(this);
	}

	getTypedValue() {
		var v = this.value;
		if (v == "") {
			v = "0";
		}
		if (isNaN(v)) {
			throw new Error(`Float literal incomplete (is "${v}")`);
		}
		return Number(v);
	}
}
