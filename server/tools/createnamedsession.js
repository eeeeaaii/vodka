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

(comment by Claude)
*/

const fs = require('fs');
const path = require('path');

// kept in step with webserver.js
// (comment by Claude)
const RESERVED = ['packages', 'samples'];
const SESSIONS_DIR = process.env.VODKA_SESSIONS_DIR
		? process.env.VODKA_SESSIONS_DIR.replace(/\/+$/, '')
		: './namedsessions';

const USAGE = `usage: node tools/createnamedsession.js <name>

Creates a session, which is a directory under namedsessions/ (or under
VODKA_SESSIONS_DIR, if set) that vodka saves and loads files in. The Sessions
tab in the help menu does the same thing on a local server.

Names may contain letters, digits, underscores and hyphens. "packages" and
"samples" are reserved.

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
	// (comment by Claude)
	if (name.indexOf('-') === 0) {
		fail(`"${name}" starts with a hyphen. If you meant an option, the only`
				+ ` one is --help.`);
	}

	if (RESERVED.indexOf(name) >= 0) {
		fail(`"${name}" is reserved.`);
	}

	if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
		fail(`"${name}" is not a valid name -- letters, digits, underscores and hyphens only.`);
	}

	// relative, same as the server resolves them
	// (comment by Claude)
	let dir = path.join(SESSIONS_DIR, name);

	if (!fs.existsSync(SESSIONS_DIR)) {
		fail(`no ${SESSIONS_DIR} directory here -- run this from the server directory,`
				+ ` or start the server once to make it.`);
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
