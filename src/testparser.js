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
testParse('!;yes');
testParse('!;no');
// integer
testParse('#234');
testParse('#-4');
testParse('#0');
testParse('#;234');
testParse('#;-4');
testParse('#;0');
// symbol
testParse('@foobar');
testParse('@foo:bar');
testParse('@foo-bar');
testParse('@foo.bar');
testParse('@foo_bar');
testParse('@zbcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
testParse('@;foobar');
testParse('@;foo:bar');
testParse('@;foo-bar');
testParse('@;foo.bar');
testParse('@;foo_bar');
testParse('@;zbcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
// string
testParse('$"hello"');
testParse('$"hello there wEF#@$R4twrgdgiortg4g$%^$&^%&(*"');
testParse('${hel"lo}');
testParse('${hel||\nleo}');
testParse('${hel|}leo}');
testParse('${hel\nleo}');
testParse('${hel\tleoeeeeeo}');
testParse('$;"hello"');
testParse('$;"hello there wEF#@$R4twrgdgiortg4g$%^$&^%&(*"');
testParse('$;{hel"lo}');
testParse('$;{hel||\nleo}');
testParse('$;{hel|}leo}');
testParse('$;{hel\nleoeo}');
testParse('$;{hel\tleoooo}');
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
testParse('%;23');
testParse('%;23.43');
testParse('%;0.23');
testParse('%;.23', '%;0.23');
testParse('%;-0.23');
// nil
//testParse('^', '[nil]');
testParse('[nil]');
// vlist
testParse('(||)');
testParse(';(||)');
// hlist
testParse('(__)');
testParse(';(__)');
// zlist - new
testParse('(,,)');
testParse(';(,,)');
testParse('(,#10 #10 #10,)');
testParse(';(,#10 #10 #10,)');
// more list tests
testParse('(|#234 %54 #3499|)');
testParse('(_#234 %54 #99334_)');
testParse(`
	(_
		#234
		%54
		#;6434
	_)`, '(_#234 %54 #;6434_)');
//testParse('(|#234 %54 (_$"apple" ^ @hello_) #554|)', '(|#234 %54 (_$"apple" [nil] @hello_) #554|)');
testParse('(|#234 %54 (_$"apple" [nil] @hello_) #554|)', '(|#234 %54 (_$"apple" [nil] @hello_) #554|)');
// deferred command
testParse('*(__)');
testParse('*;(__)');
// lambda
testParse('&(||)');
testParse('&(_#3 #3 #3_)');
testParse('&"$ a! b@ c# d$ e% f^ g& h* i() j@?"(_#3_)');
testParse('&"$ a! b@ c# d$ e% f^ g& h* i() j@..."(_#33_)');
testParse('&"a@ b@ c@"(_#54 #3 #3_)');
testParse('&{a@ \t b@ c@}(|#3 #36 #3|)');
testParse('&;(||)');
testParse('&;(_#3 #3 #3_)');
testParse('&;"$ a! b@ c# d$ e% f^ g& h* i() j@?"(_#3_)');
testParse('&;"$ a! b@ c# d$ e% f^ g& h* i() j@..."(_#33_)');
testParse('&;"a@ b@ c@"(_#54 #3 #3_)');
testParse('&;{a@ \t b@ c@}(|#3 #36 #3|)');
// command
testParse('~(||)');
testParse('~(_a:b-c _)');
testParse('~(_foo #4 #77 #5_)');
testParse('~;(||)');
testParse('~;(_a:b-c _)');
testParse('~;(_foo #4 #77 #5_)');
testParse(
` ~(_bar  #9#5 $"ack"


   #5 _)  `, '~(_bar #9 #5 $"ack" #5_)');
testParse('~(|::pl:: #4 #5 #27|)');
testParse('~;(|::pl:: #4 #5 #27|)');
// word/doc/line/letter
testParse('[word](_[nil] [nil]_)');
testParse('[word](__)');
testParse('[word](_#4 #4 #4_)');
testParse('[doc](|#4 #4 #4|)');
testParse('[line](_#4 #4 #4_)');
testParse('[doc](|[line](_[word](__) [word](__) [word](__)_) [line](_[word](__) [word](__) [word](__)_) [line](_[word](__) [word](__) [word](__)_)|)');
testParse('[zlist](_[doc](||)_)');
testParse('[letter]"a"');
testParse('[word](_[letter]"a" [letter]"b" [letter]"c"_)');
testParse('[separator]";"');
testParse('[;word](_[nil] [nil]_)');
testParse('[;word](__)');
testParse('[;word](_#4 #4 #4_)');
testParse('[;doc](|#4 #4 #4|)');
testParse('[;line](_#4 #4 #4_)');
testParse('[;doc](|[line](_[word](__) [word](__) [word](__)_) [line](_[word](__) [word](__) [word](__)_) [line](_[word](__) [word](__) [word](__)_)|)');
testParse('[;zlist](_[doc](||)_)');
testParse('[;letter]"a"');
testParse('[;word](_[letter]"a" [letter]"b" [letter]"c"_)');
testParse('[;separator]";"');
// vertical command
testParse('~"v"(__)');
testParse('~"v"(_&{a@ b@ c@||v}(__) *"v"(__)_)');
testParse('~;"v"(__)');
testParse('~;"v"(_&{a@ b@ c@||v}(__) *"v"(__)_)');
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
testParse('%<`apple` `banana`>-23.333333');
//testParse('^<`apple`>', '[nil]<`apple`>');
testParse('[nil]<`apple`>');
//testParse('(_^<`apple`> ^<`apple`> ^<`apple`>_)', '(_[nil]<`apple`> [nil]<`apple`> [nil]<`apple`>_)');
testParse('(_[nil]<`apple`> [nil]<`apple`> [nil]<`apple`>_)');
testParse('(_<`apple` `banana`>#234 %54 #3434_)');;
testParse('@;<`apple`>foobar');
testParse('@;<`apple` `banana`>foobar');
testParse('@;<`apple` `banana` `pear`>foobar');
testParse('!;<`apple` `banana`>yes');
testParse('#;<`apple` `banana`>23');
testParse('#;<`apple` `banana`>-23');
testParse('$;<`apple` `banana`>"hello"');;
testParse('%;<`apple` `banana`>23.3');
testParse('%;<`apple` `banana`>23');
testParse('%;<`apple` `banana`>-23');
testParse('%;<`apple` `banana`>-23.333333');
//testParse(';(_^<`apple`> ^<`apple`> ^<`apple`>_)', ';(_[nil]<`apple`> [nil]<`apple`> [nil]<`apple`>_)');
testParse(';(_[nil]<`apple`> [nil]<`apple`> [nil]<`apple`>_)');
testParse(';(_<`apple` `banana`>#234 %54 #3434_)');;

// private data
testParse(';{privat\tedata}(_#3 #3 #3_)');
testParse(';"privatedata"(_#3 #3 #3_)');
testParse(';(_"privatedata"(_#3 #3 #3_) (_#3 #3 #3_) "privatedata"(_<`apple` `banana`>#3 #3 #3_) (_<`apple` `banana`>#3 #3 #3_)_)');
testParse('*;"privatedata"(_#3 #3 #3_)');
testParse('*;{p\trivatedata}(_#3 #3 #3_)');
testParse('*;"privatedata"(_<`apple` `banana`>#3 #3 #3_)');
testParse('*;{privat\tedata}(_<`apple` `banana`>#3 #3 #3_)');
testParse('*;(_<`apple` `banana`>#3 #3 #3_)');
testParse('~;"private.data"(_foobar #3 #3 #3_)');
testParse('~;"privatedata"(_foobar #3 #3 #3_)');
testParse('~;{p\trivatedata}(_foobar #3 #3 #3_)');
testParse('~;"privatedata"(_<`apple` `banana`>foobar #3 #3 #3_)');
testParse('~;{privat\tedata}(_<`apple` `banana`>foobar #3 #3 #3_)');
// tag in list
testParse('~(_<`apple` `banana`>foobar #3 #3 #3_)');
testParse('~;(_<`apple` `banana`>foobar #3 #3 #3_)');
// private data also
testParse('~"privatedata"(_#3 #3 #3_)');
testParse('~{p\trivatedata}(_#3 #3 #3_)');
testParse('~"privatedata"(_<`apple` `banana`>#3 #3 #3_)');
testParse('~{privat\tedata}(_<`apple` `banana`>#3 #3 #3_)');
testParse('~(_<`apple` `banana`>#3 #3 #3_)');
testParse('&(_<`apple` `banana`>#3 #3 #3_)');
testParse('~;"privatedata"(_#3 #3 #3_)');
testParse('~;{p\trivatedata}(_#3 #3 #3_)');
testParse('~;"privatedata"(_<`apple` `banana`>#3 #3 #3_)');
testParse('~;{privat\tedata}(_<`apple` `banana`>#3 #3 #3_)');
testParse('~;(_<`apple` `banana`>#3 #3 #3_)');
testParse('&;(_<`apple` `banana`>#3 #3 #3_)');
// word/doc/letter with tags
testParse('[word](_<`apple` `banana`>_)');
testParse('[doc](|<`apple` `banana`>|)');
testParse('[zlist](_<`apple` `banana`>_)');
testParse('[letter]"a"<`apple` `banana`>');
testParse('(_[letter]"a"<`apple` `banana`> [letter]"b" [letter]"c"_)');
testParse('[line](_<`apple` `banana`>_)');
testParse('[separator]";"<`apple` `banana`>');

testParse('[;word](_<`apple` `banana`>_)');
testParse('[;doc](|<`apple` `banana`>|)');
testParse('[;zlist](_<`apple` `banana`>_)');
testParse('[;letter]"a"<`apple` `banana`>');
testParse('(_[;letter]"a"<`apple` `banana`> [;letter]"b" [letter]"c"_)');
testParse('[;line](_<`apple` `banana`>_)');
testParse('[;separator]";"<`apple` `banana`>');
// letter with brace private data
testParse('[letter]{a||privatedata}');
testParse('[;letter]{a||privatedata}');
// word/doc/letter with private data
testParse('[word]"privatedata"(__)')
testParse('[word]"privatedata"(_[letter]"a" [letter]"b" [letter]"c"_)')
testParse('[word]{privatedata||pdata}(_[letter]"a" [letter]"b" [letter]"c"_)')
testParse('[word]{private\ndatapdata}(_[letter]"a" [letter]"b" [letter]"c"_)')
testParse('[;word]"privatedata"(__)')
testParse('[;word]"privatedata"(_[letter]"a" [letter]"b" [letter]"c"_)')
testParse('[;word]{privatedata||pdata}(_[letter]"a" [letter]"b" [letter]"c"_)')
testParse('[;word]{private\ndatapdata}(_[letter]"a" [letter]"b" [letter]"c"_)')
// private data in error
testParse('?{2||whatever}');
// test that you can omit the _ on input
testParse('(#10)', '(_#10_)')
testParse('~(#10)', '~(_#10_)')
testParse('*(#10)', '*(_#10_)')
testParse('&(#10)', '&(_#10_)')
testParse('~(car #10)', '~(_car #10_)')
testParse(';(#10)', ';(_#10_)')
testParse('~;(#10)', '~;(_#10_)')
testParse('*;(#10)', '*;(_#10_)')
testParse('&;(#10)', '&;(_#10_)')
testParse('~;(car #10)', '~;(_car #10_)')
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
testParse('~;(_:+ #10 #10_)', '~;(_::pl:: #10 #10_)')
testParse('~;(_:* #10 #10_)', '~;(_::ti:: #10 #10_)')
testParse('~;(_:/ #10 #10_)', '~;(_::ov:: #10 #10_)')
testParse('~;(_:- #10 #10_)', '~;(_- #10 #10_)')
testParse('~;(_:< #10 #10_)', '~;(_::lt:: #10 #10_)')
testParse('~;(_:> #10 #10_)', '~;(_::gt:: #10 #10_)')
testParse('~;(_:<= #10 #10_)', '~;(_::lte:: #10 #10_)')
testParse('~;(_:>= #10 #10_)', '~;(_::gte:: #10 #10_)')
testParse('~;(_:<> #10 #10_)', '~;(_::ne:: #10 #10_)')
// instantiator
testParse('^(__)')
testParse('^"Grid"(__)')
testParse('^;"Grid"(__)')
testParse('^;"Grid"(_<`apple` `banana`>_)')
testParse('^;"Grid"(_<`apple` `banana`>#3 #3_)')
testParse('^;{Gri\td}(_<`apple` `banana`>#3 #3_)')
testParse('^;{Gri\td}(|<`apple` `banana`>#3 #3|)')
testParse('^;{Gri\td}(,<`apple` `banana`>#3 #3,)')
testParse('^;{Gri\td}(<`apple` `banana`>#3 #3)', '^;{Gri\td}(_<`apple` `banana`>#3 #3_)')


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


