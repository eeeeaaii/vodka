#!/bin/bash

if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
	cat <<'USAGE'
usage: ./randomtests.sh [count]

Runs `count` randomly chosen tests, 5 by default. Picks with replacement, so
the same test can come up twice.

Run from the testing directory.
USAGE
	exit 0
fi


NUM_FILES_IN_DIR=$(ls alltests/*.js | wc | tr -s ' ' | cut -d ' ' -f2)

NUM_TESTS=${1:-5}

for (( I = 1; I <= $NUM_TESTS; I++)); do
	N=$RANDOM
	N=$((N % NUM_FILES_IN_DIR))
	J=0
	for NAME in alltests/*.js; do
		if [ "$J" == "$N" ]; then
			NAME=${NAME%.js}
			NAME=${NAME#alltests/}
			./runtests.sh $NAME
		fi
		J=$(($J + 1))
	done
done

