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

import { Nex } from '../nex/nex.js'; 
import { NexContainer } from '../nex/nexcontainer.js'; 
import { ValueNex } from '../nex/valuenex.js'; 
import { Bool } from '../nex/bool.js'; 
import { Builtin } from '../nex/builtin.js'; 
import { Closure } from '../nex/closure.js'; 
import { Command } from '../nex/command.js'; 
import { Doc } from '../nex/doc.js'; 
import { EError } from '../nex/eerror.js'; 
import { EString } from '../nex/estring.js'; 
import { ESymbol } from '../nex/esymbol.js'; 
import { Expectation } from '../nex/expectation.js'; 
import { Float } from '../nex/float.js'; 
import { InsertionPoint } from '../nex/insertionpoint.js'; 
import { Integer } from '../nex/integer.js'; 
import { Lambda } from '../nex/lambda.js'; 
import { Letter } from '../nex/letter.js'; 
import { Line } from '../nex/line.js'; 
import { NativeOrg } from '../nex/nativeorg.js'; 
import { Newline } from '../nex/newline.js'; 
import { Nil } from '../nex/nil.js'; 
import { Org } from '../nex/org.js'; 
import { Root } from '../nex/root.js'; 
import { Separator } from '../nex/separator.js'; 
import { Word } from '../nex/word.js'; 
import { Zlist } from '../nex/zlist.js'; 

import { evaluateNexSafely, wrapError } from '../evaluator.js'


