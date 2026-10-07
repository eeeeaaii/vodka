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

import { heap } from './heap.js'
import {
	ctx,
	outputs,
	SAMPLE_RATE,
	DEFAULT_OUTPUT_KEY,
	maybeCreateAudioContext,
	whenAudioClockIsReady,
	cycleLog,
	outputKeyFor,
	openOutputFor,
	outputTimeFor,
	channelExistsOn,
	getDefaultOutputDevice
} from './audiodevices.js'
import { getSourceFromBuffer } from './audiobuffers.js'

/*
THE TRANSPORT

One cycle, and a track for every clip that has anything to do with it. A track
is what a clip is, seen from the audio system: a device, a set of channels, the
material it is playing, and one thing waiting to happen to it at the next
boundary.

The cycle is as long as its longest track, every track is restarted at every
boundary, and a track shorter than the cycle repeats inside it and is cut at the
end. That is what makes everything stay in phase without anything being
resampled or nudged: nothing is ever asked to carry on across a boundary.

A track and its clip live and die together. The engine holds a reference to the
clip while the track is in the cycle, which is what stops a clip nobody else
holds being collected in the middle of a bar: the collection is a stop queued on
that track, and it finishes when the stop does.

A member is one channel of one track. A stereo track is two members off one
buffer; a midi track is one member that schedules messages instead of making a
sound. Members are what get scheduled; tracks are what the rest of vodka talks
to.

(comment by Claude)
*/

// how far ahead of a boundary we wake up to schedule it
// (comment by Claude)
const CYCLE_LOOKAHEAD_SECONDS = 0.15;

// every track with anything in the cycle, playing or waiting
// (comment by Claude)
let tracks = [];

/*
Things to do at the moment the next cycle begins, which is the moment whatever
is waiting to join it starts sounding. A tempo change belongs here: what makes
it right is not when you asked for it but where it lands, and where it lands is
the downbeat of the passage it is the tempo of.

(comment by Claude)
*/
let doAtNextCycleStart = [];
let cycleTimer = null;
let cycleRunning = false;
let cycleNextBoundaryTime = 0;
// when the pass now playing began, which is what every track's own repeats are
// measured from -- they all start together at the top of the cycle
let cycleStartedAt = 0;

/*
How long this member's next pass is. A member with a loop-start split point
plays the whole wave once and the loop region from then on, so its length is
a question about state, not a constant.
*/
function memberLengthSeconds(member) {
	if (member.introDone && member.loopStartSeconds > 0) {
		return member.lengthSeconds - member.loopStartSeconds;
	}
	return member.lengthSeconds;
}

// A member that keeps its own records -- midi does -- gets told when it leaves
// the cycle, so nothing has to hold on to it after that.
// (comment by Claude)
function retireMember(member) {
	if (member && member.retired) member.retired();
}

function stopMemberNow(member) {
	if (member.stop) member.stop();
	if (member.node) {
		try { member.node.stop(); } catch (e) {}
		member.node.disconnect();
		member.node = null;
	}
}

class Track {
	constructor(clip) {
		this.clip = clip ? clip : null;
		// sounding now
		this.members = [];
		// joining at the next boundary, and whether it clears the floor
		this.pending = null;
		this.pendingExclusive = false;
		// leaving at the next boundary
		this.stopAtBoundary = false;
		this.passes = 0;
		/*
		A track nothing holds and nothing can hold: a break. It has no clip, so
		the rule that collects a clip nobody wants cannot reach it, and it would
		otherwise play for ever. One pass is what a break is.

		(comment by Claude)
		*/
		this.oneShot = false;
		this.paused = false;
		this.muted = false;
		/*
		The engine owns the clip while the track is in the cycle. That is the
		whole of vodka's garbage collection for clips: a clip nobody else holds
		has one reference left, which is this one, and it cannot be collected
		until the track lets go -- which it does when a stop completes, at a
		boundary, rather than in the middle of a bar.

		(comment by Claude)
		*/
		if (this.clip) heap.addReference(this.clip);
	}

	isEmpty() {
		return this.members.length == 0 && !this.pending;
	}

	// in the cycle at all, sounding or waiting
	isInCycle() {
		return !this.isEmpty();
	}

