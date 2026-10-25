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

const hostname = '127.0.0.1';
const port = Number(process.env.VODKA_PORT) || 3000;

/*
The two audio libraries, and the only two directory names the client can ask
for. list-audio sends a library name, so it maps through here rather than
being pasted into a path.
*/
const AUDIO_LIBRARIES = {
	sample: './sounds/',
	wave: './waves/',
};
const endpoint_hostname = 'localhost:' + port;

const writeprotectionfile = 'WRITE_PROTECTED_SESSION.9999999999';


const webenv_vars = {}

const ERROR = "Rather than a beep<br>Or a rude error message,<br>These words: \"File not found.\"";
 
/*
Every session on a local server is a folder in here, and the folder is yours:
it is gitignored, so you can clone your own sessions repo into it and commit
from inside. VODKA_SESSIONS_DIR puts it somewhere else entirely.

Generated vs- ids used to get a directory of their own under sessions/. A local
server no longer makes them -- a page with no session goes to default-local --
so the ones that are left get moved in here at startup and are named sessions
like any other. A hosted vodka still uses them, but it keeps nothing, so they
never need a directory.

(comment by Claude)
*/
const SESSIONS_DIR = process.env.VODKA_SESSIONS_DIR
		? process.env.VODKA_SESSIONS_DIR.replace(/\/+$/, '')
		: './namedsessions';
const LEGACY_GENERATED_SESSIONS_DIR = './sessions';
const SAMPLES_DIR = './samples/';

// ship with vodka, so they are never a folder of yours
// (comment by Claude)
const RESERVED_SESSIONS = [ 'packages', 'samples' ];

const DEFAULT_LOCAL_SESSION = 'default-local';
const DEFAULT_REMOTE_SESSION = 'default';

/*
A name that is not in your session is looked for in what ships with vodka, and
the suffix says where: -sample in samples/, anything else in packages/. So a
sample or a library file can be loaded from any session, edited, and saved, and
the copy in your session is what you get from then on.

(comment by Claude)
*/
const SAMPLE_SUFFIX = '-sample';

