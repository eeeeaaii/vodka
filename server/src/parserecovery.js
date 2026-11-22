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
import { parse } from './nexparser2.js';

/*
When part of a saved document doesn't parse, the rest of it should still load.

The parser stops at the first thing it can't read, and pegjs has no way to skip
past it. So we do it from the outside: find the smallest list in the text that
contains the spot the parser stopped at, swap that whole list for an error nex
holding the parser's message and the list's original text, and parse again.
Repeat until it parses. When the list around the spot is the whole document,
only the atom at the spot is swapped out instead.

A close bracket that is missing or the wrong kind is the exception: there the
close the parser wanted is put in (or swapped in) where it stopped, with an
error in front of it saying so.

Finding lists only needs brackets. Parens only ever show up as list brackets,
except inside private data ("..." or {...}) and tags (`...`), which are skipped.
In {...} anything after a | is skipped too, which is lenient on purpose: it is
how a |{ that an older parser could not read gets stepped over.

(comment by Claude)
*/

const MAX_REPAIRS = 50;

function isSpace(c) {
	return c == ' ' || c == '\t' || c == '\n' || c == '\r';
}

// Index just past the private data or tag that starts at i.
// (comment by Claude)
function skipQuoted(text, i) {
	let c = text[i];
	if (c == '"' || c == '`') {
		let end = text.indexOf(c, i + 1);
		return end < 0 ? text.length : end + 1;
	}
	// {...}, where | escapes the character after it
	// (comment by Claude)
	i++;
	while (i < text.length) {
		if (text[i] == '|') {
			i += 2;
		} else if (text[i] == '}') {
			return i + 1;
		} else {
			i++;
		}
	}
	return text.length;
}

function skipTagList(text, i) {
	// i is at the <
	// (comment by Claude)
	i++;
	while (i < text.length && text[i] != '>') {
		i = (text[i] == '`') ? skipQuoted(text, i) : i + 1;
	}
	return i + 1;
}

/*
The innermost list around offset, as {start, end}: start is where its nex
begins (sigil, name, private data), end is just past its closing paren. Null
when there isn't one, or when the list never closes.

(comment by Claude)
*/
function listAround(text, offset) {
	let stack = [];
	let found = null;
	let tokenStart = null;
	let i = text.indexOf(':') + 1;  // past v2:
	while (i < text.length) {
		if (found == null && i >= offset) {
			if (stack.length == 0) return null;
			found = stack.length;
		}
		let c = text[i];
		if (isSpace(c)) {
			tokenStart = null;
			i++;
		} else if (c == '"' || c == '`' || c == '{') {
			if (tokenStart == null) tokenStart = i;
			i = skipQuoted(text, i);
		} else if (c == '(') {
			stack.push(tokenStart == null ? i : tokenStart);
			tokenStart = null;
			i++;
			if (text[i] == '_' || text[i] == '|' || text[i] == ',') i++;
			// tags right after the bracket belong to this list, not the first child
			// (comment by Claude)
			if (text[i] == '<') i = skipTagList(text, i);
		} else if (c == ')') {
			let start = stack.pop();
			tokenStart = null;
			i++;
			if (found != null && stack.length == found - 1) {
				return { start: start, end: i };
			}
		} else {
			if (tokenStart == null) tokenStart = i;
			i++;
		}
	}
	return null;
}

/*
The single atom at offset, as {start, end}, for when the list around it is the
whole document. Null if offset is not in an atom.

(comment by Claude)
*/
function atomAround(text, offset) {
	let tokenStart = null;
	let i = text.indexOf(':') + 1;  // past v2:
	while (i < text.length && i < offset) {
		let c = text[i];
		if (isSpace(c) || c == '(' || c == ')') {
			tokenStart = null;
			i++;
		} else {
			if (tokenStart == null) tokenStart = i;
			i = (c == '"' || c == '`' || c == '{') ? skipQuoted(text, i) : i + 1;
		}
	}
	let start = (tokenStart == null) ? offset : tokenStart;
	while (i < text.length) {
		let c = text[i];
		if (c == '(') return null;
		if (isSpace(c)) break;
		if (c == ')') {
			// the _ | or , in front of a ) is the list's, not the atom's
			// (comment by Claude)
			if (i - 1 > start && '_|,'.indexOf(text[i - 1]) >= 0) i--;
			break;
		}
		i = (c == '"' || c == '`' || c == '{') ? skipQuoted(text, i) : i + 1;
	}
	return (i > start) ? { start: start, end: i } : null;
}

