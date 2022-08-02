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

import * as Utils from './utils.js'

import { Nex } from './nex/nex.js';

import { constructBool } from './nex/bool.js';
import { constructInteger } from './nex/integer.js';
import { constructESymbol } from './nex/esymbol.js';
import { constructEString } from './nex/estring.js';
import { constructFloat } from './nex/float.js';
import { constructNil } from './nex/nil.js';
import { constructOrg } from './nex/org.js';
import { constructInstantiator } from './nex/instantiator.js';
import { constructDeferredCommand } from './nex/deferredcommand.js';
import { constructLambda } from './nex/lambda.js';
import { constructCommand } from './nex/command.js';
import { constructWord } from './nex/word.js';
import { constructWavetable } from './nex/wavetable.js';
import { constructSurface } from './nex/surface.js';
import { constructLine } from './nex/line.js';
import { constructDoc } from './nex/doc.js';
import { constructEError, newTagOrThrowOOM } from './nex/eerror.js';
import { constructLetter } from './nex/letter.js';
import { constructSeparator } from './nex/separator.js';

import { Tag } from './tag.js'

function concatParserString(arr) {
	if (arr == null) {
		return '';
	}
	return arr.join('');
}

function decorateNex(nex, tags, nonmutable) {
	if (!nonmutable) {
		nex.setMutable(true);
	}		
	if (!tags) {
		return nex;
	}
	for (let i = 0; i < tags.length; i++) {
		let fixedTag = concatParserString(tags[i]);
		nex.addTag(newTagOrThrowOOM(fixedTag, 'parsing saved data'));
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
	} else if (vh == 'z') {
		obj.setZdirectional();
	} else {
		throw new Error('unknown verthoriz code');
	}
}

function makeInteger(negation, digits, taglist, nonmutable) {
	let n = Number(concatParserString(digits));
	if (negation) {
		n = -n;
	}
	return decorateNex(constructInteger(n), taglist, nonmutable);
}

function makeSymbol(letters, taglist, nonmutable) {
	return decorateNex(constructESymbol(concatParserString(letters)), taglist, nonmutable);
}

function makeString(privateData, taglist, nonmutable) {
	let str = constructEString();
	setPrivateData(str, privateData);
	return decorateNex(str, taglist, nonmutable);
}

function makeError(privateData, taglist, nonmutable) {
	let err = constructEError();
	setPrivateData(err, privateData);
	return decorateNex(err, taglist, nonmutable);
}

function makeFloat(contents, taglist, nonmutable) {
	return decorateNex(constructFloat(contents), taglist, nonmutable);
}

function makeBool(val, taglist, nonmutable) {
	return decorateNex(constructBool(val), taglist, nonmutable);
}

function makeNil(taglist, nonmutable) {
	return decorateNex(constructNil(), taglist, nonmutable);
}

function makeOrgList(children, privateData, taglist, verthoriz, nonmutable) {
	let t = constructOrg();
	appendChildrenToListType(t, children);
	setPrivateData(t, privateData);
	decorateNex(t, taglist, nonmutable);
	setVertHoriz(t, verthoriz);
	return t;
}

function makeDeferredCommandList(children, privateData, taglist, verthoriz, nonmutable) {
	let t = constructDeferredCommand();
	appendChildrenToListType(t, children);
	setPrivateData(t, privateData);
	decorateNex(t, taglist, nonmutable);
	setVertHoriz(t, verthoriz);
	return t;
}

function makeLambdaList(children, privateData, taglist, verthoriz, nonmutable) {
	let t = constructLambda();
	appendChildrenToListType(t, children);
	setPrivateData(t, privateData);
	decorateNex(t, taglist, nonmutable);
	setVertHoriz(t, verthoriz);
	return t;
}

function makeCommandList(name, children, privateData, taglist, verthoriz, nonmutable) {
	let cmdname = Utils.convertV2StringToMath(concatParserString(name));
	let t = constructCommand(cmdname);
	appendChildrenToListType(t, children);
	setPrivateData(t, privateData);
	decorateNex(t, taglist, nonmutable);
	setVertHoriz(t, verthoriz);
	return t;
}

function makeInstantiatorList(children, privateData, taglist, verthoriz, nonmutable) {
	let t = constructInstantiator('');
	appendChildrenToListType(t, children);
	setPrivateData(t, privateData);
	decorateNex(t, taglist, nonmutable);
	setVertHoriz(t, verthoriz);
	return t;
}

function makeInstanceAtom(instname, privatedata, taglist, nonmutable) {
	// currently only letter, separator, and newline supported
	let name = concatParserString(instname);
	let t = null;
	let isList = false;
	switch(name) {
		case 'newline': // so I can parse old files
			t = constructNil();
			break;
		case 'nil':
			t = constructNil();
			break;
		case 'wavetable':
			t = constructWavetable(0);
			break;
		case 'surface':
			t = constructSurface(concatParserString(privatedata));
			break;
		case 'letter':
			t = constructLetter(concatParserString(privatedata));
			break;
		case 'separator':
			t = constructSeparator(concatParserString(privatedata));
			break;
		default:
			throw new Error('unrecognized instance type: ' + instname);
	}
	setPrivateData(t, privatedata);
	decorateNex(t, taglist, nonmutable);
	return t;}

function makeInstanceList(instname, children, privatedata, taglist, verthoriz, nonmutable) {
	// currently only word, doc, and line supported
	let name = concatParserString(instname);
	let t = null;
	let isList = false;
	switch(name) {
		case 'word':
			t = constructWord();
			isList = true;
			break;
		case 'line':
			t = constructLine();
			isList = true;
			break;
		case 'doc':
			t = constructDoc();
			isList = true;
			break;
		default:
			throw new Error('unrecognized list instance type: ' + instname);
	}
	appendChildrenToListType(t, children);
	setPrivateData(t, privatedata);
	decorateNex(t, taglist, nonmutable);
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
	makeDeferredCommandList,
	makeInstanceList,
	makeInstanceAtom,
	makeInstantiatorList,
	makeError
}

