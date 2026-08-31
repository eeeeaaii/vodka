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

import { Nex } from './nex.js'
import { heap } from '../heap.js'

/*
A reference to something the system is holding on your behalf -- a loop running
on the cycle, and in time whatever else needs naming after the fact. Made by the
system, never typed in, so it renders like a closure or a contract rather than
like a value.

It holds ids rather than the resources themselves: those live wherever owns
them, and a handle is only a way to name them afterwards. Deleting a handle
releases what it names.

Passing one back to whatever made it replaces what it names rather than making
something new, which is what lets an expression be re-evaluated in place.
*/
class ResourceHandle extends Nex {
	constructor(kind, what, ids, ender) {
		super();
		// what sort of resource, so whatever is handed one can tell whether it
		// is the sort it knows how to replace
		this.kind = kind ? kind : 'resource';
		this.what = what ? what : this.kind;
		this.ids = ids ? ids : [];
		// how to end them, supplied by whatever made this
		this.ender = ender ? ender : null;
		this.ended = false;
	}

	getTypeName() {
		return '-handle-';
	}

	getKind() {
		return this.kind;
	}

	getIds() {
		return this.ids;
	}

	// replacing what a handle names keeps the handle itself valid
	setIds(ids, what) {
		this.ids = ids;
		if (what) this.what = what;
		this.ended = false;
	}

	// true if there was anything left to end
	end(atCycleEnd) {
		if (this.ended || !this.ender) return false;
		this.ended = true;
		this.ender(this.ids, atCycleEnd);
		return true;
	}

	hasEnded() {
		return this.ended;
	}

	// deleting the sequence stops what it names, with no waiting -- the point
	// of deleting a thing is that it goes away
	cleanupOnMemoryFree() {
		this.end(false /* now, not at the cycle boundary */);
	}

	makeCopy(shallow) {
		// A copy names the same resource but must not be able to release it a
		// second time. It is a picture of the handle, not another handle.
		let r = new ResourceHandle(this.kind, this.what, this.ids.slice(), null);
		r.ended = this.ended;
		this.copyFieldsTo(r);
		return r;
	}

	toString(version, ctx) {
		if (version == 'v2') {
			return this.toStringV2(ctx);
		}
		return '[handle]';
	}

	/*
	A handle names something alive now. There is nothing to write down: reading
	it back in a later session would name a resource that does not exist. It
	saves as nil, the same as a deferred with nothing in it.
	*/
	toStringV2(ctx) {
		return '[nil]';
	}

	prettyPrintInternal(lvl, hdir) {
		return this.doTabs(lvl, hdir) + '[handle]';
	}

	renderInto(renderNode, renderFlags, withEditor) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags, withEditor);
		domNode.classList.add('handle');

		let frame = document.createElement('div');
		frame.classList.add('handleframe');

		let glyph = document.createElement('div');
		glyph.classList.add('hglyph');
		glyph.innerHTML = '&#164;'; // the generic-thing sign, for a generic thing

		let innerspans = document.createElement('div');
		innerspans.classList.add('hinnerspans');

		let line1 = document.createElement('div');
		line1.classList.add('innerspan');
		line1.innerHTML = this.ended ? 'RELEASED' : this.kind.toUpperCase();
		innerspans.appendChild(line1);

		let line2 = document.createElement('div');
		line2.classList.add('innerspan');
		line2.innerHTML = this.what;
		innerspans.appendChild(line2);

		frame.appendChild(glyph);
		frame.appendChild(innerspans);
		domNode.appendChild(frame);
	}

	getDefaultHandler() {
		return 'standardDefault';
	}

	memUsed() {
		return super.memUsed() + heap.sizeHandle();
	}
}

function constructResourceHandle(kind, what, ids, ender) {
	let r = new ResourceHandle(kind, what, ids, ender);
	heap.requestMem(r.memUsed());
	return r;
}

export { ResourceHandle, constructResourceHandle }
