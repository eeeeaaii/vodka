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

import { ContextType } from '../contexttype.js'
import { Separator } from './separator.js'

// deprecated, this is essentially an insertion point
class Newline extends Separator {
	constructor() {
		super("&nbsp;");
	}

	toString(version) {
		if (version == 'v2') {
			return this.toStringV2();
		}
		return super.toString();
	}

	toStringV2() {
		return `[newline]`
	}


	getTypeName() {
		return '-newline-';
	}

	makeCopy() {
		let r = new Newline();
		this.copyFieldsTo(r);
		return r;
	}

	getText() {
		return '\n';
	}

	getKeyFunnel() {
		return new NewlineKeyFunnel(this);
	}

	renderInto(renderNode, renderFlags) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags);
		domNode.classList.add('newline');
		domNode.classList.add('data');
	}

	getDefaultHandler() {
		return 'newlineDefault';
	}

	getEventTable(context) {
		return {
			'ArrowUp': 'move-to-corresponding-letter-in-previous-line',
			'ArrowDown': 'move-to-corresponding-letter-in-next-line',
			'ArrowLeft': 'move-to-previous-leaf',
			'ArrowRight': 'move-to-next-leaf',
			'Tab': 'move-right-down',
			'ShiftBackspace': 'delete-newline',
			'Backspace':  'delete-newline',
			'Enter': 'do-line-break-always',
		}
	}
}

export { Newline }

