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

function saveNex(name, nex, expectation) {
	let payload = `save\t${name}\t${nex.toString()}`;

	sendToServer(payload, function(data) {
		let e = new EError("success");
		expectation.fulfill(e);
	});
}

function loadNex(name, expectation) {
	let payload = `load\t${name}`;

	sendToServer(payload, function(data) {
		let nex = new NexParser(data).parse();
		expectation.fulfill(nex);
	});
}

function importNex(name, expectation) {
	let payload = `load\t${name}`;

	sendToServer(payload, function(data) {
		let nex = new NexParser(data).parse();
		let result = evaluateNexSafely(nex, BUILTINS);
		expectation.fulfill(result);
	});
}

function importChain(importList, nex, expectation) {
	if (importList.numChildren() == 0) {
		let result = evaluateNexSafely(nex, BUILTINS);
		expectation.fulfill(result);
		// idk
	} else {
		let name = importList.removeChildAt(0).getTypedValue();
		let payload = `load\t${name}`;

		sendToServer(payload, function(data) {
			let imported = new NexParser(data).parse();
			evaluateNexSafely(imported, BUILTINS);
			// discard result of evaluation.
			importChain(importList, nex, expectation);
		});
	}

}