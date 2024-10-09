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

const http = require('http');
const url = require('url');
const fs = require('fs');
const fsPromises = require('fs').promises;
const querystring = require('querystring');

const { v4: uuidv4 } = require('uuid');

const hostname = '127.0.0.1';
const endpoint_hostname = 'localhost:3000';
const port = 3000;

const writeprotectionfile = 'WRITE_PROTECTED_SESSION.9999999999';


const webenv_vars = {}

const ERROR = "Rather than a beep<br>Or a rude error message,<br>These words: \"File not found.\"";
 
let api_reqs = 1;
let total_reqs = 1;

/*
If you pass a session ID in the cookie, it will fail if there isn't a directory with that name.
If you don't pass a sessionId in the cookie, 
*/

const server = http.createServer((req, resp) => {
	processRequest(req, resp)
		.then(result => {
			total_reqs++;
			return;
		});
});

// The main request processing switch
async function processRequest(req, resp) {
	let parsedUrl = url.parse(req.url, true);
	let query = parsedUrl.query;
	let path = parsedUrl.path;
	let isApi = (path == '/api');

	let sessionIdFromCookie = getSessionIdFromCookie(req);

	if (isApi) {
		if (!sessionIdFromCookie) {
			sendResponse(resp, 401, 'text/html', "session cookie needed for API request.", 'ERROR');
			return;
		}
		loadRequestBody(req, function(data) {
			// need to do something with the promise or the method will exit early I guess?
			serviceApiRequest(sessionIdFromCookie, resp, data)
				.then(r => {
					api_reqs++;
					return;
				});
		})
	} else if (query.new) {
		let sessionId = query.sessionId;
		if (sessionId) {
			let exists = await checkIfSessionExists(query.sessionId);
			if (exists) {
				sendResponse(resp, 401, 'text/html', 'cannot create, session exists already.');
				return;
			}
			if (!isValidSessionNameForUserCreate(query.sessionId)) {
				sendResponse(resp, 401, 'text/html', 'invalid session name');
				return;
			}
			let success = await createSession(sessionId, resp);
			if (!success) {
				sendResponse(resp, 401, 'text/html', 'could not create session');
				return;
			}
		} else {
			sessionId = await createNewUUIDSession(resp);
			if (!sessionId) {
				sendResponse(resp, 401, 'text/html', 'could not create session');
				return;
			}
		}
		sendRedirect(resp, `http://${webenv_vars.redirectHostname}/?sessionId=${sessionId}`);
		return;



	} else if (query.copy) {
		let sessionId = query.sessionId || sessionIdFromCookie;
		let readonly = (query.type == 'readonly');
		if (!sessionId) {
			sendResponse(resp, 401, 'text/html', 'Cannot copy a session without a session ID.');
			return;
		}
		let exists = await checkIfSessionExists(sessionId);
		if (!exists) {
			sendResponse(resp, 401, 'text/html', "unknown session id", 'ERROR');	
			return;		
		}

		let newSessionId = await createNewUUIDSession(resp);
		if (!newSessionId) {
			sendResponse(resp, 401, 'text/html', 'could not create session');
			return;
		}
		if (readonly) {
			let isWriteProtected = await sessionIsWriteProtected(newSessionId);
			if (isWriteProtected) {
				sendResponse(resp, 500, 'text/html', 'new session is already write protected.');
				return;
			}
			let ableToWriteProtect = await writeProtectSession(newSessionId);
			if (!ableToWriteProtect) {
				sendResponse(resp, 500, 'text/html', 'could not write protect read only session.');
				return;
			}
		}
		let success = copySessionContents(sessionId, newSessionId);
		if (!success) {
			sendResponse(resp, 500, 'text/html', 'could not copy session files');
			return;
		}
		sendRedirect(resp, `http://${webenv_vars.redirectHostname}/?sessionId=${newSessionId}`);
		return;

	} else if (query.sessionId) {
		let exists = await checkIfSessionExists(query.sessionId);
		if (!exists) {
			sendResponse(resp, 401, 'text/html', "unknown session id specified in query string", 'ERROR');
			return;
		}
		await serviceRequestForRegularFile(query.sessionId, path, resp);
		return;

	} else if (sessionIdFromCookie) {
		let sessionId = sessionIdFromCookie;
		let exists = await checkIfSessionExists(sessionId);
		if (!exists) {
			// if the user sends an unknown session ID in the cookie, it could be that
			// their session was deleted. Since users shouldn't be manually inserting
			// cookies into their session, we just assume this and give them a new
			// session. But -- should we put something in the response so they know?
			sessionId = await createNewUUIDSession(resp);
			if (!sessionId) {
				sendResponse(resp, 401, 'text/html', 'could not create session');
				return;				
			}
		}
		serviceRequestForRegularFile(sessionId, path, resp);
		return;

	} else {
		let newSessionId = await createNewUUIDSession(resp);
		if (!newSessionId) {
			sendResponse(resp, 401, 'text/html', 'could not create session');
			return;
		}
		serviceRequestForRegularFile(newSessionId, path, resp);
		return;
	}
};

