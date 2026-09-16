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

# Bundles the vodka client into server/dist/.
#
# The rendering engine is plain ES modules; the help system is a preact
# island that gets its own chunk via the dynamic import in vodkastart.js.
# Note that host.html is NOT processed by the bundler -- it stays a
# hand-maintained file so that webserver.js can keep doing its
# serverinject: template substitutions on it.
#
#   ./build.sh            minified production build
#   ./build.sh --dev      unminified, with sourcemaps
#   ./build.sh --watch    unminified, rebuild on change
#   ./build.sh --quiet    only report errors, not warnings

set -e

MODE="production"
EXTRA_ARGS="--minify"
LOG_ARGS=""

while [ "$1" != "" ]; do
	case "$1" in
		--dev)
			MODE="development"
			EXTRA_ARGS="--sourcemap"
			;;
		--watch)
			MODE="watch"
			EXTRA_ARGS="--sourcemap --watch"
			;;
		--quiet)
			LOG_ARGS="--log-level=error"
			;;
		--static)
			MAKE_STATIC=1
			;;
		--help|-h)
			cat <<'USAGE'
usage: ./build.sh [--dev|--watch] [--quiet] [--static]

Bundles the vodka client into server/dist/.

  --dev     unminified, with sourcemaps
  --watch   unminified, rebuild on change
  --quiet   report errors only, not warnings
  --static  also write server/static/, a folder any web server can serve
  --help    this message

Writing to server/dist/ changes what the running server serves, immediately.
Use ./run.sh from the repository root to build and serve in one step.

Run from the server directory.
USAGE
			exit 0
			;;
		*)
			echo "build.sh: unknown option '$1'"
			echo "usage: ./build.sh [--dev|--watch] [--quiet] [--static]"
			exit 1
			;;
	esac
	shift
done

cd "$(dirname "$0")"

echo "vodka build: mode=${MODE}"
echo "vodka build: entry point is src/vodkastart.js"
echo "vodka build: writing bundle to server/dist/"

rm -rf dist
mkdir -p dist

npx esbuild src/vodkastart.js \
	--bundle \
	--splitting \
	--format=esm \
	--outdir=dist \
	--target=es2020 \
	--jsx=automatic \
	--jsx-import-source=preact \
	${EXTRA_ARGS} ${LOG_ARGS}

echo "vodka build: done. Files written:"
ls -lh dist | tail -n +2 | awk '{ printf "vodka build:   %-28s %s\n", $9, $5 }'

if [ "$MAKE_STATIC" = "1" ]; then
	node tools/makestatic.js ./static
fi
