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
const OSC = require('osc-js');
const querystring = require('querystring');

const { v4: uuidv4 } = require('uuid');

const hostname = '127.0.0.1';
const endpoint_hostname = 'localhost:3000';
const port = 3000;

const osc_config = { udpClient: { port : 57110 }}
const osc = new OSC({ plugin: new OSC.BridgePlugin(osc_config)})

const webenv_vars = {}

const ERROR = "Rather than a beep<br>Or a rude error message,<br>These words: \"File not found.\"";


/*
If you pass a session ID in the cookie, it will fail if there isn't a directory with that name.
If you don't pass a sessionId in the cookie, 
*/

const server = http.createServer((req, resp) => {
	let parsedUrl = url.parse(req.url, true);
	let query = parsedUrl.query;
	let path = parsedUrl.path;
	let isApi = (path == '/api');

	let sessionIdFromCookie = getSessionIdFromCookie(req);
	if (isApi && !sessionIdFromCookie) {
		sendResponse(resp, 401, 'text/html', "session cookie needed for API request.", 'ERROR');			
	} else if (isApi) {
		loadRequestBody(req, function(data) {
			serviceApiRequest(sessionIdFromCookie, resp, data);
		})
	} else if (query.sessionId && query.new) {
		checkIfSessionExists(query.sessionId, function(exists) {
			if (exists) {
				sendResponse(resp, 401, 'text/html', 'session exists already.');
			} else {
				createSession(query.sessionId, resp, function(success) {
					if (!success) {
						sendResponse(resp, 401, 'text/html', 'could not create session');
					} else {
						serviceRequestForRegularFile(query.sessionId, path, resp);
					}
				});
			}
		});
	} else if (query.sessionId && query.copy) {
		checkIfSessionExists(query.sessionId, function(exists) {
			if (exists) {
				createNewSession(resp, function(success, newSessionId) {
					if (success) {
						copySessionContents(query.sessionId, newSessionId, function(success) {
							if (success) {
								sendRedirect(resp, `http://${webenv_vars.redirectHostname}/?sessionId=${newSessionId}`);
							} else {
								sendResponse(resp, 500, 'text/html', 'could not copy session files');
							}
						});
					} else {
						sendResponse(resp, 401, 'text/html', 'could not create session');
					}
				});
			} else {
				sendResponse(resp, 401, 'text/html', "unknown session id specified in query string", 'ERROR');			
			}
		});
	} else if (query.sessionId) {
		checkIfSessionExists(query.sessionId, function(exists) {
			if (exists) {
				serviceRequestForRegularFile(query.sessionId, path, resp);
			} else {
				sendResponse(resp, 401, 'text/html', "unknown session id specified in query string", 'ERROR');			
			}
		});
	} else if (query.new) {
		createNewSession(resp, function(success, newSessionId) {
			if (success) {
				sendRedirect(resp, `http://${webenv_vars.redirectHostname}/`);
			} else {
				sendResponse(resp, 401, 'text/html', 'could not create session');				
			}
		})
	} else if (sessionIdFromCookie && query.copy) {
		checkIfSessionExists(sessionIdFromCookie, function(exists) {
			if (exists) {
				createNewSession(resp, function(success, newSessionId) {
					if (success) {
						copySessionContents(sessionIdFromCookie, newSessionId, function(success) {
							if (success) {
								sendRedirect(resp, `http://${webenv_vars.redirectHostname}/?sessionId=${newSessionId}`);
							} else {
								sendResponse(resp, 500, 'text/html', 'could not copy session files');
							}
						});
					} else {
						sendResponse(resp, 401, 'text/html', 'could not create session');
					}
				});
			} else {
				// if someone deleted their cookies AND tried to do a copy, we can't help them
				sendResponse(resp, 401, 'text/html', 'cannot copy session without a session id');				
			}
		});
	} else if (sessionIdFromCookie) {
		checkIfSessionExists(sessionIdFromCookie, function(exists) {
			if (exists) {
				serviceRequestForRegularFile(sessionIdFromCookie, path, resp);
			} else {
				// if the user sends an unknown session ID in the cookie, it could be that
				// their session was deleted. Since users shouldn't be manually inserting
				// cookies into their session, we just assume this and give them a new
				// session. But -- should we put something in the response so they know?
				createNewSession(resp, function(success, newSessionId) {
					if (success) {
						serviceRequestForRegularFile(newSessionId, path, resp);
					} else {
						sendResponse(resp, 401, 'text/html', 'could not create session');				
					}
				})
			}
		});
	} else {
		createNewSession(resp, function(success, newSessionId) {
			if (success) {
				serviceRequestForRegularFile(newSessionId, path, resp);
			} else {
				sendResponse(resp, 401, 'text/html', 'could not create session');				
			}
		})
	}
});

