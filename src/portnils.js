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

import { parse } from './parser_for_testing.js';

import fs from 'fs'
import glob from 'glob'
import path from 'path'



var alljson = [];
var nilfiles = glob.sync("../server/packages_nil/*");

nilfiles.forEach((file) => {
	console.log('parsing ' + path.basename(file));

	console.log('  reading file');
	let data = '' + fs.readFileSync(file);
	console.log('  done');

	console.log('  parsing file');
	let nex = parse(data);
	console.log('  done');

	console.log('  outputting file with v2 toString:');
	let v2string = nex.toString('v2');
	console.log('  done');

	console.log('  re-parsing output of v2 toString with v2 parser:');
	let checkResult = parse('v2:' + v2string);
	console.log('  done with ' + path.basename(file));

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
