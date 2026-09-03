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
One argument's spec, lexed. The grammar is regular -- nothing nests and nothing
recurses -- so this is a lexer and there is no parser to go with it:

    param := '_'? '='? name? type* '?'? '...'?

The type section is a union built one token at a time, which is why #% means
"integer or float". It is unordered and repeats are harmless: %# says the same
thing as #%.

Underscore is three things at once -- the skipeval prefix, a legal character
inside a name, and the wavetable type -- and position is what tells them apart.
A name may contain an underscore but may not end in one, which is the rule that
makes _wt_ come out as skipeval, name "wt", type Wavetable rather than any of
the other readings.

A spec with no name at all is a return value. parseString marks those with a
leading backslash before they get here.

Every character has to be claimed by a rule. Anything left over is a spec that
does not mean what it looks like, and the caller is told rather than being
handed a type that silently matches nothing.
*/

// longest first, so a two character token is never mistaken for its first half
const TYPE_TOKENS = [
	['()', 'NexContainer'],
	['!', 'Bool'],
	['~', 'Command'],
	['*', 'Deferred'],
	['$', 'EString'],
	['@', 'ESymbol'],
	['%', 'Float'],
	['#', 'Integer'],
	['_', 'Wavetable'],
	['^', 'Instantiator'],
	['&', 'Closure'],
	['κ', 'Contract'],
	['μ', 'Clip'],
];

// may hold an underscore, may not end in one
const NAME_RE = /^[a-zA-Z0-9_-]*[a-zA-Z0-9-]/;

function lexParam(spec) {
	let rest = spec;
	let tokens = [];
	let out = {
		tokens: tokens,
		error: null,
		isReturnValue: false,
		name: '',
		typeString: '',
		types: [],
		skipeval: false,
		skipactivate: false,
		variadic: false,
		optional: false,
		convert: true,
	};
	let take = function(kind, text, extra) {
		let t = { kind: kind, text: text };
		if (extra) t.type = extra;
		tokens.push(t);
		rest = rest.substring(text.length);
	};

	if (rest.startsWith('\\')) {
		out.isReturnValue = true;
		take('returnvalue', '\\');
	}
	if (rest.startsWith('_')) {
		out.skipeval = true;
		take('skipeval', '_');
	}
	if (rest.startsWith('=')) {
		out.convert = false;
		take('noconvert', '=');
	}

	let nameMatch = NAME_RE.exec(rest);
	if (nameMatch) {
		out.name = nameMatch[0];
		take('name', nameMatch[0]);
	}

	for (;;) {
		if (rest.startsWith(',')) {
			// kept because parseParam has always understood it, though nothing uses it
			out.skipactivate = true;
			take('skipactivate', ',');
			continue;
		}
		let matched = null;
		for (let i = 0; i < TYPE_TOKENS.length; i++) {
			if (rest.startsWith(TYPE_TOKENS[i][0])) {
				matched = TYPE_TOKENS[i];
				break;
			}
		}
		if (!matched) break;
		out.types.push(matched[1]);
		out.typeString += matched[0];
		take('type', matched[0], matched[1]);
	}

	if (rest.startsWith('?')) {
		out.optional = true;
		take('optional', '?');
	}
	if (rest.startsWith('...')) {
		out.variadic = true;
		take('variadic', '...');
	}

	if (rest != '') {
		out.error = 'cannot make sense of "' + rest + '" in the argument "' + spec + '"';
		return out;
	}
	if (out.optional && out.variadic) {
		out.error = 'the argument "' + spec + '" is both optional and variadic';
		return out;
	}
	if (out.name == '' && out.types.length == 0 && !out.isReturnValue) {
		out.error = 'the argument "' + spec + '" has neither a name nor a type';
		return out;
	}
	return out;
}

function typeUnionOf(types) {
	return types.length == 0 ? '*' : types.join('|');
}

export { lexParam, typeUnionOf, TYPE_TOKENS }