	// waiting for the boundary, with nothing sounding yet
	isQueued() {
		return this.members.length == 0 && !!this.pending;
	}

	isPlaying() {
		return this.isInCycle() && !this.paused;
	}

	/*
	What this track asks the cycle to be at least as long as. Zero while it is
	only waiting, so something queued cannot stretch the pass it is waiting for.
	*/
	passLengthSeconds() {
		let longest = 0;
		for (let i = 0; i < this.members.length; i++) {
			let len = memberLengthSeconds(this.members[i]);
			if (len > longest) longest = len;
		}
		return longest;
	}

	/*
	New material at the next boundary. Whatever is playing now plays to the end
	of the pass and is replaced there, so the swap is not heard.

	Replacing what was already waiting rather than adding to it: a track plays
	one thing, so queueing a second is changing your mind, not asking for both.
	This is the per-track queue -- queueing on one track leaves every other
	track alone, which is what lets one evaluation start a dozen parts at once.

	(comment by Claude)
	*/
	queue(members, exclusive) {
		this.pending = members;
		this.pendingExclusive = !!exclusive;
		this.stopAtBoundary = false;
	}

	/*
	Stopping, either at the next boundary or now. At the boundary is what a clip
	being let go asks for, and what replacing one asks for; now is for stopping
	everything, and for a device that turned out not to be there.

	(comment by Claude)
	*/
	stop(atBoundary) {
		if (atBoundary) {
			this.queueStop();
			return;
		}
		this.stopNow();
		forgetTrack(this);
	}

	/*
	Leaving at the next point this track is willing to be left -- its own, not
	the cycle's. Nobody waits for anybody to stop: a four count loop told to go
	stops after four even if the cycle is six, which is the same rule muting
	already follows.

	The bookkeeping still happens at the boundary, where everything else
	happens; this only brings the sound to an end at the right moment. So a
	wave with a loop- point halfway through goes quiet halfway through and is
	tidied up at the end of the pass.

	(comment by Claude)
	*/
	queueStop() {
		this.pending = null;
		this.pendingExclusive = false;
		this.stopAtBoundary = true;
		if (!cycleRunning || this.members.length == 0) return;
		let at = this.nextEligiblePoint(ctx.currentTime);
		if (!(at > 0) || at >= cycleNextBoundaryTime) return;
		for (let i = 0; i < this.members.length; i++) {
			let member = this.members[i];
			if (member.stopAt) {
				member.stopAt(at);
			} else if (member.node) {
				try {
					member.node.stop(outputTimeFor(member.output, at));
				} catch (e) {
					console.log('vodka: could not bring a loop\'s end forward: ' + e);
				}
			}
		}
	}

	// now, not at a boundary: stopping everything, or a device that went away
	// (comment by Claude)
	stopNow() {
		for (let i = 0; i < this.members.length; i++) {
			stopMemberNow(this.members[i]);
			retireMember(this.members[i]);
		}
		this.members = [];
		if (this.pending) {
			for (let i = 0; i < this.pending.length; i++) {
				retireMember(this.pending[i]);
			}
		}
		this.pending = null;
		this.stopAtBoundary = false;
	}

	/*
	What the boundary does to this track, before anything is scheduled: the
	material waiting comes in, and anything leaving goes.

	Let go of rather than stopped. Every source was given its stop time when its
	pass was scheduled, and that time is this boundary, so it is already ending
	on its own -- telling it to stop here would stop it now, and now is a
	lookahead before the boundary, which would cut the last tenth of a second
	off every pass.

	(comment by Claude)
	*/
	applyBoundary() {
		if (this.stopAtBoundary) {
			this.releaseMembers();
			this.pending = null;
			this.stopAtBoundary = false;
			return;
		}
		if (!this.pending) return;
		this.releaseMembers();
		this.members = this.pending;
		this.pending = null;
		this.pendingExclusive = false;
		// a track that has just been given new material has not played it yet
		this.passes = 0;
	}

	releaseMembers() {
		for (let i = 0; i < this.members.length; i++) {
			retireMember(this.members[i]);
		}
		this.members = [];
	}

