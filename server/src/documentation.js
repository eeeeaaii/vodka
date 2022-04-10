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

let apiDocCategory = '';

let docs = {};
let docorder = [];

function setAPIDocCategory(str) {
	apiDocCategory = str;
	docs[apiDocCategory] = [];
	docorder.push(str);
}

function documentBuiltin(name, params, info) {
	docs[apiDocCategory].push({
		name:name,
		info:info,
		params:params
	})
}

function makespacer(p) {
	let line = document.createElement('p');
	line.classList.add('infospacer');
	p.appendChild(line);
	return line;
}

function makeline(p, contents) {
	let line = document.createElement('p');
	line.classList.add('infoline');
	line.innerText = contents;
	p.appendChild(line);
	return line;
}

function makeindentedline(p, contents, ishtml) {
	let line = document.createElement('p');
	line.classList.add('infoline');
	line.classList.add('infoindent');
	if (ishtml) {
		line.innerHTML = contents;
	} else {
		line.innerText = contents;
	}
	p.appendChild(line);
	return line;
}

function makebigline(p, contents) {
	let line = document.createElement('p');
	line.classList.add('infotitle');
	line.innerText = contents;
	p.appendChild(line);
	return line;
}

function makehotkey(contents) {
	let line = document.createElement('span');
	line.classList.add('infohotkey');
	line.innerText = contents;
	return line;
}

function makebighotkey(contents) {
	let line = document.createElement('span');
	line.classList.add('infohotkey');
	line.classList.add('infohotkeylarge');
	line.innerText = contents;
	return line;
}

function printTitle(p, text) {
	makebigline(p, text);
	makespacer(p);
}

function printItem(p, item) {
	let line = makeline(p, '')
	line.prepend(makebighotkey(item.name))
	if (item.params.length > 0) {
		let l2 = makeindentedline(p, 'args: ')
		for(let i = 0; i < item.params.length; i++) {
			l2.appendChild(makehotkey(item.params[i]))
		}		
	}
	let info = '' + item.info;
	info = info.replace(/\|([a-zA-Z_]+) /g, "<span class=\"infohotkey\">$1</span>")
	info = info.replace(/\|([a-zA-Z_]+)/g, "<span class=\"infohotkey\">$1</span>")
	makeindentedline(p, info, true);
	makespacer(p);
	makespacer(p);
}

function writeDocs() {
	let div = document.getElementById('fullapireference');
	for (let j = 0; j < docorder.length; j++) {
		let key = docorder[j];
		printTitle(div, key);
		let list = docs[key];
		for (let i = 0 ; i < list.length ; i++) {
			printItem(div, list[i]);
		}
	}
}


export { setAPIDocCategory, documentBuiltin, writeDocs }