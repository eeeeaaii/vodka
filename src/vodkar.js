// This file is part of Vodka.

// Vodka is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Vodka is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Vodka.  If not, see <https://www.gnu.org/licenses/>.


import { parse } from '../server/src/nexparser2.js';
import { evaluateAndReturn } from '../server/src/evaluatorinterface.js';
import { replSetup } from '../server/src/vodka.js';

import repl from 'repl'
import process from 'process'

replSetup();

function evalVodka(rawinput, context, filename, callback) {
	let input = rawinput.trim();
	if (input == '') {
		callback('');
		return;
	}
	if (input.charAt(0) == '|') {
		if (input.length > 1 && input.charAt(1) == '|') {
			callback(null, input);
		} else {
			callback('');
		}
		return;
	}
	let parsed = '';
	try {
		parsed = parse('v2:' + input);
	} catch (err) {
		callback(`unable to parse err`);
		return;
	}
	let result = evaluateAndReturn(parsed);
	let resultstr = result.toString('v2');
	callback(null, resultstr);

}

function writeVodka(str) {
	return str;
}

let prompt = '| ';
if (process.argv[2] == '--noprompt') {
	prompt = '';
}

repl.start({
	'prompt': prompt,
	'eval':evalVodka,
	'writer': writeVodka
});

