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
	return isDeferredValue(n) || isDeferredCommand(n)
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

function beep() {
    var snd = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");  
    snd.play();
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

export {
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
	isLambda,
	isRoot,
	isNex,
	isESymbol,
	isNil,
	isBool,
	isFloat,
	isInteger,
	isClosure,
	beep,
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
	figureOutWhatItCanBe
}
