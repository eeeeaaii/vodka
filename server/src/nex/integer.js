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



class Integer extends ValueNex {
	constructor(val) {
		if (!val) {
			val = '0';
		}
		super(val, '#', 'integer')
		this.render();
	}

	makeCopy() {
		return new Integer(this.value);
	}

	isValid() {
		var v = Number(this.value);
		return !isNaN(v);
	}

	evaluate() {
		if (!this.isValid()) {
			throw new EError(`Integer format invalid: ${this.value}`);
		}
		var n = Number(this.value);
		this.value = '' + n;
		this.render()
		return this;
	}

	renderValue() {
		return '' + this.value;
	}

	getKeyFunnel() {
		return new IntegerKeyFunnel(this);
	}

	getTypedValue() {
		var v = this.value;
		if (v == "") {
			v = "0";
		}
		if (isNaN(v)) {
			throw new Error(`Integer literal incomplete (is "${v}")`);
		}
		return Number(v);
	}

	getRawValue() {
		return this.value;
	}
}
