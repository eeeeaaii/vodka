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

class Root extends NexContainer {
	constructor(attached) {
		super();
		this.attached = attached;
	}

	getTypeName() {
		return '-root-';
	}

	// makeCopy intentionally unimplemented

	// dead code?
	debug() {
		this.doForEachChild(c => {
			c.debug();
		});
	}

	getContextType() {
		return ContextType.COMMAND;
	}

	getKeyFunnel() {
		return new RootKeyFunnel(this);
	}

	renderInto(domNode, renderFlags) {
		let toPassToSuperclass = domNode;
		if (RENDERNODES) {
			// change param name
			domNode = domNode.getDomNode();
		}
		super.renderInto(toPassToSuperclass, renderFlags);
		domNode.classList.add('root');
	}

}