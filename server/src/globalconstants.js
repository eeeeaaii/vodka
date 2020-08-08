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

// render flags
const RENDER_FLAG_NORMAL = 0;
const RENDER_FLAG_SHALLOW = 1;
const RENDER_FLAG_EXPLODED = 2;
const RENDER_FLAG_RERENDER = 4;
const RENDER_FLAG_SELECTED = 8;
const RENDER_FLAG_REMOVE_OVERRIDES = 16; // get rid of normal/exploded overrides
const RENDER_FLAG_DEPTH_EXCEEDED = 32;


export {
	UNHANDLED_KEY,
	RENDER_FLAG_NORMAL,
	RENDER_FLAG_SHALLOW,
	RENDER_FLAG_EXPLODED,
	RENDER_FLAG_RERENDER,
	RENDER_FLAG_SELECTED,
	RENDER_FLAG_REMOVE_OVERRIDES,
	RENDER_FLAG_DEPTH_EXCEEDED,
	CONSOLE_DEBUG
}