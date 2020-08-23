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

import { Nex } from './nex/nex.js';
import { Bool } from './nex/bool.js';
import { Integer } from './nex/integer.js';
import { ESymbol } from './nex/esymbol.js';
import { EString } from './nex/estring.js';
import { Float } from './nex/float.js';
import { Nil } from './nex/nil.js';
import { Org } from './nex/org.js';
import { Expectation } from './nex/expectation.js';
import { Lambda } from './nex/lambda.js';
import { Command } from './nex/command.js';
import { Word } from './nex/word.js';
import { Line } from './nex/line.js';
import { Doc } from './nex/doc.js';
import { Zlist } from './nex/zlist.js';
import { EError } from './nex/eerror.js';
import { Letter } from './nex/letter.js';
import { Separator } from './nex/separator.js';
import { Newline } from './nex/newline.js';
import { InsertionPoint } from './nex/insertionpoint.js';
import { Tag } from './tag.js'

function concatParserString(arr) {
	if (arr == null) {
		return '';
	}
	return arr.join('');
}

function addTagsToNex(nex, tags) {
	if (!tags) {
		return nex;
	}
	for (let i = 0; i < tags.length; i++) {
		let fixedTag = concatParserString(tags[i]);
		nex.addTag(new Tag(fixedTag));
	}
	return nex;
}

function appendChildrenToListType(listtype, children) {
	for (let i = 0; i < children.length ; i++) {
		listtype.appendChild(children[i]);
	}
	return listtype;	
}

function setPrivateData(obj, parserStr) {
	let str = concatParserString(parserStr);
	obj.deserializePrivateData(str);
	return obj;
}

function setVertHoriz(obj, vh) {
	if (vh == 'v') {
		obj.setVertical();
	} else if (vh == 'h') {
		obj.setHorizontal();
	} else {
		throw new Error('unknown verthoriz code');
	}
}

function makeInteger(negation, digits, taglist) {
	let n = Number(concatParserString(digits));
	if (negation) {
		n = -n;
	}
	return addTagsToNex(new Integer(n), taglist);
}

function makeSymbol(letters, taglist) {
	return addTagsToNex(new ESymbol(concatParserString(letters)), taglist);
}

function makeString(contents, taglist) {
	return addTagsToNex(new EString(concatParserString(contents)), taglist);
}

function makeError(contents, taglist) {
	return addTagsToNex(new EError(concatParserString(contents)), taglist);
}

function makeFloat(contents, taglist) {
	return addTagsToNex(new Float(contents), taglist);
}

function makeBool(val, taglist) {
	return addTagsToNex(new Bool(val), taglist);
}

function makeNil(taglist) {
	return addTagsToNex(new Nil(), taglist);
}

function makeOrgList(children, privateData, taglist, verthoriz) {
	let t = new Org();
	appendChildrenToListType(t, children);
	setPrivateData(t, privateData);
	addTagsToNex(t, taglist);
	setVertHoriz(t, verthoriz);
	return t;
}

function makeExpList(children, privateData, taglist, verthoriz) {
	let t = new Expectation();
	appendChildrenToListType(t, children);
	setPrivateData(t, privateData);
	addTagsToNex(t, taglist);
	setVertHoriz(t, verthoriz);
	return t;
}

function makeLambdaList(children, privateData, taglist, verthoriz) {
	let t = new Lambda();
	appendChildrenToListType(t, children);
	setPrivateData(t, privateData);
	addTagsToNex(t, taglist);
	setVertHoriz(t, verthoriz);
	return t;
}

function makeCommandList(name, children, privateData, taglist, verthoriz) {
	let cmdname = Command.convertV2StringToMath(concatParserString(name));
	let t = new Command(cmdname);
	appendChildrenToListType(t, children);
	setPrivateData(t, privateData);
	addTagsToNex(t, taglist);
	setVertHoriz(t, verthoriz);
	return t;
}

function makeInstanceAtom(instname, privatedata, taglist) {
	// currently only letter, separator, and newline supported
	let name = concatParserString(instname);
	let t = null;
	let isList = false;
	switch(name) {
		case 'letter':
			t = new Letter(concatParserString(privatedata));
			break;
		case 'separator':
			t = new Separator(concatParserString(privatedata));
			break;
		case 'newline':
			t = new Newline();
			break;
		default:
			throw new Error('unrecognized instance type: ' + instname);
	}
	setPrivateData(t, privatedata);
	addTagsToNex(t, taglist);
	return t;}

function makeInstanceList(instname, children, privatedata, taglist, verthoriz) {
	// currently only word, doc, and line supported
	let name = concatParserString(instname);
	let t = null;
	let isList = false;
	switch(name) {
		case 'word':
			t = new Word();
			isList = true;
			break;
		case 'line':
			t = new Line();
			isList = true;
			break;
		case 'doc':
			t = new Doc();
			isList = true;
			break;
		case 'zlist':
			t = new Zlist();
			isList = true;
			break;
		default:
			throw new Error('unrecognized instance type: ' + instname);
	}
	appendChildrenToListType(t, children);
	setPrivateData(t, privatedata);
	addTagsToNex(t, taglist);
	setVertHoriz(t, verthoriz);
	return t;
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
	makeOrgList,
	makeExpList,
	makeInstanceList,
	makeInstanceAtom,
	makeError
}

