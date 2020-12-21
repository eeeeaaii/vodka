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


echo "Capturing SCREENSHOT test"
if [ "$1" == "" ]; then
	echo "Type name of the new test:"
	read NAME
else
	NAME=$1
fi
pbpaste
echo ""
echo "Is this the SCREENSHOT test you want to save? (y/n)"
read CONFIRM
if [ "$CONFIRM" == "y" ]; then
	pbpaste > "____tmpfile.txt"
	echo "Type human-readable description of test (make it good):"
	read READABLE
	FILENAME="alltests/${NAME}.js"
	cat > ${FILENAME} <<HERE
//startgnumessage//
/*
This file is part of Vodka.

Vodka is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Vodka is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Vodka.  If not, see <https://www.gnu.org/licenses/>.
*/
//endgnumessage//
HERE
	echo "//testname// ${NAME}" >> ${FILENAME}
	echo "//startdescription//" >> ${FILENAME}
	echo "/*" >> ${FILENAME}
	echo "${READABLE}" >> ${FILENAME}
	echo "*/" >> ${FILENAME}
	echo "//enddescription//" >> ${FILENAME}
	cat "____tmpfile.txt" >> ${FILENAME}
	# run once to get golden
	runtests.sh ${NAME}
	# run again to get a green result
	runtests.sh ${NAME}
	# parse outputs to refresh html page
	node parsetestoutput.js
	rm "____tmpfile.txt"
fi

