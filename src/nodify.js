

// point of this is to automatically copy files from server/src/nex and "nodify" them
// i.e. turn them into node modules so I can import them into the parser
// if I want to run the parser in test mode.



let fs = require('fs');

function processFile(fileName) {
	let file = fs.readFileSync("../server/src/nex/" + fileName);
	// need to find the class definition, i.e.
	//    class Foo extends Bar
	// and change it to 
	//    class Foo extends Bar.bar
	// then add
	//    const bar = require('bar.js');
	// then add
	//    exports = { Foo : Foo }
	
}

function processAllFiles() {
	let dirs = fs.readdirSync("../server/src/nex");

	for (let i = 0; i < dirs.length; i++) {
		processFile(dirs[i]);
	}
}


// var data = fs.readFileSync("./testoutput.tmpl");
// var tmpl = hb.compile('' + data);
// var context = {info: 'blah blah'};
// var html = tmpl(context);
// fs.writeFileSync('./testoutput.html', html);
