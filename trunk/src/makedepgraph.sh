#!/bin/bash

echo "digraph {" > dependencies.dot
for A in *.h; do
	cat $A | grep '#include "' | sed 's/#include/   "'$A'" -> /' >> dependencies.dot
done
echo "}" >> dependencies.dot

dot -Tpdf -odotoutput.pdf dependencies.dot
rm dotoutput.dot
open dotoutput.pdf
