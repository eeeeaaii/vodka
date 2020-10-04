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

function saveNex(name, nex, callback) {
	let payload = `save\t${name}\t${'v2:' + nex.toString('v2')}`;

	sendToServer(payload, function(data) {
		let e = new EError("success");
		e.setErrorType(ERROR_TYPE_INFO);
		callback(e);
	});
}

function loadNex(name, callback) {
	let payload = `load\t${name}`;

	sendToServer(payload, function(data) {
		document.title = name;
		try {
			let nex = parse(data);
			callback(nex);
		} catch (e) {
			if (e instanceof EError) {
				callback(nex);
			} else {
				callback(new EError(
`PEG PARSER PERROR
full error message follows:
${e.name}
${e.message}
line: ${e.location.start.line}
col: ${e.location.start.column}
found: "${e.found}"
expected: ${e.expected[0].type}
` + e));
			}
		}
	});
}

function loadRaw(name, callback) {
	let payload = `load\t${name}`;

	sendToServer(payload, function(data) {
		callback(data);
	});
}


function importNex(name, callback) {
	let payload = `load\t${name}`;

	sendToServer(payload, function(data) {
		let nex = parse(data);
		if (!nex.getCommandName || nex.getCommandName() != 'package') {
			let r = new EError('Cannot import a non-package, see file contents')
			r.appendChild(nex);
			callback(r);
			return;
		}
		let result = evaluateNexSafely(nex, BINDINGS);
		let r = null;
		if (result.getTypeName() != '-error-') {
			r = new EError("Import successful.");
			r.setErrorType(ERROR_TYPE_INFO);
		} else {
			r = new EError("Import failed.");
			r.setErrorType(ERROR_TYPE_WARN);
			r.appendChild(result);
			r.appendChild(nex);
		}
		callback(r);
	});
}

export { saveNex, importNex, loadNex, loadRaw  }