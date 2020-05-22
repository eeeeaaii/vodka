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

import { Builtin } from '/nex/builtin.js'
import { EError } from '/nex/eerror.js'
import { Bool } from '/nex/bool.js'
import { manipulator } from '/vodka.js'
import * as Utils from '/utils.js'

function createLogicBuiltins() {
	Builtin.createBuiltin(
		'not',
		[ 'val!' ],
		function(env, executionEnvironment) {
			return new Bool(!env.lb('val').getTypedValue());
		}
	)


	Builtin.createBuiltin(
		'and',
		[ 'val1!', 'val2!' ],
		function(env, executionEnvironment) {
			return new Bool(env.lb('val1').getTypedValue() && env.lb('val2').getTypedValue());
		}
	)

	Builtin.createBuiltin(
		'or',
		[ 'val1!', 'val2!' ],
		function(env, executionEnvironment) {
			return new Bool(env.lb('val1').getTypedValue() || env.lb('val2').getTypedValue());
		}
	)

	Builtin.createBuiltin(
		'if',
		[ 'cond!', '_iftrue', '_iffalse' ],
		function(env, executionEnvironment) {
			let b = env.lb('cond').getTypedValue();
			if (b) {
				let iftrue = evaluateNexSafely(env.lb('iftrue'), executionEnvironment);
				if (isFatalError(iftrue)) {
					iftrue = wrapError('&szlig;', 'if: error in argument 2', iftrue);
				}
				return iftrue;
			} else {
				let iffalse = evaluateNexSafely(env.lb('iffalse'), executionEnvironment);
				if (isFatalError(iffalse)) {
					iffalse = wrapError('&szlig;', 'if: error in argument 3', iffalse);
				}
				return iffalse;
			}
		}
	)
}

export { createLogicBuiltins }

