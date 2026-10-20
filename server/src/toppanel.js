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

/*
THE TOP PANEL

A strip across the top of the window, opened from the caret in the status bar,
showing what is playing. The panel only sets a class on <html>; the stylesheet
turns that into --top-panel-h, and everything at the top of the window moves
by it (see vodka.css).

(comment by Claude)
*/

import { ctx, outputs, SAMPLE_RATE, outputKeyFor, getDefaultOutputDevice, channelExistsOn } from './audiodevices.js'
import { playingTracks, currentCycleBounds, memberOffsetAt } from './transport.js'
import { onPlaybackFrame } from './playbackloop.js'
import { drawWaveSamples, drawClippingLines } from './wavedrawing.js'

const STORAGE_KEY = 'vodka-top-panel-open';
// the wave's height inside the panel: 100 less the border
// (comment by Claude)
const WAVE_HEIGHT = 98;

let panel = null;
let canvas = null;
let playhead = null;
let open = false;
let stopFollowing = null;

// what is drawn now, and what it was drawn from
let shown = null;
let shownSignature = null;
let rebuildPending = false;
let needsRedraw = false;

function ensurePanel() {
	if (panel) return;
	panel = document.createElement('div');
	panel.id = 'toppanel';
	let wave = document.createElement('div');
	wave.classList.add('toppanelwave');
	canvas = document.createElement('canvas');
	playhead = document.createElement('div');
	playhead.classList.add('toppanelplayhead');
	wave.appendChild(canvas);
	wave.appendChild(playhead);
	panel.appendChild(wave);
	document.body.appendChild(panel);
}

function remember(v) {
	try {
		localStorage.setItem(STORAGE_KEY, v ? '1' : '0');
	} catch (e) {}
}

function remembered() {
	try {
		return localStorage.getItem(STORAGE_KEY) == '1';
	} catch (e) {
		return false;
	}
}

/*
What is on channel 1 of the main output. Not midi (no buffer), not a muted
track, not a track still waiting for the boundary -- the members of a track are
what is sounding, its pending material is not heard yet.

(comment by Claude)
*/
function channelOneMembers() {
	let main = outputs[outputKeyFor(getDefaultOutputDevice())];
	let r = [];
	if (!main) return r;
	let tracks = playingTracks();
	for (let i = 0; i < tracks.length; i++) {
		let t = tracks[i];
		if (t.muted) continue;
		for (let j = 0; j < t.members.length; j++) {
			let m = t.members[j];
			if (!m.buffer || m.channel !== 0 || m.output !== main) continue;
			if (!channelExistsOn(m.output, m.channel)) continue;
			r.push({ track: t, member: m });
		}
	}
	return r;
}

/*
Cheap enough to work out every frame, and different whenever the picture would
be: a member joining or leaving, a mute, an intro finishing, a stop brought
forward, the boundary moving.

(comment by Claude)
*/
let ids = new WeakMap();
let nextId = 1;
function idOf(o) {
	if (!ids.has(o)) ids.set(o, nextId++);
	return ids.get(o);
}

function signature(bounds, members) {
	let s = bounds.start + ':' + bounds.end;
	for (let i = 0; i < members.length; i++) {
		let { track, member } = members[i];
		s += '|' + idOf(member) + (member.introDone ? 'i' : '')
				+ (track.stopAtBoundary && track.cutAt ? '@' + track.cutAt : '');
	}
	return s;
}

/*
The pass, summed: every member laid out the way the looping source plays it,
from where it starts in its buffer, round its loop region, and silent after a
stop that was brought forward.

(comment by Claude)
*/
function sumPass(bounds, members) {
	let n = Math.max(0, Math.round((bounds.end - bounds.start) * SAMPLE_RATE));
	let sum = new Float32Array(n);
	for (let k = 0; k < members.length; k++) {
		let { track, member } = members[k];
		let data = member.buffer.getChannelData(0);
		let len = data.length;
		let loopS = Math.round((member.loopStartSeconds || 0) * SAMPLE_RATE);
		let first = memberOffsetAt(member, 0);
		if (first < 0 || len == 0) continue;
		let idx = Math.round(first * SAMPLE_RATE);
		let until = n;
		if (track.stopAtBoundary && track.cutAt > bounds.start && track.cutAt < bounds.end) {
			until = Math.round((track.cutAt - bounds.start) * SAMPLE_RATE);
		}
		for (let i = 0; i < until; i++) {
			if (idx >= len) {
				if (loopS >= len) break;
				idx = loopS;
			}
			sum[i] += data[idx++];
		}
	}
	return sum;
}

