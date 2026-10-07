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
THE GLOBAL CYCLE

Every loop shares one cycle, whose length is the longest loop in it. Adding a
loop waits for the current cycle to finish, then the cycle becomes as long as it
needs to be and everything starts together.

That is what `mix` already does, made to happen live rather than in advance:
mixing a four beat wave with a six beat one gives six beats, with the short one
playing through and then its first half again, because valueAtSample wraps. Here
each loop is its own source node set to repeat, and all of them are cut and
restarted at the cycle boundary, which comes to the same thing while leaving
each loop separately removable.

The boundary is scheduled on ctx.currentTime, so it is exact. setTimeout is only
used to wake up early enough to do the scheduling.

(comment by Claude)
*/

// how far ahead of a boundary we wake up to schedule it
// (comment by Claude)
const CYCLE_LOOKAHEAD_SECONDS = 0.15;

let cycleLoops = {};        // id -> { buffer, channel, lengthSeconds, node, endAfterCycle }
let cyclePending = {};      // loops that join at the next boundary
/*
A break: everything stops, one sample plays alone, and whatever you start while
it plays comes in when it ends.

Queued rather than done, because the point of a break is where it lands. It
waits for the boundary the same as anything else joining the cycle, so the
music finishes the bar it is in.

Once it has the floor the cycle is the break and nothing else, which is what
makes the rest of it work without any new machinery: the cycle is as long as
its longest member, so for one pass the cycle is exactly the break; anything
started meanwhile waits for the next boundary, which is the end of the break,
and then they all begin together from the top, in phase, the way they would
after any other boundary. If nothing was started, the cycle has no members
left, and a cycle with nothing in it stops.

(comment by Claude)
*/
let pendingBreak = null;    // { buffers, channels } waiting for the next boundary
let breakIds = [];          // what the break is playing on, while it plays
/*
Things to do at the moment the next cycle begins, which is the moment whatever
is waiting to join it starts sounding. A tempo change belongs here: what makes
it right is not when you asked for it but where it lands, and where it lands is
the downbeat of the passage it is the tempo of.

(comment by Claude)
*/
let doAtNextCycleStart = [];
let nextCycleLoopId = 1;
let cycleTimer = null;
let cycleRunning = false;
let cycleNextBoundaryTime = 0;
// when the pass now playing began, which is what every loop's own repeats are
// measured from -- they all start together at the top of the cycle
let cycleStartedAt = 0;

/*
How long this member's next pass is. A member with a start-loop split point
plays the whole wave once and the loop region from then on, so its length is
a question about state, not a constant.
*/
function memberLengthSeconds(loop) {
	if (loop.introDone && loop.loopStartSeconds > 0) {
		return loop.lengthSeconds - loop.loopStartSeconds;
	}
	return loop.lengthSeconds;
}

function cycleLengthSeconds() {
	let longest = 0;
	for (let id in cycleLoops) {
		let len = memberLengthSeconds(cycleLoops[id]);
		if (len > longest) {
			longest = len;
		}
	}
	return longest;
}

function anyLoopsPlaying() {
	for (let id in cycleLoops) return true;
	for (let id in cyclePending) return true;
	return false;
}

/*
While a clip is playing, the audio system owns it. That is what decides how
long it plays for: at every boundary each playing clip is asked whether anyone
else still holds it, and one that nobody else holds has just played its last
pass. Nothing can stop it, replace it or even name it any more, so there is
nothing to schedule it for.

That is where the one-shot comes from. Shift-enter throws the clip away, so the
audio system is its only owner and it plays once. Press enter instead and the
clip lands in the document, which holds it, so it loops. Delete it and the
document lets go, and it stops at the end of the pass it is in rather than
being cut off. None of those are special cases.

A clip is spared on the pass that starts it, since the document has not taken
hold of it yet when the first cycle is scheduled.
*/
let playingClips = [];

