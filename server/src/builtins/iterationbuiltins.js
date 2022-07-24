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
import { constructFatalError } from '../nex/eerror.js'
import { Command } from '../nex/command.js'; 
import { constructNil } from '../nex/nil.js'; 
import { constructOrg } from '../nex/org.js';
import { constructInteger } from '../nex/integer.js';
import { UNBOUND } from '../environment.js'
import { experiments } from '../globalappflags.js'
import { sEval, makeCommandWithClosureOneArg, makeCommandWithClosureTwoArgs, makeCommandWithClosureZeroArgs, makeQuote } from '../syntheticroot.js'


function createIterationBuiltins() {

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	Builtin.createBuiltin(
		'filter',
		[ 'list()', 'func&' ],
		function $filterWith(env, executionEnvironment) {
			let list = env.lb('list');
			let closure = env.lb('func');
			let resultList = list.makeCopy(true /* shallow */);
			let appendIterator = null;
			let i = 0;
			try {
				list.doForEachChild(function(item) {
					let result = sEval(makeCommandWithClosureOneArg(closure, makeQuote(item)),
									   executionEnvironment,
									   `filter: error returned from item ${i+1}`,
									   true /* throw errors */);
					if (!Utils.isBool(result)) {
						throw constructFatalError('filter-with: filter function must return boolean.');
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
					throw e;
				}
			}
			return resultList;
		},
		'Returns a new list containing only the elements of |list for which |func calls true when it is called on that element. Aliases: filter with'
	);

	Builtin.aliasBuiltin('filter with', 'filter');

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -


	Builtin.createBuiltin(
		'map',
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
					let result = sEval(makeCommandWithClosureOneArg(closure, makeQuote(item)),
									   executionEnvironment,
									   `map: error returned from item ${i+1}`,
									   true /* throw errors */);
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
		'Goes through all the elements in |list and replaces each one with the result of calling |func on that element. Aliases: map with'
	);

	Builtin.aliasBuiltin('map with', 'map');


	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -

	Builtin.createBuiltin(
		'reduce',
		[ 'list()', 'func&', 'startvalue' ],
		function $reduceWithGiven(env, executionEnvironment) {
			let list = env.lb('list');
			let closure = env.lb('func');
			let sn = env.lb('startvalue');
			let p = sn;
			let i = 0;
			try {
				list.doForEachChild(function(item) {
					p = sEval(makeCommandWithClosureTwoArgs(closure, makeQuote(item), makeQuote(p)),
									   executionEnvironment,
									   `reduce: error returned from item ${i+1}`,
									   true /* throw errors */);
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
		'Progressively updates a value, starting with |startvalue, by calling |func on each element in |list, passing in 1. the list element and 2. the progressively updated value, returning the final updated value. Aliases: reduce with, reduce with starting'
	);

	Builtin.aliasBuiltin('reduce with', 'reduce');
	Builtin.aliasBuiltin('reduce with starting', 'reduce');


	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  


	Builtin.createBuiltin(
		'loop over',
		[ 'func&', 'list()' ],
		function $loopOver(env, executionEnvironment) {
			let closure = env.lb('func');
			let list = env.lb('list');
			let result = null;
			let i = 0;
			try {
				list.doForEachChild(function(item) {
					result = sEval(makeCommandWithClosureOneArg(closure, makeQuote(item)),
									   executionEnvironment,
									   `loop-over: error returned when processing input ${i+1}`,
									   true /* throw errors */);
					i++;
				});
			} catch (e) {
				if (Utils.isFatalError(e)) {
					return e;
				} else {
					throw e;
				}
			}
			return result ? result : constructNil();
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
				return constructFatalError('range statement will not terminate.');
			}
			let result = constructOrg();
			let appendIterator = null;
			for (let i = start ; i != stop; i += inc) {
				let thisnum = constructInteger(i);
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
			let iterationvalue = sEval(makeCommandWithClosureZeroArgs(start),
							  		   executionEnvironment,
							          `for: error returned from initializer`);
			if (Utils.isFatalError(iterationvalue)) return iterationvalue;

			let bodyresult = null;
			while(true) {
				// check for continuation condition
				let testval = sEval(makeCommandWithClosureOneArg(test, makeQuote(iterationvalue)),
								    executionEnvironment,
								    `for: error returned from test`);
				if (Utils.isFatalError(testval)) return testval;

				if (!Utils.isBool(testval)) {
					return constructFatalError('for: test lambda must return a boolean');
				}
				if (!testval.getTypedValue()) {
					break;
				}

				// execute body
				let bodycmd = sEval(makeCommandWithClosureOneArg(body, makeQuote(iterationvalue)),
								    executionEnvironment,
								    `for: error returned from body`);
				if (Utils.isFatalError(bodycmd)) return bodycmd;


				// increment
				let inccmd = sEval(makeCommandWithClosureOneArg(inc, makeQuote(iterationvalue)),
								   executionEnvironment,
								   `for: error returned from incrementer`);
				if (Utils.isFatalError(inccmd)) return inccmd;

				iterationvalue = inccmd;

			}
			return bodyresult ? bodyresult : constructNil();
		},
		`Classic "for loop". First |start is evaluated, then |test. If |test returns true, |body and |inc are evaluated, and then we go back to |test. Alias: starting-with while do then-with.`
	)

	Builtin.aliasBuiltin('starting-with while do then-with', 'for-loop');

}

export { createIterationBuiltins }