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

if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
	cat <<'USAGE'
usage: ./run.sh [--dev]

Builds the client and starts the server. This is the one you want.

  --dev     unminified build with sourcemaps
  --help    this message

Refuses to start if something is already listening on port 3000.
Serves on http://localhost:3000; ctrl-c stops it.
USAGE
	exit 0
fi


set -e
cd "$(dirname "$0")"

echo "=== vodka ==="

# -sTCP:LISTEN matters: without it this also matches browsers holding a client
# connection to port 3000, which outlive the server and make it look like the
# old one never died.
if lsof -ti:3000 -sTCP:LISTEN > /dev/null 2>&1; then
	echo "run.sh: something is already listening on port 3000."
	echo "run.sh: stop it first (pkill -f 'node webserver[.]js') and try again."
	exit 1
fi

echo "run.sh: building..."
server/build.sh --quiet "$@"
echo "run.sh: (build warnings are hidden here -- run server/build.sh to see them)"

echo "run.sh: starting server on http://localhost:3000 (ctrl-c to stop)"
cd server
exec ./runserver.sh
