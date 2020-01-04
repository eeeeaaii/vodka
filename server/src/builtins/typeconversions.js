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


function createTypeConversionBuiltins() {
	Builtin.createBuiltin(
		'to-string',
		[
			{name:'a0', type:'*'},
		],
		function(env, argEnv) {
			let v = env.lb('a0');
			let s = "";
			if (v instanceof Bool) {
				s = v.getTypedValue() ? 'yes' : 'no';
			} else if (v instanceof Float) {
				s = '' + v.getTypedValue();
			} else if (v instanceof Integer) {
				s = '' + v.getTypedValue();
			} else if (v instanceof Letter) {
				s = '' + v.getText();
			} else if (v instanceof Separator) {
				s = '' + v.getText();
			} else if (v instanceof Word || v instanceof Line || v instanceof Doc) {
				try {
					s = v.getValueAsString();
				} catch (eerror) {
					// probably contained non-letters
				}
			}
			if (!s) {
				return new EError('Could not convert to string, invalid format');
			} else {
				return new EString(s);
			}

		}
	);
}