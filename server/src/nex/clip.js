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
import { getLoopPositionSamples, loopExists } from '../webaudio.js'
import { getMidiLastNote } from '../midifunctions.js'

/*
A clip is a running loop -- audio or midi -- as something you can hold. Made by
the system, never typed in, so it renders like a closure or a contract rather
than like a value.

It holds ids rather than the sound itself, plus whatever else describes the
loop: which channels it is on, how to end it. Deleting a clip stops it.

Passing a clip back to play replaces what it names rather than starting
something alongside it, which is what lets an expression be re-evaluated in
place. A clip is not a generic handle: it names a loop and nothing else.
*/
class Clip extends Nex {
	constructor(kind, what, ids, ender, channels, port) {
		super();
		// audio or midi, so whatever is handed one can tell whether it is the
		// sort it knows how to replace
		this.kind = kind ? kind : 'clip';
		this.what = what ? what : this.kind;
		this.ids = ids ? ids : [];
		// a replacement stays where the loop already is: channels for audio,
		// a port for midi
		this.channels = channels ? channels : [];
		this.port = port ? port : null;
		this.ender = ender ? ender : null;
		this.ended = false;
		this.posFrame = null;
		this.posSpan = null;
		// nothing here is yours to type over
		this.setMutable(false);
	}

	getTypeName() {
		return '-clip-';
	}

	getKind() {
		return this.kind;
	}

	getIds() {
		return this.ids;
	}

	getChannels() {
		return this.channels;
	}

	getPort() {
		return this.port;
	}

	/*
	Never a copy, whatever the mutable flag says: a copy of a clip is a picture
	of it and cannot stop the loop, so an expression holding one would go on
	naming a loop it could no longer reach.
	*/
	evaluate(env) {
		return this;
	}

	// replacing what a clip names keeps the clip itself valid
	setIds(ids, what) {
		this.ids = ids;
		if (what) this.what = what;
		this.ended = false;
		this.setDirtyForRendering(true);
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

	/*
	Deleting a clip does not stop it here. The document lets go of it, which
	is the whole story: at the next boundary the audio system finds it is the
	only one left holding it and does not schedule another pass. So a deleted
	clip finishes what it is playing rather than being cut off, and that is
	the same rule that makes a thrown-away clip play once.
	*/
	cleanupOnMemoryFree() {
		this.end(false);
	}

	makeCopy(shallow) {
		// A copy names the same loop but must not be able to stop it a second
		// time. It is a picture of the clip, not another clip.
		let r = new Clip(this.kind, this.what, this.ids.slice(), null, this.channels.slice(), this.port);
		r.ended = this.ended;
		this.copyFieldsTo(r);
		return r;
	}

	toString(version, ctx) {
		if (version == 'v2') {
			return this.toStringV2(ctx);
		}
		return '[clip]';
	}

	/*
	A clip names something playing now. There is nothing to write down: reading
	it back in a later session would name a loop that does not exist. It saves
	as nil, the same as a deferred with nothing in it.
	*/
	toStringV2(ctx) {
		return '[nil]';
	}

	prettyPrintInternal(lvl, hdir) {
		return this.doTabs(lvl, hdir) + '[clip]';
	}

	renderInto(renderNode, renderFlags, withEditor) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags, withEditor);
		domNode.classList.add('clip');

		let frame = document.createElement('div');
		frame.classList.add('sysframe');

		let glyph = document.createElement('div');
		glyph.classList.add('sysglyph');
		glyph.innerHTML = '&#8734;'; // it goes round until you stop it

		let innerspans = document.createElement('div');
		innerspans.classList.add('sysinnerspans');

		let line1 = document.createElement('div');
		line1.classList.add('innerspan');
		line1.innerHTML = this.ended ? 'STOPPED' : this.kind.toUpperCase();
		innerspans.appendChild(line1);

		let line2 = document.createElement('div');
		line2.classList.add('innerspan');
		line2.innerHTML = this.what;
		innerspans.appendChild(line2);

		this.posSpan = document.createElement('div');
		this.posSpan.classList.add('innerspan');
		this.posSpan.classList.add('clippos');
		innerspans.appendChild(this.posSpan);

		frame.appendChild(glyph);
		frame.appendChild(innerspans);
		domNode.appendChild(frame);

		this.startPositionCounter();
	}

	isMidi() {
		return this.kind == 'midi loop';
	}

	/*
	The counter writes one string into its own span, so it never asks the
	document to render -- watching a clip count samples must not cost anything
	that editing would notice.

	An audio clip counts samples, because that is what it is playing. A midi
	clip has no position of its own -- it sends messages and the sound is made
	somewhere else -- so it shows the last note it played instead.
	*/
	startPositionCounter() {
		if (this.posFrame) return;
		let quiet = 0;
		let step = () => {
			if (this.ended) {
				this.posFrame = null;
				this.showPosition(-1);
				return;
			}
			let alive = this.ids.length && loopExists(this.ids[0]);
			let pos = -1;
			if (alive) {
				pos = this.isMidi()
						? getMidiLastNote(this.ids[0])
						: getLoopPositionSamples(this.ids[0]);
			}
			this.showPosition(pos);
			// stopped from somewhere else, like the stop button -- give up
			// rather than spin for the rest of the session. Having no position
			// is not that: a loop waiting for the boundary is still ours, and a
			// midi loop has no note to show until its first one goes past.
			if (!alive && ++quiet > 60) {
				this.posFrame = null;
				return;
			}
			if (alive) quiet = 0;
			this.posFrame = window.requestAnimationFrame(step);
		};
		this.posFrame = window.requestAnimationFrame(step);
	}

	showPosition(pos) {
		if (!this.posSpan) return;
		if (pos < 0) {
			this.posSpan.textContent = '--';
			return;
		}
		this.posSpan.textContent = this.isMidi() ? ('note ' + pos) : (pos + ' samps');
	}

	getDefaultHandler() {
		return 'standardDefault';
	}

	memUsed() {
		return super.memUsed() + heap.sizeClip();
	}
}

function constructClip(kind, what, ids, ender, channels, port) {
	let r = new Clip(kind, what, ids, ender, channels, port);
	heap.requestMem(r.memUsed());
	return r;
}

export { Clip, constructClip }
