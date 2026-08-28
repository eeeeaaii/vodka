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
usage: ./createparser.sh

Regenerates the parser from parser.pegjs and installs it, writing
server/src/nexparser2.js and server/src/parserfunctions.js.

Needs pegjs on the path. Run from the src directory.
USAGE
	exit 0
fi


pegjs --format es -o ./tmp parser.pegjs 
cat ./parser_prelude.js ./tmp > ./parser_for_testing.js
cat ./parser_prelude.js ./tmp > ../server/src/nexparser2.js
cat ./parserfunctions.js | sed "s_../server/src_._" > ./tmp2 \
		&& cp ./tmp2 ../server/src/parserfunctions.js
rm ./tmp
rm ./tmp2