function createBasicBuiltins() {
	Builtin.createBuiltin(
		'dump-memory',
		[ 'closure&' ],
		function(env, executionEnvironment) {
			let closure = env.lb('closure');
			let lexenv = closure.getLexicalEnvironment();
			let doLevel = function(envAtLevel) {
				let r = new Org();
				envAtLevel.doForEachBinding(function(binding) {
					let rec = new Org();
					rec.appendChild(new ESymbol(binding.name));
					rec.appendChild(binding.val);
					r.appendChild(rec);
				})
				if (envAtLevel.getParent()) {
					r.appendChild(doLevel(envAtLevel.getParent()));
				}
				return r;
			}
			return doLevel(lexenv);
		},
		'returns the memory environment of |exp, in the form of a list containing all bound symbols along with their values.'
	);


	Builtin.createBuiltin(
		'see-id',
		[ 'nex' ],
		function(env, executionEnvironment) {
			let nex = env.lb('nex');
			return new EString('' + nex.getID());
		},
		'returns the ID of |nex as a string.'
	);


	Builtin.createBuiltin(
		'begin',
		[ 'nex...' ],
		function(env, executionEnvironment) {
			let lst = env.lb('nex');
			if (lst.numChildren() == 0) {
				return new Nil();
			} else {
				return lst.getChildAt(lst.numChildren() - 1);
			}
		},
		'all arguments are evaluated in order from first to last, and the result of the last evaluation is returned.'
	);

	Builtin.createBuiltin(
		'cap',
		[ 'list()' ],
		function(env, executionEnvironment) {
			let c = env.lb('list');
			if (c.numChildren() == 0) {
				return new EError("cap: cannot get first element of empty list. Sorry!");
			}
			let r = c.getChildAt(0);
			c.removeChild(c.getChildAt(0));
			return r;
		},
		'destructively and permanently removes the first element of |list, and returns the removed element.'
	);

	Builtin.createBuiltin(
		'car',
		[ 'list()' ],
		function(env, executionEnvironment) {
			let lst = env.lb('list');
			if (lst.numChildren() == 0) {
				return new EError('first/car: cannot get first element of empty list. Sorry!');
			}
			return lst.getFirstChild();
		},
		'returns the first element of |list, without altering |list in any way.'
	);

	Builtin.aliasBuiltin('first', 'car');

	Builtin.createBuiltin(
		'cdr',
		[ 'list()' ],
		function(env, executionEnvironment) {
			let c = env.lb('list');
			if (c.numChildren() == 0) {
				return new EError("rest/cdr: given an empty list, cannot make a new list with first element removed. Sorry!");
			}
			let newOne = c.makeCopy(true);
			c.getChildrenForCdr(newOne);
			return newOne;
		},
		'returns a new list containing all elements of |list except the first one.'
	);

	Builtin.aliasBuiltin('rest', 'cdr');

	Builtin.createBuiltin(
		'chop',
		[ 'list()' ],
		function(env, executionEnvironment) {
			let c = env.lb('list');
			if (c.numChildren() == 0) {
				return new EError("chop: cannot remove first element of empty list. Sorry!");
			}
			c.removeChild(c.getChildAt(0));
			return c;
		},
		'destructively and permanently removes the first element of |list, and returns |list.'
	);

	Builtin.createBuiltin(
		'cons',
		[ 'nex', 'list()' ],
		function(env, executionEnvironment) {
			let nex = env.lb('nex');
			let lst = env.lb('list');
			let newOne = lst.makeCopy(true);
			lst.setChildrenForCons(nex, newOne);
			return newOne;
		},
		'creates a new list by prepending |nex to |list, and returns the new list.'
	);

	Builtin.createBuiltin(
		'copy',
		[ 'nex' ],
		function(env, executionEnvironment) {
			return env.lb('nex').makeCopy();
		},
		'returns a deep copy of |nex (if |nex is a list, list elements are also copied).'
	);


	Builtin.createBuiltin(
		'cram',
		[ 'nex', 'list()' ],
		function(env, executionEnvironment) {
			let lst = env.lb('list');
			lst.prependChild(env.lb('nex'));
			return lst;
		},
		'permanently alters |list by prepending |nex to it.'
	);

	Builtin.createBuiltin(
		'eq',
		[ 'lhs', 'rhs' ],
		function(env, executionEnvironment) {
			let lhs = env.lb('lhs');
			let rhs = env.lb('rhs');
			return new Bool(rhs.getID() == lhs.getID());
		},
		'returns true if |lhs and |rhs refer to the same in-memory object.'
	);

	Builtin.createBuiltin(
		'equal',
		[ 'lhs', 'rhs' ],
		function(env, executionEnvironment) {
			let lhs = env.lb('lhs');
			let rhs = env.lb('rhs');
			if (lhs instanceof Bool && rhs instanceof Bool) {
				return new Bool(lhs.getTypedValue() == rhs.getTypedValue());
			} else if (lhs instanceof Builtin && rhs instanceof Builtin) {
				return new Bool(lhs.getID() == rhs.getID());
			} else if (lhs instanceof EString && rhs instanceof EString) {
				return new Bool(lhs.getFullTypedValue() == rhs.getFullTypedValue());
			} else if (lhs instanceof ESymbol && rhs instanceof ESymbol) {
				return new Bool(lhs.getTypedValue() == rhs.getTypedValue());
			} else if (lhs instanceof Float && rhs instanceof Float) {
				return new Bool(lhs.getTypedValue() == rhs.getTypedValue());
			} else if (lhs instanceof Integer && rhs instanceof Integer) {
				return new Bool(lhs.getTypedValue() == rhs.getTypedValue());

			// mixing numeric types should work though
			} else if (lhs instanceof Float && rhs instanceof Integer) {
				return new Bool(lhs.getTypedValue() == rhs.getTypedValue());
			} else if (lhs instanceof Integer && rhs instanceof Float) {
				return new Bool(lhs.getTypedValue() == rhs.getTypedValue());


			} else if (lhs instanceof Letter && rhs instanceof Letter) {
				return new Bool(lhs.getText() == rhs.getText());
			} else if (lhs instanceof Separator && rhs instanceof Separator) {
				return new Bool(lhs.getText() == rhs.getText());
			} else if (lhs instanceof Nil && rhs instanceof Nil) {
				return new Bool(true);


			} else if (lhs instanceof Command && rhs instanceof Command) {
				return new EError('equal: equal for lists is not implemented yet. Sorry!')
			} else if (lhs instanceof Lambda && rhs instanceof Lambda) {
				return new EError('equal: equal for lists is not implemented yet. Sorry!')
			} else if (lhs instanceof Doc && rhs instanceof Doc) {
				return new EError('equal: equal for lists is not implemented yet. Sorry!')
			} else if (lhs instanceof Line && rhs instanceof Line) {
				return new EError('equal: equal for lists is not implemented yet. Sorry!')
			} else if (lhs instanceof Word && rhs instanceof Word) {
				return new EError('equal: equal for lists is not implemented yet. Sorry!')
			} else if (lhs instanceof Zlist && rhs instanceof Zlist) {
				return new EError('equal: equal for lists is not implemented yet. Sorry!')
			} else if (lhs instanceof Expectation && rhs instanceof Expectation) {
				return new EError('equal: equal for lists is not implemented yet. Sorry!')
			} else {
				return new Bool(false);
			}
		},
		'returns true if |lhs and |rhs have the same semantic value (specific implementation depends on the type |lhs and |rhs).'
	);

	// 'eval' is really eval again because args to functions are evaled
	Builtin.createBuiltin(
		'eval',
		[ 'nex' ],
		function(env, executionEnvironment) {
			let expr = env.lb('nex');
			let newresult = evaluateNexSafely(expr, executionEnvironment);
			// we do not wrap errors for eval - we let
			// the caller deal with it
			return newresult;				
		},
		'returns the result of evaluating |nex.'
	);

	Builtin.createBuiltin(
		'filter-with',
		[ 'list()', 'func&' ],
		function(env, executionEnvironment) {
			let list = env.lb('list');
			let closure = env.lb('func');
			let resultList = list.makeCopy(true /* shallow */);
			for (let i = 0; i < list.numChildren(); i++) {
				let item = list.getChildAt(i);
				let cmd = Command.makeCommandWithClosure(closure, Command.quote(list.getChildAt(i)));
				let result = evaluateNexSafely(cmd, executionEnvironment);
				if (Utils.isFatalError(result)) {
					return wrapError('&szlig;', `filter-with: error returned from item ${i+1}`, result);
				}
				if (result.getTypedValue()) {
					resultList.appendChild(list.getChildAt(i));
				}
			}
			return resultList;				
		},
		'returns a new list containing only the elements of |list for which |func calls true when it is called on that element.'
	);

	Builtin.createBuiltin(
		'map-with',
		[ 'list()', 'func&' ],
		function(env, executionEnvironment) {
			let closure = env.lb('func');
			let list = env.lb('list');
			// until we congeal things down to a single list type
			// I'll try to honor the list type of the starting list
			let resultList = list.makeCopy(true /* shallow */);
			for (let i = 0; i < list.numChildren(); i++) {
				let item = list.getChildAt(i);
				let cmd = Command.makeCommandWithClosure(closure, Command.quote(item))
				let result = evaluateNexSafely(cmd, executionEnvironment);
				if (Utils.isFatalError(result)) {
					return wrapError('&szlig;', `map-with: error returned from item ${i+1}`, result);
				}
				resultList.appendChild(result);

			}
			return resultList;				
		},
		'goes through all the elements in |list and replaces each one with the result of calling |func on that element.'
	);

	Builtin.createBuiltin(
		'quote',
		[ '_nex' ],
		function(env, executionEnvironment) {
			return env.lb('nex');
		},
		'returns the unevaluated form of |nex.'
	);

	Builtin.createBuiltin(
		'reduce-with-starting',
		[ 'list()', 'func&', 'startvalue' ],
		function(env, executionEnvironment) {
			let list = env.lb('list');
			let closure = env.lb('func');
			let sn = env.lb('startvalue');
			let p = sn;
			for (let i = 0; i < list.numChildren(); i++) {
				let item = list.getChildAt(i);
				let cmd = Command.makeCommandWithClosure(closure, Command.quote(item), Command.quote(p));
				let result = evaluateNexSafely(cmd, executionEnvironment);
				if (Utils.isFatalError(result)) {
					return wrapError('&szlig;', `reduce-with-starting: error returned from item ${i+1}`, result);
				}
				p = result;
			}
			return p;				
		},
		'progressively updates a value, starting with |startvalue, by calling |func on each element in |list, passing in 1. the list element and 2. the progressively updated value, returning the final updated value.'
	);



}

export { createBasicBuiltins }

