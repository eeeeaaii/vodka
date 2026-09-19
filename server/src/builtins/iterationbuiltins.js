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
import { sEval } from '../syntheticroot.js'
import { systemState } from '../systemstate.js'


/*
JavaScript hands a map callback the index along with the element; vodka did not,
so the only way to know where you were in a list was to build the indices
separately and look each element up by hand.

The index is only passed to a function that declared somewhere to put it. One
that takes a single parameter is called exactly the way it always was, so
nothing already written changes behaviour -- a variadic one included, which
would otherwise quietly start collecting an extra element it never asked for.

(comment by Claude)
*/
function takesAnIndex(closure) {
	let lambda = closure.getLambda();
	if (!lambda || !lambda.getParams) return false;
	let params = lambda.getParams();
	return !!params && params.length >= 2;
}

function callOnItem(closure, item, i, executionEnvironment, errmsg) {
	let scf = systemState.getSCF();
	let cmd = takesAnIndex(closure)
		? scf.makeCommandWithClosureTwoArgs(closure, scf.makeQuote(item), scf.makeQuote(constructInteger(i)))
		: scf.makeCommandWithClosureOneArg(closure, scf.makeQuote(item));
	return sEval(cmd, executionEnvironment, errmsg, true /* throw errors */);
}

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
					let result = callOnItem(closure, item, i, executionEnvironment,
									   `filter: error returned from item ${i+1}`);
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
		'The elements of |list for which |func returns true. A |func of two arguments also gets the index.'
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
					let result = callOnItem(closure, item, i, executionEnvironment,
									   `map: error returned from item ${i+1}`);
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
		'|list with each element replaced by |func of that element. A |func of two arguments also gets the index.'
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
					p = sEval(systemState.getSCF().makeCommandWithClosureTwoArgs(closure, systemState.getSCF(). makeQuote(item), systemState.getSCF(). makeQuote(p)),
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
		'Folds |list into one value. |func is called with each element and the value so far, starting from |startvalue.'
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
					result = callOnItem(closure, item, i, executionEnvironment,
									   `loop-over: error returned when processing input ${i+1}`);
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
		'Calls |func on each element of |list and returns the last result. A |func of two arguments also gets the index.'
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
		`The integers from |startorstop up to but not including |stop, stepping by |inc. Given one argument it counts from 0.`
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
			let iterationvalue = sEval(systemState.getSCF().makeCommandWithClosureZeroArgs(start),
							  		   executionEnvironment,
							          `for: error returned from initializer`);
			if (Utils.isFatalError(iterationvalue)) return iterationvalue;

			let bodyresult = null;
			while(true) {
				// check for continuation condition
				let testval = sEval(systemState.getSCF().makeCommandWithClosureOneArg(test, systemState.getSCF(). makeQuote(iterationvalue)),
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
				let bodycmd = sEval(systemState.getSCF().makeCommandWithClosureOneArg(body, systemState.getSCF(). makeQuote(iterationvalue)),
								    executionEnvironment,
								    `for: error returned from body`);
				if (Utils.isFatalError(bodycmd)) return bodycmd;


				// increment
				let inccmd = sEval(systemState.getSCF().makeCommandWithClosureOneArg(inc, systemState.getSCF(). makeQuote(iterationvalue)),
								   executionEnvironment,
								   `for: error returned from incrementer`);
				if (Utils.isFatalError(inccmd)) return inccmd;

				iterationvalue = inccmd;

			}
			return bodyresult ? bodyresult : constructNil();
		},
		`Evaluates |start, then repeats |body and |inc for as long as |test is true.`
	)

	Builtin.aliasBuiltin('starting-with while do then-with', 'for-loop');

}

export { createIterationBuiltins }