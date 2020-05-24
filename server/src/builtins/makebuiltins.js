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

import { Builtin } from '../nex/builtin.js'
import { Word } from '../nex/word.js'
import { EError } from '../nex/eerror.js'
import { Doc } from '../nex/doc.js' 
import { Line } from '../nex/line.js' 
import { Command } from '../nex/command.js' 
import { Expectation } from '../nex/expectation.js' 
import { Lambda } from '../nex/lambda.js' 
import { Zlist } from '../nex/zlist.js' 

function createMakeBuiltins() {
    // I don't think I need "make" functions for atom types. It
    // would be difficult, because "make-integer" would just
    // create the number zero, it's hard to see how that would be useful.
    // (copy #0) would do the same thing.

	Builtin.createBuiltin(
		'make-word',
		[],
		function(env, executionEnvironment) {
			return new Word();
		}
	);

	Builtin.createBuiltin(
		'make-doc',
		[],
		function(env, executionEnvironment) {
			return new Doc();
		}
	);

	Builtin.createBuiltin(
		'make-line',
		[],
		function(env, executionEnvironment) {
			return new Line();
		}
	);

	Builtin.createBuiltin(
		'make-expectation',
		[ 'nex...' ],
		function(env, executionEnvironment) {
			let exps = env.lb('nex');
			let r = new Expectation();
			for (let i = exps.numChildren() - 1; i >= 0; i--) {
				let c = exps.getChildAt(i);
				r.appendChild(c);
			}
			return r;
		}
	);

	Builtin.createBuiltin(
		'make-command',
		[],
		function(env, executionEnvironment) {
			return new Command();
		}
	);

	Builtin.createBuiltin(
		'make-lambda',
		[],
		function(env, executionEnvironment) {
			return new Lambda();
		}
	);

	Builtin.createBuiltin(
		'make-zlist',
		[],
		function(env, executionEnvironment) {
			return new Zlist();
		}
	);
}

export { createMakeBuiltins }