	/*
	The intro flag advances at the boundary, not when the intro pass was
	scheduled -- lengths must hold still for the whole pass they were computed
	for, or anything reconstructing the running cycle from them is wrong.
	*/
	advanceIntro() {
		for (let i = 0; i < this.members.length; i++) {
			if (this.members[i].introScheduled) this.members[i].introDone = true;
		}
	}

	startPass(startTime, len) {
		if (this.paused || this.muted) return;
		for (let i = 0; i < this.members.length; i++) {
			this.startMember(this.members[i], startTime, len);
		}
	}

	startMember(member, startTime, len) {
		// A member that brings its own way of starting -- midi does, and
		// schedules messages rather than making a sound.
		// (comment by Claude)
		if (member.start) {
			member.start(startTime, len);
			return;
		}
		// still opening its device, or the device would not open. Either way
		// there is nowhere to play it this pass
		// (comment by Claude)
		if (!member.output) return;
		if (!channelExistsOn(member.output, member.channel)) return;
		// the same moment, said in this device's own clock
		// (comment by Claude)
		let at = outputTimeFor(member.output, startTime);
		let node = getSourceFromBuffer(member.buffer, true, member.loopStartSeconds,
				member.output);
		node.connect(member.output.merger, 0, member.channel);
		// the pass after the intro has played starts at the loop point, and
		// every pass wraps back to it
		node.start(at, member.introDone ? member.loopStartSeconds || 0 : 0);
		node.stop(at + len);
		if (!member.introDone) member.introScheduled = true;
		member.node = node;
	}

	/*
	The earliest moment this track is willing to be left. Every member of a
	track is the same material, so the first one answers for all of them.
	*/
	nextEligiblePoint(after) {
		if (this.members.length == 0) return 0;
		return memberEligibleAfter(this.members[0], after);
	}

	setPaused(paused) {
		this.paused = paused;
		if (!paused) return;
		for (let i = 0; i < this.members.length; i++) {
			stopMemberNow(this.members[i]);
		}
	}

	/*
	Silences the track without taking it out of the cycle, so it comes back in
	phase. Independent of pausing on purpose: a track can be both, and stops
	being silent only when neither says so.

	Muting cuts the sound off where it is. Unmuting waits for the track to come
	back round to its own beginning, the same as unpausing: a loop that started
	again in the middle of a bar would be out of time with everything else.
	*/
	setMuted(muted) {
		let was = this.muted;
		this.muted = muted;
		if (muted) {
			// not skipped when the flag was already set: asking again still has
			// to cut off whatever is sounding
			for (let i = 0; i < this.members.length; i++) {
				stopMemberNow(this.members[i]);
			}
			return;
		}
		if (!was || this.paused || !cycleRunning) return;
		for (let i = 0; i < this.members.length; i++) {
			this.unmuteMember(this.members[i]);
		}
	}

	/*
	Unmuting, and the member's own boundary decides when: it comes back where it
	would have come back anyway, in phase with itself. If that is still inside
	this pass it is started for the rest of the pass; if not, the next pass
	starts it in the ordinary way.
	*/
	unmuteMember(member) {
		if (member.start || member.node) return;
		if (!channelExistsOn(member.output, member.channel)) return;
		let at = nextOwnBoundary(member, ctx.currentTime);
		if (at >= cycleNextBoundaryTime) return;
		let node = getSourceFromBuffer(member.buffer, true, member.loopStartSeconds,
				member.output);
		node.connect(member.output.merger, 0, member.channel);
		node.start(outputTimeFor(member.output, at),
				member.introDone ? member.loopStartSeconds || 0 : 0);
		node.stop(outputTimeFor(member.output, cycleNextBoundaryTime));
		if (!member.introDone) member.introScheduled = true;
		member.node = node;
	}

	/*
	Where this track is, in samples from the start of its material. A readout
	rather than anything to synchronise against, and -1 when there is nothing
	to read: a track waiting for the boundary has no position yet.
	*/
	positionSamples() {
		if (!ctx || this.members.length == 0) return -1;
		let member = this.members[0];
		if (!member.lengthSeconds) return -1;
		if (member.lastNote) return member.lastNote();
		let elapsed = ctx.currentTime - cycleStartedAt;
		if (elapsed < 0) return -1;
		let len = memberLengthSeconds(member);
		// after the intro every pass lives in the loop region, so the readout
		// points there
		let base = member.introDone ? member.loopStartSeconds : 0;
		return Math.round((base + (elapsed % len)) * SAMPLE_RATE);
	}
}

