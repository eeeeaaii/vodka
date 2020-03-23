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

function createFileBuiltins() {

	Builtin.createBuiltin(
		'save',
		[
			{name:'_name@', type:'ESymbol', skipeval:true},
			{name:'_nex', type:'*', skipeval:true}
		],
		function(env, argEnv) {
			let namesym = env.lb('_name@');
			let nm = namesym.getTypedValue();
			let val = env.lb('_nex');			
			let exp = new Expectation();
			let savingMessage = new EError("saving...");
			savingMessage.setErrorType(ERROR_TYPE_INFO);
			exp.appendChild(savingMessage)
			saveNex(nm, val, exp);
			return exp;
		}
	);

	// in order to make this variadic so it mirrors begin it has to be a builtin
	Builtin.createBuiltin(
		'save-and-run',
		[
			{name:'_name@', type:'ESymbol', skipeval:true},
			{name:'_nex...', type:'*', skipeval:true, variadic:true}
		],
		function(env, argEnv) {
			let namesym = env.lb('_name@');
			let lst = env.lb('_nex...');
			let nm = namesym.getTypedValue();
			// construct thing to save
			let toSave = new Command('run');
			toSave.setVertical();
			// we aren't running it yet.
			for (let i = 0; i < lst.numChildren(); i++) {
				let c = lst.getChildAt(i);
				toSave.appendChild(c.makeCopy());
			}
			let exp = new Expectation();
			let savingMessage = new EError("saving...");
			savingMessage.setErrorType(ERROR_TYPE_INFO);
			exp.appendChild(savingMessage)
			saveNexWithCallback(nm, toSave, exp, (function(result) {
				let resultRun = new Command('save-and-run');
				resultRun.setVertical();
				resultRun.appendChild(namesym.makeCopy());
				for (var i = 0; i < toSave.numChildren(); i++) {
					let c = toSave.getChildAt(i);
					let result = evaluateNexSafely(c, argEnv);
					let ccopy = c.makeCopy();
					resultRun.appendChild(ccopy);
					if (result.getTypeName() == '-error-') {
						resultRun.appendChild(result);
						ccopy.addTag(new Tag("Error follows"));
					}
				}
				exp.fulfill(resultRun);
			}).bind(this));
			return exp;
		}
	);


	Builtin.createBuiltin(
		'save-result',
		[
			{name:'_name@', type:'ESymbol', skipeval:true},
			{name:'nex', type:'*'}
		],
		function(env, argEnv) {
			let namesym = env.lb('_name@');
			let nm = namesym.getTypedValue();
			let val = env.lb('nex');			
			let exp = new Expectation();
			exp.appendChild(namesym)
			saveNex(nm, val, exp);
			return exp;
		}
	);

	Builtin.createBuiltin(
		'load',
		[
			{name:'_name@', type:'ESymbol', skipeval:true},
		],
		function(env, argEnv) {
			let namesym = env.lb('_name@');
			let nm = namesym.getTypedValue();
			let exp = new Expectation();
			exp.appendChild(namesym)
			loadNex(nm, exp);
			return exp;
		}
	);

	Builtin.createBuiltin(
		'import',
		[
			{name:'_name@', type:'ESymbol', skipeval:true},
		],
		function(env, argEnv) {
			let namesym = env.lb('_name@');
			let nm = namesym.getTypedValue();
			let exp = new Expectation();
			exp.appendChild(namesym)
			importNex(nm, exp);
			return exp;
		}
	);

	Builtin.createBuiltin(
		'with-imports',
		[
			{name:'imports()', type:'NexContainer'},
			{name:'_nex', type:'*', skipeval:true}
		],
		function(env, argEnv) {
			let importList = env.lb('imports()');
			let nex = env.lb('_nex');
			let exp = new Expectation();
			exp.appendChild(importList);
			importChain(importList, nex, exp);
			return exp;
		}
	);
}