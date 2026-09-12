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

import { experiments } from '../globalappflags.js'
import { Nex } from './nex.js'
import { heap, HeapString } from '../heap.js'
import { eventQueueDispatcher } from '../eventqueuedispatcher.js'

/*
Dragging a number to change it, the way a number box works in max and
everything descended from one: press on it and move up or down, and it counts
while you hold it. Nothing else in the editor works this way, but nothing else
in the editor is a knob.

A pixel is one step, and what a step is worth is the nex's business: an integer
counts by ones no matter what is held, a float counts by ones plainly and by
tenths, hundredths and thousandths as you add modifiers. The modifiers are read
on every move rather than once at the start, so you can come down onto the
digit you want in the middle of a drag without letting go.

Because the step can change mid-drag the value is accumulated move by move
instead of computed from the total distance -- otherwise adding a modifier
would re-scale everything you had already dragged. Rounding is to the finest
step the drag has used, so tenths picked up along the way survive going back to
ones.

Listening on the document rather than the number: a drag that leaves the box is
still that drag, and letting go anywhere has to end it. Anything that reaches
this has already been selected by the click that started it, which is what you
want -- you are working on the thing you are dragging.
*/
function roundToStep(v, step) {
	let places = 0;
	let s = String(step);
	let dot = s.indexOf('.');
	if (dot != -1) {
		places = s.length - dot - 1;
	}
	return Number(v.toFixed(places));
}

function startNumberDrag(nex, event) {
	let lastY = event.clientY;
	let startY = event.clientY;
	let value = nex.getTypedValue();
	if (isNaN(value)) {
		value = 0;
	}
	// the finest step used so far, so the drag rounds to the smallest amount
	// the user has actually asked for
	let finest = null;
	let moved = false;

	function onMove(e) {
		if (!moved && Math.abs(startY - e.clientY) < 2) {
			// a press that has not gone anywhere yet is still just a click
			return;
		}
		moved = true;
		let step = nex.getDragStep(e);
		if (finest === null || step < finest) {
			finest = step;
		}
		// up is more, which is which way the number goes on screen
		value += (lastY - e.clientY) * step;
		lastY = e.clientY;
		nex.setValue(String(roundToStep(value, finest)));
		eventQueueDispatcher.enqueueRenderOnlyDirty();
		// or the browser selects text across the page as the pointer moves
		e.preventDefault();
	}

	function onUp() {
		document.removeEventListener('mousemove', onMove, true);
		document.removeEventListener('mouseup', onUp, true);
		document.removeEventListener('contextmenu', onContextMenu, true);
	}

	// holding control to drag by hundredths is a right-click as far as a mac is
	// concerned, and the menu would take the pointer away mid-drag
	function onContextMenu(e) {
		e.preventDefault();
	}

	document.addEventListener('mousemove', onMove, true);
	document.addEventListener('mouseup', onUp, true);
	document.addEventListener('contextmenu', onContextMenu, true);
}

class ValueNex extends Nex {
	constructor(val, prefix, className) {
		super();
		if (experiments.ASM_RUNTIME) {
			this.wasmSetup();
		}
		this.value = new HeapString();
		this.setValue(String(val));
		this.prefix = prefix;
		this.className = className;
	}

	getRuntimeId() {
		return this.runtimeId;
	}

	isEmpty() {
		return this.setValue('');
	}

	toString() {
		return '' + this.prefix + this.getValue();
	}

	renderValue() {
		return this.getValue();
	}

	evaluate(env) {
		// TODO(#264): this is currently the ONLY thing in the codebase that makes
		// an evaluation result immutable, which is why values come back immutable
		// but builtin results don't.
		let r = super.evaluate(env);
		r.setMutable(false);
		return r;
	}

	escapedRenderValue() {
		return this.escape(this.renderValue());
	}

	renderInto(renderNode, renderFlags, withEditor) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags, withEditor);
		domNode.classList.add(this.className);
		domNode.classList.add('valuenex');
		let val = this.escapedRenderValue();
		let inner = '';
		let leftspan = '<span class="glyphleft">' + this.prefix + '</span>'
		let faintleftdot = '<span class="tilde glyphleft faint">·</span>';
		let rightspan = '<span class="glyphright">' + this.prefix + '</span>'
		if (this.isEditing) {
			inner = '' + leftspan + this.escapedRenderValue();
		} else {
			inner = '' + faintleftdot + this.escapedRenderValue() + rightspan;
		}
		domNode.innerHTML = inner;
	}

	getTypedValue() {
		return this.getValue();
	}

	wasmSetup() {}

	setValue(v) {
		this.value.set(v);
		this.setDirtyForRendering(true);
	}

	getValue() {
		return this.value.get();
	}

	appendText(txt) {
		let v = this.getValue();
		v = v + txt;
		this.setValue(v);
		this.setDirtyForRendering(true);
	}

	deleteLastLetter() {
		let v = this.getValue();
		if (v == '') return;
		v = v.substr(0, v.length - 1);
		this.setValue(v);
		this.setDirtyForRendering(true);
	}

	memUsed() {
		return super.memUsed() + this.value.memUsed();
	}
}




export {
	startNumberDrag, ValueNex }

