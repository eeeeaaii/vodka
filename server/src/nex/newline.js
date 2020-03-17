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


class Newline extends Separator {
	constructor() {
		super("&nbsp;");
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

	defaultHandle(txt, context) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let isCommand = (context == ContextType.COMMAND);
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);
		if (isSeparator) {
			manipulator.insertAfterSelectedAndSelect(new Separator(txt));
		} else {
			if (isCommand) {
				manipulator.insertAfterSelectedAndSelect(new Letter(txt));
			} else {
				KeyResponseFunctions['insert-letter-after-separator'](txt);
			}
		}
		return true;
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