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

import { Nex } from '../nex/nex.js' 
import { NexContainer } from '../nex/nexcontainer.js' 
import { ValueNex } from '../nex/valuenex.js' 
import { Bool } from '../nex/bool.js' 
import { Builtin } from '../nex/builtin.js' 
import { Closure } from '../nex/closure.js' 
import { Command } from '../nex/command.js' 
import { Doc } from '../nex/doc.js' 
import { EError } from '../nex/eerror.js' 
import { EString } from '../nex/estring.js' 
import { ESymbol } from '../nex/esymbol.js' 
import { Expectation } from '../nex/expectation.js' 
import { Float } from '../nex/float.js' 
import { Integer } from '../nex/integer.js' 
import { Lambda } from '../nex/lambda.js' 
import { Letter } from '../nex/letter.js' 
import { Line } from '../nex/line.js' 
import { NativeOrg } from '../nex/nativeorg.js' 
import { Nil } from '../nex/nil.js' 
import { Org } from '../nex/org.js' 
import { Root } from '../nex/root.js' 
import { Separator } from '../nex/separator.js' 
import { Word } from '../nex/word.js' 

function createTestBuiltins() {

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $isBoolean(env, executionEnvironment) {
		return new Bool(env.lb('nex') instanceof Bool);
	}

	Builtin.createBuiltin(
		'is-boolean',
		[ 'nex' ],
		$isBoolean
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $isCommand(env, executionEnvironment) {
		return new Bool(env.lb('nex') instanceof Command);
	}

	Builtin.createBuiltin(
		'is-command',
		[ 'nex' ],
		$isCommand
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $isDoc(env, executionEnvironment) {
		return new Bool(env.lb('nex') instanceof Doc);
	}

	Builtin.createBuiltin(
		'is-page',
		[ 'nex' ],
		$isDoc
	);

	Builtin.aliasBuiltin('is-doc', 'is-page');

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $isEmpty(env, executionEnvironment) {
		let lst = env.lb('list');
		let rb = !lst.hasChildren();
		return new Bool(rb);
	}

	Builtin.createBuiltin(
		'is-empty',
		[ 'list()' ],
		$isEmpty
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $isExpectation(env, executionEnvironment) {
		return new Bool(env.lb('nex') instanceof Expectation);
	}

	Builtin.createBuiltin(
		'is-expectation',
		[ 'nex' ],
		$isExpectation
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $isError(env, executionEnvironment) {
		return new Bool(env.lb('nex') instanceof EError);
	}

	Builtin.createBuiltin(
		'is-error',
		[ 'nex' ],
		$isError
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $isFloat(env, executionEnvironment) {
		return new Bool(env.lb('nex') instanceof Float);
	}

	Builtin.createBuiltin(
		'is-float',
		[ 'nex' ],
		$isFloat
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $isInteger(env, executionEnvironment) {
		return new Bool(env.lb('nex') instanceof Integer);
	}

	Builtin.createBuiltin(
		'is-integer',
		[ 'nex' ],
		$isInteger
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $isLambda(env, executionEnvironment) {
		return new Bool(env.lb('nex') instanceof Lambda);
	}

	Builtin.createBuiltin(
		'is-lambda',
		[ 'nex' ],
		$isLambda
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $isLetter(env, executionEnvironment) {
		return new Bool(env.lb('nex') instanceof Letter);
	}

	Builtin.createBuiltin(
		'is-letter',
		[ 'nex' ],
		$isLetter
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $isLine(env, executionEnvironment) {
		return new Bool(env.lb('nex') instanceof Line);
	}

	Builtin.createBuiltin(
		'is-line',
		[ 'nex' ],
		$isLine
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $isList(env, executionEnvironment) {
		return new Bool(env.lb('nex') instanceof NexContainer);
	}

	Builtin.createBuiltin(
		'is-list',
		[ 'nex' ],
		$isList
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $isNil(env, executionEnvironment) {
		return new Bool(env.lb('nex') instanceof Nil);
	}

	Builtin.createBuiltin(
		'is-nil',
		[ 'nex' ],
		$isNil
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $isSeparator(env, executionEnvironment) {
		return new Bool(env.lb('nex') instanceof Separator
			&& !(env.lb('nex') instanceof Letter));
	}

	Builtin.createBuiltin(
		'is-separator',
		[ 'nex' ],
		$isSeparator
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $isString(env, executionEnvironment) {
		return new Bool(env.lb('nex') instanceof EString);
	}

	Builtin.createBuiltin(
		'is-string',
		[ 'nex' ],
		$isString
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $isSymbol(env, executionEnvironment) {
		return new Bool(env.lb('nex') instanceof ESymbol);
	}

	Builtin.createBuiltin(
		'is-symbol',
		[ 'nex' ],
		$isSymbol
	);

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  

	function $isWord(env, executionEnvironment) {
		return new Bool(env.lb('nex') instanceof Word);
	}

	Builtin.createBuiltin(
		'is-word',
		[ 'nex' ],
		$isWord
	);

}

export { createTestBuiltins }

