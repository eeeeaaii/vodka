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



import { Nex } from './nex.js'
import { experiments } from '../globalappflags.js'


class CustomNex extends Nex {
	constructor() {
		super();
		this.drawcommand == null;
	}

	getTypeName() {
		return '-custom-';
	}

	makeCopy() {
		let r = new CustomNex();
		this.copyFieldsTo(r);
		return r;
	}

	copyFieldsTo(r) {
		super.copyFieldsTo(r);
		r.drawcommand = this.drawcommand;
	}

	toString(version) {
		// yay i don't have to support v1
		return '[name]'
	}

	renderInto(renderNode, renderFlags) {
		let domNode = renderNode.getDomNode();
		if (this.drawcommand) {
			this.drawcommand(this);
		}
		super.renderInto(renderNode, renderFlags);

	}

	evaluate(env) {
		return this;
	}

	setDrawCommand(nex) {
		this.drawcommand = nex;
	}

	getDefaultHandler() {
		return 'floatDefault';
	}

	getEventTable(context) {
		if (experiments.V2_INSERTION) {
			return {
				// these 2 are questionable but make tests pass?
				'ShiftBackspace': 'remove-selected-and-select-previous-leaf-v2',
				'Backspace': 'remove-selected-and-select-previous-leaf-v2',
				'Enter': 'do-line-break-always',
			}
		} else {
			return {
				// these 2 are questionable but make tests pass?
				'ShiftBackspace': 'remove-selected-and-select-previous-leaf',
				'Backspace': 'remove-selected-and-select-previous-leaf',
				'Enter': 'do-line-break-always',
			}
		}
	}
}



export { CustomNex }

