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
A saved file that contains audio is a container: the document text, followed by
the samples that document refers to, in one file.

Wavetables serialize as their id instead of a base64 blob, and the sample list
after the document supplies the bytes under the same ids. That is the id the
wavetable is known by everywhere its samples might be kept, so a file and
indexeddb name the same thing the same way.

Nothing unreachable gets written: only wavetables the walk actually reached ever
got the chance to hand over their samples.

The header is length-prefixed rather than delimited, so no part of the document
has to be escaped and no sentinel has to be picked that document text could
never contain:

    VODKAC1 <doclen> <id0>:<len0> <id1>:<len1> ...\n<doctext><b64 0><b64 1>...

A document with no audio in it is written with no container at all. The common
case stays byte-for-byte what earlier versions wrote, and files written before
containers existed still load, because decode() passes anything without the
magic straight through.
*/

const CONTAINER_MAGIC = 'VODKAC1';

// String.fromCharCode is applied to slices rather than the whole array: a few
// seconds of audio is a few hundred thousand samples, which is well past the
// argument-count limit.
const CHUNK = 0x8000;

class AudioCollector {
	constructor() {
		this.samples = [];
		this.ids = [];
		this.seen = {};
	}

	add(id, float32array) {
		// the same wavetable reached twice is still one wavetable
		if (this.seen[id]) return;
		this.seen[id] = true;
		this.ids.push(id);
		this.samples.push(float32array);
	}

	isEmpty() {
		return this.samples.length == 0;
	}
}

function toBase64(float32array) {
	let bytes = new Uint8Array(
			float32array.buffer, float32array.byteOffset, float32array.byteLength);
	let s = '';
	for (let i = 0; i < bytes.length; i += CHUNK) {
		s += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
	}
	return (typeof window !== 'undefined' && window.btoa)
			? window.btoa(s)
			: Buffer.from(s, 'binary').toString('base64');
}

function fromBase64(str) {
	let s = (typeof window !== 'undefined' && window.atob)
			? window.atob(str)
			: Buffer.from(str, 'base64').toString('binary');
	let bytes = new Uint8Array(s.length);
	for (let i = 0; i < s.length; i++) {
		bytes[i] = s.charCodeAt(i);
	}
	// A Float32Array needs whole samples. A truncated file would otherwise throw
	// here and take the whole load down with it.
	if (bytes.length % 4 != 0) {
		return null;
	}
	return new Float32Array(bytes.buffer);
}

function encode(docText, collector) {
	if (!collector || collector.isEmpty()) {
		return docText;
	}
	let encoded = [];
	for (let i = 0; i < collector.samples.length; i++) {
		encoded.push(toBase64(collector.samples[i]));
	}
	let header = [ CONTAINER_MAGIC, docText.length ];
	for (let i = 0; i < encoded.length; i++) {
		header.push(collector.ids[i] + ':' + encoded[i].length);
	}
	return header.join(' ') + '\n' + docText + encoded.join('');
}

/*
Returns { docText, samples } for a container, where samples maps a wavetable id
to its Float32Array. Returns null for anything else -- a plain document, a
server error string, a file from before containers existed.
Callers treat null as "parse this as-is".

A container that doesn't decode also comes back as null rather than throwing.
That gets it parsed as a document, which fails with a parse error the user can
see, instead of an exception on the way in.
*/
function decode(fileText) {
	if (typeof fileText != 'string') return null;
	if (fileText.indexOf(CONTAINER_MAGIC + ' ') != 0) return null;

	let nl = fileText.indexOf('\n');
	if (nl < 0) return null;

	let fields = fileText.substring(0, nl).split(' ');
	// the document length, then one id:length per wavetable
	let docLen = Number(fields[1]);
	if (!Number.isInteger(docLen) || docLen < 0) return null;
	let ids = [];
	let lengths = [];
	for (let i = 2; i < fields.length; i++) {
		let c = fields[i].indexOf(':');
		if (c < 0) return null;
		let n = Number(fields[i].substring(c + 1));
		if (!Number.isInteger(n) || n < 0) return null;
		ids.push(fields[i].substring(0, c));
		lengths.push(n);
	}
	if (ids.length == 0) return null;

	let total = nl + 1 + docLen;
	for (let i = 0; i < lengths.length; i++) {
		total += lengths[i];
	}
	if (total != fileText.length) return null;

	let pos = nl + 1;
	let docText = fileText.substr(pos, docLen);
	pos += docLen;

	let samples = {};
	for (let i = 0; i < lengths.length; i++) {
		samples[ids[i]] = fromBase64(fileText.substr(pos, lengths[i]));
		pos += lengths[i];
	}
	return { docText: docText, samples: samples };
}

export { AudioCollector, encode, decode }