function clipStartedPlaying(clip, ids) {
	for (let i = 0; i < playingClips.length; i++) {
		if (playingClips[i].clip == clip) {
			playingClips[i].ids = ids;
			return;
		}
	}
	heap.addReference(clip);
	playingClips.push({ clip: clip, ids: ids, passes: 0 });
}

function releaseClip(i) {
	let clip = playingClips[i].clip;
	playingClips.splice(i, 1);
	heap.removeReference(clip);
}

function retireUnownedClips() {
	for (let i = playingClips.length - 1; i >= 0; i--) {
		let p = playingClips[i];
		if (p.passes == 0) continue;
		if (p.clip.references <= 1) {
			cycleLog('  retiring a clip nobody holds, passes=' + p.passes);
			// at the end of this pass, not now -- the pass it is in was
			// scheduled to run to the boundary and should get there
			p.clip.end(true);
			releaseClip(i);
		}
	}
}

// Starts every loop at the boundary and cuts it at the end of the cycle, so a
// loop shorter than the cycle repeats inside it and is truncated.
// (comment by Claude)
function startCycleAt(startTime) {
	/*
	startTime is where this pass is meant to begin. Late means the sources are
	started in the past, which the web audio api honours by playing them from
	the top immediately -- but their stop time is startTime + len regardless, so
	a late pass is a short pass, and the next boundary cuts it off wherever it
	has got to. That is the shape of the bug being chased here.

	(comment by Claude)
	*/
	cycleLog('startCycleAt(' + startTime.toFixed(4) + ') late by '
			+ ((ctx.currentTime - startTime) * 1000).toFixed(1) + 'ms'
			+ ' members=' + Object.keys(cycleLoops).length
			+ ' pending=' + Object.keys(cyclePending).length
			+ ' clips=' + playingClips.length);
	if (pendingBreak) {
		beginBreak();
	} else if (breakIds.length > 0) {
		// it has had its one pass. Whatever was started while it played is
		// waiting in cyclePending and is about to begin; if nothing was, there
		// is nothing left and the cycle stops below.
		// (comment by Claude)
		endLoops(breakIds, false);
		breakIds = [];
	}
	retireUnownedClips();
	for (let id in cyclePending) {
		cycleLoops[id] = cyclePending[id];
		delete cyclePending[id];
	}
	for (let id in cycleLoops) {
		if (cycleLoops[id].endAfterCycle) {
			retireMember(cycleLoops[id]);
			delete cycleLoops[id];
		}
	}
	/*
	Counted before the length check, so that a clip holding nothing still gets
	a pass and can be retired when nobody else wants it. An empty clip makes
	the cycle length zero and stops the cycle, and a clip that never counts a
	pass is never retired.

	(comment by Claude)
	*/
	for (let i = 0; i < playingClips.length; i++) {
		playingClips[i].passes++;
	}
	/*
	The intro flag advances here, at the boundary, not when the intro pass was
	scheduled -- lengths must hold still for the whole pass they were computed
	for, or anything reconstructing the running cycle from them is wrong.
	*/
	for (let id in cycleLoops) {
		if (cycleLoops[id].introScheduled) {
			cycleLoops[id].introDone = true;
		}
	}
	let len = cycleLengthSeconds();
	if (len <= 0) {
		cycleRunning = false;
		cycleTimer = null;
		return;
	}
	for (let id in cycleLoops) {
		let loop = cycleLoops[id];
		// A member that brings its own way of starting -- midi does, and
		// schedules messages rather than making a sound.
		// (comment by Claude)
		if (loop.start) {
			if (!loop.paused && !loop.muted) loop.start(startTime, len);
			continue;
		}
		// Muting is not pausing. A loop can be both, and comes back only when
		// neither says so, so un-pausing must not undo a mute.
		if (loop.paused || loop.muted) continue;
		// still opening its device, or the device would not open. Either way
		// there is nowhere to play it this pass
		// (comment by Claude)
		if (!loop.output) continue;
		if (!channelExistsOn(loop.output, loop.channel)) continue;
		// the same moment, said in this device's own clock
		// (comment by Claude)
		let at = outputTimeFor(loop.output, startTime);
		let node = getSourceFromBuffer(loop.buffer, true, loop.loopStartSeconds,
				loop.output);
		node.connect(loop.output.merger, 0, loop.channel);
		// the pass after the intro has played starts at the loop point, and
		// every pass wraps back to it
		node.start(at, loop.introDone ? loop.loopStartSeconds || 0 : 0);
		node.stop(at + len);
		if (!loop.introDone) loop.introScheduled = true;
		loop.node = node;
	}
	cycleStartedAt = startTime;
	/*
	After the loops for this pass are scheduled, so that anything doing this is
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
			+ ' wakeIn=' + wakeIn.toFixed(1) + 'ms'
			+ (cycleTimer ? ' (a timer was already pending!)' : ''));
	cycleTimer = window.setTimeout(function() {
		cycleLog('timer fired for boundary ' + nextBoundary.toFixed(4));
		startCycleAt(nextBoundary);
	}, wakeIn > 0 ? wakeIn : 0);
}

/*
Runs fn when the next cycle starts -- the same boundary at which anything
queued right now begins to sound. With nothing playing there is no boundary to
wait for and the caller is about to start one, so this still lands on the first
beat of what it starts.

(comment by Claude)
*/
/*
When the pass now playing began. Asked for by the punch-in recording, which has
to know where the downbeat was in the clock the samples are arriving on -- and
which should not be reading a variable out of here to find out.

(comment by Claude)
*/
function currentCycleStart() {
	return cycleStartedAt;
}

function atNextCycleStart(fn) {
	doAtNextCycleStart.push(fn);
}

/*
Takes the floor. Everything playing stops here rather than at some later
boundary -- a break that let the old loop finish underneath it would not be a
break -- and the clips are ended, so the document shows what you can hear.

The break is put straight into cycleLoops rather than into cyclePending,
because it is starting now, at this boundary, not at the next one.

(comment by Claude)
*/
function beginBreak() {
	let ids = [];
	for (let id in cycleLoops) ids.push(id);
	for (let id in cyclePending) ids.push(id);
	endLoops(ids, false);
	while (playingClips.length > 0) {
		playingClips[0].clip.end(false);
		releaseClip(0);
	}
	breakIds = [];
	for (let i = 0; i < pendingBreak.channels.length; i++) {
		let id = nextCycleLoopId++;
		cycleLoops[id] = {
			buffer: pendingBreak.buffer,
			channel: pendingBreak.channels[i],
			lengthSeconds: pendingBreak.buffer.length / SAMPLE_RATE,
			loopStartSeconds: pendingBreak.loopStartSeconds || 0,
			introDone: false,
			node: null,
			endAfterCycle: false,
			outputKey: pendingBreak.outputKey,
			output: outputs[pendingBreak.outputKey] || outputs[DEFAULT_OUTPUT_KEY]
		};
		breakIds.push(id);
	}
	pendingBreak = null;
}

/*
Queues a break for the next boundary. With nothing playing there is no boundary
to wait for, so it starts one, and the break is simply a sample played once.

(comment by Claude)
*/
function queueBreak(buffer, channels, loopStartSeconds, deviceId) {
	maybeCreateAudioContext();
	pendingBreak = {
		buffer: buffer,
		channels: channels,
		loopStartSeconds: loopStartSeconds || 0,
		outputKey: outputKeyFor(deviceId === undefined ? getDefaultOutputDevice() : deviceId)
	};
	if (!cycleRunning) {
		cycleRunning = true;
		whenAudioClockIsReady(function() {
			startCycleAt(ctx.currentTime);
		});
	}
}

/*
Joins the cycle. Returns an id.

The first loop starts immediately, since there is no cycle to wait for. Later
ones wait for the boundary, which is what keeps everything in phase.

(comment by Claude)
*/
function addLoop(buffer, channel, loopStartSeconds, deviceId, deviceName) {
	maybeCreateAudioContext();
	return addCycleMember({
		buffer: buffer,
		channel: channel,
		lengthSeconds: buffer.length / SAMPLE_RATE,
		loopStartSeconds: loopStartSeconds || 0,
		introDone: false,
		node: null,
		outputKey: outputKeyFor(deviceId),
		outputName: deviceName || ''
	});
}

/*
Anything with a length can join the cycle. An audio loop brings a buffer and a
channel; a midi sequence brings start and stop functions instead, and schedules
messages rather than making a sound.

(comment by Claude)
*/
function addCycleMember(loop) {
	maybeCreateAudioContext();
	let id = nextCycleLoopId++;
	loop.endAfterCycle = false;
	/*
	Which device this one plays on. Already open nearly always -- choosing a
	device opens it -- and when it is not, the member sits in the cycle without
	an output until it is, and starts at the first boundary after that. Being
	one boundary late the very first time you play on a device you have not
	named before is better than making play wait for a device to open.

	(comment by Claude)
	*/
	if (loop.outputKey !== undefined) {
		let open = outputs[loop.outputKey];
		if (open) {
			loop.output = open;
		} else {
			openOutputFor(loop.outputKey, loop.outputName, function(o, err) {
				if (o) {
					loop.output = o;
					return;
				}
				/*
				No such device -- a document saved on another machine, or an
				interface that is not plugged in. Taken out of the cycle rather
				than left in it: a member with no output is never played, but it
				still has a length, and the cycle is as long as its longest
				member. A clip from somewhere else would silently decide how long
				every bar was.

				(comment by Claude)
				*/
				console.log('vodka: could not open that audio output: ' + err);
				delete cyclePending[id];
				delete cycleLoops[id];
			});
		}
	} else {
		loop.output = outputs[DEFAULT_OUTPUT_KEY];
	}
	cyclePending[id] = loop;
	/*
	Starting is deferred by a microtask so that everything added in one go
	starts together.

	play adds one loop per channel, one at a time. Starting the cycle as
	soon as the first arrived meant the second was already too late for it and
	waited for the next boundary -- so a stereo pair played left only for its
	first time round, then both from then on.

	(comment by Claude)
	*/
	if (!cycleRunning) {
		cycleRunning = true;
		whenAudioClockIsReady(function() {
			startCycleAt(ctx.currentTime);
		});
	}
	return id;
}

/*
Where a running loop is, for the counter on a clip. Reckoned the same way the
audition player does it, and like that one it is a readout rather than anything
to synchronise against. -1 when the loop is not running.
*/
/*
Whether a loop is still one of ours, which is not the same question as where it
is. A loop waiting for the next boundary has no position yet but has not gone
anywhere, and a clip that could not tell those apart would give up watching a
loop that has not started.

(comment by Claude)
*/
function loopExists(id) {
	return !!(cycleLoops[id] || cyclePending[id]);
}

/*
Waiting for the boundary: joined the cycle, not yet sounding. Everything added
in one go joins in one go, so the first id answers for all of them.

(comment by Claude)
*/
function loopsAreQueued(ids) {
	for (let i = 0; i < ids.length; i++) {
		if (cycleLoops[ids[i]]) return false;
		if (cyclePending[ids[i]]) return true;
	}
	return false;
}

function getLoopPositionSamples(id) {
	if (!ctx) return -1;
	let loop = cycleLoops[id];
	if (!loop || !loop.lengthSeconds) return -1;
	/*
	From when this pass began, which is remembered, rather than worked back from
	the next boundary minus the cycle length. Those agree only while a boundary
	cannot move, which is about to stop being true -- and the subtraction was
	already wrong for the pass in which a member joins or leaves, since the
	length is recomputed at the boundary.

	(comment by Claude)
	*/
	let elapsed = ctx.currentTime - cycleStartedAt;
	if (elapsed < 0) return -1;
	let len = memberLengthSeconds(loop);
	// after the intro every pass lives in the loop region, so the readout
	// points there
	let offset = (loop.introDone && loop.loopStartSeconds > 0) ? loop.loopStartSeconds : 0;
	return Math.floor((offset + (elapsed % len)) * SAMPLE_RATE);
}

/*
A paused loop keeps its place in the cycle and its length, so it is still what
the cycle is measured against and it comes back in phase rather than starting a
new bar of its own. It simply is not scheduled while it is paused.
*/
function pauseLoops(ids, paused) {
	let found = false;
	for (let i = 0; i < ids.length; i++) {
		let loop = cycleLoops[ids[i]] || cyclePending[ids[i]];
		if (!loop) continue;
		found = true;
		loop.paused = paused;
		if (paused) {
			if (loop.stop) loop.stop();
			if (loop.node) {
				try { loop.node.stop(); } catch (e) {}
				loop.node.disconnect();
				loop.node = null;
			}
		}
	}
	return found;
}

// playing means in the cycle and not paused -- a clip whose loops have gone is
// not playing either
/*
Silences the loops a clip owns without taking them out of the cycle, so they
come back in phase. Independent of pausing on purpose: a clip can be both, and
stops being silent only when neither says so.

Muting cuts the sound off where it is. Unmuting waits for the loop to come back
round to its own beginning, the same as unpausing: a loop that started again in
the middle of a bar would be out of time with everything else.
*/
/*
When a loop next comes back round to its own beginning.

The cycle is as long as the longest loop, and a shorter one repeats inside that
-- a four count loop in a six count cycle starts again at four. Its own
boundaries are what matter for muting it: a four count loop told to stop should
stop after four, not wait for the six. They are measured from the top of the
cycle, because that is where every loop is started.

Never returns the moment it is asked about, so a loop is always allowed to
finish the repeat it is in the middle of.

The answer can land past the end of the cycle, and for a loop whose length does
not divide the cycle it usually does -- the four count loop's next own boundary
after count five is eight, and the cycle ends at six. The caller compares
against the cycle boundary; the node stops there regardless.
*/
function nextOwnBoundary(loop, after) {
	let len = memberLengthSeconds(loop);
	if (!(len > 0)) {
		return cycleNextBoundaryTime;
	}
	let elapsed = after - cycleStartedAt;
	let n = Math.floor(elapsed / len) + 1;
	return cycleStartedAt + n * len;
}

function muteLoops(ids, muted) {
	let found = false;
	for (let i = 0; i < ids.length; i++) {
		let loop = cycleLoops[ids[i]] || cyclePending[ids[i]];
		if (!loop) continue;
		found = true;
		let was = loop.muted;
		loop.muted = muted;

		// Not skipped when the flag was already set: asking again still has to
		// cut off whatever is sounding.
		// (comment by Claude)
		if (muted) {
			if (loop.stop) loop.stop();
			if (loop.node) {
				try { loop.node.stop(); } catch (e) {}
				loop.node.disconnect();
				loop.node = null;
			}
			continue;
		}
		/*
		Unmuting, and the same boundary decides when: the loop comes back where
		it would have come back anyway, in phase with itself. If that is still
		inside this pass it is started for the rest of the pass; if not, the
		next pass starts it in the ordinary way.
		*/
		if (!was) continue;
		if (!loop.start && !loop.node && cycleRunning
				&& channelExistsOn(loop.output, loop.channel)) {
			let at = nextOwnBoundary(loop, ctx.currentTime);
			if (at < cycleNextBoundaryTime) {
				let node = getSourceFromBuffer(loop.buffer, true, loop.loopStartSeconds,
						loop.output);
				node.connect(loop.output.merger, 0, loop.channel);
				node.start(outputTimeFor(loop.output, at),
						loop.introDone ? loop.loopStartSeconds || 0 : 0);
				node.stop(outputTimeFor(loop.output, cycleNextBoundaryTime));
				if (!loop.introDone) loop.introScheduled = true;
				loop.node = node;
			}
		}
	}
	return found;
}

function loopsArePlaying(ids) {
	for (let i = 0; i < ids.length; i++) {
		let loop = cycleLoops[ids[i]] || cyclePending[ids[i]];
		if (loop && !loop.paused) return true;
	}
	return false;
}

function togglePauseLoops(ids) {
	return pauseLoops(ids, loopsArePlaying(ids));
}

// A member that keeps its own records -- midi does -- gets told when it leaves
// the cycle, so nothing has to hold on to it after that.
// (comment by Claude)
function retireMember(loop) {
	if (loop && loop.retired) loop.retired();
}

function endLoops(ids, atCycleEnd) {
	for (let i = 0; i < ids.length; i++) {
		let id = ids[i];
		let loop = cycleLoops[id] || cyclePending[id];
		if (!loop) continue;
		if (atCycleEnd) {
			loop.endAfterCycle = true;
		} else {
			if (loop.stop) loop.stop();
			if (loop.node) {
				try { loop.node.stop(); } catch (e) {}
				loop.node.disconnect();
			}
			retireMember(loop);
			delete cycleLoops[id];
			delete cyclePending[id];
		}
	}
}

function endAllLoops() {
	let ids = [];
	for (let id in cycleLoops) ids.push(id);
	for (let id in cyclePending) ids.push(id);
	endLoops(ids, false);
	// nothing is going to reach another boundary, so let go of the clips here
	// rather than leaving the audio system owning them forever
	while (playingClips.length > 0) {
		playingClips[0].clip.end(false);
		releaseClip(0);
	}
	if (cycleTimer) {
		window.clearTimeout(cycleTimer);
		cycleTimer = null;
	}
	cycleRunning = false;
	// a break that was queued or playing is over too -- stopping everything
	// means everything, and leaving either of these set would have the next
	// cycle open by tidying up after a break that is long gone
	// (comment by Claude)
	pendingBreak = null;
	breakIds = [];
	// and anything that was waiting for a downbeat that is not going to come
	// (comment by Claude)
	doAtNextCycleStart = [];
}


// When the next cycle begins, in ctx.currentTime, and how long a cycle is.
// This is what midi aligns to.
// (comment by Claude)
function nextCycleBoundary() {
	return { at: cycleNextBoundaryTime, lengthSeconds: cycleLengthSeconds() };
}

function loopPlay(buffer, channelList, loopStartSeconds, deviceId, deviceName) {
	maybeCreateAudioContext();
	let ids = [];
	for (let i = 0; i < channelList.length; i++) {
		ids.push(addLoop(buffer, channelList[i], loopStartSeconds, deviceId, deviceName));
	}
	return ids;
}

// we don't need to stop nicely at end of loop
// because user can do that by putting in a gain(0, ...) or something
// this is for abort/free resources/etc.
/*
Stops what is playing on a channel, now rather than at a boundary.

It used to look in channelPlayers, which was a list of OneshotPlayer and
LoopingPlayer objects -- classes nothing had constructed since playback moved
into the cycle. So the list was always empty and this builtin had quietly done
nothing at all for however long that has been true. The classes are gone and
this asks the cycle, which is where the sound is.

(comment by Claude)
*/
function abortPlayback(channel) {
	let ids = [];
	for (let id in cycleLoops) {
		if (channel == -1 || cycleLoops[id].channel == channel) ids.push(id);
	}
	for (let id in cyclePending) {
		if (channel == -1 || cyclePending[id].channel == channel) ids.push(id);
	}
	endLoops(ids, false);
}

export {
	CYCLE_LOOKAHEAD_SECONDS,
	cycleLengthSeconds,
	anyLoopsPlaying,
	clipStartedPlaying,
	startCycleAt,
	atNextCycleStart,
	currentCycleStart,
	queueBreak,
	addLoop,
	addCycleMember,
	loopExists,
	loopsAreQueued,
	getLoopPositionSamples,
	pauseLoops,
	muteLoops,
	loopsArePlaying,
	togglePauseLoops,
	endLoops,
	endAllLoops,
	nextCycleBoundary,
	loopPlay,
	abortPlayback
}