async function createNewUUIDSession(resp) {
	let newSessionId = uuidv4();
	let success = await createSession(newSessionId, resp);
	return success ? newSessionId : null;
}

function isValidSessionNameForUserCreate(sessionName) {
	if (sessionName == 'packages') return false;
	if (sessionName == 'samples') return false;
	let isIdentifier = /^[a-zA-Z0-9_]+$/.test(sessionName);
	return isIdentifier;
}

async function createSession(sessionId, resp) {
	resp.setHeader('Set-Cookie', `sessionId=${sessionId}`);
	return await createSessionIdDirectory(sessionId);
}

// actually also loads css files, js files, etc.
// everything but api reqs.
async function serviceRequestForRegularFile(sessionId, path, resp) {
	if (path == "/") {
		path = "/host.html"
	} else if (path.indexOf('/?') == 0) {
		let i = path.indexOf('?');
		let qs = path.substring(i);
		path = "/host.html" + qs;
	}
	// uh
	let isSessionDownload = false;
	if (path.indexOf('/sounds') == 0) {
		path = "." + path;
	} else if (path.indexOf('/session/') == 0) {
		path = path.substr(8);
		path = './sessions/' + sessionId + path;
		isSessionDownload = true;
	} else {
		path = "./src" + path;
	}
	let z = path.indexOf('?');
	if (z > -1) {
		path = path.substr(0, z);
	}
	// You have to decode the path because it might have %20 in it
	path = decodeURI(path);
	let mimetype = getMimeTypeFromExt(path);
	try {
		let data = await fsPromises.readFile(path);
		if (path == './src/host.html') {
			data = await transformHost(sessionId, data);
		}
		sendResponse(resp, 200, mimetype, data, path, isSessionDownload);
	} catch (err) {
		sendResponse(resp, 404, 'text/html', ERROR, 'ERROR');
	}
}

function getSessionIdFromCookie(req) {
	c = req.headers['cookie'];
	if (c) {
		let s = c.split('; ');
		for (let i = 0; i < s.length; i++) {
			let t = s[i].split('=');
			if (t[0] == 'sessionId') {
				return t[1];
			}
		}
	}
	return null;
}

function loadRequestBody(req, cb) {
	let body = [];
	let bstr;
	req.on('data', (chunk) => {
		body.push(chunk);
	}).on('end', () => {
		bstr = Buffer.concat(body).toString();
		cb(bstr);
	});
}

function sendRedirect(resp, toUrl) {
	let status = 303;
	console.log(`redir ${status} "${toUrl}"`);
	resp.writeHead(status, {'Location': toUrl});
	resp.end();
}

