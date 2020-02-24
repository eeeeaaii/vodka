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

class Zlist extends NexContainer {
	constructor() {
		super();
	}

	getTypeName() {
		return '-zlist-';
	}

	makeCopy() {
		let r = new Zlist();
		this.copyFieldsTo(r);
		return r;
	}

	toString() {
		return '<' + super.childrenToString() + '>';
	}

	getKeyFunnel() {
		return null;
	}

	getContextType() {
		return ContextType.DOC;
	}

	renderInto(domNode, shallow) {
		let toPassToSuperclass = domNode;
		if (RENDERNODES) {
			// change param name
			domNode = domNode.getDomNode();
		}
		if (RENDERFLAGS) {
			var renderFlags = shallow;
		}
		super.renderInto(toPassToSuperclass, shallow);
		domNode.classList.add('zlist');
		domNode.classList.add('data');
		if (RENDERFLAGS) {
			if (renderFlags & NEX_RENDER_TYPE_EXPLODED) {
				domNode.style.height = '' + (this.children.length * 10) + 'px'; 
			} else {
				domNode.style.height = '0px';
			}
		} else {
			if (this.renderType == NEX_RENDER_TYPE_EXPLODED) {
				domNode.style.height = '' + (this.children.length * 10) + 'px'; 
			} else {
				domNode.style.height = '0px';
			}
		}
		if (!RENDERNODES) {
			this.renderTags(domNode, shallow);
		}
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
				if (this.hasChildren()) {
					manipulator.insertAfterSelectedAndSelect(new Letter(txt));
				} else {
					manipulator.appendAndSelect(new Letter(txt));
				}							
			} else {
				manipulator.appendAndSelect(new Letter(txt));
			}
		}
		return true;
	}

	getEventTable(context) {
		return {
		}
	}
}
