
// this is a one-time-use script that I used to fix up the old tests
// will keep it around tho in case

var fs = require("fs");
var glob = require("glob")

var jsfilenames = glob.sync("./alltests/*.js")
jsfilenames.forEach((jsfilename) => {
	fs.unlinkSync(jsfilename);
});

var jsfilenames = glob.sync("./alltestsbackup/*.js")
jsfilenames.forEach((jsfilename) => {
	var newfilename = jsfilename.replace('backup', '');
	fs.copyFileSync(jsfilename, newfilename);
});

var jsfilenames = glob.sync("./alltests/*.js")
jsfilenames.forEach((jsfilename) => {
 	let js = '' + fs.readFileSync(jsfilename);

 	// get rid of gnu message
 	js = js.replace(/\/\*\nThis file is part of (.|\n)*licenses\/>.\n\*\//, '//gnumessage//\n')

 	js = js.replace(/\/\*/, '//startdescription//\n/*')
 	js = js.replace(/\*\//, '*/\n//enddescription//')


 	// fix the wrapped new test block things
 	js = js.replace(/{\n\t\ttype:/g, '{type:');
 	js = js.replace(/,\n\t\tcode:/g, ',code:');
 	js = js.replace(/\'\n\t}\);/g, "'});");

 	// get rid of some whitespace
 	js = js.replace(/\n\t*/g, '\n');
 	js = js.replace(/\n */g, '\n');
 	js = js.replace(/\n\n/g, '\n');

 	// normalize fields
 	js = js.replace(/\/\/ \|/g, '//testspec// |');
 	js = js.replace(/\/\/ test:/g, '//testname// ');

 	// start test
 	js = js.replace('var harness =', '//starttest//\nvar harness =');
 	js = js.replace(/$/, '//endtest//\n');

 	if (js.indexOf('//testspec//') < 0) {
 		js = js.replace('//gnumessage//', '//gnumessage//\n//testspec// [none]');
 	}
 	if (js.indexOf('//startdescription//') < 0) {
 		js = js.replace('//gnumessage//', '//gnumessage//\n//startdescription//\n/*\n[none]\n*/\n//enddescription//');
 	}
 	if (js.indexOf('//testname//') < 0) {
 		var realtestname = jsfilename.replace('./alltests/', '');
 		realtestname = realtestname.replace('.js', '');
 		js = js.replace('//gnumessage//', '//gnumessage//\n//testname// ' + realtestname);
 	}
 	js = js.replace(/\n\n/g, '\n');
 	js = js.replace('//gnumessage//', `//startgnumessage//
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
//endgnumessage//`)


 	fs.writeFileSync(jsfilename, js)
})