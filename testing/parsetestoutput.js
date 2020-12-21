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

var hb = require("handlebars");
var fs = require("fs");
var glob = require("glob")

var alljson = [];
var jsonfiles = glob.sync("./alltests/*/*.json")
var failing_tests = [];
var passing_tests = [];
var ignored_tests = [];
jsonfiles.forEach((jsonfile) => {
	let rawjson = fs.readFileSync(jsonfile);
	let json = null;
	try {
		json = JSON.parse(rawjson);
	} catch (e) {
		console.log(`Deleting ${jsonfile} because it is broken. You will have to rerun this test.`);
		fs.unlinkSync(jsonfile);
		return;
	}
	try {
		if (json.node_ignored) {
			ignored_tests.push(json.test);
		} else if (json.node_success && (
			json.is_repl || (
				json.diffs[0].diff_succeeded &&
				json.diffs[1].diff_succeeded))) {
			passing_tests.push(json.test);
		} else {
			failing_tests.push(json.test);
		}
		alljson.push(json);
	} catch (e) {
		console.log('' + e);
	}
})

var summary = {
	num_passing: passing_tests.length,
	num_failing: failing_tests.length,
	num_ignored: ignored_tests.length,
	passing: passing_tests,
	failing: failing_tests,
	ignored: ignored_tests
}

var data = { summary: summary, testresults: alljson };
var rawtemplate = fs.readFileSync("./testoutput.tmpl");
var template = hb.compile('' + rawtemplate);
var html = template(data);
fs.writeFileSync('./testoutput.html', html);

