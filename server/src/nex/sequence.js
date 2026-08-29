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
A handle to something running on the global cycle -- a looping wavetable, a
looping midi sequence. Made by the system, never typed in, so it renders like a
closure or a contract rather than like a value.

It holds ids rather than the loops themselves: the loops live in webaudio and
midifunctions, which own the cycle, and a sequence is only a way to name them
afterwards. Deleting one ends its loops immediately, end-seq ends them at the
next cycle boundary.
*/
class Sequence extends Nex {
	constructor(what, loopIds, ender) {
		super();
		this.what = what ? what : 'sequence';
		this.loopIds = loopIds ? loopIds : [];
		// how to end them, supplied by whatever made this
		this.ender = ender ? ender : null;
		this.ended = false;
	}

	getTypeName() {
		return '-sequence-';
	}

	getLoopIds() {
		return this.loopIds;
	}

	// true if there was anything left to end
	end(atCycleEnd) {
		if (this.ended || !this.ender) return false;
		this.ended = true;
		this.ender(this.loopIds, atCycleEnd);
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
		// A copy names the same loops but must not be able to end them twice,
		// and ending through a copy would be surprising. It is a picture of the
		// sequence, not another handle to it.
		let r = new Sequence(this.what, this.loopIds.slice(), null);
		r.ended = this.ended;
		this.copyFieldsTo(r);
		return r;
	}

	toString(version, ctx) {
		if (version == 'v2') {
			return this.toStringV2(ctx);
		}
		return '[sequence]';
	}

	/*
	A sequence is a handle to something running now. There is nothing to write
	down: reading it back in a later session would give you a name for loops
	that do not exist. It saves as nil, the same as a deferred with nothing in
	it.
	*/
	toStringV2(ctx) {
		return '[nil]';
	}

	prettyPrintInternal(lvl, hdir) {
		return this.doTabs(lvl, hdir) + '[sequence]';
	}

	renderInto(renderNode, renderFlags, withEditor) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags, withEditor);
		domNode.classList.add('sequence');

		let frame = document.createElement('div');
		frame.classList.add('seqframe');

		let glyph = document.createElement('div');
		glyph.classList.add('sglyph');
		glyph.innerHTML = '&#8734;'; // infinity, for something that goes round

		let innerspans = document.createElement('div');
		innerspans.classList.add('sinnerspans');

		let line1 = document.createElement('div');
		line1.classList.add('innerspan');
		line1.innerHTML = this.ended ? 'ENDED' : 'SEQUENCE';
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
		return super.memUsed() + heap.sizeSequence();
	}
}

function constructSequence(what, loopIds, ender) {
	let r = new Sequence(what, loopIds, ender);
	heap.requestMem(r.memUsed());
	return r;
}

export { Sequence, constructSequence }
