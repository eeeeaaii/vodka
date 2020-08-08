#!/bin/bash

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