function defaultSessionId() {
	return webenv_vars.isLocal ? DEFAULT_LOCAL_SESSION : DEFAULT_REMOTE_SESSION;
}

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
	// only the page itself gets redirected; assets must be served where asked
	// (comment by Claude)
	let isPageLoad = (parsedUrl.pathname == '/');
	// pathname, not path: an api request now carries a query string
	// (comment by Claude)
	let isApi = (parsedUrl.pathname == '/api');

	// keep whatever else was on the url -- flags, runfile, theme
	// (comment by Claude)
	function urlWithSession(sessionId) {
		let params = new URLSearchParams(parsedUrl.query);
		params.set('sessionId', sessionId);
		return `http://${webenv_vars.redirectHostname}/?${params.toString()}`;
	}

	let sessionIdFromCookie = getSessionIdFromCookie(req);

	/*
	Told to the client rather than compiled into it, so one bundle works both
	ways: served from here it can save, dropped on a static host it cannot.
	The static build ships these same three files, which is why the client has
	no idea which kind of server it is talking to.

	(comment by Claude)
	*/
	if (parsedUrl.pathname == '/config.json') {
		sendResponse(resp, 200, 'application/json', JSON.stringify({
			canSave: writesAllowed(),
			defaultSession: defaultSessionId(),
			// a live server can look in the directory, so a file added while
			// you work shows up without a rebuild
			// (comment by Claude)
			liveIndex: true,
		}), 'config');
		return;
	}
	if (parsedUrl.pathname == '/packages/index.json'
			|| parsedUrl.pathname == '/samples/index.json') {
		let names = [];
		try {
			names = fs.readdirSync(parsedUrl.pathname == '/samples/index.json' ? SAMPLES_DIR : './packages');
		} catch (e) {
			names = [];
		}
		sendResponse(resp, 200, 'application/json', JSON.stringify(names), 'index');
		return;
	}
	/*
	The audio libraries are two levels deep -- a bank (or category) holding wav
	files -- so their index is a map, not a flat list. Same shape makestatic.js
	writes, so the client reads a live server and a static host the same way.
	*/
	if (parsedUrl.pathname == '/sounds/index.json'
			|| parsedUrl.pathname == '/waves/index.json') {
		let dir = '.' + parsedUrl.pathname.substring(0, parsedUrl.pathname.lastIndexOf('/'));
		sendResponse(resp, 200, 'application/json',
				JSON.stringify(audioIndex(dir)), 'index');
		return;
	}

	if (parsedUrl.pathname == '/sessions.json') {
		sendResponse(resp, 200, 'application/json',
				JSON.stringify(await listSessionFolders()), 'sessions');
		return;
	}
	if (parsedUrl.pathname == '/sessions') {
		if (!writesAllowed()) {
			sendResponse(resp, 403, 'application/json',
					JSON.stringify({ ok: false, error: 'this vodka does not keep sessions.' }), 'sessions');
			return;
		}
		loadRequestBody(req, function(data) {
			serviceSessionOpRequest(data).then(function(r) {
				sendResponse(resp, 200, 'application/json', JSON.stringify(r), 'sessions');
			});
		});
		return;
	}

	if (isApi) {
		// the cookie is the fallback for older clients; the session the tab is
		// actually in comes on the request
		// (comment by Claude)
		let apiSessionId = query.sessionId || sessionIdFromCookie;
		if (!apiSessionId) {
			sendResponse(resp, 401, 'text/html', "no session id on API request.", 'ERROR');
			return;
		}
		if (apiSessionId != 'packages' && !isLegalSessionId(apiSessionId)) {
			sendResponse(resp, 400, 'text/html', "bad session id on API request.", 'ERROR');
			return;
		}
		loadRequestBody(req, function(data) {
			// need to do something with the promise or the method will exit early I guess?
			serviceApiRequest(apiSessionId, resp, data)
				.then(r => {
					api_reqs++;
					return;
				});
		})
	} else if (query.sessionId) {
		/*
		A hosted vodka keeps nothing, so it has no session directories to check
		against and no opinion about which sessions exist -- the browser holds
		them. Insisting on a directory here would mean a session made in the
		browser could not be opened.

		(comment by Claude)
		*/
		if (writesAllowed()) {
			let exists = await checkIfSessionExists(query.sessionId);
			if (!exists) {
				// a typo should not make a folder in your repo, so sessions are
				// only made on purpose, from the Sessions tab in help
				// (comment by Claude)
				sendResponse(resp, 401, 'text/html',
						`there is no session called "${escapeHtml(query.sessionId)}". `
						+ `Open <a href="/">your default session</a> and make it from the Sessions tab in help.`,
						'ERROR');
				return;
			}
		} else if (!isLegalSessionId(query.sessionId)) {
			sendResponse(resp, 400, 'text/html', "bad session id", 'ERROR');
			return;
		}
		await serviceRequestForRegularFile(query.sessionId, path, resp);
		return;

	} else if (isPageLoad) {
		/*
		A page with no session in the url goes to the default session, so there
		is always somewhere to come back to -- it used to mint a new one every
		time, and the only way back to your work was the url you happened to
		keep. The cookie is not consulted: two tabs share it, so it says which
		session some tab was in last, not which one you asked for.

		(comment by Claude)
		*/
		let sessionId = defaultSessionId();
		if (writesAllowed() && !(await ensureSessionFolder(sessionId))) {
			sendResponse(resp, 500, 'text/html', 'could not create the default session', 'ERROR');
			return;
		}
		sendRedirect(resp, urlWithSession(sessionId));
		return;

	} else {
		// assets. Only host.html looks at the session, and it is a page load.
		// (comment by Claude)
		let sessionId = sessionIdFromCookie;
		if (!sessionId || !isLegalSessionId(sessionId)) {
			sessionId = defaultSessionId();
		}
		serviceRequestForRegularFile(sessionId, path, resp);
		return;
	}
};

function escapeHtml(text) {
	return String(text).replace(/[&<>"']/g, function(c) {
		return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
	});
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
	if (path.indexOf('/sounds') == 0 || path.indexOf('/waves') == 0) {
		path = "." + path;
	} else if (path.indexOf('/packages/') == 0) {
		// the shipped library, read the same way a static host would serve it,
		// so the client has one way of reading a file that ships with the app
		// (comment by Claude)
		path = "." + path;
	} else if (path.indexOf('/samples/') == 0) {
		// shipped too, and read the same way
		// (comment by Claude)
		path = "." + path;
	} else if (path.indexOf('/dist/') == 0) {
		// the bundled client, written by build.sh
		path = "." + path;
	} else if (path.indexOf('/session/') == 0) {
		let sessionDirectory = getSessionDirectory(sessionId);
		if (!sessionDirectory) {
			sendResponse(resp, 400, 'text/html', 'bad session id', 'ERROR');
			return;
		}
		path = sessionDirectory + path.substr(9);
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
		case '.map':
			return 'application/json';
	}
	return 'text/plain';
}

