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

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
LIGHTBLUE='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

NC='\033[0m' # No Color

# to make a repl test:
# 1. write the code in vodka
# 2. put everything you want to be in the test into an org
# 3. put the org in a to-string conversion
# 4. save that string in a file called the_test_name.vk
# run this to grab all those files

capture_test() {
	BASENAME=$1
	SRCFILE=$2
	FILENAME="alltests/${BASENAME}.vk"
	TESTOUTDIR="alltests/${BASENAME}/"
	OVERWRITING=false
	if [ -e $FILENAME ]; then
		echo -e "${YELLOW}[$BASENAME]${NC} This test exists already, overwrite and rerun? (y/n)"
		read CONFIRM
		if [ "$CONFIRM" == "y" ]; then
			rm ${FILENAME}
			rm -rf ${TESTOUTDIR}
			OVERWRITING=true
		else
			exit
		fi
	fi
	cat $SRCFILE
	echo ""
	echo -e "${BLUE}[$BASENAME]${NC} Is this the REPL test you want to save as ${BASENAME}? (y/n)"
	read CONFIRM
	if [ "$CONFIRM" == "y" ]; then
		cat $SRCFILE > "____tmpfile.txt"
		echo -e "${BLUE}[$BASENAME]${NC}  Type human-readable description of test (make it good):"
		read READABLE
		cat > ${FILENAME} <<HERE
| This file is part of Vodka.

| Vodka is free software: you can redistribute it and/or modify
| it under the terms of the GNU General Public License as published by
| the Free Software Foundation, either version 3 of the License, or
| (at your option) any later version.

| Vodka is distributed in the hope that it will be useful,
| but WITHOUT ANY WARRANTY; without even the implied warranty of
| MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
| GNU General Public License for more details.

| You should have received a copy of the GNU General Public License
| along with Vodka.  If not, see <https://www.gnu.org/licenses/>.

HERE
		echo "| testname: ${NAME}" >> ${FILENAME}
		echo "| description: ${READABLE}" >> ${FILENAME}
		echo "" >> ${FILENAME}
		cat "____tmpfile.txt" >> ${FILENAME}
		echo "" >> ${FILENAME}
		echo "" >> ${FILENAME}
		echo "" >> ${FILENAME}
		rm "____tmpfile.txt"
		# first run will generate goldens
		runtests.sh ${BASENAME}
	fi
}

if ! ( find ../server/sessions | grep '.vk' > /dev/null 2> /dev/null ) ; then
	echo "No test files saved. Exiting."
	exit 0
fi

for A in $(find ../server/sessions | grep '.vk') ; do
	BASENAME=$(basename $A)
	BASENAME=${BASENAME%.vk}
	echo -e "${BLUE}[$BASENAME]${NC} Capturing REPL test."
	capture_test $BASENAME $A
	echo -e "${BLUE}[$BASENAME]${NC} Deleting the file ${A} from the sessions directory"
	rm $A
done
node parsetestoutput.js
