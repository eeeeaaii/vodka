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
import { Bool } from '../nex/bool.js' 

function createTestBuiltins() {

	Builtin.createBuiltin(
		'is-boolean',
		[ 'nex' ],
		function $isBoolean(env, executionEnvironment) {
			return new Bool(Utils.isBool(env.lb('nex')));
		},
		`Returns true if |nex is a boolean.`
	);

	Builtin.createBuiltin(
		'is-command',
		[ 'nex' ],
		function $isCommand(env, executionEnvironment) {
			return new Bool(Utils.isCommand(env.lb('nex')));
		},
		`Returns true if |nex is a command.`
	);

	Builtin.createBuiltin(
		'is-doc',
		[ 'nex' ],
		function $isDoc(env, executionEnvironment) {
			return new Bool(Utils.isDoc(env.lb('nex')));
		},
		`Returns true if |nex is a doc.`
	);

	Builtin.createBuiltin(
		'is-empty',
		[ 'list()' ],
		function $isEmpty(env, executionEnvironment) {
			let lst = env.lb('list');
			let rb = !lst.hasChildren();
			return new Bool(rb);
		},
		`Returns true if |list is empty.`
	);

	Builtin.createBuiltin(
		'is-deferred-command',
		[ 'nex' ],
		function $isDeferredCommand(env, executionEnvironment) {
			return new Bool(Utils.isDeferredCommand(env.lb('nex')));
		},
		`Returns true if |nex is a deferred command.`
	);

	Builtin.createBuiltin(
		'is-deferred-value',
		[ 'nex' ],
		function $isDeferredValue(env, executionEnvironment) {
			return new Bool(Utils.isDeferredValue(env.lb('nex')));
		},
		`Returns true if |nex is a deferred value.`
	);

	Builtin.createBuiltin(
		'is-error',
		[ 'nex' ],
		function $isError(env, executionEnvironment) {
			return new Bool(Utils.isError(env.lb('nex')));
		},
		`Returns true if |nex is an error.`
	);

	Builtin.createBuiltin(
		'is-float',
		[ 'nex' ],
		function $isFloat(env, executionEnvironment) {
			return new Bool(Utils.isFloat(env.lb('nex')));
		},
		`Returns true if |nex is a float.`
	);

	Builtin.createBuiltin(
		'is-integer',
		[ 'nex' ],
		function $isInteger(env, executionEnvironment) {
			return new Bool(Utils.isInteger(env.lb('nex')));
		},
		`Returns true if |nex is an integer.`
	);

	Builtin.createBuiltin(
		'is-lambda',
		[ 'nex' ],
		function $isLambda(env, executionEnvironment) {
			return new Bool(Utils.isLambda(env.lb('nex')));
		},
		`Returns true if |nex is a lambda.`
	);

	Builtin.createBuiltin(
		'is-letter',
		[ 'nex' ],
		function $isLetter(env, executionEnvironment) {
			return new Bool(Utils.isLetter(env.lb('nex')));
		},
		`Returns true if |nex is a letter.`
	);

	Builtin.createBuiltin(
		'is-line',
		[ 'nex' ],
		function $isLine(env, executionEnvironment) {
			return new Bool(Utils.isLine(env.lb('nex')));
		},
		`Returns true if |nex is a line.`
	);

	Builtin.createBuiltin(
		'is-list',
		[ 'nex' ],
		function $isList(env, executionEnvironment) {
			return new Bool(Utils.isNexContainer(env.lb('nex')));
		},
		`Returns true if |nex is a list.`
	);

	Builtin.createBuiltin(
		'is-nil',
		[ 'nex' ],
		function $isNil(env, executionEnvironment) {
			return new Bool(Utils.isNil(env.lb('nex')));
		},
		`Returns true if |nex is nil.`
	);

	Builtin.createBuiltin(
		'is-separator',
		[ 'nex' ],
		function $isSeparator(env, executionEnvironment) {
			return new Bool(Utils.isSeparator(env.lb('nex')));
		},
		`Returns true if |nex is a separator.`
	);

	Builtin.createBuiltin(
		'is-string',
		[ 'nex' ],
		function $isString(env, executionEnvironment) {
			return new Bool(Utils.isEString(env.lb('nex')));
		},
		`Returns true if |nex is a string.`
	);

	Builtin.createBuiltin(
		'is-symbol',
		[ 'nex' ],
		function $isSymbol(env, executionEnvironment) {
			return new Bool(Utils.isESymbol(env.lb('nex')));
		},
		`Returns true if |nex is a symbol.`
	);

	Builtin.createBuiltin(
		'is-word',
		[ 'nex' ],
		function $isWord(env, executionEnvironment) {
			return new Bool(Utils.isWord(env.lb('nex')));
		},
		`Returns true if |nex is a word.`
	);
}

export { createTestBuiltins }

