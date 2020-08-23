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

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((message, res) => {
	// parse url - what file is being looked for?
	const parsedUrl = url.parse(message.url, true);
	let path = parsedUrl.path;
	if (path == '/api') {
		doApiRequest(message, res);
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
		doFileRequest(path, res);
	}
});

function doApiRequest(message, res) {
	let body = [];
	let bstr;
	message.on('data', (chunk) => {
		body.push(chunk);
	}).on('end', () => {
		bstr = Buffer.concat(body).toString();
		serviceApiRequest(
			bstr,
			function(respData) {
				res.writeHead(200, {'Content-Type': 'text/xml'});
				res.write(respData);
				res.end();			
			}
		)
	});
}

function serviceApiRequest(data, cb) {
	let i = data.indexOf('\t');
	let func = data.substr(0, i);
	if (func == 'save') {
		doSave(data.substr(i+1), cb);
	} else if (func == 'load') {
		doLoad(data.substr(i+1), cb);
	}
}

function doSave(data, cb) {
	let i = data.indexOf('\t');
	let nm = data.substr(0, i);
	let savedata = data.substr(i+1);
	fs.writeFile('./packages/' + nm, savedata, function(err) {
		if (err) {
			cb("^")
		} else {
			cb("^");
		}
	})
}

function doLoad(data, cb) {
	let nm = data;
	let filename = './packages/' + nm;
	fs.readFile('./packages/' + nm, function(err, data) {
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

function doFileRequest(path, res) {
	// chop off query string
	let z = path.indexOf('?');
	if (z > -1) {
		path = path.substr(0, z);
	}
	let mimetype = getMimeTypeFromExt(path);
	fs.readFile(path, function(err, data) {
		if (err) {
			console.log('404: ' + path);
			res.writeHead(404, {'Content-Type': 'text/html'});
			res.write("Rather than a beep<br>Or a rude error message,<br>These words: \"File not found.\"");
			res.end();			
		} else {
			if (path == './src/host.html') {
				data = transformHost(data);
			}
			console.log('200: ' + path + ' (' + mimetype + ')');
			res.writeHead(200, {'Content-Type': mimetype});
			res.write(data);
			res.end();			
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

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});