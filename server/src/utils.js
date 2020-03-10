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
	if (n instanceof RenderNode) n = n.getNex();
	return (n instanceof Expectation);
}

function isDoc(n) {
	if (n instanceof RenderNode) n = n.getNex();
	return (n instanceof Doc);
}

function isLine(n) {
	if (n instanceof RenderNode) n = n.getNex();
	return (n instanceof Line);
}

function isWord(n) {
	if (n instanceof RenderNode) n = n.getNex();
	return (n instanceof Word);
}

function isSeparator(n) {
	if (n instanceof RenderNode) n = n.getNex();
	return (n instanceof Separator);
}

function isLetter(n) {
	if (n instanceof RenderNode) n = n.getNex();
	return (n instanceof Letter && !(n instanceof Separator));
}

function isCodeContainer(n) {
	return isCommand(n) || isExpectation(n) || isLambda(n);
}

function isNexContainer(n) {
	if (n instanceof RenderNode) n = n.getNex();
	return (n instanceof NexContainer);
}

function isEString(n) {
	if (n instanceof RenderNode) n = n.getNex();
	return (n instanceof EString);
}

function isCommand(n) {
	if (n instanceof RenderNode) n = n.getNex();
	return (n instanceof Command);
}

function isLambda(n) {
	if (n instanceof RenderNode) n = n.getNex();
	return (n instanceof Lambda);
}

function isInsertionPoint(n) {
	if (n instanceof RenderNode) n = n.getNex();
	return (n instanceof InsertionPoint);
}