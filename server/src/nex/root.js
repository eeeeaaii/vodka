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

import { NexContainer, V_DIR } from './nexcontainer.js'
import { ContextType } from '../contexttype.js'

class Root extends NexContainer {
	constructor(attached) {
		super();
		this.attached = attached;
		this.dir = V_DIR;
	}

	makeCopy(shallow) {
		let r = new Root(false);
		this.copyChildrenTo(r, shallow);
		this.copyFieldsTo(r);
		return r;
	}

	prettyPrintInternal(lvl, hdir) {
		return this.standardListPrettyPrint(lvl, 'ROOT: ', false);
	}

	getTypeName() {
		return '-root-';
	}

	numReferences() {
		return 1;
	}

	canUseTagEditor() {
		return false; // no tagging the root
	}

	getDefaultHandler() {
		return 'standardDefault';
	}

	getEventTable(context) {
		return {
			'Backspace': 'do-nothing',
			'ShiftBackspace': 'do-nothing',
			'ShiftTab': 'do-nothing',
			'ArrowUp': 'do-nothing',
			'ArrowLeft': 'do-nothing',
			'ArrowDown': 'do-nothing',
			'ArrowRight': 'do-nothing',
			'AltArrowUp': 'do-nothing',
			'AltArrowDown': 'do-nothing',
			'AltArrowLeft': 'do-nothing',
			'AltArrowRight': 'do-nothing',
			'ShiftAltTab': 'do-nothing',
			'ShiftEnter': 'do-nothing',
			'Enter': 'do-nothing',
			'ShiftSpace': 'do-nothing',
			'ShiftBackspace': 'do-nothing',
			'AltBackspace': 'do-nothing',
			'AltEnter': 'do-nothing',
			'Alt\\': 'do-nothing'


		}
	}


	// dead code?
	debug() {
		this.doForEachChild(c => {
			c.debug();
		});
	}

	getContextType() {
		return ContextType.COMMAND;
	}

	renderInto(renderNode, renderFlags, withEditor) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags, withEditor);
		domNode.classList.add('root');
	}

}

export { Root }

