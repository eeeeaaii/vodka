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
	OUTFILE=$3

	TESTOUTPUT="$SSDIR/${BASENAME}_OUT_${DIFF_MODE}.png"
	GOLDEN="$SSDIR/${BASENAME}_GOLDEN_${DIFF_MODE}.png"
	DIFF="$SSDIR/${BASENAME}_DIFF_${DIFF_MODE}.png"

	REGENERATED_GOLDEN=false
	DIFF_SUCCEEDED=false
	if [ -e ${GOLDEN} ]; then
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
			DIFF_SUCCEEDED=true
		else
			echo -e "${RED}[${BASENAME}]${NC} ${DIFF_MODE} diff failed!!!!! check diff at ${DIFF}"
		fi
	else
		echo -e "${YELLOW}[${BASENAME}]${NC} was missing ${DIFF_MODE} golden. Check new golden at ${GOLDEN}"
		cp ${TESTOUTPUT} ${GOLDEN}
		REGENERATED_GOLDEN=true
	fi
	if [ "${DIFF_MODE}" == "NORMAL" ]; then
		EXT="-n"
	else
		EXT="-e"
	fi
	echo "      {" >> ${OUTFILE}
	echo "        \"diff_type\": \"${DIFF_MODE}\"," >> ${OUTFILE}
	echo "        \"regenerated_golden\": ${REGENERATED_GOLDEN}," >> ${OUTFILE}
	echo "        \"regenerate_command\": \"./goldenupdate.sh ${BASENAME} ${EXT}\"," >> ${OUTFILE}
	echo "        \"diff_succeeded\": ${DIFF_SUCCEEDED}" >> ${OUTFILE}
	echo "      }" >> ${OUTFILE}
}

do_vk_test() {
	BASENAME=$1
	INPUT=$(pwd)/alltests/${BASENAME}.vk
	OUTPUT=$(pwd)/alltests/${BASENAME}/${BASENAME}.out
	OUTDIR=./alltests/${BASENAME}
	GOLDEN=${OUTDIR}/${BASENAME}_GOLDEN.out
	DIFF=${OUTDIR}/${BASENAME}_DIFF.out
	TESTFILE_ASHTML="${OUTDIR}/${BASENAME}_code.txt"
	TESTOUTPUT_JSON="${OUTDIR}/${BASENAME}_testresults.json"
	IGNOREFILE="${OUTDIR}/${BASENAME}.ignore"
	test -d "$OUTDIR" || mkdir "$OUTDIR"
	if [ -e ${IGNOREFILE} ]; then
		echo -e "${GRAY}[${BASENAME}]${NC} ignoring test"
		echo "{ " > ${TESTOUTPUT_JSON}
		echo "    \"test\": \"${BASENAME}\"," >> ${TESTOUTPUT_JSON}
		echo "    \"is_repl\": \"true\"," >> ${TESTOUTPUT_JSON}
		echo "    \"node_ignored\": true," >> ${TESTOUTPUT_JSON}
		echo "    \"node_success\": false" >> ${TESTOUTPUT_JSON}
		echo "  }" >> ${TESTOUTPUT_JSON}
	else
		pushd ../src > /dev/null
		echo -e "${BLUE}[${BASENAME}]${NC} running test"
		vodkar --noprompt < "$INPUT" > "$OUTPUT" 2> /dev/null
		popd > /dev/null
		TEST_SUCCESS=false
		DOCSTRING="eh?"
		cp "$INPUT" ${TESTFILE_ASHTML}
		echo "{ " > ${TESTOUTPUT_JSON}
		diff "${OUTPUT}" ${GOLDEN} > $DIFF 2> /dev/null && TEST_SUCCESS=true
		if [ ! -e ${GOLDEN} ]; then
			echo -e "${YELLOW}[$BASENAME]${NC} was missing golden, creating"
			cp "${OUTPUT}" ${GOLDEN}
			diff "${OUTPUT}" ${GOLDEN} > $DIFF 2> /dev/null && TEST_SUCCESS=true
		fi
		if [ "$TEST_SUCCESS" == "false" ]; then
			echo -e "${RED}[${BASENAME}]${NC} REPL test failed"
			echo "    \"test\": \"${BASENAME}\"," >> ${TESTOUTPUT_JSON}
			echo "    \"is_repl\": \"true\"," >> ${TESTOUTPUT_JSON}
			echo "    \"docstring\": \"${DOCSTRING}\"," >> ${TESTOUTPUT_JSON}
			echo "    \"node_ignored\": false," >> ${TESTOUTPUT_JSON}
			echo "    \"node_success\": ${TEST_SUCCESS}" >> ${TESTOUTPUT_JSON}
		else
			echo -e "${GREEN}[${BASENAME}]${NC} REPL test passed"
			echo "    \"test\": \"${BASENAME}\"," >> ${TESTOUTPUT_JSON}
			echo "    \"is_repl\": \"true\"," >> ${TESTOUTPUT_JSON}
			echo "    \"docstring\": \"${DOCSTRING}\"," >> ${TESTOUTPUT_JSON}
			echo "    \"node_ignored\": false," >> ${TESTOUTPUT_JSON}
			echo "    \"node_success\": ${TEST_SUCCESS}" >> ${TESTOUTPUT_JSON}
		fi
		echo "  }" >> ${TESTOUTPUT_JSON}

	fi

	# if diff repltests.out repltests.golden; then
	# 	echo "SUCCESS: repl tests passed"
	# else
	# 	echo "ERROR: repl tests failed, outputs do not match"
	# fi

}

