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
The tags vodka reads, as opposed to the ones you write for yourself.

Most tags are a label: you put one on a nex so that you can see which one it
is. A few are instructions -- `mute`, `samps`, `nocycle` -- and those are read
by the engine and change what happens. The two look the same in a document and
are not the same kind of thing at all, which is what this is for: one list, so
the renderer can tell them apart and so that adding a tag with a meaning is a
change in one place.

Here rather than in wavetablefunctions.js, where the timebase spellings used to
live, because that file imports tag.js and the tags have to be able to ask
about themselves. This imports nothing.

The vocabularies that belong to one builtin are here too -- the filter kinds,
the vowel names -- even though `a` or `low` as a label of your own will now be
marked as though it meant something. That is the wrong way round on purpose:
the question you have when you write one of these is whether you spelled it in
a way vodka will recognise, and a tag that lights up when it should not is a
smaller problem than one that silently does nothing.

(comment by Claude)
*/

function timebaseForTagString(t) {
	if (t == 'note' || t == 'nn') return 'NOTE';
	if (t == 'seconds' || t == 'second' || t == 'secs' || t == 'sec') return 'SECONDS';
	if (t == 'ms' || t == 'millis' || t == 'milliseconds') return 'MILLIS';
	if (t == 'hz' || t == 'Hz' || t == 'HZ' || t == 'cps') return 'HZ';
	if (t == 'b' || t == 'beats' || t == 'beat') return 'BEATS';
	if (t == 'samples' || t == 'samps' || t == 'samp' || t == 'sample') return 'SAMPLES';
	return null;
}

// relative timebases move a pitch instead of naming a duration. ratio is the
// multiplier itself; semitones and cents are 12ths and 1200ths of an octave.
function relativeTimebaseForTagString(t) {
	if (t == 'ratio') return 'RATIO';
	if (t == 'cents' || t == 'cent') return 'CENTS';
	if (t == 'semitones' || t == 'semitone' || t == 'semis' || t == 'semi') return 'SEMITONES';
	return null;
}

/*
Tags that mean the same thing wherever they appear, which is what makes them
worth marking. Each one is read somewhere in the builtins: nocycle by the wave
arithmetic, wrap and hann by the commands that window a wave, of-total by the
ones that take a fraction of one, and the last three by start-recording.

(comment by Claude)
*/
const INSTRUCTION_TAGS = [
	'mute',
	'nocycle',
	'wrap',
	'hann',
	'of-total',
	'unlimited',
	'punch-in',
	'punch-out'
];

// a nex you collapsed by hand carries this
// (comment by Claude)
const COLLAPSE_TAG = '\\';

/*
The kinds a filter can be, across every builtin that takes one -- not every
one of these works on every filter, but each is a real spelling somewhere, and
being told which command wants which is not a job a colour can do.

`pass` is optional on all of them: lowpass and low are the same word said two
ways, which is the rule filterKindFromTags follows.

(comment by Claude)
*/
const FILTER_KINDS = [
	'low',
	'high',
	'band',
	'notch',
	'peak',
	'lowshelf',
	'highshelf'
];

// the vowels formant knows, which are the keys of VOWEL_FORMANTS
// (comment by Claude)
const VOWELS = ['a', 'e', 'i', 'o', 'u'];

function isSpecialTagString(t) {
	if (!t) return false;
	/*
	Machinery. A tag starting with a colon -- `:docs`, `:init`,
	`::drawfunction` -- is vodka's rather than yours.

	(comment by Claude)
	*/
	if (t.charAt(0) == ':') return true;
	if (t == COLLAPSE_TAG) return true;
	if (INSTRUCTION_TAGS.indexOf(t) >= 0) return true;
	if (timebaseForTagString(t)) return true;
	if (relativeTimebaseForTagString(t)) return true;
	/*
	The builtin vocabularies, matched the way the builtins match them: trimmed
	and lowercased, and with the optional `pass` taken off a filter kind. Done
	here rather than above because the tags vodka reads everywhere are matched
	exactly -- `hz`, `Hz` and `HZ` are spellings that were chosen, and `hZ` is
	not one of them.

	(comment by Claude)
	*/
	let normalized = t.trim().toLowerCase();
	if (VOWELS.indexOf(normalized) >= 0) return true;
	let kind = normalized.endsWith('pass')
			? normalized.substring(0, normalized.length - 4)
			: normalized;
	if (FILTER_KINDS.indexOf(kind) >= 0) return true;
	return false;
}

export { timebaseForTagString, relativeTimebaseForTagString, isSpecialTagString }