const CLOSES = [ '_)', '|)', ',)', ')' ];

/*
When the parser stopped because it wanted a list to close, the close it wanted.
That is when it found the close of some other kind of list, or ran out of text.
Null otherwise.

(comment by Claude)
*/
function missingClose(text, err) {
	let wanted = (err.expected || []).filter(function(x) {
		return x.type == 'literal' && CLOSES.indexOf(x.text) >= 0;
	});
	if (wanted.length == 0) return null;
	let offset = err.location.start.offset;
	let atEnd = offset >= text.length;
	let atClose = CLOSES.some(function(c) { return text.substring(offset, offset + c.length) == c; });
	if (!atEnd && !atClose) return null;
	return wanted[0].text;
}

function escapePrivateData(s) {
	return s.replace(/\|/g, '||').replace(/\}/g, '|}').replace(/\{/g, '|{');
}

function errorText(message) {
	return '?{' + escapePrivateData('0|' + message) + '}';
}

function tryParse(text) {
	try {
		return { result: parse(text) };
	} catch (e) {
		if (!isSyntaxError(e)) throw e;
		return { err: e };
	}
}

function isSyntaxError(e) {
	return e && e.location && e.location.start && typeof e.location.start.offset == 'number';
}

/*
Parses like parse(), but when a piece of the text is unreadable, that piece
comes back as an error nex in the tree instead of the whole thing failing.
Throws the original error when nothing can be saved.

(comment by Claude)
*/
function parseWithRecovery(text) {
	try {
		return parse(text);
	} catch (e) {
		if (!isSyntaxError(e)) throw e;
		let firstError = e;
		let current = text;
		let err = e;
		for (let n = 0; n < MAX_REPAIRS; n++) {
			let close = missingClose(current, err);
			if (close) {
				/*
				Either a close is missing, or the one there is the wrong kind. Try
				both and keep whichever gets further.
				(comment by Claude)
				*/
				let offset = err.location.start.offset;
				let candidates = [ current.substring(0, offset)
						+ ' ' + errorText('A ' + close + ' was missing here, so one was added. '
							+ 'The parser only notices this at the next close bracket, so the '
							+ 'real gap may be earlier, and the things since then may have ended '
							+ 'up in this list when they belong outside it.')
						+ close + current.substring(offset) ];
				let found = CLOSES.find(function(c) { return current.substring(offset, offset + c.length) == c; });
				if (found) {
					candidates.push(current.substring(0, offset)
							+ ' ' + errorText('This list was closed with ' + found + ' but it needs '
								+ close + ', so it was changed.')
							+ close + current.substring(offset + found.length));
				}
				let best = null;
				for (let k = 0; k < candidates.length; k++) {
					let attempt = tryParse(candidates[k]);
					if (attempt.result) {
						console.log('vodka: loaded with ' + (n + 1) + ' repair(s).');
						return attempt.result;
					}
					// how far it got, in the text as it was before the repair
					// (comment by Claude)
					let reached = attempt.err.location.start.offset - (candidates[k].length - current.length);
					if (!best || reached > best.reached) {
						best = { text: candidates[k], err: attempt.err, reached: reached };
					}
				}
				current = best.text;
				err = best.err;
				continue;
			}
			let span = listAround(current, err.location.start.offset);
			let docStart = current.indexOf(':') + 1;
			while (docStart < current.length && isSpace(current[docStart])) docStart++;
			if (span && span.start <= docStart) {
				span = atomAround(current, err.location.start.offset);
			}
			if (!span) throw firstError;
			let original = current.substring(span.start, span.end);
			let at = err.location.start.offset - span.start;
			let message = 'This part of the file could not be read, so it was replaced by this error. '
					+ 'Its original text is below.\n'
					+ err.message + ' (at character ' + at + ' of the text below)\n\n'
					+ original;
			current = current.substring(0, span.start)
					+ errorText(message)
					+ current.substring(span.end);
			try {
				let result = parse(current);
				console.log('vodka: loaded with ' + (n + 1) + ' unreadable part(s) replaced by errors.');
				return result;
			} catch (e2) {
				if (!isSyntaxError(e2)) throw e2;
				err = e2;
			}
		}
		throw firstError;
	}
}

export { parseWithRecovery, listAround, atomAround }
