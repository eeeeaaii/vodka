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
What a doc, a line and a word do with a pfont, in one place so the three of
them say it the same way. A letter (and so a separator) does its own version in
letter.js.

The rule is last write wins. Applying a pfont to something sets it on that
thing and on everything inside it, replacing whatever was there, and a child
inserted later gets its parent's. So a letter's font is whatever was last
applied to it or to anything containing it. There is no inheritance to work out
at draw time and no merging of params.

The string is parsed once, where it is applied, and the one resolved Font is
handed down to everything it lands on.

Saving follows from the rule. A nex's string is written only where it differs
from its parent's, so a plain pfont'd doc stores one string, not one per letter.
On load the strings are put back parent first, then the children that differ,
which is the order they would have been applied in to get that result.

The private data of a doc, line or word is its style; with a pfont to save it
is style|pfstring. A pfont string never contains | (the builtin refuses one), so
the split is unambiguous, and a file with no pfont in it is written exactly as
before.

(comment by Claude)
*/

import { parametricFontManager } from './pfontmanager.js'

function setContainerPfont(container, pfstring) {
	let font = parametricFontManager.getFontForString(pfstring);
	container.applyResolvedPfont(pfstring, font);
}

function applyResolvedPfontToContainer(container, pfstring, font) {
	container.pfstring.set(pfstring);
	container.pfont = font;
	container.pfontRunCache = null;
	container.doForEachChild(function(c) {
		c.applyResolvedPfont(pfstring, font);
	});
	let block = container.getActivePfontBlock();
	if (block) {
		block.fontChanged(false);
	}
}

function giveNewChildContainerPfont(container, c) {
	if (container.pfstring.get()) {
		c.applyResolvedPfont(container.pfstring.get(), container.pfont);
	}
}

function serializeContainerPrivateData(container, ctx) {
	let style = `${container.getCurrentStyle()}`;
	let pfstring = container.pfstring.get();
	if (ctx && pfstring != ctx.getParentPfstring()) {
		return `${style}|${pfstring}`;
	}
	return style;
}

function deserializeContainerPrivateData(container, data) {
	let a = data.split('|');
	container.setCurrentStyle(a[0]);
	if (a.length > 1) {
		restorePfontFromFile(container, a[1]);
	}
}

/*
Called on a nex whose saved data had a pfont in it. Its children were loaded
before it was, so any of them that had their own are already right; everything
else inside gets this one.

(comment by Claude)
*/
function restorePfontFromFile(nex, pfstring) {
	let font = parametricFontManager.getFontForString(pfstring);
	nex.pfontFromFile = true;
	nex.fillPfontFromParent(pfstring, font);
}

function fillContainerPfontFromParent(container, pfstring, font) {
	container.pfstring.set(pfstring);
	container.pfont = font;
	container.doForEachChild(function(c) {
		if (!c.pfontFromFile) {
			c.fillPfontFromParent(pfstring, font);
		}
	});
}

function copyContainerPfontTo(container, nex) {
	nex.pfstring.set(container.pfstring.get());
	nex.pfont = container.pfont;
}

export {
	setContainerPfont,
	applyResolvedPfontToContainer,
	giveNewChildContainerPfont,
	serializeContainerPrivateData,
	deserializeContainerPrivateData,
	restorePfontFromFile,
	fillContainerPfontFromParent,
	copyContainerPfontTo,
}
