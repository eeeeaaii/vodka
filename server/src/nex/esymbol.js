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
		if (!DEFER_DRAW) {
			this.render();
		}
	}

	makeCopy() {
		let r = new ESymbol(this.getTypedValue());
		this.copyFieldsTo(r);
		return r;
	}

	needsEvaluation() {
		return true;
	}

	pushNexPhase(phaseExecutor, env) {
	 	phaseExecutor.pushPhase(new SymbolLookupPhase(this, env));
	}

	getAsString() {
		return '' + this.value;
	}

	getKeyFunnel() {
		return new SymbolKeyFunnel(this);
	}

	evaluate(env) {
		ILVL++;
		if (this.enclosingClosure) {
			env = this.enclosingClosure;
		}
		let b = env.lookupBinding(this.getTypedValue());
		if (CONSOLE_DEBUG) {
			console.log(`${INDENT()}symbol ${this.value} bound to ${b.debugString()}`);
		}
		ILVL--;
		return b;
	}
	getEventTable(context) {
		return null;
	}
	// TODO: move tables from these unused functions into getEventTable
	getKeyFunnelVector(context) {
		if (context == ContextType.COMMAND) {
			let defaultHandle = function(letter) {
				let allowedKeyRegex = /^[a-zA-Z0-9-_]$/;
				if (allowedKeyRegex.test(letter)) {
					this.appendText(letter);
				}
			}.bind(this);
			return {
				'ShiftTab': 'select-parent',
				'Tab': 'select-next-sibling',
				'ArrowUp': 'move-left-up',
				'ArrowDown': 'move-right-down',
				'ArrowLeft': 'move-left-up',
				'ArrowRight': 'move-right-down',
				'ShiftBackspace': 'remove-selected-and-select-previous-sibling',
				'Backspace': 'delete-last-letter-or-remove-selected-and-select-previous-sibling',
				'~': 'insert-command-as-next-sibling',
				'!': 'insert-bool-as-next-sibling',
				'@': 'insert-symbol-as-next-sibling',
				'#': 'insert-integer-as-next-sibling',
				'$': 'insert-string-as-next-sibling',
				'%': 'insert-float-as-next-sibling',
				'^': 'insert-nil-as-next-sibling',
				'(': 'insert-word-as-next-sibling',
				'[': 'insert-line-as-next-sibling',
				'{': 'insert-doc-as-next-sibling',
				'defaultHandle': defaultHandle
			};
		} else {
			let docDefaultHandle = function(letter) {
				manipulator.insertAfterSelectedAndSelect(new Letter(letter));
			}.bind(this);
			return {
				'ShiftTab': 'select-parent',
				'Tab': 'select-next-sibling',
				'ArrowUp': 'move-to-corresponding-letter-in-previous-line',
				'ArrowDown': 'move-to-corresponding-letter-in-next-line',
				'ArrowLeft': 'move-to-previous-leaf',
				'ArrowRight': 'move-to-next-leaf',
				'ShiftBackspace': 'remove-selected-and-select-previous-leaf',
				'Backspace': 'delete-last-letter-or-remove-selected-and-select-previous-leaf',
				'~': 'insert-command-as-next-sibling',
				'defaultHandle': docDefaultHandle
			};
		}
	}
}

