#!/bin/bash

if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
	cat <<'USAGE'
usage: ./makedocs.sh

Runs jsdoc over server/src and writes the result to server/docs.
Run from the server directory.
USAGE
	exit 0
fi


jsdoc src/* -d docs
