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

import * as Utils from '../utils.js'

import { Builtin } from '../nex/builtin.js'
import { EError } from '../nex/eerror.js'
import { templateStore } from '../templates.js'
import { ERROR_TYPE_INFO } from '../nex/eerror.js'
import { experiments } from '../globalappflags.js'


function createOrgBuiltins() {

	if (experiments.ORG_OVERHAUL) {
		Builtin.createBuiltin(
			'template',
			[ '_name@', '_org()' ],
			function $template(env, executionEnvironment) {
				let name = env.lb('name');
				let org = env.lb('org');
				try {
					let template = templateStore.createTemplate(name, org, executionEnvironment);
					let r = new EError(`created template ${template.getName()}`);
					r.setErrorType(ERROR_TYPE_INFO);
					return r;
				} catch (e) {
					if (Utils.isFatalError(e)) {
						return e;
					} else {
						throw e;
					}
				}
			},
			'creates a template with a name equal to the passed-in symbol.'
		);		
	} else {
		Builtin.createBuiltin(
			'template',
			[ 'nix^', 'org()' ],
			function $template(env, executionEnvironment) {
				let nix = env.lb('nix');
				let org = env.lb('org');
				try {
					let template = templateStore.createTemplate(nix, org, executionEnvironment);
					let r = new EError(`created template ${template.getName()}`);
					r.setErrorType(ERROR_TYPE_INFO);
					return r;
				} catch (e) {
					if (Utils.isFatalError(e)) {
						return e;
					} else {
						throw e;
					}
				}
			},
			'creates a template identified by the nix tag.'
		);		
	}

	Builtin.createBuiltin(
		'merge',
		[ 'nex...' ],
		function $merge(env, executionEnvironment) {
			let nexc = env.lb('nex');
			let a = [];
			for (let i = 0; i < nexc.numChildren(); i++) {
				a.push(nexc.getChildAt(i));
			}
			try {
				return templateStore.merge(a);
			} catch (e) {
				if (Utils.isFatalError(e)) {
					return e;
				} else {
					throw e;
				}
			}
		},
		'merges the orgs passed to it, returning an org with the union of all members'
	);

	Builtin.createBuiltin(
		'instantiate',
		[ 'init', 'nex...' ],
		function $instantiate(env, executionEnvironment) {
			let init = env.lb('init');
			let args = env.lb('nex');
			let a = [];
			for (let i = 0; i < args.numChildren(); i++) {
				let c = args.getChildAt(i);
				a.push(c);
			}
			try {
				if (init.getTypeName() == '-nil-') {
					init = templateStore.merge([init]);					
				}
				if (!init || !init.getTypeName || init.getTypeName() != '-org-') {
					return EError('can only init with an org');
				}
				return templateStore.instantiate(init, a);
			} catch (e) {
				if (Utils.isFatalError(e)) {
					return e;
				} else {
					throw e;
				}
			}
		},
		'instantiates a new org from the template |init, or if |init is a nix, the template named by |init.'
	);

	Builtin.aliasBuiltin('new', 'instantiate');
}

export { createOrgBuiltins }