/*
When a member next comes back round to its own beginning.

The cycle is as long as the longest track, and a shorter one repeats inside
that -- a four count loop in a six count cycle starts again at four. Its own
boundaries are what matter for muting it: a four count loop told to stop should
stop after four, not wait for the six. They are measured from the top of the
cycle, because that is where everything is started.

Never returns the moment it is asked about, so a loop is always allowed to
finish the repeat it is in the middle of.

The answer can land past the end of the cycle, and for a loop whose length does
not divide the cycle it usually does -- the four count loop's next own boundary
after count five is eight, and the cycle ends at six. The caller compares
against the cycle boundary; the node stops there regardless.
*/
function nextOwnBoundary(member, after) {
	let len = memberLengthSeconds(member);
	if (!(len > 0)) {
		return cycleNextBoundaryTime;
	}
	let elapsed = after - cycleStartedAt;
	let n = Math.floor(elapsed / len) + 1;
	return cycleStartedAt + n * len;
}

/*
When this member could next be left, at or after a moment.

The material plays from `base` -- nothing on the intro pass, the loop point
afterwards -- for one pass length, and repeats inside the cycle. So a split
point at `m` seconds into the wave is reachable this pass if it is inside that
window, and it comes round again every pass after.

The end of a pass is always eligible and is the last candidate, which is what
makes a wave with no loop- points behave exactly as everything did before:
the only place you can leave it is the end.

(comment by Claude)
*/
function memberEligibleAfter(member, after) {
	let len = memberLengthSeconds(member);
	if (!(len > 0)) return cycleNextBoundaryTime;
	let base = member.introDone ? (member.loopStartSeconds || 0) : 0;
	let offsets = [];
	let points = member.eligiblePoints || [];
	for (let i = 0; i < points.length; i++) {
		let offset = points[i] - base;
		if (offset > 0 && offset < len) offsets.push(offset);
	}
	offsets.push(len);
	offsets.sort(function(a, b) { return a - b; });
	let elapsed = after - cycleStartedAt;
	let k = Math.floor(elapsed / len);
	if (k < 0) k = 0;
	for (let pass = k; pass <= k + 1; pass++) {
		for (let i = 0; i < offsets.length; i++) {
			let t = cycleStartedAt + pass * len + offsets[i];
			if (t > after) return t;
		}
	}
	return cycleStartedAt + (k + 2) * len;
}

function cycleLengthSeconds() {
	let longest = 0;
	for (let i = 0; i < tracks.length; i++) {
		let len = tracks[i].passLengthSeconds();
		if (len > longest) longest = len;
	}
	return longest;
}

function anyLoopsPlaying() {
	for (let i = 0; i < tracks.length; i++) {
		if (tracks[i].isInCycle()) return true;
	}
	return false;
}

/*
The track a clip is playing on, made if it has none. One track per clip, for as
long as the clip is alive: that is the whole of the relationship, and it is why
there is no way to refer to a track except through its clip.

(comment by Claude)
*/
function trackFor(clip) {
	if (clip.getTrack && clip.getTrack()) return clip.getTrack();
	let track = new Track(clip);
	tracks.push(track);
	if (clip.setTrack) clip.setTrack(track);
	return track;
}

// a track with no clip: a break, which nothing holds and nothing can replace
// (comment by Claude)
function anonymousTrack() {
	let track = new Track(null);
	track.oneShot = true;
	tracks.push(track);
	return track;
}

function forgetTrack(track) {
	tracks = tracks.filter(function(t) { return t != track; });
	if (track.clip) {
		let clip = track.clip;
		track.clip = null;
		if (clip.setTrack) clip.setTrack(null);
		heap.removeReference(clip);
	}
}

