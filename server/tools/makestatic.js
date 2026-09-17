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
Builds the folder you can drop on any static host. No node process, nothing to
keep running, nothing to patch.

It is the same client bundle the vodka server serves; what differs is the three
files written here. config.json says there is no saving and no live directory
listing, and the two index.json files are the directory listings a static host
cannot produce for itself.
*/

const fs = require('fs');
const path = require('path');

const OUT = process.argv[2] ? process.argv[2] : './static';
const SERVER_DIR = path.join(__dirname, '..');

function copyDir(from, to) {
	fs.mkdirSync(to, { recursive: true });
	for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
		const src = path.join(from, entry.name);
		const dst = path.join(to, entry.name);
		if (entry.isDirectory()) {
			copyDir(src, dst);
		} else {
			fs.copyFileSync(src, dst);
		}
	}
}

function audioIndex(dir) {
	const index = {};
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue;
		index[entry.name] = fs.readdirSync(path.join(dir, entry.name))
				.filter(f => f.toLowerCase().endsWith('.wav'));
	}
	return index;
}

function main() {
	const out = path.resolve(OUT);
	fs.rmSync(out, { recursive: true, force: true });
	fs.mkdirSync(out, { recursive: true });

	// the app itself
	copyDir(path.join(SERVER_DIR, 'dist'), path.join(out, 'dist'));
	copyDir(path.join(SERVER_DIR, 'src', 'css'), path.join(out, 'css'));
	copyDir(path.join(SERVER_DIR, 'packages'), path.join(out, 'packages'));
	copyDir(path.join(SERVER_DIR, 'sounds'), path.join(out, 'sounds'));
	copyDir(path.join(SERVER_DIR, 'waves'), path.join(out, 'waves'));

	// host.html is served as / by the vodka server, and index.html is what a
	// static host looks for
	fs.copyFileSync(path.join(SERVER_DIR, 'src', 'host.html'),
			path.join(out, 'index.html'));

	fs.writeFileSync(path.join(out, 'config.json'), JSON.stringify({
		canSave: false,
		liveIndex: false,
	}, null, 1) + '\n');

	const packages = fs.readdirSync(path.join(SERVER_DIR, 'packages'));
	fs.writeFileSync(path.join(out, 'packages', 'index.json'),
			JSON.stringify(packages, null, 1) + '\n');
	console.log('makestatic: packages/index.json lists ' + packages.length + ' entries');

	// the audio libraries are a bank (or category) holding wav files, so their
	// index is a map, which is what list-audio reads
	for (const dir of ['sounds', 'waves']) {
		const index = audioIndex(path.join(SERVER_DIR, dir));
		fs.writeFileSync(path.join(out, dir, 'index.json'),
				JSON.stringify(index, null, 1) + '\n');
		const banks = Object.keys(index);
		let count = 0;
		for (const bank of banks) count += index[bank].length;
		console.log('makestatic: ' + dir + '/index.json lists ' + count
				+ ' wav files in ' + banks.length + ' folders');
	}

	console.log('makestatic: wrote ' + out);
	console.log('makestatic: serve that folder with anything -- no vodka server needed');
}

main();
