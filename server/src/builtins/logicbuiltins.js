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
import { constructNil } from '../nex/nil.js'
import { EError } from '../nex/eerror.js'
import { constructBool } from '../nex/bool.js'
import { evaluateNexSafely, wrapError } from '../evaluator.js'
import { UNBOUND } from '../environment.js'
import { sAttach } from '../syntheticroot.js'


function createLogicBuiltins() {

	// - - -  - - -  - - -  - - -  - - -  - - -  - - -  - - -  - - - 


	Builtin.createBuiltin(
		'and',
		[ 'val1!', 'val2!' ],
		function $and(env, executionEnvironment) {
			return constructBool(env.lb('val1').getTypedValue() && env.lb('val2').getTypedValue());		
		},
		'Returns true if both |val1 and |val2 evaluate to boolean true.',
		true /* infix */
	)

	// - - -  - - -  - - -  - - -  - - -  - - -  - - -  - - -  - - - 


	Builtin.createBuiltin(
		'first-non-nil',
		[ '_nex...'],
		function $firstNonNil(env, executionEnvironment) {
			let nex = env.lb('nex');
			for (let i = 0; i < nex.numChildren(); i++) {
				let c = nex.getChildAt(i);
				let result = sAttach(evaluateNexSafely(c, executionEnvironment));
				if (result.getTypeName() != '-nil-') {
					return result;
				}
			}
			return constructNil();
		},
		'Returns the first argument that does not evaluate to nil, ignoring the rest. Alias: case.'
	)

	Builtin.aliasBuiltin('case', 'first-non-nil');

	// - - -  - - -  - - -  - - -  - - -  - - -  - - -  - - -  - - - 

	Builtin.createBuiltin(
		'if then else',
		[ 'cond!', '_iftrue', '_iffalse?' ],
		function $if(env, executionEnvironment) {
			let b = env.lb('cond').getTypedValue();
			let iftrue = env.lb('iftrue');
			let iffalse = env.lb('iffalse');
			if (iffalse == UNBOUND) {
				iffalse = constructNil();
			}
			if (b) {
				let iftrueresult = evaluateNexSafely(iftrue, executionEnvironment);
				if (Utils.isFatalError(iftrueresult)) {
					return wrapError('&szlig;', 'if then else: error in argument 2', iftrueresult);
				}
				return iftrueresult;
			} else {
				let iffalseresult = evaluateNexSafely(iffalse, executionEnvironment);
				if (Utils.isFatalError(iffalseresult)) {
					return wrapError('&szlig;', 'if then else: error in argument 3', iffalseresult);
				}
				return iffalseresult;
			}
		},
		'Evalutes |cond, and if it is true, return |iftrue, otherwise return |iffalse. If |iffalse is not provided, a Nil is returned if |cond is false. Alias: if.'
	)
	Builtin.aliasBuiltin('if', 'if then else');


	Builtin.createBuiltin(
		'not',
		[ 'val!' ],
		function $not(env, executionEnvironment) {
			return constructBool(!env.lb('val').getTypedValue());
		},
		'Evalutes to true if |val evaluates to false, or false if |val evaluates to true.'
	)


	Builtin.createBuiltin(
		'or',
		[ 'val1!', 'val2!' ],
		function $or(env, executionEnvironment) {
			return constructBool(env.lb('val1').getTypedValue() || env.lb('val2').getTypedValue());
		},
		'Evaluates to true if either or both of |val1 or |val2 evaluate to true.',
		true /* infix */
	)


}

export { createLogicBuiltins }