do_js_test() {
	BASENAME=$1
	SSDIR="./${TESTDIR}/${BASENAME}"
	TESTFILE="./${TESTDIR}/${BASENAME}.js"
	TESTOUTPUT="./${TESTDIR}/${BASENAME}/output.txt"
	TESTOUTPUT_NORMAL="${SSDIR}/${BASENAME}_OUT_NORMAL.png"
	TESTOUTPUT_EXPLODED="${SSDIR}/${BASENAME}_OUT_EXPLODED.png"
	TESTFILE_ASHTML="${SSDIR}/${BASENAME}_code.txt"
	TESTOUTPUT_JSON="${SSDIR}/${BASENAME}_testresults.json"
	IGNOREFILE="${SSDIR}/${BASENAME}.ignore"

	test -d $SSDIR || mkdir $SSDIR
	if [ -e ${IGNOREFILE} ]; then
		echo -e "${GRAY}[${BASENAME}]${NC} ignoring test"
		echo "{ " > ${TESTOUTPUT_JSON}
		echo "    \"test\": \"${BASENAME}\"," >> ${TESTOUTPUT_JSON}
		echo "    \"node_ignored\": true," >> ${TESTOUTPUT_JSON}
		echo "    \"node_success\": false" >> ${TESTOUTPUT_JSON}
		echo "  }" >> ${TESTOUTPUT_JSON}
	else
		echo -e "${BLUE}[${BASENAME}]${NC} running test"
		TEST_SUCCESS=false

		echo "{ " > ${TESTOUTPUT_JSON}
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
		node $TESTFILE ${TESTOUTPUT_NORMAL} ${TESTOUTPUT_EXPLODED} ${HEADFUL} ${PARAMS} 2> ${TESTOUTPUT} && TEST_SUCCESS=true
		if [ "$TEST_SUCCESS" == "false" ]; then
			echo -e "${RED}[${BASENAME}]${NC} test crashed!!!!! check console for error."
			echo "    \"test\": \"${BASENAME}\"," >> ${TESTOUTPUT_JSON}
			echo "    \"is_repl\": \"false\"," >> ${TESTOUTPUT_JSON}
			echo "    \"docstring\": \"${DOCSTRING}\"," >> ${TESTOUTPUT_JSON}
			echo "    \"node_ignored\": false," >> ${TESTOUTPUT_JSON}
			echo "    \"node_success\": ${TEST_SUCCESS}" >> ${TESTOUTPUT_JSON}
		else
			echo "    \"test\": \"${BASENAME}\"," >> ${TESTOUTPUT_JSON}
			echo "    \"is_repl\": \"false\"," >> ${TESTOUTPUT_JSON}
			echo "    \"docstring\": \"${DOCSTRING}\"," >> ${TESTOUTPUT_JSON}
			echo "    \"node_ignored\": false," >> ${TESTOUTPUT_JSON}
			echo "    \"node_success\": ${TEST_SUCCESS}," >> ${TESTOUTPUT_JSON}
			echo "    \"diffs\": [" >> ${TESTOUTPUT_JSON}
			do_image_comparison "NORMAL" ${BASENAME} ${TESTOUTPUT_JSON}
			echo "    ," >> ${TESTOUTPUT_JSON}
			do_image_comparison "EXPLODED" ${BASENAME} ${TESTOUTPUT_JSON}
			echo "    ]" >> ${TESTOUTPUT_JSON}
		fi
		echo "  }" >> ${TESTOUTPUT_JSON}
	fi
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
		NUMTESTS=$(ls ./${TESTDIR}/*.js | wc | awk '{ print $1 }')
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


