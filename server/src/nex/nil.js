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

import { ValueNex } from './valuenex.js'

class Nil extends ValueNex {
	constructor() {
		super('', '^', 'nil')
	}

	getTypeName() {
		return '-nil-';
	}

	makeCopy() {
		let r = new Nil();
		this.copyFieldsTo(r);
		return r;
	}

	toString(version) {
		if (version == 'v2') {
			return this.toStringV2();
		}
		return super.toString(version);
	}

	toStringV2() {
		return '^' + this.toStringV2TagList();
	}

	isEmpty() {
		return true;
	}

	deleteLastLetter() {
		return;
	}

	appendText(txt) {
		return;
	}

	getDefaultHandler() {
		return 'nilDefault';
	}

	getEventTable(context) {
		return {
			'Enter': 'do-line-break-always',
		}
	}
}



export { Nil }

