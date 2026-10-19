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
One animation frame loop for everything on screen that follows playback, so
each thing that moves with the sound does not start a loop of its own. It runs
while anything is listening and stops when nothing is.

onPlaybackFrame(fn) calls fn(now) every frame and returns the function that
stops it.

(comment by Claude)
*/

let listeners = [];
let frame = null;

function step(now) {
	let current = listeners.slice();
	for (let i = 0; i < current.length; i++) {
		try {
			current[i](now);
		} catch (e) {
			console.log('vodka: playback frame listener failed: ' + e);
		}
	}
	frame = listeners.length > 0 ? window.requestAnimationFrame(step) : null;
}

function onPlaybackFrame(fn) {
	listeners.push(fn);
	if (!frame) frame = window.requestAnimationFrame(step);
	return function() {
		let i = listeners.indexOf(fn);
		if (i >= 0) listeners.splice(i, 1);
	};
}

export { onPlaybackFrame }
