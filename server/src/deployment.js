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
What kind of thing is serving this. One bundle runs both ways: from the vodka
server, where it can save and where directories can be listed as they are now,
and from any static host, where it cannot save and reads a list written at build
time.

The client is told rather than built twice, so the same dist/ works either way
and the deployment decides. A missing config.json means a static host that was
given only the bundle, which is the safe reading: no saving.
*/

let config = {
	canSave: false,
	liveIndex: false,
};

function loadDeploymentConfig() {
	return fetch('config.json')
		.then(function (r) { return r.ok ? r.json() : null; })
		.then(function (c) { if (c) config = c; })
		.catch(function () { /* no config, stay static */ });
}

function canSave() {
	return !!config.canSave;
}

// A live server can read its own directory, so a file you add while working
// shows up without a rebuild. A static host has to be told at build time.
function hasLiveIndex() {
	return !!config.liveIndex;
}

export { loadDeploymentConfig, canSave, hasLiveIndex }
