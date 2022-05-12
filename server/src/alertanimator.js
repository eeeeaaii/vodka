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

	setAlertStyle(node) {
		let currentNumber = this.getCurrentNumber(node.classList);
		let newNumber = currentNumber == "1" ? "2" : "1";
		node.classList.remove(`alertanimation-${currentNumber}`);
		node.classList.add(`alertanimation-${newNumber}`);
	}

	getCurrentNumber(classlist) {
		if (classlist.contains("alertanimation-2")) {
			return "2";
		} else {
			return "1"
		}
	}

	getSpansToAnimate(domNode) {
		let spans = [];
		for (let i = 0; i < domNode.childNodes.length; i++) {
			let child = domNode.childNodes[i];
			if (child.classList && (
					child.classList.contains('codespan') ||
					child.classList.contains('innercodespan') ||
					child.classList.contains('dotspan')
					)) {
				spans.push(child);
			}
		}
		return spans;
	}


	doAlertAnimation(domNode) {
		let spans = this.getSpansToAnimate(domNode);
		spans.forEach((span) => {
			this.setAlertStyle(span);
		});
		this.setAlertStyle(domNode);
	}
}

const alertAnimator = new AlertAnimator();

export { alertAnimator }