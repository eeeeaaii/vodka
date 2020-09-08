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
import { Nil } from '../nex/nil.js'
import { EError } from '../nex/eerror.js'
import { Bool } from '../nex/bool.js'
import { evaluateNexSafely, wrapError } from '../evaluator.js'
import { UNBOUND } from '../environment.js'


function createLogicBuiltins() {
	Builtin.createBuiltin(
		'and',
		[ 'val1!', 'val2!' ],
		function(env, executionEnvironment) {
			return new Bool(env.lb('val1').getTypedValue() && env.lb('val2').getTypedValue());
		}
	)

	Builtin.createBuiltin(
		'first-non-nil',
		[ '_nex...'],
		function(env, executionEnvironment) {
			let nex = env.lb('nex');
			for (let i = 0; i < nex.numChildren(); i++) {
				let c = nex.getChildAt(i);
				let result = evaluateNexSafely(c, executionEnvironment);
				if (result.getTypeName() != '-nil-') {
					return result;
				}
			}
			return new Nil();
		}
	)

	Builtin.aliasBuiltin('case', 'first-non-nil');

	Builtin.createBuiltin(
		'if',
		[ 'cond!', '_iftrue', '_iffalse?' ],
		function(env, executionEnvironment) {
			let b = env.lb('cond').getTypedValue();
			let iftrue = env.lb('iftrue');
			let iffalse = env.lb('iffalse');
			if (b) {
				let iftrueresult = evaluateNexSafely(iftrue, executionEnvironment);
				if (Utils.isFatalError(iftrueresult)) {
					return wrapError('&szlig;', 'if(-then(-else)): error in argument 2', iftrueresult);
				}
				return iftrueresult;
			} else if (iffalse == UNBOUND) {
				return new Nil();
			} else {
				let iffalseresult = evaluateNexSafely(iffalse, executionEnvironment);
				if (Utils.isFatalError(iffalseresult)) {
					return wrapError('&szlig;', 'if(-then(-else)): error in argument 3', iffalseresult);
				}
				return iffalseresult;
			}
		}
	)

	Builtin.aliasBuiltin('if-then-else', 'if');
	Builtin.aliasBuiltin('if-then', 'if');

	Builtin.createBuiltin(
		'not',
		[ 'val!' ],
		function(env, executionEnvironment) {
			return new Bool(!env.lb('val').getTypedValue());
		}
	)


	Builtin.createBuiltin(
		'or',
		[ 'val1!', 'val2!' ],
		function(env, executionEnvironment) {
			return new Bool(env.lb('val1').getTypedValue() || env.lb('val2').getTypedValue());
		}
	)


}

export { createLogicBuiltins }

