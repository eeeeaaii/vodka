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

import { NexContainer } from './nexcontainer.js'
import { ContextType } from '../contexttype.js'
import { RENDER_FLAG_EXPLODED } from '../globalconstants.js'
import { experiments } from '../globalappflags.js'


class Zlist extends NexContainer {
	constructor() {
		super();
	}

	getTypeName() {
		return '-zlist-';
	}

	makeCopy(shallow) {
		let r = new Zlist();
		this.copyChildrenTo(r, shallow);
		this.copyFieldsTo(r);
		return r;
	}

	toString(version) {
		if (version == 'v2') {
			return this.toStringV2();
		}
		return '<' + super.childrenToString() + '>';
	}

	toStringV2() {
		return `[${this.toStringV2Literal()}zlist]${this.toStringV2PrivateDataSection()}${this.listStartV2()}${this.toStringV2TagList()}${super.childrenToString('v2')}${this.listEndV2()}`;
	}

	prettyPrintInternal(lvl, hdir) {
		return this.standardListPrettyPrint(lvl, '[zlist]', hdir);
	}

	getKeyFunnel() {
		return null;
	}

	getContextType() {
		return ContextType.DOC;
	}

	renderInto(renderNode, renderFlags, withEditor) {
		let domNode = renderNode.getDomNode();
		// set the height before calling super.renderInto so that the height
		// can be overridden by apply-css-style-to
		if (renderFlags & RENDER_FLAG_EXPLODED) {
			domNode.style.height = '' + (this.numChildren() * 10) + 'px'; 
		} else {
			domNode.style.height = '0px';
		}
		super.renderInto(renderNode, renderFlags, withEditor);
		domNode.classList.add('zlist');
		domNode.classList.add('data');
	}

	getDefaultHandler() {
		return 'zlistDefault';
	}

	getEventTable(context) {
		if (experiments.BETTER_KEYBINDINGS) {
			return {
				'ShiftSpace' : 'do-nothing',
			}
		} else {
			return {};
		}
	}
}


export { Zlist }

