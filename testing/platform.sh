# This file is part of Vodka.

# Sourced by the test scripts to decide which set of goldens to use.
#
# Goldens are screenshots compared at a very tight fuzz tolerance, and font
# rendering differs between platforms, so a golden captured on one OS will not
# match output from another. Rather than pick a winner, we keep a tracked set
# per platform under alltests/<testname>/goldens/<platform>/.

case "$(uname -s)" in
	Darwin)  VODKA_PLATFORM="mac" ;;
	Linux)   VODKA_PLATFORM="linux" ;;
	*)       VODKA_PLATFORM="other" ;;
esac

# ImageMagick 7 renamed the tools; `compare` is a top-level command in 6.
if command -v magick > /dev/null 2>&1; then
	VODKA_COMPARE="magick compare"
else
	VODKA_COMPARE="compare"
fi
