#!/bin/bash

if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
	cat <<'USAGE'
usage: ./createtestoutput.sh

Rebuilds testresults.html from the .out files already in alltests/, without
running any tests. Use this after editing goldens by hand.

Run from the testing directory.
USAGE
	exit 0
fi


node parsetestoutput.js
