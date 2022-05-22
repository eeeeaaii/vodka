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
import { saveShortcut } from '../servercommunication.js'
import { ESymbol } from '../nex/esymbol.js'
import { Command } from '../nex/command.js'



function createOrgBuiltins() {

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
		'Creates a template with a name equal to the passed-in symbol.'
	);		

	Builtin.createBuiltin(
		'save-template as',
		[ '_org()', '_name@' ],
		function $template(env, executionEnvironment) {
			let name = env.lb('name');
			let org = env.lb('org');
			try {
				let template = templateStore.createTemplate(name, org, executionEnvironment);
				// successfully created template, so we also save it.
				let namesym = new ESymbol(name.getTypedValue() + '-template');
				let toSave = Command.makeCommandWithArgs("template", name, org);
				toSave.setMutable(true);
				saveShortcut(namesym, toSave, function(result) {
					if (result != null) {
						alert('save-template: save failed! Check result: ' + result.debugString());
					}
				});
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
		'Creates a template and also attempts to save it in an appropriately-named file. Notifies the user with a javascript alert dialog if the save failed, otherwise no notification is given of success.'
	);		


	Builtin.createBuiltin(
		'dump-template',
		[ '_name@' ],
		function $dumpTemplate(env, executionEnvironment) {
			let nex = env.lb('name');
			let name = nex.getTypedValue();
			let template = templateStore.getTemplate(name);
			if (!template) {
				return new EError(`dump-template: no such template ${name}`);
			} else {
				return template.getOrg().makeCopy();
			}
		},
		'Gets the definition of a template from the template store and returns it, or returns an error if no such template.'
	);
}

export { createOrgBuiltins }

