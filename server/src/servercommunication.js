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

import { BINDINGS } from './environment.js'
import { EError, ERROR_TYPE_FATAL, ERROR_TYPE_WARN, ERROR_TYPE_INFO } from './nex/eerror.js'
import { evaluateNexSafely } from './evaluator.js'
import { parse } from './nexparser2.js';

function sendToServer(payload, cb, errcb) {
	let xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {};
	xhr.open('POST', 'api')
	xhr.send(payload);
	xhr.onload = function() {
		if (xhr.readyState === xhr.DONE && xhr.status === 200) {
			cb(xhr.response);
		} else {
			errcb();
		}
	};
	xhr.onerror = function() {
		errcb();
	}
}

function loadNex(name, method, callback) {
	let payload = `${method}\t${name}`;

	sendToServer(payload, function(data) {
		document.title = name;
		parseReturnPayload(data, callback);
	}, function() {
		callback(serverError());
	});
}

function loadRaw(name, method, callback) {
	let payload = `${method}\t${name}`;

	sendToServer(payload, function(data) {
		callback(data);
	}, function() {
		callback(serverError());
	});
}

function saveNex(name, nex, method, callback) {
	let payload = `${method}\t${name}\t${'v2:' + nex.toString('v2')}`;

	sendToServer(payload, function(data) {
		parseReturnPayload(data, callback);
	}, function() {
		callback(serverError());
	});
}

function saveRaw(name, data, method, callback) {
	let payload = `${method}\t${name}\t${data}`;

	sendToServer(payload, function(data) {
		parseReturnPayload(data, callback);
	}, function() {
		callback(serverError());
	});
}

function importNex(name, method, callback) {
	let payload = `${method}\t${name}`;

	sendToServer(payload, function(data) {
		parseReturnPayload(data, function(nex) {
			callback(evaluatePackage(nex));
		})
	}, function() {
		callback(serverError());
	});
}

function loadAndRun(name, callback) {
	let payload = `load\t${name}`;

	sendToServer(payload, function(data) {
		parseReturnPayload(data, function(parsed) {
			let result = evaluateNexSafely(parsed, BINDINGS);
			callback(result);
		});
	}, function() {
		callback(serverError());
	});
}

function serverError() {
	let r = new EError("Server error.");
	return r;
}


function parseReturnPayload(data, callback) {
	let result = null;
	try {
		result = parse(data);
	} catch (e) {
		if (!(e instanceof EError)) {
			result = new EError(
`PEG PARSER PERROR
full error message follows:
${e.name}
${e.message}
line: ${e.location.start.line}
col: ${e.location.start.column}
found: "${e.found}"
expected: ${e.expected[0].type}
` + e);
		}
	}
	callback(result);
}

function evaluatePackage(nex) {
	if (!(nex.getTypeName() == '-command-'
				&& (nex.getCommandName() == 'package-named--is'
				|| nex.getCommandName() == 'template'))) {
		let r = new EError('Can only import packages or templates, see file contents')
		r.appendChild(nex);
		return r;
	}
	let result = evaluateNexSafely(nex, BINDINGS);
	let r = null;
	if (result.getTypeName() == '-error-'
			&& result.getErrorType() == ERROR_TYPE_FATAL) {
		r = new EError("Import failed.");
		r.setErrorType(ERROR_TYPE_FATAL);
	} else if (result.getTypeName() == '-error-'
			&& result.getErrorType() == ERROR_TYPE_WARN) {
		r = new EError("Import succeeded with warnings.");
		r.setErrorType(ERROR_TYPE_WARN);
	} else {
		r = new EError("Import successful.");
		r.setErrorType(ERROR_TYPE_INFO);		
	}
	r.appendChild(result);
	r.appendChild(nex);
	return r;
}

// This util is meant to be used from functions like
// save-template and save-package.
// These aren't meant to be called from "code" because it doesn't
// give you access to success/failure, or the returned expectation.
// It's more of an ide shortcut kind of thing.
function saveShortcut(namesym, val, callback) {
	let nametype = namesym.getTypeName();
	let savemethod = '';
	let nm = '';
	if (nametype == '-symbol-') {
		savemethod = 'savepackage';
		nm = namesym.getTypedValue();
	} else if (nametype == '-string-') {
		savemethod = 'save';
		nm = namesym.getFullTypedValue();
	} else {
		callback("wrong arg type"); // I guess we're not saving anything
		return;
	}
	saveNex(nm, val, savemethod, function(result) {
		if (result.getTypeName() == '-error-'
			&& result.getErrorType() == ERROR_TYPE_INFO) {
			callback(null);
		} else {
			callback(result);
		}
	});
}

export {
	saveNex,
	importNex,
	loadNex,
	loadRaw,
	saveRaw,
	loadAndRun,
	saveShortcut
}