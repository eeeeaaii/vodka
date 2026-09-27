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

import { RenderNode } from './rendernode.js';
import { ContextType } from './contexttype.js'
import { ERROR_TYPE_FATAL} from './nex/eerror.js'


function figureOutWhatItCanBe(txt) {
	let intRegex = /^[0-9]/;
	let commandRegex = /^[a-zA-Z0-9:. /=+*-]$/;
	let symbolRegex = /^[a-zA-Z0-9-_']$/;

	return {
		integer: intRegex.test(txt),
		symbol: symbolRegex.test(txt),
		command: commandRegex.test(txt)	
	}
}


function getQSVal(k) {
	let params = new URLSearchParams(window.location.search);
	let lastVal = null;
	params.forEach(function(value, key) {
		if (key == k) {
			lastVal = value;
		}
	});
	return lastVal;
}


function getCookie(key) {
	let cookies = document.cookie;
	let a = cookies.split('; ');
	for (let i = 0; i < a.length; i++) {
		let b = a[i];
		let c = b.split('=');
		if (c[0] == key) {
			return c[1];
		}
	}
	return null;
}

function setCookie(key, val) {
	document.cookie = `${key}=${val}`;
}

function isError(n) {
	if (!n || !n.getTypeName) return false;
	return n.getTypeName() == '-error-';
}

function isFatalError(n) {
	if (!n || !n.getTypeName) return false;
	return n.getTypeName && n.getTypeName() == '-error-' && n.getErrorType() == ERROR_TYPE_FATAL && !n.shouldSuppress();
}

function isWarning(n) {
	if (!n || !n.getTypeName) return false;
	return n.getTypeName && n.getTypeName() == '-error-' && n.getErrorType() == ERROR_TYPE_WARN && !n.shouldSuppress();
}

function isInfo(n) {
	if (!n || !n.getTypeName) return false;
	return n.getTypeName && n.getTypeName() == '-error-' && n.getErrorType() == ERROR_TYPE_INFO && !n.shouldSuppress();
}

function isNonFatalError(n) {
	if (!n || !n.getTypeName) return false;
	return n.getTypeName && n.getTypeName() == '-error-' && n.getErrorType() != ERROR_TYPE_FATAL && !n.shouldSuppress();
}


function isInDocContext(n) {
	let p = n.getParent();
	return isDocElement(p);
}

function isImmutableContext(context) {
	return (context == ContextType.IMMUTABLE_DOC
		|| context == ContextType.IMMUTABLE_LINE
		|| context == ContextType.IMMUTABLE_WORD);
}

function isDocElement(n) {
	return isDoc(n) || isLine(n) || isWord(n) || isLetter(n) || isSeparator(n);
}

function isDocContainerType(n) {
	return isDoc(n) || isLine(n) || isWord(n);
}

function isDeferred(n) {
	return isDeferredValue(n) || isDeferredCommand(n) || isDeferredCommandValue(n)
}

function isDeferredCommandValue(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n || !n.getTypeName) return false;
	return n.getTypeName() == '-deferredcommandvalue-';
}

function isDeferredValue(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n || !n.getTypeName) return false;
	return n.getTypeName() == '-deferredvalue-';
}

function isDeferredCommand(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n || !n.getTypeName) return false;
	return n.getTypeName() == '-deferredcommand-';
}

function isDoc(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n || !n.getTypeName) return false;
	return n.getTypeName() == '-doc-';
}

function isLine(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n || !n.getTypeName) return false;
	return n.getTypeName() == '-line-';
}

function isWord(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n || !n.getTypeName) return false;
	return n.getTypeName() == '-word-';
}

function isOrg(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n || !n.getTypeName) return false;
	return n.getTypeName() == '-org-';
}

function isSeparator(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n || !n.getTypeName) return false;
	return n.getTypeName() == '-separator-';
}

function isLetter(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n || !n.getTypeName) return false;
	return n.getTypeName() == '-letter-';
}

function isCodeContainer(n) {
	return isCommand(n) || isDeferredCommand(n) || isLambda(n);
}

function isNexContainer(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n || !n.getTypeName) return false;
	return (n.isNexContainer());
}

function isBool(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n || !n.getTypeName) return false;
	return n.getTypeName() == '-bool-';
}

function isContract(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n || !n.getTypeName) return false;
	return n.getTypeName() == '-contract-';
}

