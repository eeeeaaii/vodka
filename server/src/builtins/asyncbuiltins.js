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

function createAsyncBuiltins() {
	Builtin.createBuiltin(
		'ff-after',
		[
			{name: 'exp,', type:'Expectation'},
			{name: 'time#', type:'Integer'}
		],
		function(env, argEnv) {
			let time = env.lb('time#').getTypedValue();
			let exp = env.lb('exp,');
			let newexp = exp.makeCopy();
			setTimeout(function() {
				newexp.fulfill();
			}, time);
			return newexp;
		}
	);


	Builtin.createBuiltin(
		'ff-with',
		[
			{name: 'exp,', type:'Expectation'},
			{name: 'func&', type:'Lambda'}
		],
		function(env, argEnv) {
			let lambda = env.lb('func&');
			let exp = env.lb('exp,');
			let newexp = exp.makeCopy();
			let fff = function() {
				let cmd = new Command('');
				cmd.appendChild(lambda);
				cmd.appendChild(newexp.getChildAt(0));
				return evaluateNexSafely(cmd, argEnv);
			};
			newexp.setFFF(fff);
			return newexp;
		}
	);

	

	// deprecated
	Builtin.createBuiltin(
		'do-when-fulfilled',
		[
			{name: 'func&', type:'Lambda'},
			{name: 'exp,', type:'Expectation'}
		],
		function(env, argEnv) {
			let lambda = env.lb('func&');
			let exp = env.lb('exp,');
			let retExp = new Expectation();
			exp.addCompletionListener(function(result) {
				let cmd = new Command('');
				cmd.appendChild(lambda);
				cmd.appendChild(result);
				let newresult = evaluateNexSafely(cmd, argEnv);
				retExp.fulfill(newresult);
			})
			return retExp;
		}
	);

	// deprecated
	Builtin.createBuiltin(
		'eval-after',
		[
			{name: 'cmd', type:'*'},
			{name: 'time#', type:'Integer'}
		],
		function(env, argEnv) {
			let time = env.lb('time#').getTypedValue();
			let toEval = env.lb('cmd');
			let exp = new Expectation();
			setTimeout(function() {
				exp.fulfill(evaluateNexSafely(toEval, argEnv));
			}, time);
			return exp;
		}
	);

	// TODO: move this to typecreation.js and make ones for other types
	Builtin.createBuiltin(
		'make-expectation',
		[
			{name: 'nex', type:'*'}
		],
		function(env, argEnv) {
			let exp = new Expectation();
			exp.appendChild(env.lb('nex'));
			return exp;
		}
	);



	// TODO: bootstrap
	Builtin.createBuiltin(
		'do-on-after',
		[
			{name: 'func&', type:'Lambda'},
			{name: 'arg', type:'*'},
			{name: 'delay#', type:'Integer'}
		],
		function(env, argEnv) {
			let lambda = env.lb('func&');
			let arg = env.lb('arg');
			let delay = env.lb('delay#');
			let e = new Expectation();
			e.appendChild(arg);
			let clearVar = setTimeout(function() {
				let cmd = new Command('');
				cmd.appendChild(lambda);
				e.removeChild(arg); // eventually not needed
				cmd.appendChild(arg);
				let result = evaluateNexSafely(cmd, argEnv);
				e.fulfill(result);
			}.bind(this), delay.getTypedValue());
			e.setDeleteHandler(function() {
				clearTimeout(clearVar);
			}.bind(this));
			return e;
		}
	);
}