function setLocalWebEnv() {
	webenv_vars.canSaveOverLibraries = true;
	webenv_vars.redirectHostname = 'localhost:' + port;
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
	
	/*
	Remote is the default, and a missing or unreadable webenv.txt stays remote.
	A server that has lost its configuration should refuse to keep files rather
	than start keeping them, so the safe answer is the one you get by accident.

	Local has to be asked for: runserver.sh sets VODKA_WEBENV, and webenv.txt
	still works for anyone who was already using it.

	(comment by Claude)
	*/
	if (process.env.VODKA_WEBENV) {
		setWebEnv(process.env.VODKA_WEBENV.trim());
		return;
	}
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

// a session of yours, as opposed to one that ships with vodka
// (comment by Claude)
function isUserSessionId(sessionId) {
	return isLegalSessionId(sessionId) && RESERVED_SESSIONS.indexOf(sessionId) == -1;
}

async function ensureSessionFolder(sessionId) {
	if (!isUserSessionId(sessionId)) {
		return false;
	}
	try {
		await fsPromises.mkdir(getSessionDirectory(sessionId), { recursive: true });
		return true;
	} catch (err) {
		return false;
	}
}

async function checkIfSessionExists(sessionId) {
	let dirpath = getSessionDirectory(sessionId);
	if (!dirpath) return false;
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
	if (FILE_WRITE_OPCODES.indexOf(opcode) != -1 && !writesAllowed()) {
		respData = `v2:?"this vodka does not keep files, your work is in this browser. Sorry!"`;
	} else if (opcode == 'save') {
		respData = await serviceApiSaveRequest(arg, sessionId);
	} else if (opcode == 'load') {
		respData = await serviceApiLoadRequestUserSession(arg, sessionId, true /*fallback to user session*/);
	// these are currently identical to save/load but may not be
	// in the future due to tab escaping or -- idk, security shit
	} else if (opcode == 'saveraw') {
		respData = await serviceApiSaveRequest(arg, sessionId);
	} else if (opcode == 'loadfrom') {
		respData = await serviceApiLoadFromRequest(arg);
	} else if (opcode == 'loadraw') {
		respData = await serviceApiLoadRequestUserSession(arg, sessionId, false /*fallback to user session*/);
	} else if (opcode == 'copyfile' || opcode == 'movefile') {
		respData = await serviceApiCopyRequest(arg, sessionId, opcode == 'movefile');
	} else if (opcode == 'deletefile') {
		respData = await serviceApiDeleteRequest(arg, sessionId);
	} else if (opcode == 'newfile') {
		respData = await serviceApiNewFileRequest(arg, sessionId);
	} else if (opcode == 'listfiles') {
		// with an argument it is some other session's files
		// (comment by Claude)
		respData = arg
				? await serviceApiListOtherSessionRequest(arg)
				: await serviceApiListFilesRequest(sessionId, false /*standard*/);
	} else if (opcode == 'listaudio') {
		respData = await serviceApiListAudioDirRequest(arg);
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

/*
A session id names a directory, so anything in it that is not an identifier can
walk out of the sessions directory and into the rest of the disk. The file name
has always been checked; this is the other half of the path.

(comment by Claude)
*/
/*
Nothing a visitor makes is kept on a hosted vodka. Documents and samples live in
the browser, which is where they already live between reloads, and the server
serves the app and the shipped libraries and nothing else.

This is decided here rather than by leaving the save button out of the page: the
api is a post anyone can make by hand, so hiding the button would be a promise
about the client rather than a property of the server.

Run it on your own machine and it saves as it always has.

(comment by Claude)
*/
const FILE_WRITE_OPCODES = [ 'save', 'saveraw', 'copyfile', 'movefile', 'deletefile', 'newfile' ];

function writesAllowed() {
	return webenv_vars.isLocal;
}

function isLegalSessionId(sessionId) {
	return typeof sessionId === 'string' && /^[a-zA-Z0-9_-]+$/.test(sessionId);
}

function getSessionDirectory(sessionId, localAccessOnly) {
	let r = '';
	if (sessionId == 'packages' && (!localAccessOnly || webenv_vars.isLocal)) {
		r = './packages/'
	} else if (!isLegalSessionId(sessionId)) {
		return null;
	} else if (sessionId == 'samples') {
		r = SAMPLES_DIR;
	} else {
		r = `${SESSIONS_DIR}/${sessionId}/`;
	}
	return r;

}

async function serviceApiSaveRequest(data, sessionId) {
	let i = data.indexOf('\t');
	let nm = data.substr(0, i);
	if (containsIllegalFilenameCharacters(nm)) {
		return `v2:?"save failed (illegal filename). Sorry!"`;
	}
	let sessionDirectory = getSessionDirectory(sessionId, true /*local only*/);
	if (!sessionDirectory) {
		return `v2:?"save failed (bad session). Sorry!"`;
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

/*
Everything that changes a file goes through here first, so copy, move, delete
and new file get the same checks save does: a legal name, a real session, the
and no writing into a read-only session.

Returns the path, or the error to send back.

(comment by Claude)
*/
function writablePath(nm, sessionId, verb) {
	if (containsIllegalFilenameCharacters(nm)) {
		return { error: `v2:?"${verb} failed (illegal filename '${nm}'). Sorry!"` };
	}
	let sessionDirectory = getSessionDirectory(sessionId, true /*local only*/);
	if (!sessionDirectory) {
		return { error: `v2:?"${verb} failed (bad session). Sorry!"` };
	}
	if (sessionIsWriteProtected(sessionId)) {
		return { error: `v2:?"${verb} failed: this session is read-only."` };
	}
	return { path: `${sessionDirectory}/${nm}` };
}

async function serviceApiCopyRequest(data, sessionId, move) {
	let verb = move ? 'move' : 'copy';
	let [from, to] = data.split('\t');
	let src = writablePath(from, sessionId, verb);
	if (src.error) return src.error;
	let dst = writablePath(to, sessionId, verb);
	if (dst.error) return dst.error;
	try {
		if (move) {
			await fsPromises.rename(src.path, dst.path);
		} else {
			await fsPromises.copyFile(src.path, dst.path);
		}
		return `v2:?{2||success}`;
	} catch (err) {
		if (isFileNotFound(err)) {
			return `v2:?"${verb} failed: no file '${from}'. Sorry!"`;
		}
		return `v2:?"${verb} failed. Sorry!"`;
	}
}

async function serviceApiDeleteRequest(nm, sessionId) {
	let target = writablePath(nm, sessionId, 'delete');
	if (target.error) return target.error;
	try {
		await fsPromises.unlink(target.path);
		return `v2:?{2||success}`;
	} catch (err) {
		if (isFileNotFound(err)) {
			return `v2:?"delete failed: no file '${nm}'. Sorry!"`;
		}
		return `v2:?"delete failed. Sorry!"`;
	}
}

// unlike save, refuses to touch a file that is already there
// (comment by Claude)
async function serviceApiNewFileRequest(nm, sessionId) {
	let target = writablePath(nm, sessionId, 'new file');
	if (target.error) return target.error;
	try {
		await fsPromises.writeFile(target.path, '', { flag: 'wx' });
		return `v2:?{2||success}`;
	} catch (err) {
		if (err.code == 'EEXIST') {
			return `v2:?"new file failed: '${nm}' already exists. Sorry!"`;
		}
		return `v2:?"new file failed. Sorry!"`;
	}
}

function sessionIsWriteProtected(sessionId) {
	let filepath = `${getSessionDirectory(sessionId)}/${writeprotectionfile}`;
	return fs.existsSync(filepath);
}

async function serviceApiLoadRequestUserSession(nm, sessionId, fallback) {
	let sessionDirectory = getSessionDirectory(sessionId);
	if (!sessionDirectory) {
		return `v2:?"load failed (bad session). Sorry!"`;
	}
	let path = `${sessionDirectory}/${nm}`;
	try {
		return await fsPromises.readFile(path);
	} catch (err) {
		if (fallback && nm.endsWith(SAMPLE_SUFFIX)) {
			return await serviceApiLoadRequestShipped('samples', nm);
		} else if (fallback) {
			return await serviceApiLoadRequestPackages(nm);
		} else {
			return `v2:?"file not found in session: '${nm}'. Sorry!"`;
		}
	}
}

async function serviceApiLoadRequestShipped(sessionId, nm) {
	try {
		return await fsPromises.readFile(`${getSessionDirectory(sessionId)}/${nm}`);
	} catch (err) {
		return `v2:?"file not found in ${sessionId}: '${nm}'. Sorry!"`;
	}
}

/*
Reading another session, never writing to one: load with two arguments, and
list-files with one. A hosted vodka has no sessions of its own on disk, so
there the only others are the two that ship with it.

(comment by Claude)
*/
function canReadOtherSession(sessionId) {
	if (RESERVED_SESSIONS.indexOf(sessionId) != -1) return true;
	return webenv_vars.isLocal && isLegalSessionId(sessionId);
}

async function serviceApiLoadFromRequest(arg) {
	let [fromSession, nm] = (arg ? arg : '').split('\t');
	if (!fromSession || !canReadOtherSession(fromSession)) {
		return `v2:?"load failed: cannot read session '${fromSession}'. Sorry!"`;
	}
	if (!nm || containsIllegalFilenameCharacters(nm)) {
		return `v2:?"load failed (illegal filename '${nm}'). Sorry!"`;
	}
	if (!(await checkIfSessionExists(fromSession))) {
		return `v2:?"load failed: no session '${fromSession}'. Sorry!"`;
	}
	try {
		return await fsPromises.readFile(`${getSessionDirectory(fromSession)}/${nm}`);
	} catch (err) {
		return `v2:?"file not found in session '${fromSession}': '${nm}'. Sorry!"`;
	}
}

async function serviceApiListOtherSessionRequest(otherSession) {
	if (!canReadOtherSession(otherSession) || !(await checkIfSessionExists(otherSession))) {
		return `v2:?"no session '${otherSession}'. Sorry!"`;
	}
	let s = await getDirectoryForListFilesRequest(getSessionDirectory(otherSession));
	if (s) {
		return 'v2:' + s;
	} else {
		return `v2:?"could not get directory listing. Sorry!"`;
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

/*
pathPrefix goes in front of every name, so an audio listing can hand back
wave/metallic/x.wav rather than metallic/x.wav -- one string that says which
library as well as which file, which is all load-audio needs. Empty for a
plain file listing.
*/
async function getDirectoryForListFilesRequest(path, tag, pathPrefix) {
	try {
		const dir = await fsPromises.opendir(path);
		let s = '(|';
		let prefix = pathPrefix ? pathPrefix : '';
		if (tag) {
			s += '<`' + tag + '`>';
			prefix = prefix + tag + '/';
		}
		let first = true;
		for await (const dirent of dir) {
			if (!first) {
				s += ' ';
			}
			let filename = dirent.name;
			if (dirent.isDirectory()) {
				let subdir = await getDirectoryForListFilesRequest(
						path + filename + '/', filename, pathPrefix);
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

/*
One entry per bank, listing the wav files in it. Anything else in there (the
info.txt naming the machine, a license file) is not something load-audio
can use, so it does not go in the index.
*/
function audioIndex(dir) {
	let index = {};
	let banks = [];
	try {
		banks = fs.readdirSync(dir, { withFileTypes: true });
	} catch (e) {
		return index;
	}
	for (let i = 0; i < banks.length; i++) {
		if (!banks[i].isDirectory()) continue;
		let name = banks[i].name;
		let files = [];
		try {
			files = fs.readdirSync(dir + '/' + name);
		} catch (e) {
			continue;
		}
		index[name] = files.filter(function(f) {
			return f.toLowerCase().endsWith('.wav');
		});
	}
	return index;
}

/*
The sample library and the wavetable library are separate directories, but
they list the same way: banks (or categories) come back as tagged orgs holding
the wav files inside them. Which one you get is the only thing the client
picks, and it picks by name from AUDIO_LIBRARIES -- the name is going into a
path, so it is never taken as given.
*/
async function serviceApiListAudioDirRequest(which) {
	if (!AUDIO_LIBRARIES[which]) {
		return `v2:?"no audio library called ${which}. Sorry!"`;
	}
	let s = await getDirectoryForListFilesRequest(AUDIO_LIBRARIES[which], null, which + '/');
	if (s) {
		return 'v2:' + s;
	} else {
		return `v2:?"could not get ${which} file listing. Sorry!"`;
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

/*
The Sessions tab in help. On a local server a session is a folder, so this is
where they are listed, made, renamed, copied and thrown away. The browser's own
copy of each one -- the autosaved document and its audio -- is the client's to
move along with it.

A hosted vodka has no folders, so it lists none and refuses the rest.

(comment by Claude)
*/
async function folderSize(dirpath) {
	let total = 0;
	let entries = [];
	try {
		entries = await fsPromises.readdir(dirpath, { withFileTypes: true });
	} catch (e) {
		return 0;
	}
	for (let i = 0; i < entries.length; i++) {
		let p = dirpath + '/' + entries[i].name;
		if (entries[i].isDirectory()) {
			total += await folderSize(p);
		} else {
			try {
				total += (await fsPromises.stat(p)).size;
			} catch (e) {
				// gone while we were counting
			}
		}
	}
	return total;
}

async function listSessionFolders() {
	if (!webenv_vars.isLocal) {
		return [];
	}
	let entries = [];
	try {
		entries = await fsPromises.readdir(SESSIONS_DIR, { withFileTypes: true });
	} catch (e) {
		return [];
	}
	let r = [];
	for (let i = 0; i < entries.length; i++) {
		let name = entries[i].name;
		// .git and the like: your repo, not a session
		if (!entries[i].isDirectory() || !isUserSessionId(name)) continue;
		r.push({ id: name, bytes: await folderSize(`${SESSIONS_DIR}/${name}`) });
	}
	return r;
}

async function serviceSessionOpRequest(data) {
	let req;
	try {
		req = JSON.parse(data);
	} catch (e) {
		return { ok: false, error: 'bad request.' };
	}
	let id = req.id;
	let to = req.to;
	if (!isUserSessionId(id)) {
		return { ok: false, error: `"${id}" is not a session you can change.` };
	}
	if ((req.op == 'rename' || req.op == 'duplicate') && !isUserSessionId(to)) {
		return { ok: false, error: `"${to}" is not a usable name -- letters, digits, _ and - only, and not packages or samples.` };
	}
	let from = `${SESSIONS_DIR}/${id}`;
	let dest = `${SESSIONS_DIR}/${to}`;
	try {
		if (req.op == 'create') {
			await fsPromises.mkdir(from);
		} else if (req.op == 'rename' || req.op == 'duplicate') {
			if (fs.existsSync(dest)) {
				return { ok: false, error: `there is already a session called "${to}".` };
			}
			if (req.op == 'rename') {
				await fsPromises.rename(from, dest);
			} else {
				await fsPromises.cp(from, dest, { recursive: true });
			}
			// the default always exists, so renaming it away leaves an empty one
			if (id == DEFAULT_LOCAL_SESSION) {
				await ensureSessionFolder(DEFAULT_LOCAL_SESSION);
			}
		} else if (req.op == 'delete') {
			await fsPromises.rm(from, { recursive: true, force: true });
			if (id == DEFAULT_LOCAL_SESSION) {
				await ensureSessionFolder(DEFAULT_LOCAL_SESSION);
			}
		} else {
			return { ok: false, error: `unknown operation "${req.op}".` };
		}
	} catch (err) {
		if (err.code == 'EEXIST') {
			return { ok: false, error: `there is already a session called "${id}".` };
		}
		if (err.code == 'ENOENT') {
			return { ok: false, error: `there is no session called "${id}".` };
		}
		return { ok: false, error: `${req.op} failed: ${err.message}` };
	}
	return { ok: true };
}

/*
Before there was one folder of sessions, generated ids had sessions/ to
themselves. Anything still in there is somebody's work, so it is moved across
rather than left behind -- unless a session of the same name is already in the
new place, in which case both are left where they are and it says so.

(comment by Claude)
*/
async function prepareSessionsFolder() {
	if (!webenv_vars.isLocal) return;
	await fsPromises.mkdir(SESSIONS_DIR, { recursive: true });
	await ensureSessionFolder(DEFAULT_LOCAL_SESSION);
	let legacy = [];
	try {
		legacy = await fsPromises.readdir(LEGACY_GENERATED_SESSIONS_DIR, { withFileTypes: true });
	} catch (e) {
		return;
	}
	for (let i = 0; i < legacy.length; i++) {
		let name = legacy[i].name;
		if (!legacy[i].isDirectory() || !isUserSessionId(name)) continue;
		let dest = `${SESSIONS_DIR}/${name}`;
		if (fs.existsSync(dest)) {
			console.log(`sessions: left ${LEGACY_GENERATED_SESSIONS_DIR}/${name} alone, ${dest} already exists`);
			continue;
		}
		try {
			await fsPromises.rename(`${LEGACY_GENERATED_SESSIONS_DIR}/${name}`, dest);
			console.log(`sessions: moved ${LEGACY_GENERATED_SESSIONS_DIR}/${name} to ${dest}`);
		} catch (e) {
			console.log(`sessions: could not move ${name}: ${e.message}`);
		}
	}
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
		await prepareSessionsFolder();
		server.listen(port, hostname, () => {
			console.log(`Server running at http://${hostname}:${port}/`);
		  });	
	} catch (e) {
		console.log('Could not start server');
	}
})();
