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

# Builds the client and starts the server. This is the one you want.
#
#   ./run.sh          minified build, then serve
#   ./run.sh --dev    unminified build with sourcemaps, then serve

set -e
cd "$(dirname "$0")"

echo "=== vodka ==="

if lsof -ti:3000 > /dev/null 2>&1; then
	echo "run.sh: something is already listening on port 3000."
	echo "run.sh: stop it first (pkill -f 'node webserver.js') and try again."
	exit 1
fi

echo "run.sh: building..."
server/build.sh --quiet "$@"
echo "run.sh: (build warnings are hidden here -- run server/build.sh to see them)"

echo "run.sh: starting server on http://localhost:3000 (ctrl-c to stop)"
cd server
exec ./runserver.sh
