#!/bin/bash
# This file is part of Vodka.

# Vodka is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Vodka is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with Vodka.  If not, see <https://www.gnu.org/licenses/>.

if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
	cat <<'USAGE'
usage: ./regenerateallgoldens.sh

Replaces the golden for EVERY test with that test's current output, after one
confirmation prompt.

Only do this when you have looked at every failing test and decided that all
of the new output is correct. Otherwise it silently blesses real breakage.
For a single test use ./goldenupdate.sh instead.

Run from the testing directory.
USAGE
	exit 0
fi


echo "DO NOT REGENERATE GOLDENS IF YOU HAVE NOT LOOKED CAREFULLY AT EVERY SINGLE FAILING TEST, AND VERIFIED THAT IT IS OKAY FOR THE TEST OUTPUT TO BECOME THE NEW GOLDEN. (type 'y' to proceed)"
read INP
if [ "$INP" == "y" ]; then
	for FILENAME in alltests/*.js; do
		TESTNAME=$(echo ${FILENAME} | sed "s_alltests/__g" | sed "s_\.js\$__")
		./goldenupdate.sh ${TESTNAME} -b
	done
fi
