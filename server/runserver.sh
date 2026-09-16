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
usage: ./runserver.sh

Starts the vodka server on port 3000. Does not build first -- use ./run.sh
from the repository root for build-then-serve, or ./build.sh here to build
without serving.

Run from the server directory.
USAGE
	exit 0
fi


# Running it yourself means it is yours to save into. A deployed vodka leaves
# this unset and keeps nothing -- see writesAllowed in webserver.js.
VODKA_WEBENV="${VODKA_WEBENV:-local}" node webserver.js
