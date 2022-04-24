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

import { BUILTINS, BINDINGS } from './environment.js'

class Autocomplete {
	getMatchesInNames(substring, names) {
		let matches = [];
		for (let i = 0; i < names.length; i++) {
			if (substring == "" || names[i].indexOf(substring) >= 0) {
				matches.push({
					name: names[i],
					matchStart: names[i].indexOf(substring),
					matchEnd: names[i].indexOf(substring) + substring.length
				});
			}
		}
		return matches;
	}

	findAllBindingsMatching(substring) {
		return this.getMatchesInNames(substring, BINDINGS.getAllBoundSymbolsAtThisLevel());
	}

	findAllBuiltinsMatching(substring) {
		return this.getMatchesInNames(substring, BUILTINS.getAllBoundSymbolsAtThisLevel());
	}

	findAllMatches(substring) {
		return this.findAllBuiltinsMatching(substring).concat(this.findAllBindingsMatching(substring));
	}

	sameMatch(m1, m2) {
		return m1.name == m2.name 
			&& m1.matchStart == m2.matchStart
			&& m1.matchLength == m2.matchLength;
	}

	findNextMatchAfter(substring, after) {
		if (substring == "") {
			return "";
		}
		let matches = this.findAllMatches(substring);
		if (matches.length == 0) {
			return null;
		}
		if (!after) {
			return matches[0];
		}
		for (let i = 0; i < matches.length; i++) {
			let b = matches[i];
			if (this.sameMatch(b, after)) {
				let j = (i + 1) % matches.length;
				return matches[j];
			}
		}
		return null;
	}
}

const autocomplete = new Autocomplete();

export { autocomplete }

