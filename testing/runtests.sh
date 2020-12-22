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

HEADFUL="no"
TESTDIR="alltests"
TESTFILE="*"
ARG_PARSING_STATE="DEFAULT"
PARAMS=""

do_image_comparison() {
	DIFF_MODE=$1
	BASENAME=$2
	RVAL=0

	TESTOUTPUT="$OUTDIR/${BASENAME}_OUT_${DIFF_MODE}.png"
	GOLDEN="$OUTDIR/${BASENAME}_GOLDEN_${DIFF_MODE}.png"
	DIFF="$OUTDIR/${BASENAME}_DIFF_${DIFF_MODE}.png"

	REGENERATED_GOLDEN=false
	DIFF_SUCCEEDED=false
	if [ -e ${GOLDEN} ]; then
		echo "found" > "${OUTDIR}/${BASENAME}_${DIFF_MODE}.goldenstatus"
		# compare
		echo -e "${BLUE}[${BASENAME}]${NC} ${DIFF_MODE} golden exists, comparing"
		# fuzz syntax:
		# -fuzz .1%
		# if I change the rgb color for unselected-border from #aaaaaa to #aaaaab,
		# the test will fail. If I set fuzz to .2% (or higher) the test will pass
		# because the colors are still similar enough to count as equal.
		# if I set the fuzz to .1% it will fail.
		if ( magick compare -metric ae -fuzz .1% ${TESTOUTPUT} ${GOLDEN} ${DIFF} > /dev/null 2> /dev/null ); then
			echo -e "${GREEN}[${BASENAME}]${NC} ${DIFF_MODE} diff passed"
			echo "success" > "${OUTDIR}/${BASENAME}_${DIFF_MODE}.comparisonstatus"
			DIFF_SUCCEEDED=true
		else
			echo -e "${RED}[${BASENAME}]${NC} ${DIFF_MODE} diff failed!!!!! check diff at ${DIFF}"
			echo "failure" > "${OUTDIR}/${BASENAME}_${DIFF_MODE}.comparisonstatus"
		fi
	else
		echo "missing" > "${OUTDIR}/${BASENAME}_${DIFF_MODE}.goldenstatus"
		echo -e "${YELLOW}[${BASENAME}]${NC} was missing ${DIFF_MODE} golden. Check new golden at ${GOLDEN}"
		cp ${TESTOUTPUT} ${GOLDEN}
		REGENERATED_GOLDEN=true
	fi
	if [ "${DIFF_MODE}" == "NORMAL" ]; then
		EXT="-n"
	else
		EXT="-e"
	fi
}

do_vk_test() {
	BASENAME=$1
	INPUT=$(pwd)/alltests/${BASENAME}.vk
	OUTPUT=$(pwd)/alltests/${BASENAME}/${BASENAME}.out
	OUTDIR=./alltests/${BASENAME}
	GOLDEN=${OUTDIR}/${BASENAME}_GOLDEN.out
	DIFF=${OUTDIR}/${BASENAME}_DIFF.out
	TESTFILE_ASHTML="${OUTDIR}/${BASENAME}_code.txt"
	IGNOREFILE="${OUTDIR}/${BASENAME}.ignore"
	test -d "$OUTDIR" || mkdir "$OUTDIR"
	echo "started" > "${OUTDIR}/${BASENAME}.teststatus"
	echo "vk" > "${OUTDIR}/${BASENAME}.testtype"
	echo "-no docs-" > "${OUTDIR}/${BASENAME}.docstring"
	if [ -e ${IGNOREFILE} ]; then
		echo -e "${GRAY}[${BASENAME}]${NC} ignoring test"
	else
		pushd ../src > /dev/null
		echo -e "${BLUE}[${BASENAME}]${NC} running test"
		vodkar --noprompt < "$INPUT" > "$OUTPUT" 2> /dev/null
		popd > /dev/null
		TEST_SUCCESS=false
		DOCSTRING="eh?"
		cp "$INPUT" ${TESTFILE_ASHTML}
		diff "${OUTPUT}" ${GOLDEN} > $DIFF 2> /dev/null && TEST_SUCCESS=true
		echo $TEST_SUCCESS > "${OUTDIR}/${BASENAME}.testsuccess"
		if [ ! -e ${GOLDEN} ]; then
			echo -e "${YELLOW}[$BASENAME]${NC} was missing golden, creating"
			echo "missing" > "${OUTDIR}/${BASENAME}.goldenstatus"
			cp "${OUTPUT}" ${GOLDEN}
		else
			if [ "$TEST_SUCCESS" == "false" ]; then
				echo -e "${RED}[${BASENAME}]${NC} REPL test failed"
			else
				echo -e "${GREEN}[${BASENAME}]${NC} REPL test passed"
			fi
		fi
	fi
	echo "completed" > "${OUTDIR}/${BASENAME}.teststatus"
}

