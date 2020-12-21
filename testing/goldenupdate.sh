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

#!/bin/bash

is_vk() {
	FILE=$1
	find ./alltests/$FILE.vk > /dev/null 2> /dev/null
}

BASENAME=$1
if [ "${BASENAME}" == "" ]; then
	echo "requires test name."
	exit 1
fi

if is_vk $BASENAME ; then
	TESTOUT="./alltests/${BASENAME}/${BASENAME}.out"
	GOLDEN="./alltests/${BASENAME}/${BASENAME}_GOLDEN.out"
	cp ${TESTOUT} ${GOLDEN}
	echo "[${BASENAME}] golden updated"
	runtests.sh ${BASENAME}
	node parsetestoutput.js
	exit 0
fi

shift
VARIANT=$1

if [ "${VARIANT}" == "" ]; then
	echo "requires variant (-e for exploded, -n for normal, -b for both)"
	exit 1
fi

BASENAME=${BASENAME#./alltests/}
BASENAME=${BASENAME#alltests/}
BASENAME=${BASENAME%.js}

if [ ! -e "./alltests/${BASENAME}.js" ]; then
	echo "${BASENAME} is not a real test!  Exiting."
	exit 1
fi

TESTOUT_NORMAL="./alltests/${BASENAME}/${BASENAME}_OUT_NORMAL.png"
GOLDEN_NORMAL="./alltests/${BASENAME}/${BASENAME}_GOLDEN_NORMAL.png"
GOLDEN_NORMAL_BACKUP="./alltests/${BASENAME}/${BASENAME}_GOLDEN_NORMAL.backup.png"
TESTOUT_EXPLODED="./alltests/${BASENAME}/${BASENAME}_OUT_EXPLODED.png"
GOLDEN_EXPLODED="./alltests/${BASENAME}/${BASENAME}_GOLDEN_EXPLODED.png"
GOLDEN_EXPLODED_BACKUP="./alltests/${BASENAME}/${BASENAME}_GOLDEN_EXPLODED.backup.png"

if [ "${VARIANT}" == "-n" -o "${VARIANT}" == "-b" ]; then
	if [ ! -e "${TESTOUT_NORMAL}" ]; then
		echo "[${BASENAME}] no test output in ${TESTOUT_NORMAL}"
		exit 1
	fi

	cp ${GOLDEN_NORMAL} ${GOLDEN_NORMAL_BACKUP}
	cp ${TESTOUT_NORMAL} ${GOLDEN_NORMAL}
	echo "[${BASENAME}] NORMAL golden updated"
fi

if [ "${VARIANT}" == "-e"  -o "${VARIANT}" == "-b" ]; then
	if [ ! -e "${TESTOUT_EXPLODED}" ]; then
		echo "[${BASENAME}] no test output in ${TESTOUT_EXPLODED}"
		exit 1
	fi

	cp ${GOLDEN_EXPLODED} ${GOLDEN_EXPLODED_BACKUP}
	cp ${TESTOUT_EXPLODED} ${GOLDEN_EXPLODED}
	echo "[${BASENAME}] EXPLODED golden updated"
fi

runtests.sh ${BASENAME}
node parsetestoutput.js

