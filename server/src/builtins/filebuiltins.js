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
import { Command } from '../nex/command.js'
import { Lambda } from '../nex/lambda.js'
import { constructEError } from '../nex/eerror.js'
import { constructFatalError, newTagOrThrowOOM } from '../nex/eerror.js'
import { constructEString } from '../nex/estring.js'
import { Nil } from '../nex/nil.js'
import { wrapError } from '../evaluator.js'
import { DeferredValue, constructDeferredValue } from '../nex/deferredvalue.js'
import { Org, constructOrg } from '../nex/org.js'
import { ESymbol } from '../nex/esymbol.js'
import { ERROR_TYPE_INFO } from '../nex/eerror.js'
import { evaluateNexSafely } from '../evaluator.js'
import { BINDINGS } from '../environment.js'
import { experiments } from '../globalappflags.js'
import {
	GenericActivationFunctionGenerator
} from '../asyncfunctions.js'
import {
	RENDER_MODE_NORM,
	RENDER_MODE_EXPLO,
	RENDER_MODE_INHERIT,
} from '../globalconstants.js'
import { sAttach } from '../syntheticroot.js'
import { readAudioTags, libraryNames } from '../audiolibraries.js'



import {
	saveShortcut,
	saveNex,
	loadNex,
	importNex,
	loadRaw,
	saveRaw,
	listFiles,
	listAudio,
	listStandardFunctionFiles
} from '../servercommunication.js'


// A listing entry is audio if it's a string ending in .wav. Anything else in a
// bank folder (info.txt, a nested directory) is not something load-audio
// can use.
// (comment by Claude)
function isWavFile(nex) {
	if (!nex || Utils.isNexContainer(nex)) {
		return false;
	}
	if (!nex.getFullTypedValue) {
		return false;
	}
	let v = nex.getFullTypedValue();
	return typeof v == 'string' && v.toLowerCase().endsWith('.wav');
}

