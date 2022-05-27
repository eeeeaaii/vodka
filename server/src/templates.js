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

	_copyMembersInto(src, dst) {
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


	_getSingleTagName(nex) {
		if (nex.numTags() != 1) {
			return null;
		}
		return nex.getTag(0).getName();
	}

	instantiateWithPotentialTemplate(namestr, binding, args, env) {
		if (!binding) {
			return new EError(`no binding for template ${namestr}.`);
		}
		if (!Utils.isOrg(binding)) {
			// instantiating non-orgs just gives you back the thing.
			return binding;
		}
		let dst = new Org();
		this._copyMembersInto(binding, dst);
		return this._instantiate(dst, args, env);
	}

	// args is an array, will always be passed, but it might be empty, contains nexes
	_instantiate(initOrg, args, env) {
		let org = new Org();
		let initializer = null;
		let fcscope = {};
		let innerenv = env.pushEnv();
		innerenv.bind('self', org);
		for (let i = 0; i < initOrg.numChildren(); i++) {
			let c = initOrg.getChildAt(i);
			let membername = this._getSingleTagName(c);
			if (c.getTypeName() == '-closure-') {
				let lambda = c.getLambda();
				let closure = evaluateNexSafely(lambda, innerenv);
				org.appendChild(closure);
				if (membername == ':init') {
					initializer = closure;
				}
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
	
	_makeLine(n, s) {
		return `<div class="templateline${n}">${s.trim()}</div>`;
	}

	getTemplateDocs(binding) {
		if (!binding) {
			return '';
		}
		if (!Utils.isOrg(binding)) {
			return '-not a template-';
		}

		let docs = binding.getChildTagged(new Tag(':docs'));
		if (!docs) {
			return '-no description-';
		}

		if (!Utils.isDoc(docs)) {
			return '-invalid description-';
		}

		let firstline = docs.getValueAsString();

		// okay great, let's try other things.

		let secondline = '';
		let initializer = binding.getChildTagged(new Tag(':init'));
		if (initializer) {
			if (initializer.getTypeName() == '-closure-') {
				secondline = ''
						+ initializer.getSummaryLine()
						+ ' '
						+ initializer.getLambdaArgString();
			}
		}
		if (secondline) {
			return this._makeLine(0, '&#x25F0') + this._makeLine(1, firstline) + this._makeLine(2, secondline);			
		} else {			
			return this._makeLine(0, '&#x25F0') + this._makeLine(1, firstline);
		}
	}

}


const templateStore = new TemplateStore();


export { templateStore  }

