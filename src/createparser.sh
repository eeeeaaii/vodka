#!/bin/bash


node node_modules/pegjs/bin/pegjs parser.pegjs
node node_modules/pegjs/bin/pegjs --format globals --export-var NexParser2 -o ../server/src/nexparser2.js parser.pegjs 
