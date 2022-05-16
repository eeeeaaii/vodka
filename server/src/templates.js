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

import * as Utils from './utils.js'

import { Command } from './nex/command.js'
import { Nex } from './nex/nex.js'
import { EError } from './nex/eerror.js'
import { Closure } from './nex/closure.js'
import { EString } from './nex/estring.js'
import { Tag } from './tag.js'
import { Org, convertJSMapToOrg } from './nex/org.js'
import { Integer } from './nex/integer.js'
import { Float } from './nex/float.js'
import { evaluateNexSafely } from './evaluator.js'
import { BUILTINS, BINDINGS } from './environment.js'
import { experiments } from './globalappflags.js'

class TemplateStore  {
	constructor() {
		this.templates = {};
		this.foreigntemplates = {};
	}

	getTemplate(name) {
		return this.templates[name];
	}

	createTemplate(nonce, org, env) {
		let name = '';
		name = nonce.getTypedValue();
		let template = new Template(name, org, env);
		this.templates[name] = template;
		return template;
	}

	copyMembersInto(src, dst) {
		for (let i = 0; i < src.numChildren() ; i++) {
			let c = src.getChildAt(i);
			// SHOULD I EVALUATE and append THAT?
			if (c.getTypeName() == '-closure-') {
				dst.appendChild(c);
			} else {
				dst.appendChild(c.makeCopy());
			}
		}
	}

	getSingleTagName(nex) {
		if (nex.numTags() != 1) {
			return null;
		}
		return nex.getTag(0).getName();
	}

	// kind of temporary because I have to figure out subclassing I guess
	instantiateWithNameString(str, args) {
		let dst = new Org();
		let template = this.templates[str];
		if (!template) {
		  throw new EError(`cannot instantiate unknown template ${str}. Sorry!`);
		}
		this.copyMembersInto(template.getOrg(), dst);
		if (template.getDrawCheat()) {
			dst.setDrawCheat(template.getDrawCheat());
		}
		return this.instantiate(dst, args);
	}

	// merge: takes a bunch of nonces and initializers and makes an initializer
	merge(args) {
		let dst = new Org();
		for (let i = 0; i < args.length; i++) {
			let arg = args[i];
			if (arg.getTypeName() == '-nil-') {
				// it's a nonce
				let name = arg.getTag(0).getName();
				let template = this.templates[name];
				this.copyMembersInto(template.getOrg(), dst);
				if (template.getDrawCheat()) {
					dst.setDrawCheat(template.getDrawCheat());
				}
			} else if (arg.getTypeName() == '-org-') {
				this.copyMembersInto(arg, dst);
			} else {
				throw new Error('ack');
			}
		}		
		return dst;
	}

	// args is an array, will always be passed, but it might be empty, contains nexes
	instantiate(initOrg, args) {
		let org = new Org();
		let initializer = null;
		let fcscope = {};
		if (initOrg.getDrawCheat()) {
			let dc = initOrg.getDrawCheat();
			dc = dc.bind(fcscope);
			org.setDrawFunction(dc);
		}
		let env = BUILTINS.pushEnv();
		env.bind('self', org);
		for (let i = 0; i < initOrg.numChildren(); i++) {
			let c = initOrg.getChildAt(i);
			let membername = this.getSingleTagName(c);
			if (c.getTypeName() == '-lambda-') {
				let closure = evaluateNexSafely(c, env);
				closure.addTag(new Tag(membername));
				org.appendChild(closure);
				if (membername == ':init') {
					initializer = closure;
				} else if (membername == ':draw') {
					let df = function(prevHTML) {
						let str = new EString(prevHTML);
						let cmd = Command.makeCommandWithClosure(closure, str);
						let rstr = evaluateNexSafely(cmd, env);
						return rstr.getFullTypedValue();
					}
					org.setDrawFunction(df);
				}
			} else if (c instanceof Closure) {
				org.appendChild(c);
			} else {
				org.appendChild(c.makeCopy());
			}
		}
		if (initializer) {
			let cmd = Command.makeCommandWithClosure(initializer, args);
			let rstr = evaluateNexSafely(cmd, env);
			if (Utils.isFatalError(rstr)) {
				throw rstr;
			}
		}
		return org;
	}
}

class Template {
	// we don't do anything with the env yet but I think we will need it
	// should write a test for it WHEN we do something with it
	constructor(name, org, env, drawCheat, docs) {
		this.name = name;
		this.org = org;
		this.env = env;
		this.drawCheat = drawCheat;
		this.docs = docs;
	}

	getName() {
		return this.name;
	}

	getOrg() {
		return this.org;
	}

	getEnv() {
		return this.env;
	}

	getDrawCheat() {
		return this.drawCheat;
	}

	line(n, s) {
		return `<div class="templateline${n}">${s.trim()}</div>`
	}

	getDocs() {
		let firstline = '';
		if (!this.docs) {
			let docs = this.org.getChildTagged(':info');
			if (docs && docs.getTypeName() == '-page-') {
				firstline = docs.getValueAsString();
			} else {
				firstline = '-no description-';
			}
		} else {
			firstline = this.docs;
		}
		let initializer = this.org.getChildTagged(':init');
		if (initializer) {
			let secondline = ''
			if (initializer.getTypeName() == '-closure-') {
				secondline = ''
						+ initializer.getSummaryLine()
						+ ' '
						+ initializer.getLambdaArgString();
			} else {
				secondline = initializer.getArgString(':init');
			}

			return this.line(0, '&#x25F0') + this.line(1, firstline) + this.line(2, secondline);
		} else {
			return this.line(0, '&#x25F0') + this.line(1, firstline);
		}
	}
}


const templateStore = new TemplateStore();


export { templateStore, convertJSMapToOrg  }

