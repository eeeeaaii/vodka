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



class Bool extends ValueNex {
	constructor(val) {
		if (val === 'true') {
			val = 'yes';
		} else if (val === 'false') {
			val = 'no';
		} else if (val === 'yes' || val === 'no') {
			// do nothing
		} else {
			val = !!val ? 'yes' : 'no';
		}
		super(val, '!', 'boolean')
		this.render();
	}

	getTypedValue() {
		return this.value === 'yes';
	}

	toString() {
		return '!' + this.renderValue();
	}

	makeCopy() {
		return new Bool(this.getTypedValue());
	}

	isEmpty() {
		return true;
	}

	getKeyFunnel() {
		return new BoolKeyFunnel(this);
	}

	renderValue() {
		return this.value;
	}

	toggleValue(v) {
		this.setValue(this.value === 'yes' ? 'no' : 'yes');
		this.render();
	}
}
