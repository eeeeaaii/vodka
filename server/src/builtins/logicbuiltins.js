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
import { EError, constructFatalError } from '../nex/eerror.js'
import { constructBool } from '../nex/bool.js'
import { evaluateNexSafely, wrapError } from '../evaluator.js'
import { UNBOUND } from '../environment.js'
import { sAttach } from '../syntheticroot.js'


function createLogicBuiltins() {

	// - - -  - - -  - - -  - - -  - - -  - - -  - - -  - - -  - - - 


	// and/or take any number of args and stop at the first one that settles
	// the answer, so later args are not evaluated (like first-non-nil).
	// With no args you get the identity: true for and, false for or.
	function shortCircuit(name, stopOn, docstring) {
		Builtin.createBuiltin(
			name,
			[ '_vals...' ],
			function(env, executionEnvironment) {
				let vals = env.lb('vals');
				for (let i = 0; i < vals.numChildren(); i++) {
					let result = sAttach(evaluateNexSafely(vals.getChildAt(i), executionEnvironment));
					if (Utils.isFatalError(result)) {
						return wrapError('&szlig;', `${name}: error in argument ${i + 1}`, result);
					}
					if (!Utils.isBool(result)) {
						return constructFatalError(`${name}: argument ${i + 1} is not a bool`);
					}
					if (result.getTypedValue() == stopOn) {
						return constructBool(stopOn);
					}
				}
				return constructBool(!stopOn);
			},
			docstring,
			true /* infix */
		)
	}

	shortCircuit('and', false,
		'True if all of |vals are true. Stops at the first false one, and the rest are not evaluated. With no args, true.');

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
		'The first argument that is not nil. The rest are not evaluated.'
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
		'Evaluates |cond, then returns |iftrue or |iffalse. Only the branch taken is evaluated. Without |iffalse, a false |cond gives nil.'
	)
	Builtin.aliasBuiltin('if', 'if then else');


	Builtin.createBuiltin(
		'not',
		[ 'val!' ],
		function $not(env, executionEnvironment) {
			return constructBool(!env.lb('val').getTypedValue());
		},
		'True if |val is false, false if it is true.'
	)


	shortCircuit('or', true,
		'True if any of |vals is true. Stops at the first true one, and the rest are not evaluated. With no args, false.');


}

export { createLogicBuiltins }

