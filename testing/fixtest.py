#!/usr/bin/env python3

import sys
import re

first_line = True

def do_start():
	print("")
	print("var testactions = [];")
	print("")


def do_end():
	print("")
	print("harness.runTestNew(testactions, 'direct-legacy');")

# example:
# doKeyInput('Shift', 'ShiftLeft', true, false, false);
def do_test_line(match, line):
	keyname = match.group(2)
	global first_line
	if first_line and keyname == 'Escape':
		first_line = False
		return
	if keyname == 'ShiftLeft' or keyname == 'ShiftRight':
		return
	if keyname == 'ControlLeft' or keyname == 'ControlRight':
		return
	if keyname == 'AltLeft' or keyname == 'AltRight':
		return
	hasShift = (match.group(3) == 'true')
	hasCtrl = (match.group(4) == 'true')
	hasMeta = (match.group(5) == 'true')
	if hasShift:
		print("testactions.push({type:'keydown',code:'ShiftLeft'});")
	if hasCtrl:
		print("testactions.push({type:'keydown',code:'ControlLeft'});")
	if hasMeta:
		print("testactions.push({type:'keydown',code:'AltLeft'});")
	print("testactions.push({type:'keydown',code:'" + keyname + "'});")
	print("testactions.push({type:'keyup',code:'" + keyname + "'});")
	if hasMeta:
		print("testactions.push({type:'keyup',code:'AltLeft'});")
	if hasCtrl:
		print("testactions.push({type:'keyup',code:'ControlLeft'});")
	if hasShift:
		print("testactions.push({type:'keyup',code:'ShiftLeft'});")


def do_regular_line(line):
	print(line, end='')

if len(sys.argv) < 2:
	print("need argument: file to fix.")
	sys.exit()

filename = sys.argv[1]

f = open(filename, "r")
for line in f:
	result = re.match('doKeyInput\\(\'(.*)\', \'(.*)\', (true|false), (true|false), (true|false)', line)
	firstharness = re.match('harness\\.runTest\\(function\\(\\) {', line)
	endharness = re.match('}\\);', line)
	if firstharness:
		do_start()
	elif endharness:
		do_end()
	elif result:
		do_test_line(result, line)
	else:
		do_regular_line(line)


f.close()