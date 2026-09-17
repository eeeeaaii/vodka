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
		this.clearWhenFinished(node);
	}

	/*
	The marker has to come back off once the flash is over, because while it is
	on, which animation runs depends on what else the node is: .alertanimation-1
	and .newselected.alertanimation-1 name two different animations, as do the
	doc, line and word variants. Nothing used to remove it, so every nex that
	had ever been evaluated kept it, and then selecting one changed the
	animation name -- which is all it takes for the browser to run the animation
	again. Clicking an evaluated nex flashed it yellow as though it were being
	re-evaluated.

	Only animationend, not animationcancel: a swap from 1 to 2 mid-flash cancels
	the first animation, and that event is delivered after the new class is
	already on, so clearing there would wipe the flash that just started. The
	swap has removed the old class by then anyway.

	Animation events bubble and the spans inside a nex animate too, so only the
	event aimed at this node counts.

	An element with no box (a span the current render mode hides) never runs the
	animation and so never gets the animationend, and keeps the class. It cannot
	flash while it is hidden; if it is later revealed it flashes once and then
	clears itself, because the listener is already on it. Checking for a box here
	instead would mean forcing layout on every alert, which is not worth it for
	one flash of something that just appeared.
	*/
	clearWhenFinished(node) {
		if (node.vodkaClearsAlert) {
			return;
		}
		node.vodkaClearsAlert = true;
		node.addEventListener('animationend', function(event) {
			if (event.target != node) {
				return;
			}
			node.classList.remove('alertanimation-1');
			node.classList.remove('alertanimation-2');
		});
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