function createFileBuiltins() {

	Builtin.createBuiltin(
		'list-files',
		[ ],
		function $listFiles(env, executionEnvironment) {
			let deferredValue = constructDeferredValue();
			deferredValue.set(new GenericActivationFunctionGenerator(
				'list-files', 
				function(callback, deferredValue) {
					listFiles(function(files) {
						// turn files into an org or whatever
						callback(files);
					})
				}
			));
			let loadingMessage = constructEError(`listing files`);
			loadingMessage.setErrorType(ERROR_TYPE_INFO);
			deferredValue.appendChild(loadingMessage)
			deferredValue.activate();
			return deferredValue;
		},
		'Lists all user files available in current session.'
	);	

	/*
	The directory listing is generic: subdirectories come back as tagged orgs,
	loose files as plain strings. For audio we only care about the folders, and
	a stray file (the README, say) breaks callers that expect every item to be
	taggable. So drop non-containers, and flip each folder horizontal -- one
	very tall column per folder reads badly.
	*/
	/*
	A listing is meant to be walked with dot syntax --

		~(_bind @audio ~(_list-audio_)_)   then   @audio.sample.SB_003.Drop_Synth

	-- and each step of that is a tag looked up by name. The folders arrive
	tagged already; the files arrive as bare strings, so they get a tag here.

	The extension comes off both the tag and the name itself. A dot separates
	one step of a walk from the next, so a tag ending in .wav could never be
	reached, and once every name in the library is a wav the extension was only
	ever four characters of noise. load-audio puts it back.

	(comment by Claude)
	*/
	function nameAudioFile(file) {
		let full = file.getFullTypedValue();
		let stripped = full.substring(0, full.length - '.wav'.length);
		file.setFullValue(stripped);
		let at = stripped.lastIndexOf('/');
		let leaf = at == -1 ? stripped : stripped.substring(at + 1);
		if (!file.hasTagWithString(leaf)) {
			file.addTag(newTagOrThrowOOM(leaf, 'list-audio file name'));
		}
	}

	function tidyAudioListing(files) {
		if (!files.numChildren) {
			return files;
		}
		for (let i = files.numChildren() - 1; i >= 0; i--) {
			let dir = files.getChildAt(i);
			if (!Utils.isNexContainer(dir)) {
				files.removeChildAt(i);
				continue;
			}
			// Each folder also holds an info.txt naming the machine the samples
			// came from. Keep only the audio, so a caller can map load-audio
			// over a folder directly.
			for (let j = dir.numChildren() - 1; j >= 0; j--) {
				if (!isWavFile(dir.getChildAt(j))) {
					dir.removeChildAt(j);
				} else {
					nameAudioFile(dir.getChildAt(j));
				}
			}
			if (dir.setHorizontal) {
				dir.setHorizontal();
			}
		}
		return files;
	}

	function folderName(dir) {
		return dir.numTags() > 0 ? dir.getTag(0).getTagString() : '';
	}

	// A folder tag narrows the listing to that folder. The listing is what
	// knows which folders exist, so this is also where a tag that names no
	// folder gets caught, and it says what the real names are rather than just
	// that the one you gave is wrong.
	function keepOnlyFolders(files, wanted) {
		let found = [];
		for (let i = files.numChildren() - 1; i >= 0; i--) {
			let name = folderName(files.getChildAt(i));
			if (wanted.indexOf(name) == -1) {
				files.removeChildAt(i);
			} else {
				found.push(name);
			}
		}
		let missing = wanted.filter(w => found.indexOf(w) == -1);
		return missing;
	}

	function allFolderNames(files) {
		let names = [];
		for (let i = 0; i < files.numChildren(); i++) {
			names.push(folderName(files.getChildAt(i)));
		}
		names.sort();
		return names;
	}

	/*
	One library. Narrowed to particular folders if any were named, which is
	also where a tag that names no folder is caught.
	*/
	function listOneLibrary(library, folders, callback) {
		listAudio(library, function(files) {
			if (Utils.isFatalError(files)) {
				callback(files);
				return;
			}
			tidyAudioListing(files);
			if (folders.length > 0) {
				let names = allFolderNames(files);
				let missing = keepOnlyFolders(files, folders);
				if (missing.length > 0) {
					callback(constructFatalError(
							`list-audio: the ${library} library has no `
							+ `folder called ${missing.join(' or ')}. It has: `
							+ names.join(', ')));
					return;
				}
			}
			callback(files);
		})
	}

	/*
	No library tag means all of them, as one org holding an org per library,
	each tagged with its name. The tag is not decoration: it is the tag you
	need on load-audio to get anything out of that half of the listing.

	The requests go out together and are assembled in a fixed order, so the
	listing does not come back in whichever order the network answered.
	*/
	function listAllLibraries(callback) {
		let names = libraryNames();
		let results = {};
		let waitingFor = names.length;
		let failure = null;
		names.forEach(function(name) {
			listAudio(name, function(files) {
				if (Utils.isFatalError(files)) {
					failure = files;
				} else {
					results[name] = tidyAudioListing(files);
				}
				if (--waitingFor > 0) {
					return;
				}
				if (failure) {
					callback(failure);
					return;
				}
				let all = constructOrg();
				names.forEach(function(name) {
					let library = results[name];
					library.addTag(newTagOrThrowOOM(name, 'list-audio library name'));
					all.appendChild(library);
				});
				callback(all);
			})
		});
	}

	Builtin.createBuiltin(
		'list-audio',
		[ ],
		function $listAudio(env, executionEnvironment, commandTags) {
			let want = readAudioTags(commandTags);
			if (want.error) {
				return constructFatalError(`list-audio: ${want.error}`);
			}
			let deferredValue = constructDeferredValue();
			deferredValue.set(new GenericActivationFunctionGenerator(
				'list-audio', 
				function(callback, deferredValue) {
					if (want.library) {
						listOneLibrary(want.library, want.folders, callback);
					} else {
						listAllLibraries(callback);
					}
				}
			));
			let loadingMessage = constructEError(
					`listing ${want.library ? want.library : 'all'} audio`);
			loadingMessage.setErrorType(ERROR_TYPE_INFO);
			deferredValue.appendChild(loadingMessage)
			deferredValue.activate();
			return deferredValue;
		},
		'Lists the audio libraries: one org per folder, holding the audio files in '
		+ 'it. With no tag you get every library, each as its own org tagged with '
		+ 'its name; tag the command sample or wave to get just that one, and '
		+ 'additionally with a folder name to get just that folder -- a folder tag '
		+ 'needs its library tag alongside it. A name from this listing is what '
		+ 'load-audio takes. Names have no .wav on the end, and every library, '
		+ 'folder and file is tagged with its own name, so a listing can be walked '
		+ 'with dots: bind it to @audio and one sample is @audio.sample.SB-003.Drop_Synth.'
	);

	Builtin.createBuiltin(
		'list-standard-function-files',
		[ ],
		function $listStandardFunctionFiles(env, executionEnvironment) {
			let def = constructDeferredValue();
			def.set(new GenericActivationFunctionGenerator(
				'list-standard-function-files', 
				function(callback, def) {
					listStandardFunctionFiles(function(files) {
						// turn files into an org or whatever
						callback(files);
					})
				}
			));
			let loadingMessage = constructEError(`listing standard function files`);
			loadingMessage.setErrorType(ERROR_TYPE_INFO);
			def.appendChild(loadingMessage)
			def.activate();
			return def;
		},
		'Lists the standard library function files available to all users.'
	);	

	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  	

	Builtin.createBuiltin(
		'load',
		[ '_name' ],
		function $load(env, executionEnvironment) {
			let name = env.lb('name');
			let nametype = name.getTypeName();
			// need to look for illegal filename characters if it's a string?
			let nm = nametype == '-symbol-' ? name.getTypedValue() : name.getFullTypedValue();

			let def = constructDeferredValue();
			def.set(new GenericActivationFunctionGenerator(
				'load', 
				function(callback, def) {
					loadNex(nm, function(loadResult) {
						callback(loadResult);
					})
				}
			));
			let loadingMessage = constructEError(`load file ${nm}`);
			loadingMessage.setErrorType(ERROR_TYPE_INFO);
			def.appendChild(loadingMessage);
			def.activate();
			return def;
		},
		'loads the file |name as a nex/object (parsing it)'
	);
	
	Builtin.createBuiltin(
		'load-raw',
		[ '_name' ],
		function $loadRaw(env, executionEnvironment) {
			let name = env.lb('name');
			let nametype = name.getTypeName();
			// need to look for illegal filename characters if it's a string?
			let nm = nametype == '-symbol-' ? name.getTypedValue() : name.getFullTypedValue();

			let def = constructDeferredValue();
			def.set(new GenericActivationFunctionGenerator(
				'load-raw', 
				function(callback, def) {
					loadRaw(nm, function(loadResult) {
						callback(constructEString(loadResult));
					})
				}
			));
			let loadingMessage = constructEError(`load file ${nm}`);
			loadingMessage.setErrorType(ERROR_TYPE_INFO);
			def.appendChild(loadingMessage)
			def.activate();
			return def;
		},
		'Loads raw bytes from the file |name into a string, and returns it.'
	);


	Builtin.createBuiltin(
		'eval-and-save',
		[ '_name', 'val' ],
		function $evalAndSave(env, executionEnvironment) {
			let val = env.lb('val');
			let name = env.lb('name');

			let nametype = name.getTypeName();
			// need to look for illegal filename characters if it's a string?
			let nm = nametype == '-symbol-' ? name.getTypedValue() : name.getFullTypedValue();


			let def = constructDeferredValue();
			def.set(new GenericActivationFunctionGenerator(
				'save', 
				function(callback, def) {
					saveNex(nm, val, function(saveResult) {
						
						callback(saveResult);
					})
				}
			));
			let savingMessage = constructEError(`save in file ${nm} this data: ${val.prettyPrint()}`);
			savingMessage.setErrorType(ERROR_TYPE_INFO);
			def.appendChild(savingMessage)
			def.activate();
			return def;			

		},
		'saves |val in the file |name (|val is evaluated).'
	);

	Builtin.createBuiltin(
		'save',
		[ '_name', '_val' ],
		function $save(env, executionEnvironment) {

			let val = env.lb('val');

			let name = env.lb('name');
			let nametype = name.getTypeName();
			// need to look for illegal filename characters if it's a string?
			let nm = nametype == '-symbol-' ? name.getTypedValue() : name.getFullTypedValue();

			let def = constructDeferredValue();
			def.set(new GenericActivationFunctionGenerator(
				'save', 
				function(callback, def) {
					saveNex(nm, val, function(saveResult) {
						
						callback(saveResult);
					})
				}
			));
			let savingMessage = constructEError(`save in file ${nm} this data: ${val.prettyPrint()}`);
			savingMessage.setErrorType(ERROR_TYPE_INFO);
			def.appendChild(savingMessage);
			def.activate();
			return def;			
		},
		'Saves |val in the file |name (without evaluating |val).'
	);


	Builtin.createBuiltin(
		'save-raw',
		[ '_name', 'val$'],
		function $saveFile(env, executionEnvironment) {
			let name = env.lb('name');
			let nametype = name.getTypeName();
			// need to look for illegal filename characters if it's a string?
			let nm = nametype == '-symbol-' ? name.getTypedValue() : name.getFullTypedValue();

			let val = env.lb('val');
			let saveval = val.getFullTypedValue();

			let def = constructDeferredValue();
			def.set(new GenericActivationFunctionGenerator(
				'save-string-as', 
				function(callback, def) {
					saveRaw(nm, saveval, function(saveResult) {
						callback(saveResult);
					})
				}
			));
			let savingMessage = constructEError(`save in file ${nm} this data: ${val}`);
			savingMessage.setErrorType(ERROR_TYPE_INFO);
			def.appendChild(savingMessage);
			def.activate();
			return def;
		},
		'Saves the raw bytes of string |val in the file |name.'
	);


	Builtin.createBuiltin(
		'import',
		[ '_name' ],
		function $import(env, executionEnvironment) {
			let name = env.lb('name');
			let nametype = name.getTypeName();
			// need to look for illegal filename characters if it's a string?
			let nm = nametype == '-symbol-' ? name.getTypedValue() : name.getFullTypedValue();

			let def = constructDeferredValue();
			def.set(new GenericActivationFunctionGenerator(
				'import', 
				function(callback, def) {
					importNex(nm, function(importResult) {
						callback(importResult);
					})
				}
			));
			let importMessage = constructEError(`import package ${nm}`);
			importMessage.setErrorType(ERROR_TYPE_INFO);
			def.appendChild(importMessage)
			def.activate();
			return def;
		},
		'Imports the package in file |name, loading the file and binding the package contents into memory.'
	);



	// Before you go renaming the "package" builtin to something else!
	// the name of this builtin is hardcoded into servercommunication.js
	// idk if there is a better way, but be aware.
	Builtin.createBuiltin(
		'package',
		[ '_name@', '_block...' ],
		function $package(env, executionEnvironment) {

			/*
			okay so the package thing is a special form basically.
			this means that the rules here are different. We always
			treat this as if it was a deferred command, so we look at
			the return value for each expression. If it's deferred,
			we wait for it to resolve before moving on to the next one.

			Additionally: we should create a new scope,
			not for the purposes of using "let" but so that we could
			associate with that scope a package name.
			that way imported packages don't interfere with the package here,
			we get a stack of package names by default.

			Finally, what do we return? Let's just always return a deferred
			value. It resolves when all the different imports happen and
			the package is finished being created. Since a package
			statement will frequently import things, it is more or less
			by definition the same type of builtin as a file loading builtin.

			this means that if you do crazy shit like trying to use package
			or import statements inside lambdas, you get what you get.
			The system is designed to be used in this sensible way,
			results are undefined if you go outside of that.

			*/

			let packageName = env.lb('name').getTypedValue();
			let lst = env.lb('block');

			let packageScope = executionEnvironment.pushEnv(); // popped
			packageScope.setPackageForBinding(packageName);
			packageScope.usePackage(packageName);

			let nextArgToEval = 0;

			let deferredCallback = null;

			let packageStatements = [];
			for (let i = 0; i < lst.numChildren(); i++) {
				packageStatements.push(lst.getChildAt(i));
			}

			let notifyCallback = function() {
				evalNextArg();
			};

			let evalNextArg = function() {
				for( ; nextArgToEval < packageStatements.length ; nextArgToEval++) {
					let c = packageStatements[nextArgToEval];
					let result = sAttach(evaluateNexSafely(c, packageScope));
					if (Utils.isDeferredValue(result)) {
						packageStatements[nextArgToEval] = result;
						result.addListener({
							notify: notifyCallback
						});
						return;
					}
					if (Utils.isFatalError(result)) {
						let err = wrapError('&szlig;', `package: error returned from expression ${nextArgToEval+2}`, result);
						packageScope.finalize();
						deferredCallback(err);
						return;
					}
				}
				if (nextArgToEval == packageStatements.length) {
					let message = constructEError(`successfully created package.`);
					message.setErrorType(ERROR_TYPE_INFO);
					packageScope.finalize();
					deferredCallback(message);
				}
			}

			let r = constructDeferredValue();
			r.set(new GenericActivationFunctionGenerator(
				'package', 
				function(callback, def) {
					deferredCallback = callback;
					evalNextArg();
				}
			));
			let message = constructEError(`creating package`);
			message.setErrorType(ERROR_TYPE_INFO);
			r.appendChild(message)
			r.activate();
			return r;
		},
		'Defines a package. All args in |block are evaluated, and any bindings are bound with |name as their package scope identifier.'
	);

	Builtin.createBuiltin(
		'normal-mode',
		[ 'nex' ],
		function $normalMode(env, executionEnvironment) {
			let nex = env.lb('nex');
			nex.setModeHint(RENDER_MODE_NORM);
			let nodes = nex.getRenderNodes();
			nodes.forEach(node => setRenderMode(RENDER_MODE_NORM));
			return nex;
		},
		'Sets the mode hint for nex so that it will render as normal by default.'
	);	

	Builtin.createBuiltin(
		'exploded-mode',
		[ 'nex' ],
		function $explodedMode(env, executionEnvironment) {
			let nex = env.lb('nex');
			nex.setModeHint(RENDER_MODE_EXPLO);
			let nodes = nex.getRenderNodes();
			nodes.forEach(node => setRenderMode(RENDER_MODE_EXPLO));
			return nex;
		},
		'Sets the mode hint for nex so that it will render as exploded by default.'
	);	

}

export { createFileBuiltins }

