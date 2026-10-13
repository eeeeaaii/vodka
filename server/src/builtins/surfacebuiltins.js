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

import { Builtin } from '../nex/builtin.js'
import { constructSurface } from '../nex/surface.js'
import { constructFatalError } from '../nex/eerror.js'

/**
 * Creates all surface builtins.
 */
function createSurfaceBuiltins() {
	/*
	The only one. Drawing is appending a path, erasing is removing one, and the
	list builtins already do both.

	(comment by Claude)
	*/
	Builtin.createBuiltin(
		'make-surface',
		[ 'w#%', 'h#%' ],
		function $makeSurface(env, executionEnvironment) {
			let w = env.lb('w').getTypedValue();
			let h = env.lb('h').getTypedValue();
			if (!(w > 0) || !(h > 0)) {
				return constructFatalError(`make-surface: width and height must be more than zero.`);
			}
			return constructSurface(w, h);
		},
		'An empty surface |w by |h.'
	);
}

export { createSurfaceBuiltins }
