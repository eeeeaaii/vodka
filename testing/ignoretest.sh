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
usage: ./ignoretest.sh <testname>

Marks a test ignored, so runtests.sh skips it, then reruns it to refresh the
results page. Undo with ./unignoretest.sh.

Run from the testing directory.
USAGE
	exit 0
fi


if [ "$1" == "" ]; then
	echo "requires argument"
	exit 1
fi

TOIG=$1

echo 1 > ./alltests/${TOIG}/${TOIG}.ignore

runtests.sh ${TOIG}


