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
	var xhr = new XMLHttpRequest();
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
	var payload = `save\t${name}\t${nex.toString()}`;

	sendToServer(payload, function(data) {
		var e = new EError("success");
		expectation.fulfill(e);
	});
}

function loadNex(name, expectation) {
	var payload = `load\t${name}`;

	sendToServer(payload, function(data) {
		var nex = new NexParser(data).parse();
		expectation.fulfill(nex);
	});
}