function sendResponse(resp, status, mimetype, data, path, forDownload) {
	console.log(`tr:${total_reqs} ar:${api_reqs} ${status} "${path}" (${mimetype})`);
	if (forDownload) {
		resp.writeHead(status, {'Content-Type': mimetype, 'content-disposition': 'attachment'});
	} else {
		resp.writeHead(status, {'Content-Type': mimetype});
	}
	resp.write(data);
	resp.end();
}

function getMimeTypeFromExt(fname) {
	let ext = fname.substr(fname.lastIndexOf('.'));
	switch(ext) {
		case '.js':
			return 'text/javascript';
		case '.html':
			return 'text/html';
		case '.css':
			return 'text/css';
		case '.mp3':
			return 'audio/mpeg';
		case '.ogg':
			return 'application/ogg';
		case '.wav':
			return 'audio/x-wav';
		case '.aiff':
		case '.aifc':
			return 'audio/x-aiff';
		case '.wasm':
			return 'application/wasm';
	}
	return 'text/plain';
}

function setLocalWebEnv() {
	webenv_vars.canSaveOverLibraries = true;
	webenv_vars.redirectHostname = 'localhost:3000';
	webenv_vars.isLocal = true;
}

function setRemoteWebEnv() {
	webenv_vars.canSaveOverLibraries = false;
	webenv_vars.redirectHostname = 'vodka.church';
	webenv_vars.isLocal = false;
}

async function loadWebEnv() {
	const setWebEnv = (we) =>
		(we === 'local')
			? setLocalWebEnv()
			: setRemoteWebEnv();
	
	try {
		const data = await fsPromises.readFile('webenv.txt');
		setWebEnv(String(data).trim());
	} catch (err) {
		if (isFileNotFound(err)) {
			setWebEnv('remote');
		} else {
			console.log('cannot start server because ' + err);
		}
	}
}

function isFileNotFound(error) {
	return error.message.substr(0, 6) == "ENOENT";
}

function containsIllegalSessionCharacters(fn) {
	if (fn == 'packages') return true;
	if (fn == 'samples') return true;
	let isIdentifier = /^[a-zA-Z0-9_-]+$/.test(fn);
	return !isIdentifier;
}

async function createSessionIdDirectory(sessionId) {
	if (containsIllegalSessionCharacters(sessionId)) {
		return false;
	}
	let dirpath = `${getSessionDirectory(sessionId, true /*local only*/)}`;
	try {
		await fsPromises.mkdir(dirpath);
		return true;
	} catch (err) {
		return false;
	}
}

async function checkIfSessionExists(sessionId) {
	let dirpath = `${getSessionDirectory(sessionId, true /*local only*/)}`;
	try {
		await fsPromises.access(dirpath, fs.constants.F_OK);
		return true;
	} catch (e) {
		return false;
	}
}

async function checkIfFileExists(sessionId, path) {
	let filepath = `${getSessionDirectory(sessionId)}/${path}`;
	try {
		await fsPromises.access(filepath, fs.constants.F_OK);
		return true;
	} catch (e) {
		return false;
	}
}

function cookieFromSessionId(sessionId) {
	return `sessionId=${sessionId}; domain=127.0.0.1; path=/`;
}

async function serviceApiRequest(sessionId, resp, data) {
	let i = data.indexOf('\t');
	let opcode = data;
	let arg = null;
	if (i >= 0) {
		opcode = data.substr(0, i);
		arg = data.substr(i + 1);
	}
	let respData = `v2:?"unknown api method. Sorry!"`;
	if (opcode == 'save') {
		respData = await serviceApiSaveRequest(arg, sessionId);
	} else if (opcode == 'load') {
		respData = await serviceApiLoadRequestUserSession(arg, sessionId, true /*fallback to user session*/);
	// these are currently identical to save/load but may not be
	// in the future due to tab escaping or -- idk, security shit
	} else if (opcode == 'saveraw') {
		respData = await serviceApiSaveRequest(arg, sessionId);
	} else if (opcode == 'loadraw') {
		respData = await serviceApiLoadRequestUserSession(arg, sessionId, false /*fallback to user session*/);
	} else if (opcode == 'listfiles') {
		respData = await serviceApiListFilesRequest(sessionId, false /*standard*/);
	} else if (opcode == 'listaudio') {
		respData = await serviceApiListAudioRequest(sessionId, false /*standard*/);
	} else if (opcode == 'liststandardfunctionfiles') {
		respData = await serviceApiListFilesRequest(sessionId, true /*standard*/);
	}
	sendResponse(resp, 200, 'text/xml', respData, 'apipath');
	return 'api request completed';
}

