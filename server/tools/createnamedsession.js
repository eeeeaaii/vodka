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

/*
Creates a named session. Used to be possible over HTTP with ?new&sessionId=,
which let anyone claim any name.

  node tools/createnamedsession.js <name>

Run from the server directory.
*/

const fs = require('fs');
const path = require('path');

// kept in step with webserver.js
const GENERATED_SESSION_PREFIX = 'vs-';

const RESERVED = ['packages', 'samples'];

const USAGE = `usage: node tools/createnamedsession.js <name>

Creates a named session, which is a directory under namedsessions/ that vodka
saves and loads files in. Named sessions can only be made here -- the server
used to allow it over HTTP, which let anyone claim any name.

Names may contain letters, digits, underscores and hyphens. "packages" and
"samples" are reserved, and a name cannot start with "vs-", which marks the
sessions the server generates for itself.

Open the result at /?sessionId=<name>

Run from the server directory.`;

function fail(message) {
	console.error('createnamedsession: ' + message);
	process.exit(1);
}

function main() {
	let name = process.argv[2];

	if (name == '--help' || name == '-h') {
		console.log(USAGE);
		process.exit(0);
	}

	if (!name) {
		console.error(USAGE);
		process.exit(1);
	}

	// Hyphens are legal inside a name, so an option typo like --dry-run would
	// otherwise pass validation and create a directory named after the flag.
	if (name.indexOf('-') === 0) {
		fail(`"${name}" starts with a hyphen. If you meant an option, the only`
				+ ` one is --help.`);
	}

	if (RESERVED.indexOf(name) >= 0) {
		fail(`"${name}" is reserved.`);
	}

	if (name.indexOf(GENERATED_SESSION_PREFIX) === 0) {
		fail(`"${GENERATED_SESSION_PREFIX}" is reserved for sessions the server generates.`
				+ ` A named session starting with it would be looked for in the wrong directory.`);
	}

	if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
		fail(`"${name}" is not a valid name -- letters, digits, underscores and hyphens only.`);
	}

	// relative, same as the server resolves them
	let dir = path.join('./namedsessions', name);

	if (!fs.existsSync('./namedsessions')) {
		fail('no namedsessions directory here -- run this from the server directory.');
	}

	if (fs.existsSync(dir)) {
		fail(`session "${name}" already exists at ${dir}`);
	}

	try {
		fs.mkdirSync(dir);
	} catch (e) {
		fail(`could not create ${dir}: ${e.message}`);
	}

	console.log(`created named session "${name}" at ${dir}`);
	console.log(`open it at /?sessionId=${name}`);
}

main();