function themeColor(name) {
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/*
Drawn the way a wave in the document is drawn, by the same code, stretched to
the width of the window: a hundred sample loop is a hundred wide boxes.
Scaled the same way too -- full scale reaches the edges, and a sum louder than
that is shrunk to fit and gets the dashed clipping lines.

(comment by Claude)
*/
function draw() {
	needsRedraw = false;
	let width = canvas.clientWidth;
	let height = WAVE_HEIGHT;
	let dpr = window.devicePixelRatio || 1;
	canvas.width = Math.round(width * dpr);
	canvas.height = Math.round(height * dpr);
	let c = canvas.getContext('2d');
	c.setTransform(dpr, 0, 0, dpr, 0, 0);
	c.clearRect(0, 0, width, height);
	if (!shown || shown.data.length == 0) return;
	let data = shown.data;
	let peak = 0;
	for (let i = 0; i < data.length; i++) {
		let a = Math.abs(data[i]);
		if (a > peak) peak = a;
	}
	let view = {
		data: data,
		width: width,
		height: height,
		origin: 0,
		pps: width / data.length,
		heightFullScale: height / 2 / Math.max(peak, 1),
		colors: {
			regular: themeColor('--wave-regular'),
			intense: themeColor('--wave-intense'),
			audition: themeColor('--wave-audition'),
			solid: themeColor('--wave-solid')
		},
		exactColumns: true
	};
	let clips = drawWaveSamples(c, view);
	drawClippingLines(c, view, clips, themeColor('--wave-clipping'));
}

function whenIdle(fn) {
	if (window.requestIdleCallback) {
		window.requestIdleCallback(fn, { timeout: 500 });
	} else {
		setTimeout(fn, 0);
	}
}

/*
Every frame: has the picture changed, and where is the playhead. The summing
and drawing wait for an idle moment, never inside the frame, so this can never
be the reason a pass is scheduled late. The old picture stays until then.

A pass is announced a little before it is heard, so one that has not started
yet keeps the last one showing.

(comment by Claude)
*/
function follow() {
	if (!ctx) {
		showNothing();
		return;
	}
	let bounds = currentCycleBounds();
	let now = ctx.currentTime;
	let members = bounds.running ? channelOneMembers() : [];
	if (members.length == 0) {
		showNothing();
		return;
	}
	if (now >= bounds.start) {
		let sig = signature(bounds, members);
		if (sig != shownSignature && !rebuildPending) {
			rebuildPending = true;
			whenIdle(function() {
				rebuildPending = false;
				let b = currentCycleBounds();
				// the next pass was announced while this waited: try again
				// once it is the one playing
				// (comment by Claude)
				if (!ctx || ctx.currentTime < b.start) return;
				let m = channelOneMembers();
				shown = { data: sumPass(b, m), start: b.start, end: b.end };
				shownSignature = signature(b, m);
				draw();
			});
		}
	}
	if (needsRedraw) draw();
	placePlayhead(now);
}

function showNothing() {
	if (shown) {
		shown = null;
		shownSignature = null;
		draw();
	}
	playhead.classList.remove('showing');
}

function placePlayhead(now) {
	if (!shown || !(shown.end > shown.start)) {
		playhead.classList.remove('showing');
		return;
	}
	let at = (now - shown.start) / (shown.end - shown.start);
	if (at < 0 || at > 1) {
		playhead.classList.remove('showing');
		return;
	}
	playhead.style.transform = 'translateX(' + Math.round(at * canvas.clientWidth) + 'px)';
	playhead.classList.add('showing');
}

function onResize() {
	needsRedraw = true;
}

function setTopPanelOpen(v) {
	open = !!v;
	ensurePanel();
	document.documentElement.classList.toggle('toppanelopen', open);
	remember(open);
	if (open && !stopFollowing) {
		stopFollowing = onPlaybackFrame(follow);
		window.addEventListener('resize', onResize);
		needsRedraw = true;
	} else if (!open && stopFollowing) {
		stopFollowing();
		stopFollowing = null;
		window.removeEventListener('resize', onResize);
	}
}

function toggleTopPanel() {
	setTopPanelOpen(!open);
}

function isTopPanelOpen() {
	return open;
}

// opens it again if it was open when the page was last closed
function restoreTopPanel() {
	if (remembered()) setTopPanelOpen(true);
}

export { toggleTopPanel, isTopPanelOpen, restoreTopPanel }
