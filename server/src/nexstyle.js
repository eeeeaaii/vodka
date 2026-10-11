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

The shorthands are here too -- `border` and the four sides of it, and `font`.
A shorthand only ever sets the longhands it is made of, so it cannot say
anything the list above does not already allow; what it saves you is writing
three declarations to draw one line. `background` is the shorthand that is NOT
here: it can carry a background-image, and an image is a url, which is a hole
out of vodka to somewhere else.

(comment by Claude)
*/
const ALLOWED = [
	'background-color',
	'border',
	'border-bottom',
	'border-color',
	'border-left',
	'border-radius',
	'border-right',
	'border-style',
	'border-top',
	'border-width',
	'color',
	'cursor',
	'font',
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
	'text-color': 'color',
	'foreground': 'color',
	'align': 'text-align',
	'underline': 'text-decoration',
	'radius': 'border-radius',
	'border-top-width': 'border-top or border-width',
	'border-top-color': 'border-top or border-color',
	'border-top-style': 'border-top or border-style',
	'outline': 'border',
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

const BORDER_SHORTHANDS = [
	'border',
	'border-top',
	'border-right',
	'border-bottom',
	'border-left',
];

const BORDER_STYLE_KEYWORDS = [
	'none',
	'hidden',
	'dotted',
	'dashed',
	'solid',
	'double',
	'groove',
	'ridge',
	'inset',
	'outset',
];

/*
`border: 1px red` draws nothing, because the shorthand sets every part of the
border it is made of and the part it was not told about goes back to its
default, and the default style is none. The parts of the shorthand can be given
in any order, so saying `solid` at the end of one that did not mention a style
is both safe and what the person meant.

(comment by Claude)
*/
function withVisibleBorderStyle(value) {
	let words = value.split(/\s+/);
	for (let i = 0; i < words.length; i++) {
		if (BORDER_STYLE_KEYWORDS.indexOf(words[i].toLowerCase()) >= 0) {
			return value;
		}
	}
	return value + ' solid';
}

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
Checking a style string and merging it into the one a nex already has, and
saying what is wrong with it rather than only that something is. Returns the
css to store, or a string naming the problem.

Additive, because a style is now something you look at and adjust. Setting
`background-color` on a thing that already has a border should give it both; a
whole style written out again every time you want to change one number is a
style nobody will touch twice. A property named again replaces its old value
and keeps its old place in the order.

	border: 1px solid black          ->  border: 1px solid black
	background-color: red            ->  border: 1px solid black;
	                                     background-color: red
	background-color: blue           ->  border: 1px solid black;
	                                     background-color: blue

A property given no value at all is removed:

	border:;                         ->  background-color: blue

That is not valid css -- nothing could mean it, since a declaration with no
value is simply dropped by a browser -- which is what makes it safe to use for
this. Removing takes the whole family: `border:;` also removes border-width,
border-color, border-style and border-radius, because somebody who says the
border should go means all of it. `border-radius:;` removes only the radius.
`all:;` removes everything.

A value is not checked beyond being there -- the browser is better at that than
anything written here would be, and a value it does not understand is a
declaration it ignores, not a hole in anything.

Merging only happens into a style that was set this way. One set with the old
builtin is unchecked, so there is nothing to safely merge with, and it is
replaced instead.

(comment by Claude)
*/
function checkStyle(s, existingStyle) {
	let declarations = parseDeclarations(s);
	let kept = isRestrictedStyle(existingStyle)
			? parseDeclarations(existingStyle.substring(STYLE_MARK.length))
			: [];
	for (let i = 0; i < declarations.length; i++) {
		let d = declarations[i];
		if (d.bad) {
			return { problem: `"${d.bad}" is not a css declaration -- it wants`
					+ ' a property, a colon, and a value' };
		}
		if (!d.value) {
			kept = removeProperty(kept, d.property);
			continue;
		}
		if (ALLOWED.indexOf(d.property) < 0) {
			let instead = SPELLINGS[d.property]
					? `. Did you mean ${SPELLINGS[d.property]}?`
					: `. You can set: ${ALLOWED.join(', ')}`;
			return { problem: `${d.property} is not a style you can set${instead}` };
		}
		let value = d.value;
		if (BORDER_SHORTHANDS.indexOf(d.property) >= 0) {
			value = withVisibleBorderStyle(value);
		}
		kept = setProperty(kept, d.property, value);
	}
	/*
	A border nobody can see is not a border. Css defaults border-style to none,
	so asking for a width and a colour and getting nothing is the first thing
	anybody hits; a border asked for is a border drawn. A shorthand has already
	had this done to its own value, so it counts as having said what the style
	is and nothing here overwrites it.

	(comment by Claude)
	*/
	let has = (prop) => kept.some(d => d.property == prop);
	let hasShorthand = kept.some(d => BORDER_SHORTHANDS.indexOf(d.property) >= 0);
	if ((has('border-width') || has('border-color'))
			&& !has('border-style') && !hasShorthand) {
		kept.push({ property: 'border-style', value: 'solid' });
	}
	return { css: kept.map(d => `${d.property}: ${d.value}`).join('; ') };
}

// in place if it is already there, keeping the order the style was written in,
// otherwise on the end
// (comment by Claude)
function setProperty(declarations, property, value) {
	let out = declarations.slice();
	for (let i = 0; i < out.length; i++) {
		if (out[i].property == property) {
			out[i] = { property: property, value: value };
			return out;
		}
	}
	out.push({ property: property, value: value });
	return out;
}

/*
The property and everything under it: `border:;` takes border-width and the
rest with it, because a border that is gone is gone. `all:;` takes everything,
which is the only thing `all` is allowed to be used for -- as a property to
set it would mean something far beyond this list.

(comment by Claude)
*/
function removeProperty(declarations, property) {
	if (property == 'all') {
		return [];
	}
	let prefix = property + '-';
	return declarations.filter(d =>
			d.property != property && d.property.indexOf(prefix) != 0);
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
