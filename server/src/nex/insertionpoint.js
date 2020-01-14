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



class InsertionPoint extends ValueNex {
	constructor() {
		super('&nbsp;', '', 'insertionpoint')
		this.render();
	}

	makeCopy() {
		let r = new InsertionPoint();
		this.copyFieldsTo(r);
		return r;
	}

	toString() {
		return '';
	}

	isEmpty() {
		return true;
	}

	getKeyFunnel() {
		return new InsertionPointKeyFunnel(this);
	}

	deleteLastLetter() {}

	appendText(txt) {}

	getEventTable(context) {
		return null;
	}
	// TODO: move tables from these unused functions into getEventTable
	getKeyFunnelVector(context) {
		if (context == ContextType.LINE) {
			let defaultHandle = function(s) {
			}.bind(this);
			return {
				'ShiftTab': 'select-parent-and-remove-self',
				'ArrowLeft': 'move-to-previous-leaf-and-remove-self',
				'ArrowRight': 'move-to-next-leaf-and-remove-self',
				'Backspace': 'remove-selected-insertion-point-and-select-previous-leaf',
				'ShiftBackspace': 'remove-selected-insertion-point-and-select-previous-leaf',
				'defaultHandle': defaultHandle
			};
		} else {
			let defaultHandle = function(s) {
			}.bind(this);

			return {
				'ShiftTab': 'select-parent-and-remove-self',
				'ArrowUp': 'move-left-up-and-remove-self',
				'ArrowDown': 'move-right-down-and-remove-self',
				'ArrowLeft': 'move-left-up-and-remove-self',
				'ArrowRight': 'move-right-down-and-remove-self',
				'ShiftBackspace': 'remove-selected-and-select-previous-sibling',
				'Backspace': 'remove-selected-and-select-previous-sibling',
				'~': 'replace-selected-with-command',
				'!': 'replace-selected-with-bool',
				'@': 'replace-selected-with-symbol',
				'#': 'replace-selected-with-integer',
				'$': 'replace-selected-with-string',
				'%': 'replace-selected-with-float',
				'^': 'replace-selected-with-nil',
					'(': 'replace-selected-with-word',
					'[': 'replace-selected-with-line',
					'{': 'replace-selected-with-doc',
				'defaultHandle': defaultHandle
			};
		}
	}
}