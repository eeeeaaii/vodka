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


class Autocomplete {
	findAllBindingsMatching(substring) {
		let matchingNames = [];
		let names = BINDINGS.getAllBoundSymbolsAtThisLevel();
		for (let i = 0; i < names.length; i++) {
			if (substring == "" || names[i].indexOf(substring) >= 0) {
				matchingNames.push(names[i]);
			}
		}
		return matchingNames;
	}

	findAllBuiltinsMatching(substring) {
		let matchingNames = [];
		let names = BUILTINS.getAllBoundSymbolsAtThisLevel();
		for (let i = 0; i < names.length; i++) {
			if (substring == "" || names[i].indexOf(substring) >= 0) {
				matchingNames.push(names[i]);
			}
		}
		return matchingNames;
	}

	findAllMatches(substring) {
		return this.findAllBuiltinsMatching(substring).concat(this.findAllBindingsMatching(substring));
	}

	findNextMatchAfter(substring, after) {
		if (substring == "") {
			return "";
		}
		let matches = this.findAllMatches(substring);
		if (matches.length == 0) {
			return substring;
		}
		if (!after) {
			return matches[0];
		}
		for (let i = 0; i < matches.length; i++) {
			let b = matches[i];
			if (b == after) {
				let j = (i + 1) % matches.length;
				return matches[j];
			}
		}
		return substring;
	}
}
