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

const UNHANDLED_KEY = 'unhandled_key'

const CONSOLE_DEBUG = false;

// render flags are not stored anywhere but are passed
// into the render method and different actions are taken
// during rendering depending. They are bitmasked into
// an int (so retro, I know)

const RENDER_FLAG_NORMAL = 0;
const RENDER_FLAG_SHALLOW = 1;
const RENDER_FLAG_EXPLODED = 2;
const RENDER_FLAG_RERENDER = 4;
const RENDER_FLAG_SELECTED = 8;
const RENDER_FLAG_RENDER_IF_DIRTY = 16;
const RENDER_FLAG_DEPTH_EXCEEDED = 32;
const RENDER_FLAG_INSERT_AFTER = 64;
const RENDER_FLAG_INSERT_BEFORE = 128;
const RENDER_FLAG_INSERT_INSIDE = 256;
const RENDER_FLAG_INSERT_AROUND = 512;
const RENDER_FLAG_COLLAPSED = 1024;

/*
Collapsed is a tag on the nex, and this is the tag: a single backslash, the key
that puts it there. On the nex rather than on the render node because collapsing
an argument takes it out of the call it is in (see command.js), and the
execution path must not have to ask the view layer anything -- it is the hot
path, and it is the part that has to be able to leave javascript one day.

Being a tag, it saves and loads with the document and travels with a copy, which
a render node's state could never do.

The tag editor refuses to type a backslash (see tageditor.js), so the collapse
keystroke is the only way to put this on or take it off. Anything else would be
a nex you could not expand, or an expanded nex that reads as collapsed.

(comment by Claude)
*/
const COLLAPSE_TAG = '\\';

// render modes are values that are stored as state, for example in RenderNode objects.

const RENDER_MODE_EXPLO = 1;
const RENDER_MODE_NORM = 2;

export {
	UNHANDLED_KEY,
	COLLAPSE_TAG,
	RENDER_FLAG_NORMAL,
	RENDER_FLAG_SHALLOW,
	RENDER_FLAG_EXPLODED,
	RENDER_FLAG_RERENDER,
	RENDER_FLAG_SELECTED,
	RENDER_FLAG_DEPTH_EXCEEDED,
	RENDER_FLAG_INSERT_AROUND,
	RENDER_FLAG_INSERT_INSIDE,
	RENDER_FLAG_INSERT_BEFORE,
	RENDER_FLAG_INSERT_AFTER,
	RENDER_FLAG_RENDER_IF_DIRTY,
	RENDER_FLAG_COLLAPSED,
	RENDER_MODE_NORM,
	RENDER_MODE_EXPLO,
	CONSOLE_DEBUG
}