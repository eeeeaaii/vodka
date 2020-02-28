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
	}

	getTypeName() {
		return '-insertionpoint-';
	}

	// TODO: fix the bug in this where if you click somewhere
	// else the insertion point just hangs around.
	// also with RENDERNODES there's actually no need for
	// this to be a nex, it can be a RenderNode only.

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

	defaultHandle(txt, context, sourceNode) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);

		let parent = (RENDERNODES ? sourceNode.getParent() : this.getParent());

		if (isSeparator) {
			if (isWord(parent)) {
				manipulator.selectParent()
					&& manipulator.insertAfterSelectedAndSelect(new Separator(txt))
					&& manipulator.removeNex(sourceNode);
			} else {
				manipulator.replaceSelectedWith(new Separator(txt));		
			}
		} else {
			if (isDoc(parent)) {
				let ln = (RENDERNODES ? new RenderNode(new Line()) : new Line());
				let w = (RENDERNODES ? new RenderNode(new Word()) : new Word());
				let lt = (RENDERNODES ? new RenderNode(new Letter(txt)) : new Letter(txt));
				ln.appendChild(w);
				w.appendChild(lt);
				manipulator.replaceSelectedWith(ln);
				lt.setSelected();
			} else if (isLine(parent)) {
				let w = (RENDERNODES ? new RenderNode(new Word()) : new Word());
				let lt = (RENDERNODES ? new RenderNode(new Letter(txt)) : new Letter(txt));
				w.appendChild(lt);
				manipulator.replaceSelectedWith(w);
				lt.setSelected();
			} else {			
				manipulator.replaceSelectedWith(new Letter(txt));
			}
		}
		return true;
	}

	getEventTable(context) {
		return {
			'ShiftTab': 'select-parent-and-remove-self',
			'ArrowUp': 'move-to-previous-leaf-and-remove-self',
			'ArrowDown': 'move-to-next-leaf-and-remove-self',
			'ArrowLeft': 'move-to-previous-leaf-and-remove-self',
			'ArrowRight': 'move-to-next-leaf-and-remove-self',
			'ShiftBackspace': 'legacy-unchecked-remove-selected-and-select-previous-leaf',
			'Backspace': 'legacy-unchecked-remove-selected-and-select-previous-leaf',
			'Enter': 'do-line-break-always',
			'~': 'replace-selected-with-command',
			'!': 'replace-selected-with-bool',
			'@': 'replace-selected-with-symbol',
			'#': 'replace-selected-with-integer',
			'$': 'replace-selected-with-string',
			'%': 'replace-selected-with-float',
			'^': 'replace-selected-with-nil',
			'&': 'replace-selected-with-lambda',
			'(': 'replace-selected-with-word-correctly',
			'[': 'replace-selected-with-line',
			'{': 'replace-selected-with-doc',
		};
	}
	// TODO: move tables from these unused functions into getEventTable

}