function isClip(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n || !n.getTypeName) return false;
	return n.getTypeName() == '-clip-';
}

function isFloat(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n || !n.getTypeName) return false;
	return n.getTypeName() == '-float-';
}

function isInteger(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n || !n.getTypeName) return false;
	return n.getTypeName() == '-integer-';
}

function isESymbol(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n || !n.getTypeName) return false;
	return n.getTypeName() == '-symbol-';
}

function isEString(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n || !n.getTypeName) return false;
	return n.getTypeName() == '-string-';
}

function isCommand(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n || !n.getTypeName) return false;
	return n.getTypeName() == '-command-';
}

function isInstantiator(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n || !n.getTypeName) return false;
	return n.getTypeName() == '-instantiator-';
}

function isLambda(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n || !n.getTypeName) return false;
	return n.getTypeName() == '-lambda-';
}

function isBuiltin(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n || !n.getTypeName) return false;
	return n.getTypeName() == '-builtin-';
}

function isClosure(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n || !n.getTypeName) return false;
	return n.getTypeName() == '-closure-';
}

function isNil(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n || !n.getTypeName) return false;
	return n.getTypeName() == '-nil-';
}

function isRoot(n) {
	if (n instanceof RenderNode) n = n.getNex();
	if (!n || !n.getTypeName) return false;
	return n.getTypeName() == '-root-';
}

function isNex(n) {
	return !!(n.getTypeName); // cheat
}


function isMac() {
	return ('' + navigator.platform).substring(0, 3) == 'Mac';
}

function convertMathToV2String(val) {
	switch(val) {
		case '*': return '::ti::';
		case '/': return '::ov::';
		case '+': return '::pl::';
		case '=': return '::eq::';
		case '<': return '::lt::';
		case '>': return '::gt::';
		case '<=': return '::lte::';
		case '>=': return '::gte::';
		case '<>': return '::ne::';
		default: return val;
	}
}

function convertV2StringToMath(val) {
	switch(val) {
		case '::ti::': return '*' ;
		case '::ov::': return '/' ;
		case '::pl::': return '+' ;
		case '::eq::': return '=' ;
		case '::lt::': return '<' ;
		case '::gt::': return '>' ;
		case '::lte::': return '<=' ;
		case '::gte::': return '>=' ;
		case '::ne::': return '<>' ;

		case ':*': return '*' ;
		case ':/': return '/' ;
		case ':+': return '+' ;
		case ':-': return '-' ;
		case ':=': return '=' ;
		case ':<': return '<' ;
		case ':>': return '>' ;
		case ':<=': return '<=' ;
		case ':>=': return '>=' ;
		case ':<>': return '<>' ;
		default: return val;
	}
}


/*
A short random id, for naming something that has to be found again later --
a wavetable's samples, wherever they are kept.

Twelve base36 characters is about 62 bits. Not a uuid, which is 128 bits and 36
characters; this only has to stay unique across the wavetables a person makes,
including ones pasted in from elsewhere, and 62 bits is enormous next to that.
Short enough to read in a saved file.

(comment by Claude)
*/
function newShortId() {
	let bytes = new Uint8Array(9);
	if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
		crypto.getRandomValues(bytes);
	} else {
		for (let i = 0; i < bytes.length; i++) {
			bytes[i] = Math.floor(Math.random() * 256);
		}
	}
	let s = '';
	for (let i = 0; i < bytes.length; i++) {
		s += bytes[i].toString(36).padStart(2, '0');
	}
	return s.substring(0, 12);
}

export {
	newShortId,
	isError,
	isFatalError,
	isNonFatalError,
	isInDocContext,
	isDocElement,
	isDocContainerType,
	isDeferredValue,
	isDeferredCommand,
	isDeferred,
	isDoc,
	isLine,
	isWord,
	isSeparator,
	isLetter,
	isCodeContainer,
	isNexContainer,
	isEString,
	isCommand,
	isContract,
	isClip,
	isLambda,
	isRoot,
	isNex,
	isESymbol,
	isNil,
	isBool,
	isFloat,
	isInteger,
	isClosure,
	isMac,
	isBuiltin,
	isOrg,
	isInstantiator,
	convertV2StringToMath,
	convertMathToV2String,
	isImmutableContext,
	getCookie,
	setCookie,
	getQSVal,
	figureOutWhatItCanBe,
	isDeferredCommandValue
}
