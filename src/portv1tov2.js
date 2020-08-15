
import { parse } from './parser_for_testing.js';
import { NexParser } from '../server/src/nexparser.js'

import fs from 'fs'
import glob from 'glob'
import path from 'path'



var alljson = [];
var v1files = glob.sync("../server/packages_v1/*");

v1files.forEach((file) => {
	console.log('parsing ' + path.basename(file));

	console.log('reading file:');
	let data = '' + fs.readFileSync(file);
	console.log('done');

	console.log('parsing file with v1 parser:');
	let nex = new NexParser(data).parse();
	console.log('done');

	console.log('outputting file with v2 toString:');
	let v2string = nex.toString('v2');
	console.log('done');

	console.log('re-parsing output of v2 toString with v2 parser:');
	let checkResult = parse('v2:' + v2string);
	console.log('done');
	console.log('done with ' + path.basename(file));

	fs.writeFileSync('../server/packages/' + path.basename(file), 'v2:' + v2string);

/*





	try {
		let json = JSON.parse(rawjson);
		if (json.node_success
				&& json.diffs[0].diff_succeeded
				&& json.diffs[1].diff_succeeded) {
			passing_tests.push(json.test);
		} else {
			failing_tests.push(json.test);
		}
		alljson.push(json);
	} catch (e) {
		console.log('' + e);
		console.log(`broken json file ${jsonfile}, continuing`)
	}
	*/
});
