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

function createBasicBuiltins() {
	Builtin.createBuiltin(
		'copy',
		[
			{name:'nex', type:'*'}
		],
		function(env, argEnv) {
			return env.lb('nex').makeCopy();
		}
	);


	Builtin.createBuiltin(
		'car',
		[
			{name:'list()', type:'NexContainer'}
		],
		function(env, argEnv) {
			let lst = env.lb('list()');
			if (lst.numChildren() == 0) {
				return new EError('car: cannot get first element of empty list. Sorry!');
			}
			return lst.getFirstChild();
		}
	);

	Builtin.createBuiltin(
		'cdr',
		[
			{name:'list()', type:'NexContainer'}
		],
		function(env, argEnv) {
			let c = env.lb('list()');
			if (c.numChildren() == 0) {
				return new EError("cdr: given an empty list, cannot make a new list with first element removed. Sorry!");
			}
			let newOne = c.makeCopy(true);
			c.getChildrenForCdr(newOne);
			return newOne;
		}
	);

	Builtin.createBuiltin(
		'cons',
		[
			{name:'nex', type:'*'},
			{name:'list()', type:'NexContainer'},
		],
		function(env, argEnv) {
			let lst = env.lb('list()');
			let nex = env.lb('nex');
			let newOne = lst.makeCopy(true);
			lst.setChildrenForCons(nex, newOne);
			return newOne;
		}
	);

	Builtin.createBuiltin(
		'cap',
		[
			{name:'list()', type:'NexContainer'}
		],
		function(env, argEnv) {
			let c = env.lb('list()');
			if (c.numChildren() == 0) {
				return new EError("chop: cannot get first element of empty list. Sorry!");
			}
			let r = c.getChildAt(0);
			c.removeChild(c.getChildAt(0));
			return r;
		}
	);

	Builtin.createBuiltin(
		'chop',
		[
			{name:'list()', type:'NexContainer'}
		],
		function(env, argEnv) {
			let c = env.lb('list()');
			if (c.numChildren() == 0) {
				return new EError("chop: cannot remove first element of empty list. Sorry!");
			}
			c.removeChild(c.getChildAt(0));
			return c;
		}
	);

	Builtin.createBuiltin(
		'cram',
		[
			{name:'nex', type:'*'},
			{name:'list()', type:'NexContainer'},
		],
		function(env, argEnv) {
			let lst = env.lb('list()');
			lst.prependChild(env.lb('nex'));
			return lst;
		}
	);

	Builtin.createBuiltin(
		'quote',
		[
			{name:'_nex', type:'*', skipeval:true},
		],
		function(env, argEnv) {
			return env.lb('_nex');
		}
	);

	Builtin.createBuiltin(
		'begin',
		[
			{name:'nex...', type:'*', variadic:true}
		],
		function(env, argEnv) {
			let lst = env.lb('nex...');
			if (lst.numChildren() == 0) {
				return new Nil();
			} else {
				return lst.getChildAt(lst.numChildren() - 1);
			}
		}
	);

	// in order to make this variadic so it mirrors begin it has to be a builtin
	Builtin.createBuiltin(
		'run',
		[
			{name:'_nex...', type:'*', skipeval:true, variadic:true}
		],
		function(env, argEnv) {
			let lst = env.lb('_nex...');
			let resultRun = new Command('run');
			resultRun.setVertical();
			for (let i = 0; i < lst.numChildren(); i++) {
				let c = lst.getChildAt(i);
				let result = evaluateNexSafely(c, argEnv);
				let ccopy = c.makeCopy();
				resultRun.appendChild(ccopy);
				if (result.getTypeName() == '-error-') {
					resultRun.appendChild(result);
					ccopy.addTag(new Tag("Error follows"));
				}
			}
			return resultRun;
		}
	);

	// 'eval' is really eval again because args to functions are evaled
	Builtin.createBuiltin(
		'eval',
		[
			{name: 'nex', type:'*'}
		],
		function(env, argEnv) {
			let expr = env.lb('nex');
			let newresult = evaluateNexSafely(expr, argEnv);
			// we do not wrap errors for eval - we let
			// the caller deal with it
			return newresult;				
		}
	);

	Builtin.createBuiltin(
		'map-with',
		[
			{name: 'list()', type:'NexContainer'},
			{name: 'func&', type:'Lambda'}
		],
		function(env, argEnv) {
			let lam = env.lb('func&');
			let list = env.lb('list()');
			// until we congeal things down to a single list type
			// I'll try to honor the list type of the starting list
			let resultList = new Word();
			if (list.getTypeName() == '-line-') {
				resultList = new Line();
			} else if (list.getTypeName() == '-doc-') {
				resultList = new Doc();
			} else if (list.getTypeName() == '-zlist-') {
				resultList = new Zlist();
			}
			for (let i = 0; i < list.numChildren(); i++) {
				let item = list.getChildAt(i);
				let cmd = new Command('');
				cmd.appendChild(lam);
				cmd.appendChild(list.getChildAt(i));				
				let result = evaluateNexSafely(cmd, argEnv);
				resultList.appendChild(result);

			}
			return resultList;				
		}
	);

	Builtin.createBuiltin(
		'reduce-with-starting',
		[
			{name: 'list()', type:'NexContainer'},
			{name: 'func&', type:'Lambda'},
			{name: 'startval', type:'*'}
		],
		function(env, argEnv) {
			let lam = env.lb('func&');
			let sn = env.lb('startval');
			let list = env.lb('list()');
			let p = sn;
			for (let i = 0; i < list.numChildren(); i++) {
				let item = list.getChildAt(i);
				let cmd = new Command('');
				cmd.appendChild(lam);
				cmd.appendChild(list.getChildAt(i));				
				cmd.appendChild(p);
				let result = evaluateNexSafely(cmd, argEnv);
				p = result;
			}
			return p;				
		}
	);

	Builtin.createBuiltin(
		'filter-with',
		[
			{name: 'list()', type:'NexContainer'},
			{name: 'func&', type:'Lambda'}
		],
		function(env, argEnv) {
			let lam = env.lb('func&');
			let list = env.lb('list()');
			let resultList = new Word();
			if (list.getTypeName() == '-line-') {
				resultList = new Line();
			} else if (list.getTypeName() == '-doc-') {
				resultList = new Doc();
			} else if (list.getTypeName() == '-zlist-') {
				resultList = new Zlist();
			}
			for (let i = 0; i < list.numChildren(); i++) {
				let item = list.getChildAt(i);
				let cmd = new Command('');
				cmd.appendChild(lam);
				cmd.appendChild(list.getChildAt(i));				
				let result = evaluateNexSafely(cmd, argEnv);
				if (result.getTypedValue()) {
					resultList.appendChild(list.getChildAt(i));
				}
			}
			return resultList;				
		}
	);
	Builtin.createBuiltin(
		'eq',
		[
			{name: 'lhs', type:'*'},
			{name: 'rhs', type:'*'}
		],
		function(env, argEnv) {
			let lhs = env.lb('lhs');
			let rhs = env.lb('rhs');
			return new Bool(rhs.getID() == lhs.getID());
		}
	);

	Builtin.createBuiltin(
		'equal',
		[
			{name: 'lhs', type:'*'},
			{name: 'rhs', type:'*'}
		],
		function(env, argEnv) {
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
	);
}