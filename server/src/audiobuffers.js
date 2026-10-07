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
Making the things the audio system plays: a buffer from a wave's samples, and a
source node to play one with. Both need a context and nothing else, which is
why they are not in with the devices that own the contexts.

(comment by Claude)
*/

import { ctx, SAMPLE_RATE, maybeCreateAudioContext } from './audiodevices.js'

function getAudioBufferFromData(data) {
  maybeCreateAudioContext();
	// createBuffer throws on nothing at all, and one silent frame sounds like
	// what a wave with no samples should sound like
	// (comment by Claude)
	let frames = data.length > 0 ? data.length : 1;
	let buffer = ctx.createBuffer(1, frames, SAMPLE_RATE);
	let chan = buffer.getChannelData(0);
	chan.set(data);	
	return buffer;
}

/*
Silence of a given length. createBuffer hands back a buffer that is already
zero, so a muted wave does not need an array of zeros to copy from -- which for
a long wave is megabytes whose only purpose was to be copied into this.

(comment by Claude)
*/
function getSilentAudioBuffer(frames) {
	maybeCreateAudioContext();
	return ctx.createBuffer(1, frames > 0 ? frames : 1, SAMPLE_RATE);
}

/*
An AudioBuffer is not tied to the context that made it, so one wave can be
playing on three devices at once off the same samples -- which is the whole
point of the outputs, and would be three copies of the audio otherwise.

(comment by Claude)
*/
function getSourceFromBuffer(buffer, loop, loopStartSeconds, output) {
	let source = (output ? output.ctx : ctx).createBufferSource();
	source.buffer = buffer;
	source.loop = loop;
	source.loopStart = loopStartSeconds || 0;
	source.loopEnd = buffer.length * (1 / SAMPLE_RATE);

	return source;
}

export { getAudioBufferFromData, getSilentAudioBuffer, getSourceFromBuffer }
