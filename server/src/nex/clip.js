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
import { getLoopPositionSamples, loopExists, muteLoops, endLoops } from '../webaudio.js'
import { getMidiLastNote } from '../midifunctions.js'
import { eventQueueDispatcher } from '../eventqueuedispatcher.js'

// the same shape the other private data sections use: key:value, ; between
// (comment by Claude)
const FIELD_SEPARATOR = ';';
const KEY_SEPARATOR = ':';
const KIND_KEY = 'kind';
const CHANNELS_KEY = 'channels';
const PORT_KEY = 'port';
const OUTPUT_KEY = 'output';
const OUTPUT_NAME_KEY = 'outputname';
const DEVICE_KIND_KEY = 'devicekind';

// what a clip says it is playing on
// (comment by Claude)
function channelsDescription(channels) {
	if (channels.length == 0) return '';
	return 'channel' + (channels.length == 1 ? ' ' : 's ') + channels.join(', ');
}

/*
A clip is a running loop -- audio or midi -- as something you can hold. Made by
the system, never typed in, so it renders like a closure or a contract rather
than like a value.

It holds ids rather than the sound itself, plus whatever else describes the
loop: which channels it is on, how to end it. Deleting a clip stops it.

Passing a clip back to play replaces what it names rather than starting
something alongside it, which is what lets an expression be re-evaluated in
place. A clip is not a generic handle: it names a loop and nothing else.

(comment by Claude)
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
		// (comment by Claude)
		this.channels = channels ? channels : [];
		/*
		Which audio device this clip plays on, as a device id, with the name it
		had when it was chosen so that there is something to put on the screen.
		Empty means the device vodka opened on.

		On the clip rather than on the play command because that is what makes
		simultaneous output work: two clips of the same wave on two devices are
		two loops in one cycle, started at the same moment in two clocks. And
		because a clip is the thing that is playing, so it is the thing that
		knows where.

		A device id names hardware on one machine, so a clip loaded on another
		machine -- or after the interface was unplugged -- names a device that
		is not there, and says so when you play it.

		(comment by Claude)
		*/
		this.outputDevice = '';
		this.outputName = '';
		// 'output' or 'input', or empty for a clip that named no device.
		// A clip faces one way: you play through an output and record from an
		// input, and a clip is the routing either way round
		// (comment by Claude)
		this.deviceKind = '';
		this.port = port ? port : null;
		this.ender = ender ? ender : null;
		this.ended = false;
		this.posFrame = null;
		this.posSpan = null;
		// silence, asked for with the button
		this.muted = false;
		/*
		Whether anything this clip plays goes past full scale. Coarse on
		purpose: one flag for the whole clip, not where or how often, because
		what you want to know while playing is whether to turn something down.

		It costs nothing to know. A wavetable works out the largest sample it
		holds when it caches its buffer, for the amplitude the drawing is
		scaled to, so play only has to ask.

		(comment by Claude)
		*/
		this.clipping = false;
		// nothing here is yours to type over
		this.setMutable(false);
	}

	getTypeName() {
		return '-clip-';
	}

	isMuted() {
		return this.muted;
	}

	// pressing the button means now
	setMuted(v) {
		if (this.muted == !!v) return;
		this.muted = !!v;
		muteLoops(this.ids, this.muted);
		this.setDirtyForRendering(true);
		eventQueueDispatcher.enqueueRenderOnlyDirty();
	}


	toggleMuted() {
		this.setMuted(!this.muted);
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

	getOutputDevice() {
		return this.outputDevice;
	}

	getOutputName() {
		return this.outputName;
	}

	getDeviceKind() {
		return this.deviceKind;
	}

	setOutputDevice(id, name, kind) {
		this.outputDevice = id ? id : '';
		this.outputName = name ? name : '';
		this.deviceKind = (id && kind) ? kind : '';
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

	/*
	Replacing what a clip names keeps the clip itself valid.

	Asks to be drawn, rather than only marking itself dirty. A clip is assigned
	by play, and play can be run by a gesture that changes nothing in the
	document and so renders nothing -- a double click, which evaluates in place
	-- in which case a clip that only said it was dirty would go on saying
	UNASSIGNED, with its counter stopped, over a loop you could hear playing.
	Dirty renders are deduped in the queue, so asking costs nothing when
	something else was going to render anyway.

	(comment by Claude)
	*/
	setIds(ids, what) {
		this.ids = ids;
		if (what) this.what = what;
		this.ended = false;
		// the clip is the same clip, so a muted one stays muted across a
		// replacement rather than coming back audible
		if (this.muted) {
			muteLoops(this.ids, true);
		}
		this.setDirtyForRendering(true);
		eventQueueDispatcher.enqueueRenderOnlyDirty();
	}

	// true if there was anything left to end
	// (comment by Claude)
	end(atCycleEnd) {
		if (this.ended || !this.ender) return false;
		this.ended = true;
		this.ender(this.ids, atCycleEnd);
		// it is unassigned now and has to say so: ending happens at a cycle
		// boundary, on a timer, with nothing else about to render
		// (comment by Claude)
		this.setDirtyForRendering(true);
		eventQueueDispatcher.enqueueRenderOnlyDirty();
		return true;
	}

	hasEnded() {
		return this.ended;
	}

	/*
	A clip with no wave assigned to it. A clip is a name for a running loop and
	holds no audio of its own -- the samples live in the audio system, which is
	where the loop is -- so a clip that names no loop is not a clip that is
	paused or quiet or holding something back. It is a clip with nothing in it.

	Which is a useful thing to be. Giving play a clip replaces the loop that
	clip names instead of starting another, so an unassigned clip is what makes
	a play expression re-evaluable in place: the first run assigns it, every run
	after that replaces what it holds.

	Two ways to be in that state, and they are the same state: never assigned
	(make-clip), or assigned once and since ended, which deletes the loop and
	leaves the ids naming nothing.

	Not the same as silenced -- see toggle-playback, where the loop keeps its
	place in the cycle and comes back in phase. That one still has a wave.

	(comment by Claude)
	*/
	isUnassigned() {
		return this.ended || this.ids.length == 0;
	}

	/*
	Deleting a clip ends it, at the moment the document lets go rather than
	whenever the undo buffer gets round to it -- a clip you deleted that went
	on playing for another fifty deletions would be a clip you cannot stop.

	Ended gently: at the next boundary the audio system finds it is the only
	one left holding it and does not schedule another pass. So a deleted clip
	finishes what it is playing rather than being cut off, which is the same
	rule that makes a thrown-away clip play once.

	(comment by Claude)
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
		r.setOutputDevice(this.outputDevice, this.outputName, this.deviceKind);
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
	A clip saves as an unassigned clip, whatever it was doing when it was saved.
	What a clip names cannot be written down -- a loop belongs to the audio
	system and the audio system does not outlive the page -- but a clip is not
	only the loop it names. It is also which channels that loop is on, and, more
	than that, it is the identity that makes the expression it sits in replace
	its own sound instead of starting a second copy.

	That survives perfectly well, so it is written: kind, channels, port. What
	comes back is a clip with nothing assigned to it, which is what it honestly
	is after a reload, and the play expression around it works first time.

	It used to save as nil, because there was no way to write a clip that named
	nothing. There is now.

	(comment by Claude)
	*/
	toStringV2(ctx) {
		// [;clip], because a clip is not mutable and comes back that way: the
		// parser makes anything without the mark mutable
		// (comment by Claude)
		return `[${this.toStringV2Literal()}clip]`
				+ this.toStringV2PrivateDataSection(ctx) + this.toStringV2TagList();
	}

	serializePrivateData(ctx) {
		let fields = [ KIND_KEY + KEY_SEPARATOR + encodeURIComponent(this.kind) ];
		if (this.channels.length > 0) {
			fields.push(CHANNELS_KEY + KEY_SEPARATOR + this.channels.join(','));
		}
		if (this.port) {
			fields.push(PORT_KEY + KEY_SEPARATOR + encodeURIComponent(this.port));
		}
		if (this.outputDevice) {
			fields.push(OUTPUT_KEY + KEY_SEPARATOR + encodeURIComponent(this.outputDevice));
		}
		if (this.outputName) {
			fields.push(OUTPUT_NAME_KEY + KEY_SEPARATOR + encodeURIComponent(this.outputName));
		}
		if (this.deviceKind) {
			fields.push(DEVICE_KIND_KEY + KEY_SEPARATOR + this.deviceKind);
		}
		return fields.join(FIELD_SEPARATOR);
	}

	/*
	Whatever is missing keeps the value the constructor gave it, so a clip
	written by an older version -- or a field this version does not know about
	-- loads as a clip rather than as nothing.

	(comment by Claude)
	*/
	deserializePrivateData(data) {
		if (!data) return;
		let parts = data.split(FIELD_SEPARATOR);
		for (let i = 0; i < parts.length; i++) {
			let c = parts[i].indexOf(KEY_SEPARATOR);
			if (c < 0) continue;
			let key = parts[i].substring(0, c);
			let val = parts[i].substring(c + 1);
			if (key == KIND_KEY) {
				this.kind = decodeURIComponent(val);
				this.what = this.kind;
			} else if (key == CHANNELS_KEY) {
				this.channels = val.split(',')
						.map(n => parseInt(n, 10))
						.filter(n => n >= 1);
				this.what = channelsDescription(this.channels);
			} else if (key == PORT_KEY) {
				this.port = decodeURIComponent(val);
			} else if (key == OUTPUT_KEY) {
				this.outputDevice = decodeURIComponent(val);
			} else if (key == OUTPUT_NAME_KEY) {
				this.outputName = decodeURIComponent(val);
			} else if (key == DEVICE_KIND_KEY) {
				this.deviceKind = val;
			}
		}
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
		line1.innerHTML = this.isUnassigned() ? 'UNASSIGNED' : this.kind.toUpperCase();
		innerspans.appendChild(line1);

		/*
		Which device, when it is not the one vodka opened on. Named rather than
		numbered: the id is a hash and the name is what is written on the box.

		(comment by Claude)
		*/
		if (this.outputDevice) {
			let devline = document.createElement('div');
			devline.classList.add('innerspan');
			devline.innerHTML = this.outputName ? this.outputName : 'another device';
			innerspans.appendChild(devline);
		}

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
		/*
		Only when there is something to say. No outline waiting to be filled in:
		an indicator that is there all the time is one more thing to read on
		every clip, and this one is worth noticing precisely because it is not
		usually there.

		(comment by Claude)
		*/
		if (this.clipping) {
			let clipped = document.createElement('div');
			clipped.classList.add('clipclipping');
			clipped.setAttribute('title', 'louder than full scale');
			glyphcol.appendChild(clipped);
		}
		glyphcol.appendChild(this.createMuteButton());

		frame.appendChild(glyphcol);
		frame.appendChild(innerspans);
		domNode.appendChild(frame);

		if (this.isMuted()) {
			domNode.classList.add('muted');
		}
		this.startPositionCounter();
	}

	/*
	A square at the bottom of the glyph column, with an m in it: hollow when the
	clip can be heard, filled when it cannot. The letter is there because the
	square alone said only that it was a button, not which one -- and there is
	more than one small square on a clip now.

	mousedown rather than click, and the event stops here: the same press would
	otherwise go on to select the nex, which is what every other press on it
	does.

	(comment by Claude)
	*/
	createMuteButton() {
		let b = document.createElement('div');
		b.classList.add('clipmute');
		b.innerHTML = 'm';
		b.setAttribute('title', 'mute');
		if (this.muted) {
			b.classList.add('on');
		}
		b.onmousedown = (event) => {
			this.toggleMuted();
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

	(comment by Claude)
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
			// (comment by Claude)
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

/*
A clip with nothing assigned to it: the shape of one, made before there is a
loop to name, so that play has something to replace rather than something to
start. See isUnassigned.

It carries an ender from the start, so that once play has filled it in,
deleting it stops the sound like any other clip -- including a clip that came
back from a file, which nothing else would have given one to.

(comment by Claude)
*/
function constructUnassignedClip(kind, channels, port, deviceId, deviceName, deviceKind) {
	let chans = channels ? channels : [];
	let r = constructClip(kind ? kind : 'audio loop', channelsDescription(chans),
			[], endLoops, chans, port);
	r.setOutputDevice(deviceId, deviceName, deviceKind);
	r.ended = true;
	return r;
}

export { Clip, constructClip, constructUnassignedClip, channelsDescription }
