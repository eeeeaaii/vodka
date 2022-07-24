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
import { constructOrg } from '../nex/org.js'; 
import { constructDeferredValue } from '../nex/deferredvalue.js'; 
import { constructFatalError, constructInfo, newTagOrThrowOOM } from '../nex/eerror.js'
import { convertJSMapToOrg } from '../nex/org.js'
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
			let dv = constructDeferredValue();
			dv.set(new GenericActivationFunctionGenerator(
				'list-midi-inputs', 
				function(callback, exp) {
					getMidiDevices(function(devs) {
						// devices will just be a string
						// convert to nice estrings
						let r = constructOrg();
						for (let i = 0; i < devs.length ; i++) {
							let org = convertJSMapToOrg(devs[i]);
							org.setHorizontal();
							org.addTag(newTagOrThrowOOM('midiport', 'list midi imputs builtin'));
							r.appendChild(org);
						}
						callback(r);
					})
				}
			));
			let waitmessage = constructInfo(`listing midi inputs`);
			dv.appendChild(waitmessage)
			return dv;
		},
		'Lists midi inputs.'
	);


	Builtin.createBuiltin(
		'wait-for-midi',
		[ 'midiport()' ],
		function $setMidi(env, executionEnvironment) {
			let midiport = env.lb('midiport');
			let ismidiport = midiport.hasTag(newTagOrThrowOOM('midiport', 'wait for midi builtin, is midi port'))
			let id = midiport.getChildTagged(newTagOrThrowOOM('id', 'wait for midi builtin, id'));
			if (!ismidiport || !id) {
				return constructFatalError('wait-for-midi: must pass in a midiport object with a valid ID');
			}
			let dv = constructDeferredValue();
			dv.setAutoreset(true);
			let afg = new MidiActivationFunctionGenerator(id.getTypedValue());
			dv.set(afg);
			dv.activate();
			return dv;
		},
		'Returns a deferred value that updates any time a midi event is received on |midiport.'
	);
	
}

export { createMidiBuiltins }
