

import { parse } from './parser_for_testing.js';

function testParse(input, expectedoutput) {
	if (!expectedoutput) expectedoutput = input;
	let result = '';
	try {
		result = parse('v2:' + input);
	} catch (e) {
		console.log("***** ERROR IN FIRST PARSE: " + 'v2:' + input);
		throw e;
	}
	let output = result.toString('v2');
	let secondresult = '';
	try {
		secondresult = parse('v2:' + output);
	} catch (e) {
		console.log("***** ERROR IN SECOND PARSE: " + 'v2:' + output);
		throw e;
	}
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

console.log('');
console.log('');
console.log('');
console.log('');
console.log('');
console.log('');
console.log('------------------------------------------------')
console.log('------------------------------------------------')
console.log('-------------- START OF TEST -------------------')
console.log('------------------------------------------------')
console.log('------------------------------------------------')

// boolean
testParse('!yes');
testParse('!no');
// integer
testParse('#234');
testParse('#-4');
testParse('#0');
// symbol
testParse('@foobar');
testParse('@foo:bar');
testParse('@foo-bar');
testParse('@foo_bar');
testParse('@zbcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
// string
testParse('$"hello"');
testParse('$"hello there wEF#@$R4twrgdgiortg4g$%^$&^%&(*"');
testParse('${hel"lo}');
testParse('${hel||\nleo}');
testParse('${hel|}leo}');
testParse('${hel\nleo}');
testParse('${hel\tleo}');
// error
testParse('?"hello"');
testParse('?"hello there wEF#@$R4twrgdgiortg4g$%^$&^%&(*"');
testParse('?{hel"lo}');
testParse('?{hel\nleo}');
testParse('?{hel|}leo}');
testParse('?{hel\nleo}');
testParse('?{hel\tleo}');
// float
testParse('%23');
testParse('%23.43');
testParse('%0.23');
testParse('%.23', '%0.23');
testParse('%-0.23');
// nil
testParse('^');
// vlist
testParse('(||)');
// hlist
testParse('(__)');
// more list tests
testParse('(|#234 %54 #3434|)');
testParse('(_#234 %54 #3434_)');
testParse(`
	(_
		#234
		%54
		#3434
	_)`, '(_#234 %54 #3434_)');
testParse('(|#234 %54 (_$"apple" ^ @hello_) #3434|)');
// expectation
testParse('*(__)');
// lambda
testParse('&(||)');
testParse('&(_#3 #3 #3_)');
testParse('&"$ a! b@ c# d$ e% f^ g& h* i() j@?"(_#3_)');
testParse('&"$ a! b@ c# d$ e% f^ g& h* i() j@..."(_#3_)');
testParse('&"a@ b@ c@"(_#3 #3 #3_)');
testParse('&{a@ \t b@ c@}(|#3 #3 #3|)');
// command
testParse('~(||)');
testParse('~(_a:b-c _)');
testParse('~(_foo #4 #5 #5_)');
testParse(
` ~(_bar  #9#5 $"ack"


   #5 _)  `, '~(_bar #9 #5 $"ack" #5_)');
testParse('~(|::pl:: #4 #5 #5|)');
// word/doc/line/letter
testParse('[word](__)');
testParse('[word](_#4 #4 #4_)');
testParse('[doc](|#4 #4 #4|)');
testParse('[line](_#4 #4 #4_)');
testParse('[doc](|[line](_[word](__) [word](__) [word](__)_) [line](_[word](__) [word](__) [word](__)_) [line](_[word](__) [word](__) [word](__)_)|)');
testParse('[zlist](_[doc](||)_)');
testParse('[letter]"a"');
testParse('[word](_[letter]"a" [letter]"b" [letter]"c"_)');
testParse('[separator]";"');
// vertical command
testParse('~"v"(__)');
testParse('~"v"(_&{a@ b@ c@||v}(__) *"v"(__)_)');
// tags
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
testParse('(_^<`apple`> ^<`apple`> ^<`apple`>_)');
testParse('(_<`apple` `banana`>#234 %54 #3434_)');;
// private data
testParse('{privat\tedata}(_#3 #3 #3_)');
testParse('"privatedata"(_#3 #3 #3_)');
testParse('(_"privatedata"(_#3 #3 #3_) (_#3 #3 #3_) "privatedata"(_<`apple` `banana`>#3 #3 #3_) (_<`apple` `banana`>#3 #3 #3_)_)');
testParse('*"privatedata"(_#3 #3 #3_)');
testParse('*{p\trivatedata}(_#3 #3 #3_)');
testParse('*"privatedata"(_<`apple` `banana`>#3 #3 #3_)');
testParse('*{privat\tedata}(_<`apple` `banana`>#3 #3 #3_)');
testParse('*(_<`apple` `banana`>#3 #3 #3_)');
testParse('~"privatedata"(_foobar #3 #3 #3_)');
testParse('~{p\trivatedata}(_foobar #3 #3 #3_)');
testParse('~"privatedata"(_<`apple` `banana`>foobar #3 #3 #3_)');
testParse('~{privat\tedata}(_<`apple` `banana`>foobar #3 #3 #3_)');
// tag in list
testParse('~(_<`apple` `banana`>foobar #3 #3 #3_)');
// private data also
testParse('~"privatedata"(_#3 #3 #3_)');
testParse('~{p\trivatedata}(_#3 #3 #3_)');
testParse('~"privatedata"(_<`apple` `banana`>#3 #3 #3_)');
testParse('~{privat\tedata}(_<`apple` `banana`>#3 #3 #3_)');
testParse('~(_<`apple` `banana`>#3 #3 #3_)');
testParse('&(_<`apple` `banana`>#3 #3 #3_)');
// word/doc/letter with tags
testParse('[word](_<`apple` `banana`>_)');
testParse('[doc](|<`apple` `banana`>|)');
testParse('[zlist](_<`apple` `banana`>_)');
testParse('[letter]"a"<`apple` `banana`>');
testParse('(_[letter]"a"<`apple` `banana`> [letter]"b" [letter]"c"_)');
testParse('[line](_<`apple` `banana`>_)');
testParse('[separator]";"<`apple` `banana`>');
// letter with brace private data
testParse('[letter]{a||privatedata}');
// word/doc/letter with private data
testParse('[word]"privatedata"(__)')
testParse('[word]"privatedata"(_[letter]"a" [letter]"b" [letter]"c"_)')
testParse('[word]{privatedata||pdata}(_[letter]"a" [letter]"b" [letter]"c"_)')
testParse('[word]{private\ndatapdata}(_[letter]"a" [letter]"b" [letter]"c"_)')
// private data in error
testParse('?{2||whatever}');
// test that you can omit the _ on input
testParse('(#10)', '(_#10_)')
testParse('~(#10)', '~(_#10_)')
testParse('*(#10)', '*(_#10_)')
testParse('&(#10)', '&(_#10_)')
testParse('~(car #10)', '~(_car #10_)')
// alternate math input
testParse('~(_:+ #10 #10_)', '~(_::pl:: #10 #10_)')
testParse('~(_:* #10 #10_)', '~(_::ti:: #10 #10_)')
testParse('~(_:/ #10 #10_)', '~(_::ov:: #10 #10_)')
testParse('~(_:- #10 #10_)', '~(_- #10 #10_)')
testParse('~(_:< #10 #10_)', '~(_::lt:: #10 #10_)')
testParse('~(_:> #10 #10_)', '~(_::gt:: #10 #10_)')
testParse('~(_:<= #10 #10_)', '~(_::lte:: #10 #10_)')
testParse('~(_:>= #10 #10_)', '~(_::gte:: #10 #10_)')
testParse('~(_:<> #10 #10_)', '~(_::ne:: #10 #10_)')


// large file parse
testParse(
`
~(|begin
	~(_bind @square-size #20_)
	~(_bind @num-rows #20_)
	~(_bind @num-cols #20_)
	~(_bind @random-color &(|
		~(|string-cat
			$"#"
			~(_print-in-hex ~(_to-integer ~(_::ti:: %256 ~(_random _)_)_)_)
			~(_print-in-hex ~(_to-integer ~(_::ti:: %256 ~(_random _)_)_)_)
			~(_print-in-hex ~(_to-integer ~(_::ti:: %256 ~(_random _)_)_)_)
		|)
	|)_)
	~(_bind @make-square &(|
		~(|background-color 
			~(_height ~(_width [word](__) @square-size_) @square-size_)
			~(_random-color _)
		|)
	|)_)
	~(_bind @make-row &(|
		~(_let @make-row-n &" n"(|
			~(|if
				~(_::eq:: @n #0_)
				[line](__)
				~(_cons ~(_make-square _) ~(_make-row-n ~(_- @n #1_)_)_)
			|)
		|)_)
		~(_make-row-n @num-cols_)
	|)_)
	~(_bind @make-checkerboard &(|
		~(_let @make-cb-n &" n"(|
			~(|if
				~(_::eq:: @n #0_)
				[doc](||)
				~(_cons ~(_make-row _) ~(_make-cb-n ~(_- @n #1_)_)_)
			|)
		|)_)
		~(_make-cb-n @num-rows_)
	|)_)
|)
`, '~(|begin ~(_bind @square-size #20_) ~(_bind @num-rows #20_) ~(_bind @num-cols #20_) ~(_bind @random-color &(|~(|string-cat $"#" ~(_print-in-hex ~(_to-integer ~(_::ti:: %256 ~(_random _)_)_)_) ~(_print-in-hex ~(_to-integer ~(_::ti:: %256 ~(_random _)_)_)_) ~(_print-in-hex ~(_to-integer ~(_::ti:: %256 ~(_random _)_)_)_)|)|)_) ~(_bind @make-square &(|~(|background-color ~(_height ~(_width [word](__) @square-size_) @square-size_) ~(_random-color _)|)|)_) ~(_bind @make-row &(|~(_let @make-row-n &" n"(|~(|if ~(_::eq:: @n #0_) [line](__) ~(_cons ~(_make-square _) ~(_make-row-n ~(_- @n #1_)_)_)|)|)_) ~(_make-row-n @num-cols_)|)_) ~(_bind @make-checkerboard &(|~(_let @make-cb-n &" n"(|~(|if ~(_::eq:: @n #0_) [doc](||) ~(_cons ~(_make-row _) ~(_make-cb-n ~(_- @n #1_)_)_)|)|)_) ~(_make-cb-n @num-rows_)|)_)|)')


