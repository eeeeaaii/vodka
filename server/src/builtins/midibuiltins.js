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

import { Builtin } from '../nex/builtin.js'; 
import { getMidiDevices } from '../midifunctions.js'
import { Org } from '../nex/org.js'; 
import { EError, ERROR_TYPE_INFO } from '../nex/eerror.js'
import { Expectation } from '../nex/expectation.js'
import { convertJSMapToOrg } from '../templates.js'
import { Tag } from '../tag.js'
import {
	MidiActivationFunctionGenerator,
	GenericActivationFunctionGenerator
} from '../asyncfunctions.js'


function createMidiBuiltins() {
	Builtin.createBuiltin(
		'list-midi-inputs',
		[ ],
		function $listMidiInputs(env, executionEnvironment) {
			let exp = new Expectation();
			exp.set(new GenericActivationFunctionGenerator(
				'list-midi-inputs', 
				function(callback, exp) {
					getMidiDevices(function(devs) {
						// devices will just be a string
						// convert to nice estrings
						let r = new Org();
						for (let i = 0; i < devs.length ; i++) {
							let org = convertJSMapToOrg(devs[i]);
							org.setHorizontal();
							org.addTag(new Tag('midiport'));
							r.appendChild(org);
						}
						callback(r);
					})
				}
			));
			let waitmessage = new EError(`listing midi inputs`);
			waitmessage.setErrorType(ERROR_TYPE_INFO);
			exp.appendChild(waitmessage)
			return exp;
		},
		'lists midi inputs'
	);


	Builtin.createBuiltin(
		'wait-for-midi',
		[ 'exp*', 'midiport()' ],
		function $setMidi(env, executionEnvironment) {
			let exp = env.lb('exp');
			let midiport = env.lb('midiport');
			let ismidiport = midiport.hasTag(new Tag('midiport'))
			let id = midiport.getChildTagged(new Tag('id'));
			if (!ismidiport || !id) {
				return new EError('wait-for-midi: must pass in a midiport object with a valid ID');
			}
			exp.setAutoreset(true);
			let afg = new MidiActivationFunctionGenerator(id.getTypedValue());
			exp.set(afg);
			return exp;
		},
		'primes |exp to fulfill when a midi event is received.'
	);
	
}

export { createMidiBuiltins }