function containsIllegalFilenameCharacters(fn) {
	let isIdentifier = /^[a-zA-Z0-9_.-]+$/.test(fn);
	return !isIdentifier;
}

function getSessionDirectory(sessionId, localAccessOnly) {
	let r = '';
	if (sessionId == 'packages' && (!localAccessOnly || webenv_vars.isLocal)) {
		r = './packages/'
	} else {

		let hasDash = /-/.test(sessionId);

		// we don't let users create sessions with dashes in them.
		// only UUID sessions have dashes.
		// that way we can keep them in separate directories.

		r = `./sessions/${sessionId}/`;
		if (!hasDash) {
			r = `./namedsessions/${sessionId}/`;
		}

	}
	return r;

}

async function serviceApiSaveRequest(data, sessionId) {
	let i = data.indexOf('\t');
	let nm = data.substr(0, i);
	let isLibraryFile = nm.endsWith('-functions');
	if (containsIllegalFilenameCharacters(nm)) {
		return `v2:?"save failed (illegal filename). Sorry!"`;
	}
	let sessionDirectory = getSessionDirectory(sessionId, true /*local only*/);
	if (isLibraryFile && sessionDirectory != './packages/') {
		return `v2:?"save failed: the filename suffix '-functions' is reserved for library files, but you are trying to save this in a non-library session.  Sorry!"`;
	}
	if (sessionIsWriteProtected(sessionId)) {
		return `v2:?"save failed: this session is read-only. To save files, create a copy of this session."`;
	}
	let path = `${sessionDirectory}/${nm}`;

	let savedata = data.substr(i+1);

	try {
		await fsPromises.writeFile(path, savedata);
		return `v2:?{2||success}`;
	} catch (err) {
		return (`v2:?"save failed. Sorry!"`);
	}
}

function sessionIsWriteProtected(sessionId) {
	let filepath = `${getSessionDirectory(sessionId)}/${writeprotectionfile}`;
	return fs.existsSync(filepath);
}

async function writeProtectSession(sessionId) {
	let sessionDirectory = getSessionDirectory(sessionId, true /*local only*/);
	let path = `${sessionDirectory}/${writeprotectionfile}`;

	let savedata = '1';

	try {
		await fsPromises.writeFile(path, savedata);
		return true;
	} catch (err) {
		return false;
	}	
}

async function serviceApiLoadRequestUserSession(nm, sessionId, fallback) {
	let path = `${getSessionDirectory(sessionId)}/${nm}`;
	try {
		return await fsPromises.readFile(path);
	} catch (err) {
		if (fallback) {
			return await serviceApiLoadRequestPackages(nm);
		} else {
			return `v2:?"file not found in session: '${nm}'. Sorry!"`;
		}
	}
}

async function serviceApiLoadRequestPackages(nm) {
	let path = `${getSessionDirectory('packages')}/${nm}`;
	try {
		return await fsPromises.readFile(path);
	} catch (err) {
		return `v2:?"file not found in packages: '${nm}'. Sorry!"`;
	}
}

/*

async function getDirectoryForListFilesRequest(path) {
	try {
		let files = await fsPromises.readdir(path);
		let s = '(|';
		let first = true;
		for (let i = 0; i < files.length; i++) {
			let filename = files[i];
 			if (filename == writeprotectionfile) {
				continue;
			}
			if (filename.charAt(0) == '.') {
				continue;
			}
			if (!first) {
				s += ' ';
			}
			s += '$"' + filename + '"';
			first = false;
		}
		s += '|)';
		return s;
	} catch (err) {
		return null;
	}
}
*/