function createNewSession(resp, cb) {
	let newSessionId = uuidv4();
	createSession(newSessionId, resp, cb);
}

function createSession(sessionId, resp, cb) {
	resp.setHeader('Set-Cookie', `sessionId=${sessionId}`);
	createSessionIdDirectory(sessionId, function(success) {
		cb(success, sessionId);
	});
}

// actually also loads css files, js files, etc.
// everything but api reqs.
function serviceRequestForRegularFile(sessionId, path, resp) {
	if (path == "/") {
		path = "/host.html"
	} else if (path.indexOf('/?') == 0) {
		let i = path.indexOf('?');
		let qs = path.substring(i);
		path = "/host.html" + qs;
	}
	// uh
	if (path.indexOf('/sounds') == 0) {
		path = "." + path;
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
	fs.readFile(path, function(err, data) {
		if (err) {
			sendResponse(resp, 404, 'text/html', ERROR, 'ERROR');
		} else {
			if (path == './src/host.html') {
				transformHost(sessionId, data, function(newdata) {
					sendResponse(resp, 200, mimetype, newdata, path);
				});
			} else {
				sendResponse(resp, 200, mimetype, data, path);
			}
		}
	});
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

function sendResponse(resp, status, mimetype, data, path) {
	console.log(`resp ${status} "${path}" (${mimetype})`);
	resp.writeHead(status, {'Content-Type': mimetype});
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

function loadWebEnv(cb) {
	fs.readFile('webenv.txt', function(err, data) {
		if (!err || isFileNotFound(err)) {
			let webenv = 'remote';
			if (!err) {
				webenv = String(data).trim();
			}
			if (webenv == 'local') {
				setLocalWebEnv();
			} else {
				setRemoteWebEnv();
			}
			cb();
		} else {
			console.log('cant start server because ' + err);			
		}
	});	
}

function isFileNotFound(error) {
	return error.message.substr(0, 6) == "ENOENT";
}

function containsIllegalSessionCharacters(fn) {
	let isIdentifier = /^[a-zA-Z0-9_-]+$/.test(fn);
	return !isIdentifier;
}

function createSessionIdDirectory(sessionId, cb) {
	if (containsIllegalSessionCharacters(sessionId)) {
		return false;
	}
	let dirpath = `${getSessionDirectory(sessionId)}`;
	fs.mkdir(dirpath, function(err) {
		if (err) {
			cb(false);
		} else {
			cb(true);
		}
	});
}

function checkIfSessionExists(sessionId, cb) {
	let dirpath = `${getSessionDirectory(sessionId)}`;
	fs.access(dirpath, fs.constants.F_OK, function(err) {
		cb(!err);
	})
}

function checkIfFileExists(sessionId, path, cb) {
	let filepath = `${getSessionDirectory(sessionId)}/${path}`;
	fs.access(filepath, fs.constants.F_OK, function(err) {
		cb(!err);
	})
}

function cookieFromSessionId(sessionId) {
	return `sessionId=${sessionId}; domain=127.0.0.1; path=/`;
}

function serviceApiRequest(sessionId, resp, data) {
	let i = data.indexOf('\t');
	let opcode = data;
	let arg = null;
	if (i >= 0) {
		opcode = data.substr(0, i);
		arg = data.substr(i + 1);
	}
	let cb = function(respData) {
		sendResponse(resp, 200, 'text/xml', respData, 'apipath');
	}
	if (opcode == 'save') {
		serviceApiSaveRequest(arg, sessionId, cb);
	} else if (opcode == 'load') {
		serviceApiLoadRequest(arg, sessionId, cb);
	// these are currently identical to save/load but may not be
	// in the future due to tab escaping or -- idk, security shit
	} else if (opcode == 'saveraw') {
		serviceApiSaveRequest(arg, sessionId, cb);
	} else if (opcode == 'loadraw') {
		serviceApiLoadRequest(arg, sessionId, cb);
	} else if (opcode == 'listfiles') {
		serviceApiListFilesRequest(sessionId, cb, false /*standard*/);
	} else if (opcode == 'liststandardfunctionfiles') {
		serviceApiListFilesRequest(sessionId, cb, true /*standard*/);
	}
}

function containsIllegalFilenameCharacters(fn) {
	let isIdentifier = /^[a-zA-Z0-9_.-]+$/.test(fn);
	return !isIdentifier;
}

function getSessionDirectory(sessionId) {
	if (sessionId == 'packages' && webenv_vars.isLocal) {
		return './packages/'
	}
	if (sessionId == 'samples' && webenv_vars.isLocal) {
		return './samples/';
	}

	return `./sessions/${sessionId}/`;
}

function serviceApiSaveRequest(data, sessionId, cb) {
	let i = data.indexOf('\t');
	let nm = data.substr(0, i);
	if (containsIllegalFilenameCharacters(nm)) {
		cb(`v2:?"save failed (illegal filename). Sorry!"`);
		return;
	}
	let savedata = data.substr(i+1);

	let path = `${getSessionDirectory(sessionId)}/${nm}`;

	fs.writeFile(path, savedata, function(err) {
		if (err) {
			if (isFileNotFound(err)) {
				let i = data.indexOf('\t');
				let nm = data.substr(0, i);
				let savedata = data.substr(i+1);
				let filepath = `${getSessionDirectory(sessionId)}/${nm}`;
				fs.writeFile(filepath, savedata, function(err2) {
					if (err2) {
						cb(`v2:?"save failed 1. Sorry!"`);
					} else {
						cb(`v2:?{2||success}`);
					}
				})
			} else {
				cb(`v2:?"save failed 2. Sorry!"`);
			}
		} else {
			cb(`v2:?{2||success}`);
		}
	})
}

function serviceApiLoadRequest(data, sessionId, cb) {
	let nm = data;
	let path = `${getSessionDirectory(sessionId)}/${nm}`;
	fs.readFile(path, function(err, data) {
		if (err) {
			cb(`v2:?"file not found: '${nm}'. Sorry!"`);
		} else {
			cb(data)
		}
	})	
}

function serviceApiListFilesRequest(sessionId, cb, standard) {
	let path = (standard
		? `${getSessionDirectory('packages')}`
		: `${getSessionDirectory(sessionId)}`)
	fs.readdir(path, function(err, data) {
		if (err) {
			cb(`v2:?"could not get directory listing. Sorry!"`);
		} else {
			let s = 'v2:(|';
			let first = true;
			for (let i = 0; i < data.length; i++) {
				let filename = data[i];
				if (filename.charAt(0) == '.') {
					continue;
				}
				if (!first) {
					s += ' ';
				}
				s += '$"' + data[i] + '"';
				first = false;
			}
			s += '|)';
			cb(s);
		}
	})	
}

function copySessionContents(oldSessionId, newSessionId, cb) {
	let oldPath = `./sessions/${oldSessionId}/`;
	fs.readdir(oldPath, function(err, files) {
		if (err) {
			cb(false);
		} else {
			copySessionFileArray(oldSessionId, newSessionId, files, cb);
		}
	});
}

function copySessionFileArray(oldSessionId, newSessionId, files, cb) {
	let file = files.pop();
	if (!file) {
		cb(true);
		return;
	}
	let src = `./sessions/${oldSessionId}/${file}`;
	let dst = `./sessions/${newSessionId}/${file}`;
	fs.copyFile(src, dst, function(err) {
		if (err) {
			cb(false);
		} else {
			copySessionFileArray(oldSessionId, newSessionId, files, cb);
		}
	});
}


function transformHost(sessionId, data, cb) {
	getPreBootstrapInjectData(sessionId, function(bootdata) {
		data = replaceTag(data, 'serverinject:head', getHeadInjectData());
		data = replaceTag(data, 'serverinject:beforebootstrap', bootdata);
		cb(data);
	})
}

function replaceTag(data, tag, injected) {
	return ('' + data).replace(`<!-- ${tag} -->`, injected);
}

function makeScriptTag(from) {
	return `<script>${from}</script>`;
}

function getPreBootstrapInjectData(sessionId, cb) {
	checkIfFileExists(sessionId, ':start', function(exists) {
		if (exists) {
			cb(makeScriptTag(`const FEATURE_VECTOR = { hostname:"${webenv_vars.redirectHostname}", hasstart:true }`));
		} else {
			cb(makeScriptTag(`const FEATURE_VECTOR = { hostname:"${webenv_vars.redirectHostname}", hasstart:false }`));
		}
	});
}

function getHeadInjectData() {
	let includeString = '';
	try {
		let files = fs.readdirSync("./sounds");

		// <audio src="myCoolTrack.mp3" type="audio/mpeg"></audio>
		// "myCoolTrack.mp3",
		for (let i = 0; i < files.length; i++) {
			let fileName = files[i];
			if (fileName.charAt(0) == '.') {
				continue;
			}
			includeString += `"${fileName}",
			`;
		}
		return includeString;
	} catch (e) {
		if (isFileNotFound(e)) {
			return includeString;
		}
	}
}

loadWebEnv(function() {
	server.listen(port, hostname, () => {
  	  osc.open();
	  console.log(`Server running at http://${hostname}:${port}/`);
	});	
})


