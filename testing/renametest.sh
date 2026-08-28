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
usage: ./renametest.sh <oldname> <newname>

Renames a test, rewrites the name inside the test file, drops the old output
directory and reruns under the new name. Asks for confirmation first.

Goldens are NOT carried over -- the old output directory is deleted, so the
renamed test starts with no golden and will need one captured.

Run from the testing directory.
USAGE
	exit 0
fi


if [ "$1" == "" ]; then
	echo "requires 2 arguments"
	exit 1
fi

FROM=$1

shift

if [ "$1" == "" ]; then
	echo "requires 2 arguments"
	exit 1
fi

TO=$1

echo "Renaming ${FROM} to ${TO}, are you sure?"
read INP
if [ "$INP" == "y" ]; then
	sed -e "s/${FROM}/${TO}/g" -i "" ./alltests/${FROM}.js
	mv ./alltests/${FROM}.js ./alltests/${TO}.js
	rm -rf ./alltests/${FROM}/
	./runtests.sh ${TO}
fi



