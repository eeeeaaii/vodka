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

var st = {};
var parserStack = [];

function createstate(s, n) {
	st[s] = n;
	st['-' + n] = s;
}

createstate('STARTDOC', 1);
createstate('ENDDOC', 2);
createstate('STARTLINE', 3);
createstate('ENDLINE', 4);
createstate('STARTWORD', 5);
createstate('ENDWORD', 6);
createstate('STARTCOMMAND', 7);
createstate('ENDCOMMAND', 8);
createstate('STARTLAMBDA', 9);
createstate('ENDLAMBDA', 10);

createstate('INTEGER', 11);
createstate('BOOL', 12);
createstate('STRING', 13);
createstate('ERROR', 14);
createstate('FLOAT', 15);
createstate('LETTER', 16);
createstate('SEPARATOR', 17);
createstate('SYMBOL', 18);

createstate('STARTZLIST', 19);
createstate('ENDZLIST', 20);
createstate('NEWLINE', 21); // newlines are deprecated and yucky
createstate('NIL', 22);

createstate('STARTEXPECTATION', 23);
createstate('ENDEXPECTATION', 24);


class NexParser {
	constructor(input) {
		this.s = input;
		this.origInput = input;
//		this.r = this.origr = new Root(false /* do not attach */);
	}

	testToken(regexp, token) {
		if (regexp.test(this.s)) {
			let m = regexp.exec(this.s);
			this.data = [];
			for (let i = 1; i < m.length; i++) {
				this.data[i - 1] = m[i];
			}
			this.s = this.s.replace(regexp, '');
			return token;
		}
		return 0;
	}

	getNextToken() {
		this.s = this.s.replace(/^[ \t\n]+/, '');
		return this.testToken(/^\{/, st['STARTDOC'])
		    || this.testToken(/^\}/, st['ENDDOC'])
		    || this.testToken(/^\[/, st['STARTLINE'])
		    || this.testToken(/^\]/, st['ENDLINE'])
		    || this.testToken(/^\(/, st['STARTWORD'])
		    || this.testToken(/^\)/, st['ENDWORD'])
		    || this.testToken(/^\</, st['STARTZLIST'])
		    || this.testToken(/^\>/, st['ENDZLIST'])
		    || this.testToken(/^\*\(/, st['STARTEXPECTATION'])
		    || this.testToken(/^\*\)/, st['ENDEXPECTATION'])
		    || this.testToken(/^~"([a-zA-Z_=<>:+*/-]*)"([vh]*)\(/, st['STARTCOMMAND'])
		    || this.testToken(/^~\)/, st['ENDCOMMAND'])
		    || this.testToken(/^&"([a-zA-Z0-9 |_-]*)"([vh]*)\(/, st['STARTLAMBDA'])
		    || this.testToken(/^&\)/, st['ENDLAMBDA'])
		    || this.testToken(/^\^/, st['NIL'])		    
		    || this.testToken(/^!(yes|no)/, st['BOOL'])
		    || this.testToken(/^\@([a-zA-Z0-9-:_]*)/, st['SYMBOL'])
		    || this.testToken(/^#([0-9-]*)/, st['INTEGER'])
		    || this.testToken(/^%([e0-9.-_]*)/, st['FLOAT'])
		    || this.testToken(/^\$"([^"]*)"/, st['STRING'])
		    || this.testToken(/^\?"([^"]*)"/, st['ERROR'])
		    || this.testToken(/^\|\[&nbsp;\]\|/, st['NEWLINE'])
		    || this.testToken(/^\|\((.)\)\|/, st['LETTER'])
		    || this.testToken(/^\|\[(.)\]\|/, st['SEPARATOR'])
		    || 0;
	}

	parse() {
		let token;
		this.push(new Root());
		while (token = this.getNextToken()) {
			if (CONSOLE_DEBUG) {
				console.log(`token: ${st['-' + token]} data: ${this.data[0]} remaining: ${this.s}`);
			}
			this.doParse(token);
		}
		this.pop();
		if (parserStack.length == 0 && this.r.hasChildren()) {
			return this.r.getChildAt(0);
		} else {
			let error = new EError("error parsing saved vodka file");
			let orig = new EString(this.origInput);
			orig.addTag(new Tag("original input"));
			let rem = new EString(this.s);
			rem.addTag(new Tag("remaining input"));
			error.appendChild(orig);
			error.appendChild(rem);
			return error;
		}
	}

	push(n) {
		if (parserStack.length > 0) {
			this.r.appendChild(n);
		}
		parserStack.push(n);
		this.r = n;
	}

	pop() {
		parserStack.pop();
		if (parserStack.length > 0) {
			this.r = parserStack[parserStack.length - 1];
		}
//		this.r = this.r.getParent(true /* evenIfRoot */);
	}

	doParse(token) {
		switch(token) {
		case st['STARTDOC']: {
			this.push(new Doc());
			break;
		}
		case st['STARTLINE']: {
			this.push(new Line());
			break;
		}
		case st['STARTWORD']: {
			this.push(new Word());
			break;
		}
		case st['STARTZLIST']: {
			this.push(new Zlist());
			break;
		}
		case st['STARTEXPECTATION']: {
			this.push(new Expectation());
			break;
		}
		case st['STARTCOMMAND']: {
			let c = new Command(this.data[0]);
			if (this.data[1] == 'v') {
				c.toggleDir();
			}
			this.push(c);
			break;
		}
		case st['STARTLAMBDA']: {
			let lm = new Lambda(this.data[0]);
			if (this.data[1] == 'v') {
				lm.toggleDir();
			}
			this.push(lm);
			break;
		}
		case st['ENDDOC']:
		case st['ENDLINE']:
		case st['ENDWORD']:
		case st['ENDCOMMAND']:
		case st['ENDZLIST']:
		case st['ENDEXPECTATION']:
		case st['ENDLAMBDA']: {
			this.pop();
			break;
		}
		case st['STRING']: {
			let n = new EString(this.data[0]);
			n.unScrewUp();
			this.r.appendChild(n);
			break;
		}
		case st['ERROR']: {
			let n = new EError(this.data[0]);
			n.unScrewUp();
			this.r.appendChild(n);
			break;
		}
		case st['INTEGER']: {
			let n = new Integer(this.data[0]);
			this.r.appendChild(n);
			break;
		}
		case st['FLOAT']: {
			let n = new Float(this.data[0]);
			this.r.appendChild(n);
			break;
		}
		case st['BOOL']: {
			let n = new Bool(this.data[0]);
			this.r.appendChild(n);
			break;
		}
		case st['LETTER']: {
			let n = new Letter(this.data[0]);
			this.r.appendChild(n);
			break;
		}
		case st['SEPARATOR']: {
			let n = new Separator(this.data[0]);
			this.r.appendChild(n);
			break;
		}
		case st['SYMBOL']: {
			let n = new ESymbol(this.data[0]);
			this.r.appendChild(n);
			break;
		}
		case st['NEWLINE']: {
			let n = new Newline();
			this.r.appendChild(n);
			break;
		}
		case st['NIL']: {
			let n = new Nil();
			this.r.appendChild(n);
			break;
		}
		}
	}
}
