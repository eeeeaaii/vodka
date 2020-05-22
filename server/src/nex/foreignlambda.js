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

import { Lambda } from './lambda.js'
import { ForeignClosure } from './foreignclosure.js'

class ForeignLambda extends Lambda {
	constructor(val, foreignfunction) {
		super(val);
		this.foreignfunction = foreignfunction;
	}

	getTypeName() {
		return '-foreignlambda-';
	}

	makeCopy(shallow) {
		let r = new ForeignLambda();
		this.copyChildrenTo(r, shallow);
		this.copyFieldsTo(r);
		return r;
	}

	copyFieldsTo(r) {
		super.copyFieldsTo(r);
		r.foreignfunction = this.foreignfunction;
	}

	evaluate(env) {
		return new ForeignClosure(this, this.foreignfunction);
	}
}

export { ForeignLambda }