/*
A clip nobody else holds has played its last pass.

That is where the one-shot comes from. Shift-enter throws the clip away, so the
audio system is its only owner and it plays once. Press enter instead and the
clip lands in the document, which holds it, so it loops. Delete it and the
document lets go, and it stops rather than being cut off. None of those are
special cases.

A track is spared on the pass that starts it, since the document has not taken
hold of the clip yet when the first cycle is scheduled.

(comment by Claude)
*/
function queueStopsForUnheldClips() {
	for (let i = 0; i < tracks.length; i++) {
		let track = tracks[i];
		if (!track.clip || track.passes == 0 || track.stopAtBoundary) continue;
		if (track.clip.references <= 1) {
			cycleLog('  stopping a clip nobody holds, passes=' + track.passes);
			track.clip.end(true);
		}
	}
}

// Starts every track at the boundary and cuts it at the end of the cycle, so a
// track shorter than the cycle repeats inside it and is truncated.
// (comment by Claude)
function startCycleAt(startTime) {
	cycleLog('startCycleAt(' + startTime.toFixed(4) + ') late by '
			+ ((ctx.currentTime - startTime) * 1000).toFixed(1) + 'ms'
			+ ' tracks=' + tracks.length);
	queueStopsForUnheldClips();
	/*
	A track coming in exclusively clears the floor: everything else that is
	playing stops here, at this boundary, which is where it was going to be
	restarted anyway, so nothing is cut off in the middle of a phrase.

	Only what is playing. Anything else queued for this same boundary survives
	and comes in alongside -- two things asked for in one breath are one
	intention, and the break used to delete them.

	(comment by Claude)
	*/
	let exclusive = null;
	for (let i = 0; i < tracks.length; i++) {
		if (tracks[i].pending && tracks[i].pendingExclusive) exclusive = tracks[i];
	}
	if (exclusive) {
		for (let i = 0; i < tracks.length; i++) {
			if (tracks[i] != exclusive && tracks[i].members.length > 0) {
				tracks[i].queueStop();
			}
		}
	}
	for (let i = 0; i < tracks.length; i++) {
		tracks[i].applyBoundary();
	}
	/*
	Counted before the length check, so that a track holding nothing still gets
	a pass and can be stopped when nobody wants it. An empty clip makes the
	cycle length zero and stops the cycle, and a track that never counts a pass
	is never collected.

	(comment by Claude)
	*/
	for (let i = 0; i < tracks.length; i++) {
		tracks[i].passes++;
		tracks[i].advanceIntro();
		// it has had its pass. Whatever was started while it played is waiting,
		// and comes in at the boundary this one goes out on
		// (comment by Claude)
		if (tracks[i].oneShot && tracks[i].members.length > 0) {
			tracks[i].queueStop();
		}
	}
	let gone = tracks.filter(function(t) { return t.isEmpty(); });
	for (let i = 0; i < gone.length; i++) forgetTrack(gone[i]);

	let len = cycleLengthSeconds();
	if (len <= 0) {
		cycleRunning = false;
		cycleTimer = null;
		return;
	}
	for (let i = 0; i < tracks.length; i++) {
		tracks[i].startPass(startTime, len);
	}
	cycleStartedAt = startTime;
	/*
	After the tracks for this pass are scheduled, so that anything doing this is
	taking effect alongside the sound rather than ahead of it, and cleared
	first so that something added by one of them waits for the next cycle
	rather than running twice in this one.

	(comment by Claude)
	*/
	if (doAtNextCycleStart.length > 0) {
		let todo = doAtNextCycleStart;
		doAtNextCycleStart = [];
		for (let i = 0; i < todo.length; i++) {
			todo[i]();
		}
	}
	let nextBoundary = startTime + len;
	cycleNextBoundaryTime = nextBoundary;
	let wakeIn = (nextBoundary - CYCLE_LOOKAHEAD_SECONDS - ctx.currentTime) * 1000;
	cycleLog('  len=' + len.toFixed(4) + ' nextBoundary=' + nextBoundary.toFixed(4)
			+ ' wakeIn=' + wakeIn.toFixed(1) + 'ms');
	cycleTimer = window.setTimeout(function() {
		cycleLog('timer fired for boundary ' + nextBoundary.toFixed(4));
		startCycleAt(nextBoundary);
	}, wakeIn > 0 ? wakeIn : 0);
}

