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
import { Nil } from '../nex/nil.js'
import { EError } from '../nex/eerror.js'
import { Doc } from '../nex/doc.js' 
import { Line } from '../nex/line.js' 
import { Command } from '../nex/command.js' 
import { Expectation } from '../nex/expectation.js' 
import { Lambda } from '../nex/lambda.js' 
import { Zlist } from '../nex/zlist.js' 
import { Org } from '../nex/org.js' 
import { ERROR_TYPE_INFO, ERROR_TYPE_FATAL, ERROR_TYPE_WARN } from '../nex/eerror.js'

function createMakeBuiltins() {

  Builtin.createBuiltin(
  	'make-nil',
  	[],
  	function $makeNil(env, executionEnvironment) {
  		return new Nil();
  	},
  	'creates a nil object.'
  );

	Builtin.createBuiltin(
		'make-command',
		['nex...'],
		function $makeCommand(env, executionEnvironment) {
			let args = env.lb('nex');
			let cmd = new Command();
			for (let i = 0 ; i < args.numChildren(); i++) {
				let arg = args.getChildAt(i);
				if (i == 0) {
					// should be name of command
					if (arg.getTypeName() == '-symbol-') {
						cmd = new Command(arg.getTypedValue())
					} else {
						cmd = new Command();
						cmd.appendChild(arg);
					}
				} else {
					cmd.appendChild(arg);
				}
			}
			return cmd;
		},
		'creates a new command containing the args as children.'
	);

	Builtin.createBuiltin(
		'make-page',
		['nex...'],
		function $makeDoc(env, executionEnvironment) {
			let args = env.lb('nex');
			let r = new Doc();
			for (let i = 0 ; i < args.numChildren(); i++) {
				r.appendChild(args.getChildAt(i));
			}
			return r;
		},
		'creates a new page containing the args as children.'
	);

	Builtin.aliasBuiltin('make-doc', 'make-page');

	Builtin.createBuiltin(
		'make-expectation',
		[ 'nex...' ],
		function $makeExpectation(env, executionEnvironment) {
			let exps = env.lb('nex');
			let r = new Expectation();
			for (let i = 0 ; i < exps.numChildren(); i++) {
				let c = exps.getChildAt(i);
				r.appendChild(c);
			}
			return r;
		},
		'creates a new expectation containing the args as children.'
	);

	Builtin.createBuiltin(
		'make-lambda',
		['nex...'],
		function $makeLambda(env, executionEnvironment) {
			let exps = env.lb('nex');
			let r = new Lambda();
			for (let i = 0 ; i < exps.numChildren(); i++) {
				let c = exps.getChildAt(i);
				r.appendChild(c);
			}
			return r;
		},
		'creates a new lambda containing the args as children.'
	);

	Builtin.createBuiltin(
		'make-line',
		['nex...'],
		function $makeLine(env, executionEnvironment) {
			let args = env.lb('nex');
			let r = new Line();
			for (let i = 0 ; i < args.numChildren(); i++) {
				r.appendChild(args.getChildAt(i));
			}
			return r;
		},
		'creates a new line containing the args as children.'
	);

	Builtin.createBuiltin(
		'make-word',
		['nex...'],
		function $makeWord(env, executionEnvironment) {
			let args = env.lb('nex');
			let r = new Word();
			for (let i = 0 ; i < args.numChildren(); i++) {
				r.appendChild(args.getChildAt(i));
			}
			return r;
		},
		'creates a new word containing the args as children.'
	);

	Builtin.createBuiltin(
		'make-zlist',
		['nex...'],
		function $makeZlist(env, executionEnvironment) {
			let args = env.lb('nex');
			let r = new Zlist();
			for (let i = 0 ; i < args.numChildren(); i++) {
				r.appendChild(args.getChildAt(i));
			}
			return r;
		},
		'creates a new zlist containing the args as children.'
	);

	Builtin.createBuiltin(
		'make-org',
		['nex...'],
		function $makeOrg(env, executionEnvironment) {
			let args = env.lb('nex');
			let r = new Org();
			for (let i = 0 ; i < args.numChildren(); i++) {
				r.appendChild(args.getChildAt(i));
			}
			return r;
		},
		'creates a new org containing the args as children.'
	);

	Builtin.createBuiltin(
		'make-error',
		['str$'],
		function $makeError(env, executionEnvironment) {
			let str = env.lb('str');
			let r = new EError(str.getFullTypedValue());
			r.setErrorType(ERROR_TYPE_FATAL);
			r.suppressNextCatch();
			return r;
		},
		'creates a new (fatal) error with |str as the description.'
	);

	Builtin.createBuiltin(
		'make-warning',
		['str$'],
		function $makeWarning(env, executionEnvironment) {
			let str = env.lb('str');
			let r = new EError(str.getFullTypedValue());
			r.setErrorType(ERROR_TYPE_WARN);
			return r;
		},
		'creates a new warning (an error with type WARN) with |str as the description.'
	);

	Builtin.createBuiltin(
		'make-info',
		['str$'],
		function $makeInfo(env, executionEnvironment) {
			let str = env.lb('str');
			let r = new EError(str.getFullTypedValue());
			r.setErrorType(ERROR_TYPE_INFO);
			return r;
		},
		'creates a new info (an error with type INFO) with |str as the description.'
	);
}

export { createMakeBuiltins }

