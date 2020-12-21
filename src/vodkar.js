

import { parse } from '../server/src/nexparser2.js';
import { evaluateAndReturn } from '../server/src/evaluator.js';
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
		callback(err);
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

