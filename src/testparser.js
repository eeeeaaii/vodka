

const parser = require("./parser.js");

function testParse(program, expected) {
	let result = parser.parse('v2:' + program);
	let output = result.toString('v2');
	if (!expected) expected = program;
	if (output == expected) {
		console.log('OK: ' + output);
	} else {
		console.log('ERROR: serialized output did not match expected value.');
		console.log('    parse input: ' + program);
		console.log('    expected output: ' + expected);
		console.log('    actual output: ' + output);
	}
}

testParse('!yes');
testParse('!no');
testParse('#234');
testParse('#-4');
testParse('#0');
testParse('@foobar')
testParse('@foo:bar')
testParse('@foo-bar')
testParse('@foo_bar')
testParse('@abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
testParse('$"hello"')
testParse('$"hello"')
testParse('$"hello there wEF#@$R4twrgdgiortg4g$%^$&^%&(*"')
testParse('$|SP|hel"lo|EP|');
testParse('$|SP|hel||leo|EP|');
testParse('$|SP|hel\nleo|EP|');
testParse('$|SP|hel\tleo|EP|');
testParse('%23')
testParse('%23.43')
testParse('%0.23')
testParse('%-0.23')
testParse('^')
testParse('()')
testParse('(#234 %54 #3434)')
testParse('(#234 %54 ($"apple" ^ @hello) #3434)')
testParse('*()')
testParse('&()')
testParse('~()')
testParse('~(a:b-c)')
testParse('~(foo #4 #5 #5)')
testParse(' ~(bar  #9#5 $"ack"\n\n\n   #5 )  ', '~(bar #9 #5 $"ack" #5)')
testParse('~(::pl:: #4 #5 #5)')