async function getDirectoryForListFilesRequest(path, tag) {
	try {
		const dir = await fsPromises.opendir(path);
		let s = '(|';
		let prefix = '';
		if (tag) {
			s += '<`' + tag + '`>';
			prefix = tag + '/';
		}
		let first = true;
		for await (const dirent of dir) {
			if (!first) {
				s += ' ';
			}
			let filename = dirent.name;
			if (dirent.isDirectory()) {
				let subdir = await getDirectoryForListFilesRequest(path + filename + '/', filename);
				s += subdir;
			} else {
	 			if (filename == writeprotectionfile) {
					continue;
				}
				if (filename.charAt(0) == '.') {
					continue;
				}
				s += '$"' + prefix + filename + '"';
			}
			first = false;
		}
		s += '|)';
		return s;
	} catch (err) {
		return null;
	}
}

async function serviceApiListAudioRequest(sessionId, standard) {
	let path = "./sounds/";
	let s = await getDirectoryForListFilesRequest(path);
	if (s) {
		return 'v2:' + s;
	} else {
		return `v2:?"could not get audio file listing. Sorry!"`;
	}
}

async function serviceApiListFilesRequest(sessionId, standard) {
	let path = (standard
		? `${getSessionDirectory('packages')}`
		: `${getSessionDirectory(sessionId)}`)
	let s = await getDirectoryForListFilesRequest(path);
	if (s) {
		return 'v2:' + s;
	} else {
		return `v2:?"could not get directory listing. Sorry!"`;
	}
}

async function copySessionContents(oldSessionId, newSessionId, cb) {
	let oldPath = `./sessions/${oldSessionId}/`;
	try {
		let files = await fsPromises.readdir(oldPath);
		let r = await copySessionFileArray(oldSessionId, newSessionId, files);
		return r;
	} catch (err) {
		return false;
	}
}

async function copySessionFileArray(oldSessionId, newSessionId, files) {
	for (let i = 0; i < files.length; i++) {
		let file = files[i];
		let src = `./sessions/${oldSessionId}/${file}`;
		let dst = `./sessions/${newSessionId}/${file}`;
		try {
			await fsPromises.copyFile(src, dst);
		} catch (err) {
			return false;
		}
	}
	return true;
}


async function transformHost(sessionId, data) {
	let bootdata = await getPreBootstrapInjectData(sessionId);
	data = replaceTag(data, 'serverinject:head', getHeadInjectData());
	data = replaceTag(data, 'serverinject:beforebootstrap', bootdata);
	return data;
}

function replaceTag(data, tag, injected) {
	return ('' + data).replace(`<!-- ${tag} -->`, injected);
}

function makeScriptTag(from) {
	return `<script>${from}</script>`;
}

async function getPreBootstrapInjectData(sessionId) {
	let exists = await checkIfFileExists(sessionId, 'start-doc');
	return makeScriptTag(`const FEATURE_VECTOR = { hostname:"${webenv_vars.redirectHostname}", hasstart:${exists} }`);
}

function getIncludesForSounds(dirname) {
	let includeString = '';
	let files = fs.readdirSync(dirname);
	for (let i = 0; i < files.length; i++) {
		let fileName = files[i];
		if (fileName.charAt(0) == '.') {
			continue;
		}
		includeString += `"${fileName}",
		`;
	}
	return includeString;
}

function getHeadInjectData() {
	// Currently there's no inject data. This used to be a list of audio files.
	return '';
}

(async function() {
	try {
		await loadWebEnv();
		server.listen(port, hostname, () => {
			console.log(`Server running at http://${hostname}:${port}/`);
		  });	
	} catch (e) {
		console.log('Could not start server');
	}
})();
