

import { parse } from '../server/src/nexparser2.js';
import { evaluateAndReturn } from '../server/src/evaluator.js';
import { replSetup } from '../server/src/vodka.js';

import repl from 'repl'

replSetup();

function evalVodka(rawinput, context, filename, callback) {
	let input = rawinput.trim();
	if (input == '') {
		callback('');
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

repl.start({
	'prompt': '>>> ',
	'eval':evalVodka
});

