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

import * as Utils from '../utils.js'

import { Builtin } from '../nex/builtin.js'
import { Org } from '../nex/org.js'
import { Integer } from '../nex/integer.js'
import { Surface } from '../nex/surface.js'
import { UNBOUND } from '../environment.js'
import { EError } from '../nex/eerror.js'

/**
 * Creates all surface builtins.
 */
function createSurfaceBuiltins() {
	Builtin.createBuiltin(
		'make-surface',
		[ 'w#%?', 'h#%?' ],
		function $makeSurface(env, executionEnvironment) {
			let wnex = env.lb('w');
			let hnex = env.lb('h');

			let w = (wnex == UNBOUND) ? 100 : wnex.getTypedValue();
			let h = (hnex == UNBOUND) ? 100 : hnex.getTypedValue();

			let r = new Surface(w, h);
			return r;
		},
		'Creates a 2d drawing surface with the given width and height.'
	);

	Builtin.createBuiltin(
		'fill-background',
		[ 'surf', 'color()' ],
		function $fillBackground(env, executionEnvironment) {
			let surf = env.lb('surf');
			let color = env.lb('color');

			if (!surf.isValidColorList(color)) {
				return new EError(`fill-background: color list must have exactly three integer members.`);				
			}

			// most of them can have an alpha component, but background fill can't.
			if (color.numChildren() != 3) {
				return new EError(`fill-background: color list must have exactly three integer members.`);				
			}

			let colorarray = surf.convertColorList(color);

			surf.fillBackground(colorarray);

			return surf;
		},
		'Fills the surface background with a color.'
	);

	Builtin.createBuiltin(
		'draw-line',
		[ 'surf', 'color()', 'x1#%', 'y1#%', 'x2#%', 'y2#%'],
		function $drawLine(env, executionEnvironment) {
			let surf = env.lb('surf');
			let color = env.lb('color');

			if (!surf.isValidColorList(color)) {
				return new EError(`draw-line: color list must have exactly three or four integer members.`);				
			}

			let colorarray = surf.convertColorList(color);

			let x1 = env.lb('x1').getTypedValue();
			let y1 = env.lb('y1').getTypedValue();
			let x2 = env.lb('x2').getTypedValue();
			let y2 = env.lb('y2').getTypedValue();

			surf.drawLine(colorarray, x1, y1, x2, y2);

			return surf;
		},
		'Draws a line on the surface.'
	);

	Builtin.createBuiltin(
		'draw-rectangle',
		[ 'surf', 'color()', 'x#%', 'y#%', 'w#%', 'h#%' ],
		function $drawRectangle(env, executionEnvironment) {
			let surf = env.lb('surf');
			let color = env.lb('color');

			if (!surf.isValidColorList(color)) {
				return new EError(`draw-rectangle: color list must have exactly three or four integer members.`);				
			}

			let colorarray = surf.convertColorList(color);

			let x = env.lb('x').getTypedValue();
			let y = env.lb('y').getTypedValue();
			let w = env.lb('w').getTypedValue();
			let h = env.lb('h').getTypedValue();

			surf.drawRect(colorarray, x, y, w, h);

			return surf;
		},
		'Draws a rectangle on the surface.'
	);

	Builtin.createBuiltin(
		'draw-dot',
		[ 'surf', 'color()', 'x#%', 'y#%'],
		function $drawRectangle(env, executionEnvironment) {
			let surf = env.lb('surf');
			let color = env.lb('color');

			if (!surf.isValidColorList(color)) {
				return new EError(`draw-dot: color list must have exactly three or four integer members.`);				
			}

			let colorarray = surf.convertColorList(color);

			let x = env.lb('x').getTypedValue();
			let y = env.lb('y').getTypedValue();

			surf.drawDot(colorarray, x, y);

			return surf;
		},
		'Draws a dot on the surface.'
	);

	Builtin.createBuiltin(
		'color-at',
		[ 'surf', 'x#%', 'y#%'],
		function $drawRectangle(env, executionEnvironment) {
			let surf = env.lb('surf');

			let x = env.lb('x').getTypedValue();
			let y = env.lb('y').getTypedValue();

			let colorarray = surf.colorAt(x, y);

			let r = new Org();
			r.appendChild(new Integer(colorarray[0]))
			r.appendChild(new Integer(colorarray[1]))
			r.appendChild(new Integer(colorarray[2]))
			r.appendChild(new Integer(colorarray[3]))

			return r;
		},
		'Draws a dot on the surface.'
	);


	Builtin.createBuiltin(
		'copy-from-clipboard',
		[ 'surf'],
		function $drawRectangle(env, executionEnvironment) {
			let surf = env.lb('surf');

			surf.copyFromClipboard();
			return surf;
		},
		'Copys the contents of the image clipboard into the surface.'
	);
}

export { createSurfaceBuiltins }