do_js_test() {
	BASENAME=$1
	OUTDIR="./${TESTDIR}/${BASENAME}"
	TESTFILE="./${TESTDIR}/${BASENAME}.js"
	TESTOUTPUT="./${TESTDIR}/${BASENAME}/${BASENAME}_output.txt"
	TESTOUTPUT_NORMAL="${OUTDIR}/${BASENAME}_OUT_NORMAL.png"
	TESTOUTPUT_EXPLODED="${OUTDIR}/${BASENAME}_OUT_EXPLODED.png"
	TESTFILE_ASHTML="${OUTDIR}/${BASENAME}_code.txt"
	IGNOREFILE="${OUTDIR}/${BASENAME}.ignore"

	echo "js" > "${OUTDIR}/${BASENAME}.testtype"
	echo "started" > "${OUTDIR}/${BASENAME}.teststatus"

	test -d $OUTDIR || mkdir $OUTDIR
	if [ -e ${IGNOREFILE} ]; then
		echo -e "${GRAY}[${BASENAME}]${NC} ignoring test"
	else
		echo -e "${BLUE}[${BASENAME}]${NC} running test"
		TEST_SUCCESS=false
		# echo "{ " > ${TESTOUTPUT_JSON}
		cp $TESTFILE ${TESTFILE_ASHTML}
		DOCSTRING=$(cat $TESTFILE | awk '
			BEGIN {insection="no"}
			/\/\/enddescription\/\// { insection="no" }
			/\/\*/ { next }
			/\*\// { next }
			/.?/ { if (insection == "yes") { gsub(/"/, "\\\""); print } }
			/\/\/startdescription\/\// { insection="yes" }
			')
		DOCSTRING=${DOCSTRING//$'\n'/'<br>'}
		echo $DOCSTRING > "${OUTDIR}/${BASENAME}.docstring"
		node $TESTFILE ${TESTOUTPUT_NORMAL} ${TESTOUTPUT_EXPLODED} ${HEADFUL} ${PARAMS} 2> ${TESTOUTPUT} && TEST_SUCCESS=true
		echo $TEST_SUCCESS > "${OUTDIR}/${BASENAME}.testsuccess"
		if [ "$TEST_SUCCESS" == "false" ]; then
			echo -e "${RED}[${BASENAME}]${NC} test crashed!!!!! check console for error."
		else
			do_image_comparison "NORMAL" ${BASENAME}
			do_image_comparison "EXPLODED" ${BASENAME}
		fi
	fi
	echo "completed" > "${OUTDIR}/${BASENAME}.teststatus"
}

do_test() {
	BASENAME=$1	
	if is_js $BASENAME; then
		do_js_test ${BASENAME}
	elif is_vk $BASENAME; then
		do_vk_test ${BASENAME}
	else
		echo -e "${BLUE}[${BASENAME}]${NC} is not a real test!"
		return 1
	fi
	echo " ---- ran ${CURRENTTESTNUM}/${NUMTESTS} tests ----"
	CURRENTTESTNUM=$((CURRENTTESTNUM+1))
}

is_js() {
	FILE=$1
	find ./alltests/$FILE.js > /dev/null 2> /dev/null
}

is_vk() {
	FILE=$1
	find ./alltests/$FILE.vk > /dev/null 2> /dev/null
}

run() {
	if [ "$TESTFILE" == "*" ]; then
		NUMTESTS=$(ls ./${TESTDIR}/*.js ./${TESTDIR}/*.vk | wc | awk '{ print $1 }')
		CURRENTTESTNUM=1
		for CTESTFILE in ./${TESTDIR}/*.js; do
			BASENAME="${CTESTFILE}"
			BASENAME="${BASENAME#./${TESTDIR}/}"
			BASENAME=${BASENAME%.js}
			do_test ${BASENAME}
		done
		for CTESTFILE in ./${TESTDIR}/*.vk; do
			BASENAME="${CTESTFILE}"
			BASENAME="${BASENAME#./${TESTDIR}/}"
			BASENAME=${BASENAME%.vk}
			do_test ${BASENAME}
		done
	else
		NUMTESTS=1
		CURRENTTESTNUM=1
		BASENAME="${TESTFILE}"
		do_test ${BASENAME}
	fi
	node parsetestoutput.js
}


while [ "$1" != "" ]; do
	case "$1" in
		--show)
			HEADFUL="yes"
			ARG_PARSING_STATE="DEFAULT"
			;;
		-s)
			HEADFUL="yes"
			ARG_PARSING_STATE="DEFAULT"
			;;

		--testdir)
			ARG_PARSING_STATE="LOOKING_FOR_TESTDIR"
			;;

		--params)
			ARG_PARSING_STATE="LOOKING_FOR_PARAMS"
			;;
		*)
			case "${ARG_PARSING_STATE}" in
				LOOKING_FOR_TESTDIR)
					TESTDIR=$1
					;;
				LOOKING_FOR_PARAMS)
					PARAMS=$1
					;;
				*)
					TESTFILE=$1
					;;
			esac
			ARG_PARSING_STATE="DEFAULT"
			;;
	esac
	shift
done

run


