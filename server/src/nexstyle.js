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
Styles you are allowed to set, and the mark that says a style was set that way.

A nex has always been able to carry a css string, and that string went onto the
element whole, whatever it said. That is a hole in the middle of the language:
anything you can do in css you can do, so what a nex looks like stops being
something vodka knows about. Worse, it works in exploded mode too, so a style
meant for a finished interface rearranges the code that built it.

So there are two kinds of style string now. One is what the old builtin always
wrote and is left exactly as it was. The other starts with the mark below, and
for those: only the properties in ALLOWED are permitted, and they are applied
only in normal mode. The mark rides at the front of the same string so that
both kinds save, load and copy through the one field that already existed.

The mark is a css comment, so if one ever reaches an element unstripped the
browser ignores it rather than throwing the rest of the declaration away.

(comment by Claude)
*/
const STYLE_MARK = '/*new*/';

/*
The dividing line is this: a property may change how a thing looks inside the
box it already has, and may change how big that box is. It may not change where
the box is. So no position, no float, no transform, no display, no overflow, no
z-index -- those are the ones that make a drawing stop being something the
editor can reason about, because after them what you see is no longer where the
nex is.

Everything here passes that test. Colour, border, the font, the size of the
box, the space in and around it, and the few cosmetics (opacity, cursor) that
say what a thing is for. `margin` is the one to watch: a negative margin does
pull a thing over its neighbour. It is in because spacing things apart is the
whole job and the alternative is nothing.

(comment by Claude)
*/
const ALLOWED = [
	'background-color',
	'border-color',
	'border-radius',
	'border-style',
	'border-width',
	'color',
	'cursor',
	'font-family',
	'font-size',
	'font-style',
	'font-weight',
	'height',
	'letter-spacing',
	'line-height',
	'margin',
	'max-height',
	'max-width',
	'min-height',
	'min-width',
	'opacity',
	'padding',
	'text-align',
	'text-decoration',
	'width',
];

// what you may have meant, for the error message
// (comment by Claude)
const SPELLINGS = {
	'background': 'background-color',
	'bg-color': 'background-color',
	'border': 'border-width, border-color or border-style',
	'font': 'font-family or font-size',
	'text-color': 'color',
	'foreground': 'color',
	'align': 'text-align',
	'underline': 'text-decoration',
	'radius': 'border-radius',
	'corner-radius': 'border-radius',
	'padding-left': 'padding',
	'padding-right': 'padding',
	'padding-top': 'padding',
	'padding-bottom': 'padding',
	'margin-left': 'margin',
	'margin-right': 'margin',
	'margin-top': 'margin',
	'margin-bottom': 'margin',
};

function isRestrictedStyle(s) {
	return !!s && s.indexOf(STYLE_MARK) == 0;
}

/*
Splitting a style string into property and value pairs, the way a browser
would: semicolons between declarations, the first colon in each one separating
the name from the value. Empty declarations are skipped, so a trailing
semicolon is not an error.

(comment by Claude)
*/
function parseDeclarations(s) {
	let out = [];
	let parts = s.split(';');
	for (let i = 0; i < parts.length; i++) {
		let part = parts[i].trim();
		if (!part) continue;
		let colon = part.indexOf(':');
		if (colon < 0) {
			out.push({ bad: part });
			continue;
		}
		out.push({
			property: part.substring(0, colon).trim().toLowerCase(),
			value: part.substring(colon + 1).trim(),
		});
	}
	return out;
}

/*
Checking a style string, and saying what is wrong with it rather than only that
something is. Returns the css to store, or a string naming the problem.

A value is not checked beyond being there -- the browser is better at that than
anything written here would be, and a value it does not understand is a
declaration it ignores, not a hole in anything.

(comment by Claude)
*/
function checkStyle(s) {
	let declarations = parseDeclarations(s);
	if (declarations.length == 0) {
		return { css: '' };
	}
	let kept = [];
	let sawBorder = false;
	let sawBorderStyle = false;
	for (let i = 0; i < declarations.length; i++) {
		let d = declarations[i];
		if (d.bad) {
			return { problem: `"${d.bad}" is not a css declaration -- it wants`
					+ ' a property, a colon, and a value' };
		}
		if (ALLOWED.indexOf(d.property) < 0) {
			let instead = SPELLINGS[d.property]
					? `. Did you mean ${SPELLINGS[d.property]}?`
					: `. You can set: ${ALLOWED.join(', ')}`;
			return { problem: `${d.property} is not a style you can set${instead}` };
		}
		if (!d.value) {
			return { problem: `${d.property} was given no value` };
		}
		if (d.property == 'border-width' || d.property == 'border-color') {
			sawBorder = true;
		} else if (d.property == 'border-style') {
			sawBorderStyle = true;
		}
		kept.push(`${d.property}: ${d.value}`);
	}
	/*
	A border nobody can see is not a border. Css defaults border-style to none,
	so asking for a width and a colour and getting nothing is the first thing
	anybody hits; a border asked for is a border drawn.

	(comment by Claude)
	*/
	if (sawBorder && !sawBorderStyle) {
		kept.push('border-style: solid');
	}
	return { css: kept.join('; ') };
}

// the mark, then the css: one string, because that is what a nex stores
// (comment by Claude)
function markRestrictedStyle(css) {
	return STYLE_MARK + css;
}

/*
What actually goes on the element. A restricted style is a style for the
finished thing, so it is left off while you are looking at the parts.

(comment by Claude)
*/
function styleAttributeFor(s, isExploded) {
	if (!isRestrictedStyle(s)) {
		return s;
	}
	return isExploded ? '' : s.substring(STYLE_MARK.length);
}

export {
	ALLOWED,
	STYLE_MARK,
	checkStyle,
	isRestrictedStyle,
	markRestrictedStyle,
	styleAttributeFor,
}
