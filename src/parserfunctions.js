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

import { Nex } from '../server/src/nex/nex.js';
import { Bool } from '../server/src/nex/bool.js';
import { Integer } from '../server/src/nex/integer.js';
import { ESymbol } from '../server/src/nex/esymbol.js';
import { EString } from '../server/src/nex/estring.js';
import { Float } from '../server/src/nex/float.js';
import { Nil } from '../server/src/nex/nil.js';
import { Org } from '../server/src/nex/org.js';
import { Expectation } from '../server/src/nex/expectation.js';
import { Lambda } from '../server/src/nex/lambda.js';
import { Command } from '../server/src/nex/command.js';

function concatParserString(arr) {
	return arr.join('');
}

function makeInteger(negation, digits) {
	let n = Number(concatParserString(digits));
	if (negation) {
		n = -n;
	}
	return new Integer(n);
}

function makeSymbol(letters) {
	return new ESymbol(concatParserString(letters));
}

function makeString(contents) {
	return new EString(concatParserString(contents));
}

function makeFloat(contents) {
	return new Float(contents);
}

function makeBool(val) {
	return new Bool(val);
}

function makeNil() {
	return new Nil();
}

function makeOrgList(children) {
	let r = new Org();
	for (let i = 0; i < children.length ; i++) {
		r.appendChild(children[i]);
	}
	return r;
}

function makeExpList(children) {
	let r = new Expectation();
	for (let i = 0; i < children.length ; i++) {
		r.appendChild(children[i]);
	}
	return r;
}

function makeLambdaList(children) {
	let r = new Lambda();
	for (let i = 0; i < children.length ; i++) {
		r.appendChild(children[i]);
	}
	return r;
}

function makeCommandList(children) {
	let r = new Command();
	for (let i = 0; i < children.length ; i++) {
		r.appendChild(children[i]);
	}
	return r;
}

function makeNamedCommandList(name, children) {
	name = concatParserString(name);
	let r = new Command(Command.convertV2StringToMath(name));
	for (let i = 0; i < children.length ; i++) {
		r.appendChild(children[i]);
	}
	return r;
}

function makeNamedCommandListWithPrivate(name, privatedata, children) {
	name = concatParserString(name);
	let r = new Command(Command.convertV2StringToMath(name));
	for (let i = 0; i < children.length ; i++) {
		r.appendChild(children[i]);
	}
	r.setPrivateData(privateData);
	return r;
}

export {
	makeBool,
	makeNil,
	makeFloat,
	makeString,
	makeInteger,
	makeSymbol,
	makeCommandList,
	makeLambdaList,
	makeNamedCommandList,
	makeNamedCommandListWithPrivate,
	makeOrgList,
	makeExpList
}

