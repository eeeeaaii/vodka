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
		if (attached) {
			this.domNode = document.getElementById('mixroot');			
		} else {
			this.domnode = document.createElement('div');
		}
		this.render();
	}

	// makeCopy intentionally unimplemented

	debug() {
		for (var i = 0; i < this.children.length; i++) {
			this.children[i].debug();
		}
	}

	getKeyFunnel() {
		return new RootKeyFunnel(this);
	}

	render() {
		super.render();
		this.domNode.classList.add('root');
	}

}