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

function createCruxBuiltins() {
	Builtin.createBuiltin(
		'thing',
		[
			{name: 'lst()', type:'NexContainer'}
		],
		function(env, argEnv) {
			let lst = env.lb('lst()');
			let r = new Crux();
			for (let i = 0; i < lst.numChildren(); i++) {
				r.appendChild(lst.getChildAt(i));
			}
			return r;
		}
	);

	Builtin.createBuiltin(
		'do',
		[
			{name: 'crux', type:'*'}, // really a crux, need to error check
			{name: 'args...', type:'*', variadic:true}
		],
		function(env, argEnv, tags) {
			let crux = env.lb('crux');
			let args = env.lb('args...');
			if (tags.length != 1) {
				return new EError('do: this command requires one tag');
			}
			let tag = tags[0];
			try {
				return crux.doJobWithTag(tag, args);
			} catch(e) {
				if (e instanceof EError) {
					if (isFatalError(e)) {
						return wrapError('&szlig;', `do: error doing job ${tag.getName()}`, result);
					} else {
						return e;
					}
				} else {
					throw e;
				}

			}
		}
	);
}