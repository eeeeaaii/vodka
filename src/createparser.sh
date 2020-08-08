#!/bin/bash


pegjs --format es -o ./tmp parser.pegjs 
cat ./parser_prelude.js ./tmp > ./parser_for_testing.mjs
cat ./parser_prelude.js ./tmp > ../server/src/nexparser2.js
rm ./tmp
