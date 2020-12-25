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

class AlertAnimator {
	// the reason there are two styles (1 and 2) is because if you just
	// set the same style again, it won't trigger the animation.
	// you have to set to a different version of the same animation.

	setAlertStyle(selected, node, codespan) {
		let sel = selected ? `selected` : `unselected`;
		let other = this.otherFragment(node);
		let currentNumber = node.classList.contains(`animating-${sel}${other}-executable-1`) ? "1" : "2"
		let newNumber = currentNumber == "1" ? "2" : "1";
		node.classList.remove(`animating-${sel}${other}-executable-${currentNumber}`);
		node.classList.add(`animating-${sel}${other}-executable-${newNumber}`);
		if (codespan) {
			codespan.classList.remove(`animating-${sel}-bg-executable-${currentNumber}`);
			codespan.classList.add(`animating-${sel}-bg-executable-${newNumber}`);			
		}
	}

	isDoc(domNode) {
		return domNode.classList.contains('doc');
	}

	isLine(domNode) {
		return domNode.classList.contains('line');
	}

	isWord(domNode) {
		return domNode.classList.contains('word');
	}

	otherFragment(domNode) {
		if (this.isDoc(domNode)) {
			return '-doc'
		}
		if (this.isLine(domNode)) {
			return '-line'
		}
		if (this.isWord(domNode)) {
			return '-word'
		}
		else return '';
	}

	getCodespanForAlertAnimation(domNode) {
		let codespan = null;
		for (let i = 0; i < domNode.childNodes.length; i++) {
			let child = domNode.childNodes[i];
			if (child.classList && child.classList.contains('codespan')) {
				// this is the part of the lambda that has the params etc
				codespan = child;
			}
		}
		// might be null
		return codespan;
	}

	doAlertAnimation(selected, domNode) {
		let codespan = this.getCodespanForAlertAnimation(domNode);
		if (!codespan && !this.isDoc(domNode) && !this.isLine(domNode) && !this.isWord(domNode)) {
			return;
		}
		if (!selected && (this.isDoc(domNode) || this.isWord(domNode) || this.isLine(domNode))) {
			return;
		}
		this.setAlertStyle(selected, domNode, codespan);
	}
}

const alertAnimator = new AlertAnimator();

export { alertAnimator }