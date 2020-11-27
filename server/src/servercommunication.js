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
import { EError, ERROR_TYPE_WARN, ERROR_TYPE_INFO } from './nex/eerror.js'
import { evaluateNexSafely } from './evaluator.js'
import { parse } from './nexparser2.js';

function sendToServer(payload, cb) {
	let xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {};
	xhr.open('POST', 'api')
	xhr.send(payload);
	xhr.onload = function() {
		if (xhr.readyState === xhr.DONE && xhr.status === 200) {
			cb(xhr.response);
		}
  	}
}

function loadNex(name, method, callback) {
	let payload = `${method}\t${name}`;

	sendToServer(payload, function(data) {
		document.title = name;
		parseReturnPayload(data, callback);
	});
}

function loadRaw(name, method, callback) {
	let payload = `${method}\t${name}`;

	sendToServer(payload, function(data) {
		callback(data);
	});
}

function saveNex(name, nex, method, callback) {
	let payload = `${method}\t${name}\t${'v2:' + nex.toString('v2')}`;

	sendToServer(payload, function(data) {
		parseReturnPayload(data, callback);
	});
}

function saveRaw(name, data, method, callback) {
	let payload = `${method}\t${name}\t${data}`;

	sendToServer(payload, function(data) {
		parseReturnPayload(data, callback);
	});
}

function importNex(name, method, callback) {
	let payload = `${method}\t${name}`;

	sendToServer(payload, function(data) {
		parseReturnPayload(data, function(nex) {
			callback(evaluatePackage(nex));
		})
	});
}

function loadAndRun(name, callback) {
	let payload = `load\t${name}`;

	sendToServer(payload, function(data) {
		parseReturnPayload(data, function(parsed) {
			let result = evaluateNexSafely(parsed, BINDINGS);
			callback(result);
		});
	});	
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
	if (nex.getTypeName() != '-command-' || nex.getCommandName() != 'package') {
		let r = new EError('Cannot import a non-package, see file contents')
		r.appendChild(nex);
		return r;
	}
	let result = evaluateNexSafely(nex, BINDINGS);
	if (result.getTypeName() == '-error-') {
		let r = new EError("Import failed.");
		r.setErrorType(ERROR_TYPE_WARN);
		r.appendChild(result);
		r.appendChild(nex);
		return r;
	}
	let r = new EError("Import successful.");
	r.setErrorType(ERROR_TYPE_INFO);
	return r;
}

export { saveNex, importNex, loadNex, loadRaw, saveRaw, loadAndRun  }