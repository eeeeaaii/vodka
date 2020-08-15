

import { parse } from './parser_for_testing.js';

function testParse(input, expectedoutput) {
	if (!expectedoutput) expectedoutput = input;
	let result = parse('v2:' + input);
	let output = result.toString('v2');
	let secondresult = parse('v2:' + output);
	let secondoutput = secondresult.toString('v2');
	if (output != expectedoutput) {
		console.log('***** ERROR: first serialization did not match expected serialization.');
		console.log('    first serialization: ' + output);
		console.log('    expected serialization: ' + expectedoutput);
	} else if (secondoutput != output) {
		console.log('***** ERROR: first serialization did not match second serialization.');
		console.log('    first serialization: ' + output);
		console.log('    second serialization: ' + secondoutput);
	} else {
		console.log('OK: ' + output);		
	}
}

testParse('!yes');
testParse('!no');
testParse('#234');
testParse('#-4');
testParse('#0');
testParse('@foobar');
testParse('@foo:bar');
testParse('@foo-bar');
testParse('@foo_bar');
testParse('@abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
testParse('$"hello"');
testParse('$"hello there wEF#@$R4twrgdgiortg4g$%^$&^%&(*"');
testParse('${hel"lo}');
testParse('${hel||\nleo}');
testParse('${hel|}leo}');
testParse('${hel\nleo}');
testParse('${hel\tleo}');
testParse('?"hello"');
testParse('?"hello there wEF#@$R4twrgdgiortg4g$%^$&^%&(*"');
testParse('?{hel"lo}');
testParse('?{hel||\nleo}');
testParse('?{hel|}leo}');
testParse('?{hel\nleo}');
testParse('?{hel\tleo}');
testParse('%23');
testParse('%23.43');
testParse('%0.23');
testParse('%.23', '%0.23');
testParse('%-0.23');
testParse('^');
testParse('()');
testParse('(#234 %54 #3434)');
testParse(`
	(
		#234
		%54
		#3434
	)`, '(#234 %54 #3434)');
testParse('(#234 %54 ($"apple" ^ @hello) #3434)');
testParse('*()');
testParse('&()');
testParse('&(#3 #3 #3)');
testParse('&"@a @b @c"(#3 #3 #3)');
testParse('&{@a \t @b @c}(#3 #3 #3)');
testParse('~()');
testParse('~(a:b-c)');
testParse('~(foo #4 #5 #5)');
testParse(
` ~(bar  #9#5 $"ack"


   #5 )  `, '~(bar #9 #5 $"ack" #5)');
testParse('~(::pl:: #4 #5 #5)');

testParse('[word]()');
testParse('[word](#4 #4 #4)');
testParse('[doc](#4 #4 #4)');
testParse('[line](#4 #4 #4)');
testParse('[doc]([line]([word]() [word]() [word]()) [line]([word]() [word]() [word]()) [line]([word]() [word]() [word]()))');
testParse('[zlist]([doc]())');
testParse('[letter]"a"()');
testParse('[word]([letter]"a"() [letter]"b"() [letter]"c"())');
testParse('[separator]";"()');
testParse('[newline]()');
testParse('([newline]() [letter]"b"() [newline]())');
testParse('~"v"()');
testParse('~"v"(&"@a @b @c|v"() *"v"())');
testParse('@<`apple`>foobar');
testParse('@<`apple` `banana`>foobar');
testParse('@<`apple` `banana` `pear`>foobar');
testParse('!<`apple` `banana`>yes');
testParse('#<`apple` `banana`>23');
testParse('#<`apple` `banana`>-23');
testParse('$<`apple` `banana`>"hello"');;
testParse('?<`apple` `banana`>"hello"');;
testParse('%<`apple` `banana`>23.3');
testParse('%<`apple` `banana`>23');
testParse('%<`apple` `banana`>-23');
testParse('%<`apple` `banana`>-23.3');
testParse('^<`apple`>');
testParse('(^<`apple`> ^<`apple`> ^<`apple`>)');
testParse('(<`apple` `banana`>#234 %54 #3434)');;
testParse('{privat\tedata}(#3 #3 #3)');
testParse('"privatedata"(#3 #3 #3)');
testParse('("privatedata"(#3 #3 #3) (#3 #3 #3) "privatedata"(<`apple` `banana`>#3 #3 #3) (<`apple` `banana`>#3 #3 #3))');
testParse('*"privatedata"(#3 #3 #3)');
testParse('*{p\trivatedata}(#3 #3 #3)');
testParse('*"privatedata"(<`apple` `banana`>#3 #3 #3)');
testParse('*{privat\tedata}(<`apple` `banana`>#3 #3 #3)');
testParse('*(<`apple` `banana`>#3 #3 #3)');
testParse('~"privatedata"(foobar #3 #3 #3)');
testParse('~{p\trivatedata}(foobar #3 #3 #3)');
testParse('~"privatedata"(<`apple` `banana`>foobar #3 #3 #3)');
testParse('~{privat\tedata}(<`apple` `banana`>foobar #3 #3 #3)');
testParse('~(<`apple` `banana`>foobar #3 #3 #3)');

testParse('~"privatedata"(#3 #3 #3)');
testParse('~{p\trivatedata}(#3 #3 #3)');
testParse('~"privatedata"(<`apple` `banana`>#3 #3 #3)');
testParse('~{privat\tedata}(<`apple` `banana`>#3 #3 #3)');
testParse('~(<`apple` `banana`>#3 #3 #3)');

testParse('&(<`apple` `banana`>#3 #3 #3)');

testParse('[word](<`apple` `banana`>)');
testParse('[doc](<`apple` `banana`>)');
testParse('[zlist](<`apple` `banana`>)');
testParse('[letter]"a"(<`apple` `banana`>)');
testParse('[line](<`apple` `banana`>)');
testParse('[separator]";"(<`apple` `banana`>)');



