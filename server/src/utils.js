/*
This file is part of Vodka.

Vodka is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Vodka is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Vodka.  If not, see <https://www.gnu.org/licenses/>.
*/

function isInDocContext(n) {
	let p = n.getParent();
	return isDocElement(p);
}

function isDocElement(n) {
	return isDoc(n) || isLine(n) || isWord(n);
}

function isExpectation(n) {
	return (n instanceof Expectation);
}

function isDoc(n) {
	return (n instanceof Doc);
}

function isLine(n) {
	return (n instanceof Line);
}

function isWord(n) {
	return (n instanceof Word);
}

function isSeparator(n) {
	return (n instanceof Separator);
}

function isLetter(n) {
	return (n instanceof Letter && !(n instanceof Separator));
}

function isCodeContainer(n) {
	return isCommand(n) || isExpectation(n) || isLambda(n);
}

function isCommand(n) {
	return (n instanceof Command);
}

function isLambda(n) {
	return (n instanceof Lambda);
}

function isInsertionPoint(n) {
	return (n instanceof InsertionPoint);
}