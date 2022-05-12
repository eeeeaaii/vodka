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
import { DeferredCommand } from '../nex/deferredcommand.js'; 
import { Float } from '../nex/float.js'; 
import { Integer } from '../nex/integer.js'; 
import { Lambda } from '../nex/lambda.js'; 
import { Letter } from '../nex/letter.js'; 
import { Line } from '../nex/line.js'; 
import { NativeOrg } from '../nex/nativeorg.js'; 
import { Nil } from '../nex/nil.js'; 
import { Org } from '../nex/org.js'; 
import { Root } from '../nex/root.js'; 
import { Separator } from '../nex/separator.js'; 
import { Word } from '../nex/word.js'; 

import { evaluateNexSafely, wrapError } from '../evaluator.js'

function createBasicBuiltins() {

	Builtin.createBuiltin(
		'begin',
		[ 'nex...' ],
		function $begin(env, executionEnvironment) {
			let lst = env.lb('nex');
			if (lst.numChildren() == 0) {
				return new Nil();
			} else {
				return lst.getChildAt(lst.numChildren() - 1);
			}
		},
		'Evaluates all arguments in order from first to last, returning only the result of the last evaluation.'
	);


	Builtin.createBuiltin(
		'head',
		[ 'list()' ],
		function $head(env, executionEnvironment) {
			let lst = env.lb('list');
			if (lst.numChildren() == 0) {
				return new EError('head: cannot get first element of empty list. Sorry!');
			}
			return lst.getFirstChild();
		},
		'Returns the first element of |list without altering |list. Aliases: car, first.'
	);
	Builtin.aliasBuiltin('car', 'head');
	Builtin.aliasBuiltin('first', 'head');


	Builtin.createBuiltin(
		'tail',
		[ 'list()' ],
		function $tail(env, executionEnvironment) {
			let c = env.lb('list');
			if (c.numChildren() == 0) {
				return new EError("tail: given an empty list, cannot make a new list with first element removed. Sorry!");
			}
			let newOne = c.makeCopy(true);
			c.getChildrenForCdr(newOne);
			return newOne;
		},
		'Returns a copy of |list containing all elements of |list except the first one. Aliases: cdr, rest.'
	);
	Builtin.aliasBuiltin('cdr', 'tail');
	Builtin.aliasBuiltin('rest', 'tail');


	Builtin.createBuiltin(
		'push into',
		[ 'nex', 'list()' ],
		function $pushInto(env, executionEnvironment) {
			let nex = env.lb('nex');
			let lst = env.lb('list');
			let newOne = lst.makeCopy(true);
			lst.setChildrenForCons(nex, newOne);
			return newOne;
		},
		'Returns a new list created by prepending |nex to a copy of |list. Aliases: cons.'
	);
	Builtin.aliasBuiltin('cons', 'push into');


	Builtin.createBuiltin(
		'hard-head',
		[ 'list()' ],
		function $hardHead(env, executionEnvironment) {
			let c = env.lb('list');
			if (c.numChildren() == 0) {
				return new EError("hard-head: cannot get first element of empty list. Sorry!");
			}
			let r = c.getChildAt(0);
			c.removeChild(c.getChildAt(0));
			return r;
		},
		'Removes the first element of |list, destructively altering list, and returns the removed element. Aliases: hard-car, hard-first, decap.'
	);
	Builtin.aliasBuiltin('hard-car', 'hard-head');
	Builtin.aliasBuiltin('hard-first', 'hard-head');
	Builtin.aliasBuiltin('decap', 'hard-head');


	Builtin.createBuiltin(
		'hard-tail',
		[ 'list()' ],
		function $hardTail(env, executionEnvironment) {
			let c = env.lb('list');
			if (c.numChildren() == 0) {
				return new EError("hard-tail: cannot remove first element of empty list. Sorry!");
			}
			c.removeChild(c.getChildAt(0));
			return c;
		},
		'Destructively removes the first element of |list, and returns the altered |list. Aliases: hard-cdr, hard-rest, chomp.'
	);
	Builtin.aliasBuiltin('hard-cdr', 'hard-tail');
	Builtin.aliasBuiltin('hard-rest', 'hard-tail');
	Builtin.aliasBuiltin('chomp', 'hard-tail');


	Builtin.createBuiltin(
		'hard-push into',
		[ 'nex', 'list()' ],
		function $hardPushInto(env, executionEnvironment) {
			let lst = env.lb('list');
			lst.prependChild(env.lb('nex'));
			return lst;
		},
		'Destructively alters |list by prepending |nex to it. Aliases: cram.'
	);
	Builtin.aliasBuiltin('cram', 'hard-push into');



	Builtin.createBuiltin(
		'copy',
		[ 'nex' ],
		function $copy(env, executionEnvironment) {
			return env.lb('nex').makeCopy();
		},
		'Returns a deep copy of |nex (if |nex is a list, list elements are also copied).'
	);


	Builtin.createBuiltin(
		'eq',
		[ 'lhs', 'rhs' ],
		function $eq(env, executionEnvironment) {
			let lhs = env.lb('lhs');
			let rhs = env.lb('rhs');
			return new Bool(rhs.getID() == lhs.getID());
		},
		'returns true if |lhs and |rhs refer to the same in-memory object (pointer equality).'
	);


	Builtin.createBuiltin(
		'equal',
		[ 'lhs', 'rhs' ],
		function $equal(env, executionEnvironment) {
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
			} else if (lhs instanceof DeferredCommand && rhs instanceof DeferredCommand) {
				return new EError('equal: equal for lists is not implemented yet. Sorry!')
			} else {
				return new Bool(false);
			}
		},
		'Attempts to test |rhs and |lhs for semantic equality (for example, different integers will test as equal if they represent the same numeric value). Works for most atomic types (lists not yet implemented).'
	);

	// Note the args to the eval function are evaluated.
	Builtin.createBuiltin(
		'eval',
		[ 'nex' ],
		function $eval(env, executionEnvironment) {
			let expr = env.lb('nex');
			let newresult = evaluateNexSafely(expr, executionEnvironment);
			// we do not wrap errors for eval - we let
			// the caller deal with it
			return newresult;
		},
		'Returns the result of evaluating |nex. Since the argument to this function is already evaluated anyway, this will actually result in a double evaluation.'
	);

	Builtin.createBuiltin(
		'quote',
		[ '_nex' ],
		function $quote(env, executionEnvironment) {
			return env.lb('nex');
		},
		'Returns |nex without evaluating it. Can be used to stop a function argument from being evaluated.'
	);

	Builtin.createBuiltin(
		'horizontal',
		[ 'list()' ],
		function $horizontal(env, executionEnvironment) {
			let n = env.lb('list');
			n.setHorizontal();
			return n;
		},
		'Sets the direction of |list to horizontal.'
	);


	Builtin.createBuiltin(
		'vertical',
		[ 'list()' ],
		function $vertical(env, executionEnvironment) {
			let n = env.lb('list');
			n.setHorizontal();
			return n;
		},
		'Sets the direction of |list to vertical.'
	);

	Builtin.createBuiltin(
		'zdirectional',
		[ 'list()' ],
		function $zdirectional(env, executionEnvironment) {
			let n = env.lb('list');
			n.setHorizontal();
			return n;
		},
		'Sets the direction of |list to "zdirectional" (elements appear overlapping each other, coming "out" of the screen)'
	);

	Builtin.createBuiltin(
		'mutable',
		[ 'nex' ],
		function $mutable(env, executionEnvironment) {
			let n = env.lb('nex');
			n.setMutable(true);
			return n;
		},
		'Makes |nex mutable.'
	);

	Builtin.createBuiltin(
		'immutable',
		[ 'nex' ],
		function $immutable(env, executionEnvironment) {
			let n = env.lb('nex');
			n.setMutable(false);
			return n;
		},
		'Makes |nex immutable.'
	);
}

export { createBasicBuiltins }

