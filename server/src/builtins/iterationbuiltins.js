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
import { EError } from '../nex/eerror.js'
import { Command } from '../nex/command.js'; 
import { Nil } from '../nex/nil.js'; 
import { Org } from '../nex/org.js';
import { Integer } from '../nex/integer.js';
import { evaluateNexSafely, wrapError } from '../evaluator.js'
import { UNBOUND } from '../environment.js'
import { experiments } from '../globalappflags.js'


function createIterationBuiltins() {

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	Builtin.createBuiltin(
		'filter with',
		[ 'list()', 'func&' ],
		function $filterWith(env, executionEnvironment) {
			let list = env.lb('list');
			let closure = env.lb('func');
			let resultList = list.makeCopy(true /* shallow */);
			let appendIterator = null;
			let i = 0;
			try {
				list.doForEachChild(function(item) {
					let cmd = Command.makeCommandWithClosureOneArg(closure, Command.quote(item));
					cmd.setSkipAlertAnimation(true);
					let result = evaluateNexSafely(cmd, executionEnvironment);
					if (Utils.isFatalError(result)) {
						throw wrapError('&szlig;', `filter-with: error returned from item ${i+1}`, result);
					}
					if (!Utils.isBool(result)) {
						throw new EError('filter-with: filter function must return boolean.');
					}
					if (result.getTypedValue()) {
						appendIterator = resultList.fastAppendChildAfter(list.getChildAt(i), appendIterator);
					}
					i++;
				})
			} catch (e) {
				if (Utils.isFatalError(e)) {
					return e;
				} else {
					throw e; // shouldn't be possible for this to be a non-fatal EError.
				}
			}
			return resultList;
		},
		'Returns a new list containing only the elements of |list for which |func calls true when it is called on that element.'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -


	Builtin.createBuiltin(
		'map with',
		[ 'list()', 'func&' ],
		function $mapWith(env, executionEnvironment) {
			let closure = env.lb('func');
			let list = env.lb('list');
			// until we congeal things down to a single list type
			// I'll try to honor the list type of the starting list
			let resultList = list.makeCopy(true /* shallow */);
			let appendIterator = null;
			let i = 0;
			try {
				list.doForEachChild(function(item) {
					let cmd = Command.makeCommandWithClosureOneArg(closure, Command.quote(item))
					cmd.setSkipAlertAnimation(true);
					let result = evaluateNexSafely(cmd, executionEnvironment);
					if (Utils.isFatalError(result)) {
						throw wrapError('&szlig;', `map-with: error returned from item ${i+1}`, result);
					}
					appendIterator = resultList.fastAppendChildAfter(result, appendIterator);
					i++;
				});
			} catch (e) {
				if (Utils.isFatalError(e)) {
					return e;
				} else {
					throw e;
				}
			}
			return resultList;
		},
		'Goes through all the elements in |list and replaces each one with the result of calling |func on that element.'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -

	Builtin.createBuiltin(
		'reduce with',
		[ 'list()', 'func&', 'startvalue' ],
		function $reduceWithGiven(env, executionEnvironment) {
			let list = env.lb('list');
			let closure = env.lb('func');
			let sn = env.lb('startvalue');
			let p = sn;
			let i = 0;
			try {
				list.doForEachChild(function(item) {
					let cmd = Command.makeCommandWithClosureTwoArgs(closure, Command.quote(item), Command.quote(p));
					cmd.setSkipAlertAnimation(true);
					let result = evaluateNexSafely(cmd, executionEnvironment);
					if (Utils.isFatalError(result)) {
						throw wrapError('&szlig;', `reduce-with-given: error returned from item ${i+1}`, result);
					}
					p = result;
					i++;
				});
			} catch(e) {
				if (Utils.isFatalError(e)) {
					return e;
				} else {
					throw e;
				}
			}
			return p;
		},
		'Progressively updates a value, starting with |startvalue, by calling |func on each element in |list, passing in 1. the list element and 2. the progressively updated value, returning the final updated value.'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  


	Builtin.createBuiltin(
		'loop over',
		[ 'func&', 'list()' ],
		function $loopOver(env, executionEnvironment) {
			let closure = env.lb('func');
			let list = env.lb('list');
			let result = new Nil();
			let i = 0;
			try {
				list.doForEachChild(function(item) {
					let cmd = Command.makeCommandWithClosureOneArg(closure, Command.quote(item))
					cmd.setSkipAlertAnimation(true);
					result = evaluateNexSafely(cmd, executionEnvironment);
					if (Utils.isFatalError(result)) {
						throw wrapError('&szlig;', `loop-over: error returned when processing input ${item.debugString()}`, result);
					}
					i++;
				});
			} catch (e) {
				if (Utils.isFatalError(e)) {
					return e;
				} else {
					throw e;
				}
			}
			return result;
		},
		'Loops over a list, evaluating a function on each member, and returning the last result.'
	);

	Builtin.createBuiltin(
		'range',
		[ 'startorstop#', 'stop#?', 'inc#?' ],
		function $range(env, executionEnvironment) {
			let startorstop_n = env.lb('startorstop');
			let stop_n = env.lb('stop');
			let inc_n = env.lb('inc');
			let start = 0;
			let stop = 0;
			let inc = 1;
			if (stop_n == UNBOUND) {
				stop = startorstop_n.getTypedValue();
			} else {
				start = startorstop_n.getTypedValue();
				stop = stop_n.getTypedValue();
				if (inc_n != UNBOUND) {
					inc = inc_n.getTypedValue();
				}
			}
			if (inc == 0 || start < stop && inc < 0 || stop < start && inc > 0) {
				return new EError('range statement will not terminate.');
			}
			let result = new Org();
			let appendIterator = null;
			for (let i = start ; i != stop; i += inc) {
				let thisnum = new Integer(i);
				appendIterator = result.fastAppendChildAfter(thisnum, appendIterator);
			}
			return result;
		},
		`Returns a list containing all the integers from 0 to n`
	)



	Builtin.createBuiltin(
		'for-loop',
		[ 'start&', 'test&', 'body&', 'inc&'],
		function $forLoop(env, executionEnvironment) {
			let start = env.lb('start');
			let test = env.lb('test');
			let inc = env.lb('inc');
			let body = env.lb('body');

			// starting condition
			let startcmd = Command.makeCommandWithClosureZeroArgs(start);
			startcmd.setSkipAlertAnimation(true);
			let iterationvalue = evaluateNexSafely(startcmd, executionEnvironment);
			if (Utils.isFatalError(iterationvalue)) {
				return wrapError('&szlig;', `for: error returned from initializer`, iterationvalue);
			}

			let bodyresult = new Nil();
			while(true) {
				// check for continuation condition
				let testcmd = Command.makeCommandWithClosureOneArg(test, Command.quote(iterationvalue));
				testcmd.setSkipAlertAnimation(true);
				let testval = evaluateNexSafely(testcmd, executionEnvironment);
				if (Utils.isFatalError(testval)) {
					return wrapError('&szlig;', `for: error returned from test`, testval);
				}
				if (testval.getTypeName() != '-bool-') {
					return new EError('for: test lambda must return a boolean');
				}
				if (!testval.getTypedValue()) {
					break;
				}
				// execute body
				let bodycmd = Command.makeCommandWithClosureOneArg(body, Command.quote(iterationvalue));
				bodycmd.setSkipAlertAnimation(true);
				bodyresult = evaluateNexSafely(bodycmd, executionEnvironment);
				if (Utils.isFatalError(bodyresult)) {
					return wrapError('&szlig;', `for: error returned from body, iterator=${iterationvalue.toString()}`, bodyresult);
				}
				// increment
				let inccmd = Command.makeCommandWithClosureOneArg(inc, Command.quote(iterationvalue));
				inccmd.setSkipAlertAnimation(true);
				iterationvalue = evaluateNexSafely(inccmd, executionEnvironment);
				if (Utils.isFatalError(iterationvalue)) {
					return wrapError('&szlig;', `for: error returned from then-with`, iterationvalue);
				}
			}
			return bodyresult;
		},
		`Classic "for loop". First |start is evaluated, then |test. If |test returns true, |body and |inc are evaluated, and then we go back to |test. Alias: starting-with while do then-with.`
	)

	Builtin.aliasBuiltin('starting-with while do then-with', 'for-loop');

}

export { createIterationBuiltins }