/*
Runs fn when the next cycle starts -- the same boundary at which anything
queued right now begins to sound. With nothing playing there is no boundary to
wait for, so this waits until something starts one, which may be a long time.

(comment by Claude)
*/
function atNextCycleStart(fn) {
	doAtNextCycleStart.push(fn);
}

/*
Something is waiting, so the cycle may be able to end sooner than it was going
to.

Every track that is playing says the earliest moment it is willing to be left,
and the cycle ends when the last of them has had one -- the max, because
everything restarts together and nobody may be cut off mid-phrase. Never later
than the boundary already scheduled, and never sooner than there is time to
schedule it.

A wave with no loop- split points can only be left at the end of its pass, so a
document without any of them never pulls a boundary in at all. That is what
keeps this from changing what anything already does.

(comment by Claude)
*/
function maybeEndCycleEarly() {
	if (!cycleRunning || !cycleTimer) return;
	let earliest = ctx.currentTime + CYCLE_LOOKAHEAD_SECONDS;
	let want = 0;
	for (let i = 0; i < tracks.length; i++) {
		if (tracks[i].members.length == 0) continue;
		let at = tracks[i].nextEligiblePoint(earliest);
		if (at > want) want = at;
	}
	if (!(want > 0) || want >= cycleNextBoundaryTime) return;
	cycleLog('  ending the cycle early, at ' + want.toFixed(4)
			+ ' instead of ' + cycleNextBoundaryTime.toFixed(4));
	moveBoundaryTo(want);
}

/*
Bringing the boundary forward, which means telling everything already scheduled
to stop sooner than it was told to.

A source is given its stop time when its pass is scheduled, so a pass that is
cut short has to be told again. Calling stop a second time with an earlier time
is allowed and the last call is the one that counts; it is wrapped anyway,
because if some browser disagrees the sound would otherwise run past the
boundary and overlap what starts there, and a line in the console is a better
way to find that out than the sound.

(comment by Claude)
*/
function moveBoundaryTo(at) {
	for (let i = 0; i < tracks.length; i++) {
		let members = tracks[i].members;
		for (let j = 0; j < members.length; j++) {
			let member = members[j];
			if (member.stopAt) {
				member.stopAt(at);
			} else if (member.node) {
				try {
					member.node.stop(outputTimeFor(member.output, at));
				} catch (e) {
					console.log('vodka: could not bring a loop\'s end forward: ' + e);
				}
			}
		}
	}
	cycleNextBoundaryTime = at;
	if (cycleTimer) window.clearTimeout(cycleTimer);
	let wakeIn = (at - CYCLE_LOOKAHEAD_SECONDS - ctx.currentTime) * 1000;
	cycleTimer = window.setTimeout(function() {
		startCycleAt(at);
	}, wakeIn > 0 ? wakeIn : 0);
}

function startCycleIfNeeded() {
	if (cycleRunning) return;
	cycleRunning = true;
	whenAudioClockIsReady(function() {
		startCycleAt(ctx.currentTime);
	});
}

/*
Which device a member plays on. Already open nearly always -- choosing a device
opens it -- and when it is not, the member sits in its track without an output
until it is, and starts at the first boundary after that. Being one boundary
late the very first time you play on a device you have not named before is
better than making play wait for a device to open.

(comment by Claude)
*/
function attachOutput(track, member) {
	if (member.outputKey === undefined) {
		member.output = outputs[DEFAULT_OUTPUT_KEY];
		return;
	}
	let open = outputs[member.outputKey];
	if (open) {
		member.output = open;
		return;
	}
	openOutputFor(member.outputKey, member.outputName, function(o, err) {
		if (o) {
			member.output = o;
			return;
		}
		/*
		No such device -- a document saved on another machine, or an interface
		that is not plugged in. The track stops rather than staying in the cycle:
		a member with no output is never played, but it still has a length, and
		the cycle is as long as its longest track. A clip from somewhere else
		would silently decide how long every bar was.

		(comment by Claude)
		*/
		console.log('vodka: could not open that audio output: ' + err);
		track.queueStop();
	});
}

