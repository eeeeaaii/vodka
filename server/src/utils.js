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

import { NexContainer } from './nex/nexcontainer.js';
import { EError } from './nex/eerror.js';
import * as Utils from './utils.js'
import { Expectation } from './nex/expectation.js';
import { Doc } from './nex/doc.js';
import { Line } from './nex/line.js';
import { Word } from './nex/word.js';
import { Separator } from './nex/separator.js';
import { Letter } from './nex/letter.js';
import { EString } from './nex/estring.js';
import { Command } from './nex/command.js';
import { Lambda } from './nex/lambda.js';
import { InsertionPoint } from './nex/insertionpoint.js';
import { RenderNode } from './rendernode.js';

import { ERROR_TYPE_FATAL} from './nex/eerror.js'


function isError(n) {
	if (!n) return false;
	return n.getTypeName() == '-error-';
}

function isFatalError(n) {
	if (!n) return false;
	return n.getTypeName && n.getTypeName() == '-error-' && n.getErrorType() == ERROR_TYPE_FATAL && !n.shouldSuppress();
}

function isInDocContext(n) {
	let p = n.getParent();
	return isDocElement(p);
}

function isDocElement(n) {
	return isDoc(n) || isLine(n) || isWord(n);
}

function isExpectation(n) {
	if (n instanceof RenderNode) n = n.getNex();
if (!n) return false;
	return n.getTypeName() == '-expectation-';
}

function isDoc(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n) return false;
	return n.getTypeName() == '-doc-';
}

function isLine(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n) return false;
	return n.getTypeName() == '-line-';
}

function isWord(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n) return false;
	return n.getTypeName() == '-word-';
}

function isSeparator(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n) return false;
	return n.getTypeName() == '-separator-';
}

function isLetter(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n) return false;
	return n.getTypeName() == '-letter-';
}

function isCodeContainer(n) {
	return isCommand(n) || isExpectation(n) || isLambda(n);
}

function isNexContainer(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n) return false;
	return (n.isNexContainer());
}

function isEString(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n) return false;
	return n.getTypeName() == '-estring-';
}

function isCommand(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n) return false;
	return n.getTypeName() == '-command-';
}

function isLambda(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n) return false;
	return n.getTypeName() == '-lambda-';
}

function isInsertionPoint(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n) return false;
	return n.getTypeName() == '-insertionpoint-';
}

export {
	isError,
	isFatalError,
	isInDocContext,
	isDocElement,
	isExpectation,
	isDoc,
	isLine,
	isWord,
	isSeparator,
	isLetter,
	isCodeContainer,
	isNexContainer,
	isEString,
	isCommand,
	isLambda,
	isInsertionPoint
}
