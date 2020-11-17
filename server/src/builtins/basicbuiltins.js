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

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $dumpMemory(env, executionEnvironment) {
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
	}

	Builtin.createBuiltin(
		'dump-memory',
		[ 'closure&' ],
		$dumpMemory,
		'returns the memory environment of |exp, in the form of a list containing all bound symbols along with their values.'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $seeId(env, executionEnvironment) {
		let nex = env.lb('nex');
		return new EString('' + nex.getID());
	}

	Builtin.createBuiltin(
		'see-id',
		[ 'nex' ],
		$seeId,
		'returns the ID of |nex as a string.'
	);


	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $begin(env, executionEnvironment) {
		let lst = env.lb('nex');
		if (lst.numChildren() == 0) {
			return new Nil();
		} else {
			return lst.getChildAt(lst.numChildren() - 1);
		}
	}

	Builtin.createBuiltin(
		'begin',
		[ 'nex...' ],
		$begin,
		'all arguments are evaluated in order from first to last, and the result of the last evaluation is returned.'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $cap(env, executionEnvironment) {
		let c = env.lb('list');
		if (c.numChildren() == 0) {
			return new EError("cap: cannot get first element of empty list. Sorry!");
		}
		let r = c.getChildAt(0);
		c.removeChild(c.getChildAt(0));
		return r;
	}

	Builtin.createBuiltin(
		'cap',
		[ 'list()' ],
		$cap,
		'destructively and permanently removes the first element of |list, and returns the removed element.'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $car(env, executionEnvironment) {
		let lst = env.lb('list');
		if (lst.numChildren() == 0) {
			return new EError('first/car: cannot get first element of empty list. Sorry!');
		}
		return lst.getFirstChild();
	}

	Builtin.createBuiltin(
		'car',
		[ 'list()' ],
		$car,
		'returns the first element of |list, without altering |list in any way.'
	);

	Builtin.aliasBuiltin('first', 'car');

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $cdr(env, executionEnvironment) {
		let c = env.lb('list');
		if (c.numChildren() == 0) {
			return new EError("rest/cdr: given an empty list, cannot make a new list with first element removed. Sorry!");
		}
		let newOne = c.makeCopy(true);
		c.getChildrenForCdr(newOne);
		return newOne;
	}

	Builtin.createBuiltin(
		'cdr',
		[ 'list()' ],
		$cdr,
		'returns a new list containing all elements of |list except the first one.'
	);

	Builtin.aliasBuiltin('rest', 'cdr');

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $chop(env, executionEnvironment) {
		let c = env.lb('list');
		if (c.numChildren() == 0) {
			return new EError("chop: cannot remove first element of empty list. Sorry!");
		}
		c.removeChild(c.getChildAt(0));
		return c;
	}

	Builtin.createBuiltin(
		'chop',
		[ 'list()' ],
		$chop,
		'destructively and permanently removes the first element of |list, and returns |list.'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $cons(env, executionEnvironment) {
		let nex = env.lb('nex');
		let lst = env.lb('list');
		let newOne = lst.makeCopy(true);
		lst.setChildrenForCons(nex, newOne);
		return newOne;
	}

	Builtin.createBuiltin(
		'cons',
		[ 'nex', 'list()' ],
		$cons,
		'creates a new list by prepending |nex to |list, and returns the new list.'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $copy(env, executionEnvironment) {
		return env.lb('nex').makeCopy();
	}

	Builtin.createBuiltin(
		'copy',
		[ 'nex' ],
		$copy,
		'returns a deep copy of |nex (if |nex is a list, list elements are also copied).'
	);


	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $cram(env, executionEnvironment) {
		let lst = env.lb('list');
		lst.prependChild(env.lb('nex'));
		return lst;
	}

	Builtin.createBuiltin(
		'cram',
		[ 'nex', 'list()' ],
		$cram,
		'permanently alters |list by prepending |nex to it.'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $eq(env, executionEnvironment) {
		let lhs = env.lb('lhs');
		let rhs = env.lb('rhs');
		return new Bool(rhs.getID() == lhs.getID());
	}

	Builtin.createBuiltin(
		'eq',
		[ 'lhs', 'rhs' ],
		$eq,
		'returns true if |lhs and |rhs refer to the same in-memory object.'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

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
		} else if (lhs instanceof Zlist && rhs instanceof Zlist) {
			return new EError('equal: equal for lists is not implemented yet. Sorry!')
		} else if (lhs instanceof Expectation && rhs instanceof Expectation) {
			return new EError('equal: equal for lists is not implemented yet. Sorry!')
		} else {
			return new Bool(false);
		}
	}

	Builtin.createBuiltin(
		'equal',
		[ 'lhs', 'rhs' ],
		$equal,
		'returns true if |lhs and |rhs have the same semantic value (specific implementation depends on the type |lhs and |rhs).'
	);

	
	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	// 'eval' is really `eval again` because args to functions are evaled
	
	function $eval(env, executionEnvironment) {
		let expr = env.lb('nex');
		let newresult = evaluateNexSafely(expr, executionEnvironment);
		// we do not wrap errors for eval - we let
		// the caller deal with it
		return newresult;				
	}

	Builtin.createBuiltin(
		'eval',
		[ 'nex' ],
		$eval,
		'returns the result of evaluating |nex.'
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $quote(env, executionEnvironment) {
		return env.lb('nex');
	}

	Builtin.createBuiltin(
		'quote',
		[ '_nex' ],
		$quote,
		'returns the unevaluated form of |nex.'
	);

}

export { createBasicBuiltins }

