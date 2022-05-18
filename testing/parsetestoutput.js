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
var path = require("path")

function tpath(output_suffix) {
	return `./alltests/${basename}/${basename}${output_suffix}`;
}

function getContentsOfFile(fname) {
	try {
		return fs.readFileSync(fname, {encoding: 'utf8'}).trim();
	} catch(e) {
		return null;
	}
}

function testDiff(type) {
	let goldenStatus = getContentsOfFile(tpath(`_${type}.goldenstatus`));
	let regeneratedGolden = (goldenStatus != 'found');
	let diffStatus = getContentsOfFile(tpath(`_${type}.comparisonstatus`));
	let diffSucceeded = (diffStatus == 'success')
	let goldenUpdateExtension = (type == 'EXPLODED' ? '-e' : '-n');
	return {
		'test': basename,
		'diff_type': type,
		'regenerate_golden_ext': goldenUpdateExtension,
		'regenerated_golden': regeneratedGolden,
		'diff_succeeded': diffSucceeded,
		'regenerate_command': 'foo'
	}
}

function allTestDiffs() {
	return [
		testDiff('EXPLODED'),
		testDiff('NORMAL')
		];
}

function passingTestOutput() {
	let docstring = getContentsOfFile(tpath('.docstring'));
	let testtype = getContentsOfFile(tpath('.testtype'));
	let isrepl = (testtype == 'vk');
	let json = {
		'test': basename,
		'is_repl': isrepl,
		'docstring': docstring,
		'node_ignored': false,
		'node_success': true
	}
	if (!isrepl) {
		json.diffs = allTestDiffs();
	}
	return json;
}

function failingTestOutput() {
	let docstring = getContentsOfFile(tpath('.docstring'));
	let testtype = getContentsOfFile(tpath('.testtype'));
	let goldenstatus = getContentsOfFile(tpath('.goldenstatus'))
	let isrepl = (testtype == 'vk');	
	return {
		'test': basename,
		'is_repl': isrepl,
		'docstring': docstring,
		'goldenmissing': (!isrepl && goldenstatus == 'missing'),
		'node_ignored': false,
		'node_success': false
	}
}

function ignoredTestOutput() {
	return {
		'test': basename,
		'node_ignored': true,
		'node_success': false
	}
}

var alljson = [];
var testnames = glob.sync("./alltests/*/")
var failing_tests = [];
var passing_tests = [];
var ignored_tests = [];
var goldens_needed = [];

let basename = '';

testnames.forEach((testpath) => {
	basename = path.basename(testpath);
	let testjson = {};

	let ignore = getContentsOfFile(tpath('.ignore'));
	let testtype = getContentsOfFile(tpath('.testtype'));
	if (ignore && ignore == '1') {
		ignored_tests.push({name:basename, num:2, type:testtype})
		testjson = ignoredTestOutput();
	} else {
		let success = getContentsOfFile(tpath('.testsuccess'));
		if (success == 'true') {
			testjson = passingTestOutput(basename);
			// we don't count it as a REAL passing test unless both diffs succeeded
			if (testjson.diffs) {
				// only add it once even if both diffs are passing etc etc
				let ispassing = false;
				let isfailing = false;
				let neededgolden = false;
				let numpassing = 0;
				let numfailing = 0;
				let numneeded = 0;
				for (let i = 0; i < testjson.diffs.length; i++) {
					let diff = testjson.diffs[i];
					if (diff.diff_succeeded) {
						numpassing++;
						ispassing = true;
					} else {
						isfailing = true;
						numfailing++;
					}
					if (diff.regenerated_golden) {
						neededgolden = true;
						numneeded++;
					}
				}
				// but can add in more than one place if one test passes and one fails
				if (ispassing) passing_tests.push({name:basename, num:numpassing, type:testtype});
				if (isfailing) failing_tests.push({name:basename, num:numfailing, type:testtype});
				if (neededgolden) goldens_needed.push({name:basename, num:numneeded, type:testtype});
			} else {
				passing_tests.push({name:basename, num:2, type:testtype});
			}
		} else {
			testjson = failingTestOutput(basename);
			if (testjson.goldenmissing) {
				goldens_needed.push({name:basename, num:2, type:testtype});
			} else {
				failing_tests.push({name:basename, num:2, type:testtype});
			}
		}
	}
	let rawtemplate = getContentsOfFile("./onetestresult.tmpl");
	let template = hb.compile(rawtemplate);
	var html = template(testjson);
	fs.writeFileSync(tpath('_testresults.html'), html);
})

var summary = {
	num_passing: passing_tests.length,
	num_failing: failing_tests.length,
	num_ignored: ignored_tests.length,
	num_goldenneeded: goldens_needed.length,
	passing: passing_tests,
	failing: failing_tests,
	ignored: ignored_tests,
	neededgolden: goldens_needed
}

var data = { summary: summary, testresults: alljson };
var rawtemplate = fs.readFileSync("./testresults.tmpl");
var template = hb.compile('' + rawtemplate);
var html = template(data);
fs.writeFileSync('./testresults.html', html);

