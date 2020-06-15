

let fs = require("fs");
let glob = require("glob")

var csvoutput = '';

var fields = 0;


function doField(val) {
	if (fields > 0) {
		csvoutput = csvoutput + ','
	}
	csvoutput = csvoutput + '"' + val + '"';
	fields++;
}

function startRecord() {
	fields = 0;
}

function endRecord() {
	csvoutput = csvoutput + '\n';
}

fs.unlinkSync('./tests.csv');
var jsfilenames = glob.sync("./alltests/*.js")
jsfilenames.forEach((jsfilename) => {
	startRecord();
 	let js = '' + fs.readFileSync(jsfilename);

 	var testname = js.match(/\/\/testname\/\/ *(?<name>.*)\n/).groups.name;

 	var testdesc = js.match(/\/\/startdescription\/\/\n\/\*\n(?<desc>(.|\n)*)\*\/\n\/\/enddescription\/\//).groups.desc;
 	testdesc = testdesc.replace(/\n/g, '');
 	testdesc = testdesc.replace(/"/g, '""');

 	var testspec = js.match(/\/\/testspec\/\/ *(?<spec>.*)\n/).groups.spec;
 	testspec = testspec.replace(/"/g, '""');

 	var testarr = testname.split('_')
 	for (let i = 0 ; i < 5; i++) {
 		if (testarr[i]) {
 			doField(testarr[i]);
 		} else {
 			doField('');
 		}
 	}

 	doField(testdesc);
 	doField(testname);
 	doField(testspec);


 	endRecord();
})

fs.writeFileSync('./tests.csv', csvoutput);