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

Held with shift, so that an ordinary press is still just a press: numbers sit in
the middle of expressions you are reading and clicking one should not change it.
Shift and an arrow steps a number too, which makes shift the key that means "and
change it" for both gestures.

A pixel is one step, so an integer counts by ones and a float by tenths -- the
same amount shift and an arrow gives, so the two agree about what "a bit more"
means.

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
	let step = nex.getStepAmount ? nex.getStepAmount() : 1;
	let startY = event.clientY;
	let startValue = nex.getTypedValue();
	if (isNaN(startValue)) {
		startValue = 0;
	}
	let moved = false;

	function onMove(e) {
		// up is more, which is which way the number goes on screen
		let dy = startY - e.clientY;
		if (!moved && Math.abs(dy) < 2) {
			// a press that has not gone anywhere yet is still just a click
			return;
		}
		moved = true;
		nex.setValue(String(roundToStep(startValue + dy * step, step)));
		eventQueueDispatcher.enqueueRenderOnlyDirty();
		// or the browser selects text across the page as the pointer moves
		e.preventDefault();
	}

	function onUp() {
		document.removeEventListener('mousemove', onMove, true);
		document.removeEventListener('mouseup', onUp, true);
	}

	document.addEventListener('mousemove', onMove, true);
	document.addEventListener('mouseup', onUp, true);
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

