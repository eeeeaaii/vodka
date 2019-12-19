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
	var path = parsedUrl.path;
	if (path == '/api') {
		doApiRequest(message, res);
	} else {
		if (path == "/") {
			path = "/host.html"
		}
		path = "./src" + path;
		doFileRequest(path, res);
	}
});

function doApiRequest(message, res) {
	let body = [];
	var bstr;
	message.on('data', (chunk) => {
		body.push(chunk);
	}).on('end', () => {
		bstr = Buffer.concat(body).toString();
		serviceApiRequest(bstr, function(respData) {
			res.writeHead(200, {'Content-Type': 'text/xml'});
			res.write(respData);
			res.end();			
		})
	});
}

function serviceApiRequest(data, cb) {
	var i = data.indexOf('\t');
	var func = data.substr(0, i);
	if (func == 'save') {
		doSave(data.substr(i+1), cb);
	} else if (func == 'load') {
		doLoad(data.substr(i+1), cb);
	}
}

function doSave(data, cb) {
	var i = data.indexOf('\t');
	var nm = data.substr(0, i);
	var savedata = data.substr(i+1);
	fs.writeFile('./packages/' + nm, savedata, function(err) {
		cb("^");
	})
}

function doLoad(data, cb) {
	var nm = data;
	fs.readFile('./packages/' + nm, function(err, data) {
		cb(data);
	})	
}

function doFileRequest(path, res) {
	var mimetype = getMimeTypeFromExt(path);
	fs.readFile(path, function(err, data) {
		if (err) {
			console.log('404: ' + path);
			res.writeHead(404, {'Content-Type': 'text/html'});
			res.write("Rather than a beep<br>Or a rude error message,<br>These words: \"File not found.\"");
			res.end();			
		} else {
			console.log('200: ' + path + ' (' + mimetype + ')');
			res.writeHead(200, {'Content-Type': mimetype});
			res.write(data);
			res.end();			
		}
	});	
}

function getMimeTypeFromExt(fname) {
	var ext = fname.substr(fname.lastIndexOf('.'));
	switch(ext) {
		case '.js':
			return 'text/javascript';
		case '.html':
			return 'text/html';
		case '.css':
			return 'text/css';
	}
	return 'text/plain';
}

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});