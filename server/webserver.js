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

const { v4: uuidv4 } = require('uuid');

const hostname = '127.0.0.1';
const port = 3000;

let webenv = '';

const ERROR = "Rather than a beep<br>Or a rude error message,<br>These words: \"File not found.\"";

const server = http.createServer((message, res) => {
	// parse url - what file is being looked for?
	const parsedUrl = url.parse(message.url, true);
	let path = parsedUrl.path;
	let sessionId = getOrCreateSessionId(res, message);
	if (path == '/api') {
		doApiRequest(message, res, sessionId);
	} else {
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
		doFileRequest(path, res, sessionId);
	}
});

function getOrCreateSessionId(res, message) {
	c = message.headers['cookie'];
	if (c) {
		let s = c.split('; ');
		for (let i = 0; i < s.length; i++) {
			let t = s[i].split('=');
			if (t[0] == 'sessionId') {
				return t[1];
			}
		}
	}
	// if we get here, the req has no session id.
	let sessionId = uuidv4();
	res.setHeader('Set-Cookie', `sessionId=${sessionId}`);
	return sessionId;

}

function cookieFromSessionId(sessionId) {
	return `sessionId=${sessionId}; domain=127.0.0.1; path=/`;
}

function doApiRequest(message, res, sessionId) {
	let body = [];
	let bstr;
	message.on('data', (chunk) => {
		body.push(chunk);
	}).on('end', () => {
		bstr = Buffer.concat(body).toString();
		serviceApiRequest(
			bstr,
			sessionId,
			function(respData) {
				doResponse(res, 200, 'text/xml', respData, 'apipath');
			}
		)
	});
}

function doResponse(res, status, mimetype, data, path) {
	console.log('status: ' + path + ' (' + mimetype + ')');
	res.writeHead(status, {'Content-Type': mimetype});
	res.write(data);
	res.end();
}

function serviceApiRequest(data, sessionId, cb) {
	let i = data.indexOf('\t');
	let func = data.substr(0, i);
	if (func == 'save') {
		doSave(data.substr(i+1), sessionId, cb);
	} else if (func == 'load') {
		doLoad(data.substr(i+1), sessionId, cb);
	} else if (func == 'savepackage') {
		doSavePackage(data.substr(i+1), sessionId, cb);
	} else if (func == 'loadpackage') {
		doLoadPackage(data.substr(i+1), sessionId, cb);
	// these are currently identical to save/load but may not be
	// in the future due to tab escaping or -- idk, security shit
	} else if (func == 'saveraw') {
		doSave(data.substr(i+1), sessionId, cb);
	} else if (func == 'loadraw') {
		doLoad(data.substr(i+1), sessionId, cb);
	}
}

function doSave(data, sessionId, cb) {
	let i = data.indexOf('\t');
	let nm = data.substr(0, i);
	let savedata = data.substr(i+1);

	let path = `./sessions/${sessionId}/${nm}`;

	fs.writeFile(path, savedata, function(err) {
		if (err) {
			if (isFileNotFound(err)) {
				makeSessionDirThenSave(data, sessionId, cb);
			} else {
				cb(`v2:?"save failed. Sorry!"`);
			}
		} else {
			cb(`v2:?"save successful."`);
		}
	})
}

function doSavePackage(data, sessionId, cb) {
	let i = data.indexOf('\t');
	let nm = data.substr(0, i);
	let savedata = data.substr(i+1);

	let path = `./packages/${nm}`;
	console.log('webenv = <' + webenv + '>');
	if (webenv != 'local') {
		cb(`v2:?"cannot save over library code."`);
		return;
	}

	fs.writeFile(path, savedata, function(err) {
		if (err) {
			cb(`v2:?"save failed. Sorry!"`);
		} else {
			cb(`v2:?"save successful."`);
		}
	})
}

function doLoadPackage(data, sessionId, cb) {
	let nm = data;
	let path = `./packages/${nm}`;
	fs.readFile(path, function(err, data) {
		if (err) {
			cb(`v2:?"file not found: '${nm}'. Sorry!"`);
		} else {
			cb(data)
		}
	})	
}

function makeSessionDirThenSave(data, sessionId, cb) {
	let dirpath = `./sessions/${sessionId}`;
	let i = data.indexOf('\t');
	let nm = data.substr(0, i);
	let savedata = data.substr(i+1);
	let filepath = `./sessions/${sessionId}/${nm}`;
	fs.mkdir(dirpath, function(err) {
		if (err) {
			cb(`v2:?"save failed. Sorry!`);
		} else {
			fs.writeFile(filepath, savedata, function(err2) {
				if (err2) {
					cb(`v2:?"save failed. Sorry!"`);
				} else {
					cb(`v2:?"save successful."`);
				}
			})
		}
	});
}

function isFileNotFound(error) {
	return error.message.substr(0, 6) == "ENOENT";
}

function doLoad(data, sessionId, cb) {
	let nm = data;
	let path = `./sessions/${sessionId}/${nm}`;
	fs.readFile(path, function(err, data) {
		if (err) {
			cb(`v2:?"file not found: '${nm}'. Sorry!"`);
		} else {
			cb(data)
		}
	})	
}

function getAudioFileIncludes() {
	let includeString = '';
	let files = fs.readdirSync("./sounds");

	// <audio src="myCoolTrack.mp3" type="audio/mpeg"></audio>
	for (let i = 0; i < files.length; i++) {
		let fileName = files[i];
		includeString += `<audio src="./sounds/${fileName}" type="audio/mpeg"></audio>
		`;
	}
	return includeString;

}

function transformHost(data) {
	let audio = getAudioFileIncludes();
	return ('' + data).replace('<!-- AUDIO FILES HERE -->', audio);

}

function doFileRequest(path, res, sessionId) {
	// chop off query string
	let z = path.indexOf('?');
	if (z > -1) {
		path = path.substr(0, z);
	}
	let mimetype = getMimeTypeFromExt(path);
	fs.readFile(path, function(err, data) {
		if (err) {
			doResponse(res, 404, 'text/html', ERROR, 'ERROR');
		} else {
			if (path == './src/host.html') {
				data = transformHost(data);
			}
			doResponse(res, 200, mimetype, data, path);
		}
	});	
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
	}
	return 'text/plain';
}

function loadWebEnv(cb) {
	fs.readFile('webenv.txt', function(err, data) {
		if (err) {
			console.log('cant start server no webenv');
		} else {
			webenv = String(data).trim();
			cb();
		}
	});	
}


loadWebEnv(function() {
	server.listen(port, hostname, () => {
	  console.log(`Server running at http://${hostname}:${port}/`);
	});	
})

