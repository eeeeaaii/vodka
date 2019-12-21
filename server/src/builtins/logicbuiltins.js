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

class IfArgEvaluator extends BuiltinArgEvaluator {
	constructor(name, params, argContainer, env, bindEnv) {
		super(name, params, argContainer, env, bindEnv);
		this.conditionalEvaluated = false;
	}

	startEvaluating() {
		super.startEvaluating();
		if (!this.argContainer.getNeedsEvalForArgAt(0)) {
			this.conditionalEvaluated = true;
			this.conditionalResult = this.argContainer.getArgAt(0).getTypedValue();
		}
	}

	indexOfNextUnevaluatedExpression() {
		if (!this.conditionalEvaluated) {
			return 0;
		} else {
			if (this.conditionalResult) {
				var needs = this.argContainer.getNeedsEvalForArgAt(1);
				return needs ? 1 : -1;
			} else {
				var needs = this.argContainer.getNeedsEvalForArgAt(2);
				return needs ? 2 : -1;
			}
		}
	}

	evaluateNext(exp) {
		var ind = this.indexOfNextUnevaluatedExpression();
		// shouldn't be -1!
		if (ind < 0) {
			throw new Error('wut');
		}
		if (ind == 0) {
			this.argContainer.setNeedsEvalForArgAt(false, ind);
			var arg = this.argContainer.getArgAt(ind);
			arg.stepEvaluate(this.env, exp);
			var oldhack = exp.hackfunction;
			exp.hackfunction = function() {
				var r = oldhack();
				this.conditionalEvaluated = true;
				this.conditionalResult = r.getTypedValue();
				return r;
			}.bind(this);
			this.argContainer.setArgAt(exp, ind);
			exp.appendChild(arg);
		} else {
			this.argContainer.setNeedsEvalForArgAt(false, ind);
			var arg = this.argContainer.getArgAt(ind);
			arg.stepEvaluate(this.env, exp);
			this.argContainer.setArgAt(exp, ind);
			exp.appendChild(arg);
		}
		
	}

	allExpressionsEvaluated() {
		return this.indexOfNextUnevaluatedExpression() == -1;
	}

}

function createLogicBuiltins() {
	Builtin.createBuiltin(
		'not',
		[
			{name:'a0', type:'Bool'},
		],
		function(env, argEnv) {
			return new Bool(!env.lb('a0').getTypedValue());
		}
	)


	Builtin.createBuiltin(
		'and',
		[
			{name:'a0', type:'Bool'},
			{name:'a1', type:'Bool'},
		],
		function(env, argEnv) {
			return new Bool(env.lb('a0').getTypedValue() && env.lb('a1').getTypedValue());
		}
	)

	Builtin.createBuiltin(
		'or',
		[
			{name:'a0', type:'Bool'},
			{name:'a1', type:'Bool'},
		],
		function(env, argEnv) {
			return new Bool(env.lb('a0').getTypedValue() || env.lb('a1').getTypedValue());
		}
	)

	Builtin.createBuiltin(
		'if',
		[
			{name:'a0', type:'Bool'},
			{name:'a1', type:'*'}, // skipeval sort of, see custom evaluator
			{name:'a2', type:'*'}, // skipeval sort of, see custom evaluator
		],
		function(env, argEnv) {
			var b = env.lb('a0').getTypedValue();
			if (b) {
				return env.lb('a1').evaluate(argEnv);
			} else {
				return env.lb('a2').evaluate(argEnv);
			}
		},
		function(name, params, args, argEnv, closure) {
			return new IfArgEvaluator(name, params, args, argEnv, closure);
		}
	)

	
}