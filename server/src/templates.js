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
import { constructFatalError, newTagOrThrowOOM } from './nex/eerror.js'
import { Tag } from './tag.js'
import { constructOrg, convertJSMapToOrg } from './nex/org.js'
import { evaluateNexSafely } from './evaluator.js'
import { BUILTINS, BINDINGS } from './environment.js'
import { experiments } from './globalappflags.js'
import { sEval } from './syntheticroot.js'
import { systemState } from './systemstate.js'

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
		return nex.getTag(0).getTagString();
	}

	instantiateWithPotentialTemplate(namestr, binding, args, env) {
		if (!binding) {
			return constructFatalError(`no binding for template ${namestr}.`);
		}
		if (!Utils.isOrg(binding)) {
			// instantiating non-orgs just gives you back the thing.
			return binding;
		}
		let dst = constructOrg();
		this._copyMembersInto(binding, dst);
		return this._instantiate(dst, args, env);
	}

	// args is an array, will always be passed, but it might be empty, contains nexes
	_instantiate(initOrg, args, env) {
		let org = constructOrg();
		let initializer = null;
		let fcscope = {};
		let instantiationLexicalSelfScope = env.pushEnv(); // popped
		instantiationLexicalSelfScope.bind('self', org);
		org.templateInstantiationLexicalSelfScope = instantiationLexicalSelfScope;
		for (let i = 0; i < initOrg.numChildren(); i++) {
			let c = initOrg.getChildAt(i);
			let membername = this._getSingleTagName(c);
			// members can be either lambdas or closures.
			// if it's a closure, it contains a lexical scope that has to be preserved,
			// so the self scope is parented to the lexical scope.
			// if it's a lambda, all bets are off so we give it the execution scope.
			// unlikely that a lambda would happen without quoting or something.
			if (c.getTypeName() == '-lambda-') {
				let closure = evaluateNexSafely(c, instantiationLexicalSelfScope);
				org.appendChild(closure);
				if (membername == ':init') {
					initializer = closure;
				}
				if (membername == ':draw') {
					closure.addTag(newTagOrThrowOOM('::drawfunction', 'instantiate drawfunction'));
				}
			} else if (c.getTypeName() == '-closure-') {
				let lexenv = c.getLexicalEnvironment();
				let selfScope = lexenv.pushEnv(); // popped
				selfScope.bind('self', org);
				let lambda = c.getLambda();
				let closure = evaluateNexSafely(lambda, selfScope);
				selfScope.finalize();
				org.appendChild(closure);
				if (membername == ':init') {
					initializer = closure;
				}
				if (membername == ':draw') {
					closure.addTag(newTagOrThrowOOM('::drawfunction', 'instantiate drawfunction'));
				}
			} else {
				org.appendChild(c.makeCopy());
			}
		}
		if (initializer) {
			// don't need the return value of the initializer...
			// but I do tell sEval to throw the error if it returns a fatal one.
			sEval(systemState.getSCF().makeCommandWithClosure(initializer, args),
							 env,
							 'Error in template initializer',
							 true /* throw error */);
		}
		return org;
	}
	
	_makeLine(n, s) {
		return `<div class="templateline${n}">${s.trim()}</div>`;
	}

	/*
	What `^name` shows while you are typing it: the glyph, the template's
	`:docs` if it has any, and -- the point of it -- the arguments its `:init`
	takes, written the way you would write the call.

	The arguments used to be shown only when a `:docs` member existed, because
	a missing description returned early and never reached the initializer. The
	arguments are the thing you actually need at the moment you are typing a
	call, so they are never skipped now and the description is the optional
	part.

	The call is written with the template's name, not the initializer's. An
	initializer is an anonymous lambda, so its own name is punctuation, and
	what you want to read here is the line you are about to type.

	(comment by Claude)
	*/
	getTemplateDocs(binding, name) {
		if (!binding) {
			return '';
		}
		if (!Utils.isOrg(binding)) {
			return '-not a template-';
		}
		let r = this._makeLine(0, '&#x25F0');
		let docs = binding.getChildTagged(newTagOrThrowOOM(':docs', 'creating template - doc tag'));
		if (docs) {
			r += this._makeLine(1, Utils.isDoc(docs)
					? binding.escape(docs.getValueAsString().trim(), true)
					: '-invalid description-');
		}
		let initializer = binding.getChildTagged(newTagOrThrowOOM(':init', 'creating template - init tag'));
		if (!initializer || initializer.getTypeName() != '-closure-') {
			// no initializer, so it takes no arguments
			// (comment by Claude)
			return r + this._makeLine(2, binding.escape('^' + name));
		}
		let lambda = initializer.getLambda();
		r += this._makeLine(2, binding.escape(lambda.getArgString('^' + name).trim()));
		if (lambda.hasDocStringInFirstPosition()) {
			r += this._makeLine(3, initializer.getDocString());
		}
		return r;
	}

}


const templateStore = new TemplateStore();


export { templateStore  }

