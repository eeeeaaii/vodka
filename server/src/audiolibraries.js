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
list-audio and load-audio are one pair of builtins over two libraries -- the
sampled instruments in sounds/, and the single-cycle waveforms in waves/ --
and which one you get is said with a tag on the command:

	list-audio                       both libraries, one org each
	list-audio <`wave`>              the wavetable library
	list-audio <`wave` `metallic`>   one folder of it
	list-audio <`metallic`>          an error, see below

A folder tag on its own is refused rather than searched for. Both libraries
have folders, the names do not overlap today but nothing stops them from
overlapping tomorrow, and a command that quietly changes which library it
reads when someone adds a folder is worse than one that asks to be told. So
the library tag is required as soon as you name a folder.

Plurals are accepted because `waves` is what the directory is called and it is
the obvious thing to type.
*/

const LIBRARIES = {
	'sample': 'sample',
	'samples': 'sample',
	'wave': 'wave',
	'waves': 'wave',
};

const DEFAULT_LIBRARY = 'sample';


/*
Returns { library, folders } or { error }. Anything that is not a library name
is taken to be a folder name; whether that folder exists can only be answered
by the listing, so it is checked later, by the caller that has one.

library is null when no library was named, which is a question the caller
answers rather than this one: listing with no library means both of them,
loading with no library means the default, and neither is a good default for
the other.
*/
function readAudioTags(commandTags) {
	let library = null;
	let folders = [];
	for (let i = 0; commandTags && i < commandTags.length; i++) {
		let tag = commandTags[i].getTagString();
		if (LIBRARIES[tag]) {
			if (library && library != LIBRARIES[tag]) {
				return { error: `tagged with both ${library} and ${LIBRARIES[tag]}, pick one` };
			}
			library = LIBRARIES[tag];
		} else {
			folders.push(tag);
		}
	}
	if (!library && folders.length > 0) {
		return { error: `${folders[0]} is a folder, not a library -- also tag this
				with sample or wave to say which library it is in`.replace(/\s+/g, ' ') };
	}
	return { library: library, folders: folders };
}

/*
A name from list-audio carries its library at the front -- wave/metallic/x.wav
-- so that one string says everything about where a sound is and load-audio
needs nothing else. Returns { library, path } when the name starts with a
library, and null when it does not, which is how a bare folder/file name from
a folder-tagged call still works.
*/
function splitLibraryFromPath(fname) {
	let at = fname.indexOf('/');
	if (at < 1) {
		return null;
	}
	let head = fname.substring(0, at);
	if (!LIBRARIES[head]) {
		return null;
	}
	return { library: LIBRARIES[head], path: fname.substring(at + 1) };
}

/*
The same rule the rename tool applies to the library on disk, applied to a name
on its way in. Documents written before the rename ask for "SB-003/Drop
Synth.wav" and there is no reason to make them wrong -- that names exactly one
file, and it is the file now called Drop_Synth.wav.

Per segment, because the slashes are structure rather than part of any name.
*/
function normalizeAudioName(fname) {
	let ext = '';
	if (fname.toLowerCase().endsWith('.wav')) {
		ext = fname.substring(fname.length - 4);
		fname = fname.substring(0, fname.length - 4);
	}
	let parts = fname.split('/').map(function(part) {
		return part.replace(/[()]/g, ' ')
				.replace(/[^A-Za-z0-9_-]/g, '_')
				.replace(/_+/g, '_')
				.replace(/^_|_$/g, '');
	});
	return parts.join('/') + ext;
}

/*
list-audio hands back names with no extension on them, and a name typed by hand
may well have one. Both say the same file, and the file on disk has the
extension, so this is where it goes back on.
*/
function withWavExtension(fname) {
	return fname.toLowerCase().endsWith('.wav') ? fname : fname + '.wav';
}

function libraryNames() {
	return ['sample', 'wave'];
}

export { readAudioTags, splitLibraryFromPath, libraryNames, normalizeAudioName,
		withWavExtension, DEFAULT_LIBRARY }
