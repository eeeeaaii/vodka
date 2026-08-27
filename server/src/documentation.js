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

/*
The builtins call setAPIDocCategory() and documentBuiltin() as they are
created, which is how the API reference gets populated. This file used to
build the reference DOM directly; now it just hands the collected data to
the help island, which renders it.
*/

let apiDocCategory = '';

let docs = {};
let docorder = [];
// canonical builtin name -> [alias, ...]. Kept separate from docs{} rather than
// stored on the doc item, because aliasBuiltin() runs after the builtin it
// aliases has already been documented, and not necessarily in the same
// category block.
let aliases = {};

function setAPIDocCategory(str) {
	apiDocCategory = str;
	docs[apiDocCategory] = [];
	docorder.push(str);
}

function documentBuiltin(name, params, info) {
	docs[apiDocCategory].push({
		name:name,
		info:info,
		params:params
	})
}

function documentAlias(aliasName, boundName) {
	if (!aliases[boundName]) {
		aliases[boundName] = [];
	}
	aliases[boundName].push(aliasName);
}

// Doc strings mark up hotkeys/argument names by prefixing them with a pipe,
// e.g. "returns the |car of the list". Rather than splice HTML together, we
// hand back a list of {isHotkey, text} pieces for the renderer to deal with.
function parseInfoString(info) {
	let pieces = [];
	let str = '' + info;
	let re = /\|([a-zA-Z_]+)/g;
	let lastIndex = 0;
	let m;
	while ((m = re.exec(str)) !== null) {
		if (m.index > lastIndex) {
			pieces.push({ isHotkey: false, text: str.substring(lastIndex, m.index) });
		}
		pieces.push({ isHotkey: true, text: m[1] });
		lastIndex = m.index + m[0].length;
		// the original swallowed a single trailing space after the hotkey
		if (str[lastIndex] == ' ') {
			lastIndex++;
		}
	}
	if (lastIndex < str.length) {
		pieces.push({ isHotkey: false, text: str.substring(lastIndex) });
	}
	return pieces;
}

// Returns the whole API reference as data, in the order the categories were
// declared: [ { category, items: [ { name, params, aliases, infoPieces } ] } ]
function getDocs() {
	return docorder.map(function(category) {
		return {
			category: category,
			items: docs[category].map(function(item) {
				return {
					name: item.name,
					params: item.params,
					aliases: aliases[item.name] ? aliases[item.name].slice() : [],
					infoPieces: parseInfoString(item.info)
				};
			})
		};
	});
}

export { setAPIDocCategory, documentBuiltin, documentAlias, getDocs }
