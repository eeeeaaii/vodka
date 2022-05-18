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

if [ "$1" == "" ]; then
	echo "requires TESTNAME argument"
	exit 1
fi

BASENAME=$1
echo -e "${BLUE}[$BASENAME]${NC} Deleting test ${BASENAME}, are you sure? (y/n)"
read CONFIRM
if [ "$CONFIRM" == "y" ]; then
	rm ./alltests/${BASENAME}.js 2> /dev/null
	rm ./alltests/${BASENAME}.vk 2> /dev/null
	rm -rf ./alltests/${BASENAME}/
	node parsetestoutput.js
fi



