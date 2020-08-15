#!/bin/bash


pegjs --format es -o ./tmp parser.pegjs 
cat ./parser_prelude.js ./tmp > ./parser_for_testing.js
cat ./parser_prelude.js ./tmp > ../server/src/nexparser2.js
cat ./parserfunctions.js | sed "s_../server/src_._" > ./tmp2 \
		&& cp ./tmp2 ../server/src/parserfunctions.js
# rm ./tmp
# rm ./tmp2