function makeAudioMember(buffer, channel, loopStartSeconds, deviceId, deviceName, eligiblePoints) {
	return {
		buffer: buffer,
		channel: channel,
		lengthSeconds: buffer.length / SAMPLE_RATE,
		loopStartSeconds: loopStartSeconds || 0,
		// where in this material it is all right to stop, in seconds from the
		// top of the wave. See eligiblePointsSeconds in wavetable.js
		// (comment by Claude)
		eligiblePoints: eligiblePoints ? eligiblePoints : [],
		introDone: false,
		introScheduled: false,
		node: null,
		outputKey: outputKeyFor(deviceId),
		outputName: deviceName || ''
	};
}

/*
Queues audio on a track: one member per channel, all of them joining at the same
boundary because they are one thing.

(comment by Claude)
*/
function queueAudio(track, buffer, channelList, loopStartSeconds, deviceId, deviceName, exclusive, eligiblePoints) {
	maybeCreateAudioContext();
	let members = [];
	for (let i = 0; i < channelList.length; i++) {
		let member = makeAudioMember(buffer, channelList[i], loopStartSeconds,
				deviceId, deviceName, eligiblePoints);
		attachOutput(track, member);
		members.push(member);
	}
	track.queue(members, exclusive);
	startCycleIfNeeded();
	maybeEndCycleEarly();
	return track;
}

// a sequence that schedules its own messages: see midifunctions.js
// (comment by Claude)
function queueMidi(track, member) {
	maybeCreateAudioContext();
	track.queue([ member ], false);
	startCycleIfNeeded();
	maybeEndCycleEarly();
	return track;
}

/*
Takes the floor. Everything playing stops at the boundary this comes in on --
which is where it was going to restart anyway, so nothing is cut short -- and
then this is the only thing in the cycle, so for one pass the cycle is exactly
this. Anything started while it plays waits for the next boundary, which is the
end of it, and they all begin together from the top.

(comment by Claude)
*/
function queueBreak(buffer, channels, loopStartSeconds, deviceId, eligiblePoints) {
	let track = anonymousTrack();
	return queueAudio(track, buffer, channels, loopStartSeconds,
			deviceId === undefined ? getDefaultOutputDevice() : deviceId, '', true,
			eligiblePoints);
}

function endAllLoops() {
	let all = tracks.slice();
	for (let i = 0; i < all.length; i++) {
		if (all[i].clip) all[i].clip.end(false);
		all[i].stopNow();
		forgetTrack(all[i]);
	}
	tracks = [];
	if (cycleTimer) {
		window.clearTimeout(cycleTimer);
		cycleTimer = null;
	}
	cycleRunning = false;
	// anything that was waiting for a downbeat that is not going to come
	// (comment by Claude)
	doAtNextCycleStart = [];
}

/*
Stops whatever is on a channel, now rather than at a boundary. -1 is every
channel.

(comment by Claude)
*/
function abortPlayback(channel) {
	let all = tracks.slice();
	for (let i = 0; i < all.length; i++) {
		let track = all[i];
		let hit = false;
		for (let j = 0; j < track.members.length; j++) {
			if (channel == -1 || track.members[j].channel == channel) hit = true;
		}
		if (!hit) continue;
		if (track.clip) track.clip.end(false);
		track.stopNow();
		forgetTrack(track);
	}
}

// When the next cycle begins, in ctx.currentTime, and how long a cycle is.
// This is what midi aligns to.
// (comment by Claude)
function nextCycleBoundary() {
	return { at: cycleNextBoundaryTime, lengthSeconds: cycleLengthSeconds() };
}

/*
When the pass now playing began. Asked for by the punch-in recording, which has
to know where the downbeat was in the clock the samples are arriving on.

(comment by Claude)
*/
function currentCycleStart() {
	return cycleStartedAt;
}

export {
	CYCLE_LOOKAHEAD_SECONDS,
	Track,
	trackFor,
	anonymousTrack,
	forgetTrack,
	cycleLengthSeconds,
	anyLoopsPlaying,
	startCycleAt,
	atNextCycleStart,
	currentCycleStart,
	queueAudio,
	queueMidi,
	queueBreak,
	endAllLoops,
	nextCycleBoundary,
	abortPlayback
}
