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
import { getLoopPositionSamples, loopExists, muteLoops } from '../webaudio.js'
import { getMidiLastNote } from '../midifunctions.js'
import { eventQueueDispatcher } from '../eventqueuedispatcher.js'

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
		/*
		Two reasons a clip can be silent, kept apart because they are not each
		other's business. The button is something you asked for; the collapse
		one is bookkeeping that follows whether the nex is hidden. Uncollapsing
		must not unmute something you muted on purpose, and pressing the button
		twice inside a collapsed nex must not make it audible.
		*/
		this.mutedByUser = false;
		this.mutedByCollapse = false;
		/*
		Whether anything this clip plays goes past full scale. Coarse on
		purpose: one flag for the whole clip, not where or how often, because
		what you want to know while playing is whether to turn something down.

		It costs nothing to know. A wavetable works out the largest sample it
		holds when it caches its buffer, for the amplitude the drawing is
		scaled to, so play only has to ask.
		*/
		this.clipping = false;
		// nothing here is yours to type over
		this.setMutable(false);
	}

	getTypeName() {
		return '-clip-';
	}

	isMuted() {
		return this.mutedByUser || this.mutedByCollapse;
	}

	isMutedByUser() {
		return this.mutedByUser;
	}

	// pressing the button means now
	setMutedByUser(v) {
		if (this.mutedByUser == !!v) return;
		this.mutedByUser = !!v;
		this.applyMute(true /* immediately */);
	}

	// being covered up means at the end of the pass -- what is sounding gets to
	// finish, and the next time round does not start
	setMutedByCollapse(v) {
		if (this.mutedByCollapse == !!v) return;
		this.mutedByCollapse = !!v;
		this.applyMute(false /* at the cycle end */);
	}

	toggleMutedByUser() {
		this.setMutedByUser(!this.mutedByUser);
	}

	applyMute(immediately) {
		muteLoops(this.ids, this.isMuted(), !immediately);
		this.setDirtyForRendering(true);
		eventQueueDispatcher.enqueueRenderOnlyDirty();
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

	setClipping(v) {
		this.clipping = !!v;
	}

	isClipping() {
		return this.clipping;
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
		// the clip is the same clip, so a muted one stays muted across a
		// replacement rather than coming back audible
		// these loops have not started, so there is nothing playing to let
		// finish and no difference between the two kinds of muting
		if (this.isMuted()) {
			muteLoops(this.ids, true, false /* immediately */);
		}
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
	Deleting a clip ends it, at the moment the document lets go rather than
	whenever the undo buffer gets round to it -- a clip you deleted that went
	on playing for another fifty deletions would be a clip you cannot stop.

	Ended gently: at the next boundary the audio system finds it is the only
	one left holding it and does not schedule another pass. So a deleted clip
	finishes what it is playing rather than being cut off, which is the same
	rule that makes a thrown-away clip play once.
	*/
	stopFunctioning() {
		this.end(false);
	}

	makeCopy(shallow) {
		// A copy names the same loop but must not be able to stop it a second
		// time. It is a picture of the clip, not another clip.
		let r = new Clip(this.kind, this.what, this.ids.slice(), null, this.channels.slice(), this.port);
		r.ended = this.ended;
		r.clipping = this.clipping;
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

		// the glyph and the mute square share a column, so the square sits
		// under the infinity sign rather than off at the end of the row
		let glyphcol = document.createElement('div');
		glyphcol.classList.add('sysglyphcol');
		glyphcol.appendChild(glyph);
		glyphcol.appendChild(this.createMuteButton());

		frame.appendChild(glyphcol);
		frame.appendChild(innerspans);
		domNode.appendChild(frame);

		if (this.isMuted()) {
			domNode.classList.add('muted');
		}
		/*
		Orange rather than red. Going past full scale is worth knowing about and
		is not, on its own, a disaster -- it is a thing to look at, not an alarm.
		*/
		if (this.clipping) {
			domNode.classList.add('clipping');
		}

		this.startPositionCounter();
	}

	/*
	A square under the infinity sign: hollow when the clip can be heard, filled
	when it cannot.

	Only the button's own state is shown, because that is the only half you can
	do anything about from here. A clip silenced by being collapsed is inside
	something you cannot see anyway.

	mousedown rather than click, and the event stops here: the same press would
	otherwise go on to select the nex, which is what every other press on it
	does.
	*/
	createMuteButton() {
		let b = document.createElement('div');
		b.classList.add('clipmute');
		if (this.mutedByUser) {
			b.classList.add('on');
		}
		b.onmousedown = (event) => {
			this.toggleMutedByUser();
			event.stopPropagation();
			event.preventDefault();
			return false;
		}
		return b;
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
