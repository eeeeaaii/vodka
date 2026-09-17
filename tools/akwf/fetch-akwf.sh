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

# Downloads the single-cycle waveforms listed in akwf-list.txt into
# server/waves/, one subdirectory per category. The waves are CC0 from the
# AKWF-FREE collection; the list itself is a hand-picked subset chosen for
# harmonic complexity, see akwf-list.txt for the measurements behind it.
#
# The downloaded waves are committed to the repository, so you only need to
# run this to add to the list or to rebuild the folder from scratch.
#
#   ./fetch-akwf.sh           download anything missing
#   ./fetch-akwf.sh --force   re-download everything

set -e

BASE="https://raw.githubusercontent.com/KristofferKarlAxelEkstrand/AKWF-FREE/main"
HERE="$(cd "$(dirname "$0")" && pwd)"
LIST="$HERE/akwf-list.txt"
DEST="$HERE/../../server/waves"

FORCE=0
if [ "$1" = "--force" ]; then
	FORCE=1
elif [ -n "$1" ]; then
	echo "fetch-akwf: unknown option '$1'"
	echo "usage: ./fetch-akwf.sh [--force]"
	exit 1
fi

echo "fetch-akwf: reading $LIST"
echo "fetch-akwf: writing to $DEST"

total=0
got=0
skipped=0
failed=0

while read -r category remotepath rest; do
	case "$category" in ''|'#'*) continue ;; esac
	total=$((total + 1))
	name="$(basename "$remotepath")"
	dir="$DEST/$category"
	out="$dir/$name"
	mkdir -p "$dir"
	if [ -s "$out" ] && [ "$FORCE" = "0" ]; then
		echo "fetch-akwf: [$total] have $category/$name, skipping"
		skipped=$((skipped + 1))
		continue
	fi
	echo "fetch-akwf: [$total] downloading $category/$name"
	if curl -fsS -o "$out" "$BASE/$remotepath"; then
		got=$((got + 1))
	else
		echo "fetch-akwf: FAILED $remotepath"
		rm -f "$out"
		failed=$((failed + 1))
	fi
done < "$LIST"

echo "fetch-akwf: done. $total listed, $got downloaded, $skipped already present, $failed failed"
if [ "$failed" != "0" ]; then
	exit 1
fi
