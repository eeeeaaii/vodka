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

import * as Utils from './utils.js';

import { systemState } from './systemstate.js'
import { Nex } from './nex/nex.js'; 
import { NexContainer } from './nex/nexcontainer.js'; 
import { ValueNex } from './nex/valuenex.js'; 
import { Bool } from './nex/bool.js'; 
import { Builtin } from './nex/builtin.js'; 
import { Closure } from './nex/closure.js'; 
import { Command } from './nex/command.js'; 
import { Doc } from './nex/doc.js'; 
import { EError } from './nex/eerror.js'; 
import { EString } from './nex/estring.js'; 
import { ESymbol } from './nex/esymbol.js'; 
import { Expectation } from './nex/expectation.js'; 
import { Float } from './nex/float.js'; 
import { InsertionPoint } from './nex/insertionpoint.js'; 
import { Integer } from './nex/integer.js'; 
import { Lambda } from './nex/lambda.js'; 
import { Letter } from './nex/letter.js'; 
import { Line } from './nex/line.js'; 
import { NativeOrg } from './nex/nativeorg.js'; 
import { Newline } from './nex/newline.js'; 
import { Nil } from './nex/nil.js'; 
import { Org } from './nex/org.js'; 
import { Root } from './nex/root.js'; 
import { Separator } from './nex/separator.js'; 
import { Word } from './nex/word.js'; 
import { Zlist } from './nex/zlist.js'; 
import { ContextType } from './contexttype.js'
import { manipulator } from './manipulator.js'
import { RenderNode } from './rendernode.js'; 
import { evaluateAndReplace, evaluateAndKeep, evaluateAndCopy } from './evaluator.js';
import { UNHANDLED_KEY } from './globalconstants.js'
import { experiments } from './globalappflags.js'

// V2_INSERTION
import {
	INSERT_UNSPECIFIED,
	INSERT_AFTER,
	INSERT_BEFORE,
	INSERT_INSIDE,
	INSERT_AROUND
} from './rendernode.js'


function insertOrAppend(s, obj) {
	if (s.hasChildren()) {
		return manipulator.insertAfterSelectedAndSelect(obj);
	} else {
		return manipulator.appendAndSelect(obj);
	}
}

// V2_INSERTION

function V2_INSERT_insertAfterSelectedShim(n) {
	if (experiments.V2_INSERTION) {
		return manipulator.defaultInsertForV2(manipulator.selected(), n)
	} else {
		return manipulator.insertAfterSelectedAndSelect(n);
	}
}

function V2_INSERT_appendAndSelectShim(n) {
	if (experiments.V2_INSERTION) {
		return manipulator.defaultInsertForV2(manipulator.selected(), n)
	} else {
		return manipulator.appendAndSelect(manipulator.newLetter(txt));
	}
}


function isNormallyHandled(key) {
	if (!(/^.$/.test(key))) {
		return true;
	}
	if (/^[~!@#$%`^*&)([{]$/.test(key)) {
		return true;
	}
	return false;
}

// All of these are to some extent deprecated:
// to be replaced with editors or more generic handlers.
// Return the string of the function you want from getDefaultHandler.
// Part of my motive for collecting this here is so I can see
// the similarities and differences and try to refactor this better:
// there is too much similarity across all the different nexes
// w/r/t how these work.

// 8/8/2020 another good reason to have these here is to get rid of
// circular dependencies arising from Nex modules depending directly
// on Manipulator

const DefaultHandlers = {
	'zlistDefault': function(nex, txt, context) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let isCommand = (context == ContextType.COMMAND);
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);
		if (isSeparator) {
			V2_INSERT_insertAfterSelectedShim(manipulator.newSeparator(txt));
		} else {
			if (isCommand) {
				if (nex.hasChildren()) {
					V2_INSERT_insertAfterSelectedShim(manipulator.newLetter(txt));
				} else {
					V2_INSERT_appendAndSelectShim(manipulator.newLetter(txt));
				}							
			} else {
				V2_INSERT_appendAndSelectShim(manipulator.newLetter(txt));
			}
		}
		return true;
	},

	'orgDefault': function(nex, txt, context) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let isCommand = (context == ContextType.COMMAND);
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);
		if (isSeparator) {
			V2_INSERT_insertAfterSelectedShim(manipulator.newSeparator(txt));
		} else {
			if (isCommand) {
				if (nex.hasChildren()) {
					V2_INSERT_insertAfterSelectedShim(manipulator.newLetter(txt));
				} else {
					V2_INSERT_appendAndSelectShim(manipulator.newLetter(txt));
				}							
			} else {
				V2_INSERT_appendAndSelectShim(manipulator.newLetter(txt));
			}
		}
		return true;
	},

	'nilDefault': function(nex, txt) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);

		if (isSeparator) {
			V2_INSERT_insertAfterSelectedShim(manipulator.newSeparator(txt))
		} else {
			let w = manipulator.newWord();
			w.appendChild(manipulator.newLetter(txt));
			V2_INSERT_insertAfterSelectedShim(w);
			w.setSelected();
		}
		return true;
	},

	// this is not a new version of lineDefault!
	// it's newlines. Which are deprecated anyway.
	'newlineDefault': function(nex, txt, context) {
		if (experiments.V2_INSERTION) throw new Error('bad');
		if (isNormallyHandled(txt)) {
			return false;
		}
		let isCommand = (context == ContextType.COMMAND);
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);
		if (isSeparator) {
			V2_INSERT_insertAfterSelectedShim(manipulator.newSeparator(txt));
		} else {
			if (isCommand) {
				V2_INSERT_insertAfterSelectedShim(manipulator.newLetter(txt));
			} else {
				let newword = manipulator.newWord();
				let newletter = manipulator.newLetter(txt);
				newword.appendChild(newletter);
				V2_INSERT_insertAfterSelectedShim(newword);
				manipulator.joinToSiblingIfSame(newword);
				newletter.setSelected();
			}
		}
		return true;
	},

	'lineDefault': function(nex, txt) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);
		if (experiments.V2_INSERTION) {
			if (isSeparator) {
				manipulator.insertSeparatorFromLineV2(manipulator.newSeparator(txt), manipulator.selected())
			} else {
				manipulator.insertLetterFromLineV2(manipulator.newLetter(txt), manipulator.selected())
			}
			return true;
		}


		if (isSeparator) {
			V2_INSERT_appendAndSelectShim(manipulator.newSeparator(txt));
		} else {
			if (manipulator.selectLastChild()) {
				selectedNex.appendChild(manipulator.newLetter(txt));
			} else {
				let w = manipulator.newWord();
				let lett = manipulator.newLetter(txt);
				w.appendChild(lett);
				V2_INSERT_appendAndSelectShim(w);
				if (experiments.V2_INSERTION) {
					lett.setSelected();
				}

			}
		}
		return true;
	},

	'integerDefault': function(nex, txt, context, sourcenode) {
		if (txt == 'Backspace') {
			if (nex.value == '0') {
				if (experiments.V2_INSERTION) {
					KeyResponseFunctions['remove-selected-and-select-previous-sibling-v2'](sourcenode);
				} else {
					KeyResponseFunctions['remove-selected-and-select-previous-leaf'](sourcenode);
				}
			} else {
				nex.deleteLastLetter();
			}
			return true;
		}
		if (isNormallyHandled(txt)) {
			return false;
		}
		let okRegex = /^[0-9-]$/;
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);
		if (okRegex.test(txt)) {
			nex.appendText(txt);
		} else if (isSeparator) {
			V2_INSERT_insertAfterSelectedShim(manipulator.newSeparator(txt));
		} else {
			if (experiments.V2_INSERTION) {
				manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newLetter(txt));
			} else {
				V2_INSERT_insertAfterSelectedShim(manipulator.newWord())
					&& V2_INSERT_appendAndSelectShim(manipulator.newLetter(txt));				
			}
		}
		return true;
	},

	'insertionPointDefault': function(nex, txt, context, sourcenode) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);

		let parent = sourcenode.getParent();

		if (isSeparator) {
			if (Utils.isWord(parent)) {
				manipulator.selectParent()
					&& V2_INSERT_insertAfterSelectedShim(manipulator.newSeparator(txt))
					&& manipulator.removeNex(sourcenode);
			} else {
				manipulator.replaceSelectedWith(manipulator.newSeparator(txt));		
			}
		} else {
			if (Utils.isDoc(parent)) {
				let ln = manipulator.newLine();
				let w = manipulator.newWord();
				let lt = manipulator.newLetter(txt);
				ln.appendChild(w);
				w.appendChild(lt);
				manipulator.replaceSelectedWith(ln);
				lt.setSelected();
			} else if (Utils.isLine(parent)) {
				let w = manipulator.newWord();
				let lt = manipulator.newLetter(txt);
				w.appendChild(lt);
				manipulator.replaceSelectedWith(w);
				lt.setSelected();
			} else {			
				manipulator.replaceSelectedWith(manipulator.newLetter(txt));
			}
		}
		return true;
	},

	'floatDefault': function(nex, txt, context, sourcenode) {
		if (txt == 'Backspace') {
			// do backspace hack
			if (nex.value == '0') {
				if (experiments.V2_INSERTION) {
					KeyResponseFunctions['remove-selected-and-select-previous-leaf-v2'](sourcenode);
				} else {
					KeyResponseFunctions['remove-selected-and-select-previous-leaf'](sourcenode);
				}
			} else {
				nex.deleteLastLetter();
			}
			return true;
		}
		if (isNormallyHandled(txt)) {
			return false;
		}
		let okRegex = /^[e0-9.-]$/;
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);
		if (okRegex.test(txt)) {
			nex.appendText(txt);
		} else if (isSeparator) {
			V2_INSERT_insertAfterSelectedShim(manipulator.newSeparator(txt));
		} else {

			if (experiments.V2_INSERTION) {
				manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newLetter(txt));
			} else {
				V2_INSERT_insertAfterSelectedShim(manipulator.newWord())
					&& V2_INSERT_appendAndSelectShim(manipulator.newLetter(txt));				
			}
		}
		return true;
	},

	'expectationDefault': function(nex, txt) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);

		let toInsert = null;
		if (isSeparator) {
			toInsert = manipulator.newSeparator(txt);
		} else {
			toInsert = manipulator.newLetter(txt);
		}
		if (nex.hasChildren()) {
			V2_INSERT_insertAfterSelectedShim(toInsert)
		} else {
			V2_INSERT_appendAndSelectShim(toInsert);
		}
		return true;
	},

	'insertOrAddToESymbol': function(nex, txt) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let allowedKeyRegex = /^[a-zA-Z0-9-_:]$/;
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);

		if (allowedKeyRegex.test(txt)) {
			nex.appendText(txt);
		} else if (isSeparator) {
			V2_INSERT_insertAfterSelectedShim(manipulator.newSeparator(txt));
		} else {

			if (experiments.V2_INSERTION) {
				manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newLetter(txt));
			} else {
				V2_INSERT_insertAfterSelectedShim(manipulator.newWord())
					&& V2_INSERT_appendAndSelectShim(manipulator.newLetter(txt));				
			}

		}
		return true;
	},

	'insertAfterEString': function(nex, txt) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);

		if (isSeparator) {
			V2_INSERT_insertAfterSelectedShim(manipulator.newSeparator(txt))
		} else {
			if (experiments.V2_INSERTION) {
				manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newLetter(txt));
			} else {
				V2_INSERT_insertAfterSelectedShim(manipulator.newWord())
					&& V2_INSERT_appendAndSelectShim(manipulator.newLetter(txt));				
			}
		}		
	},

	'insertAfterEError': function(nex, txt) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);

		if (isSeparator) {
			V2_INSERT_insertAfterSelectedShim(manipulator.newSeparator(txt))
		} else {
			if (experiments.V2_INSERTION) {
				manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newLetter(txt));
			} else {
				V2_INSERT_insertAfterSelectedShim(manipulator.newWord())
					&& V2_INSERT_appendAndSelectShim(manipulator.newLetter(txt));				
			}
		}
		return true;
	},

	// this is the default V2_INSERTION for all code objects!
	'justAppendLetterOrSeparator': function(nex, txt) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);
		if (isSeparator) {
			V2_INSERT_appendAndSelectShim(manipulator.newSeparator(txt))
		} else {
			V2_INSERT_appendAndSelectShim(manipulator.newLetter(txt))
		}
		return true;
	},

	'insertAfterCommandTabHack': function(nex, txt, context) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let isLetterRegex = /^.$/;
		if (isLetterRegex.test(txt)) {
			if (nex.hasChildren()) {
				V2_INSERT_insertAfterSelectedShim(manipulator.newLetter(txt))
			} else {
				V2_INSERT_appendAndSelectShim(manipulator.newLetter(txt));
			}
		}
		return true;
	},

	// V2_INSERTION only
	// EVERYTHING SHOULD MIGRATE SLOWLY TO THIS.
	'standardDefault': function(nex, txt, context) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let singleCharRegex = /^.$/;
		if (!singleCharRegex.test(txt)) {
			return false;
		}
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);

		if (isSeparator) {
			manipulator.insertAtSelectedObjInsertionPoint(manipulator.newSeparator(txt));
		} else {
			manipulator.insertAtSelectedObjInsertionPoint(manipulator.newLetter(txt));
		}
		return true;
	},

	'insertAfterCommand': function(nex, txt, context) {
		if (txt != '*' && isNormallyHandled(txt)) {
			return false;
		}
		let allowedKeyRegex = /^[a-zA-Z0-9-_=+/*<>:]$/;
		let isLetterRegex = /^.$/;
		if (allowedKeyRegex.test(txt)) {
			nex.appendCommandText(txt);
		} else if (isLetterRegex.test(txt)) {
			if (nex.hasChildren()) {
				V2_INSERT_insertAfterSelectedShim(manipulator.newLetter(txt))
			} else {
				V2_INSERT_appendAndSelectShim(manipulator.newLetter(txt));
			}
		}
		return true;
	},

	'insertAtLetterLevel': function(nex, txt, context) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		// zlists are experimental I guess?
		if (txt == '<') {
			return false;
		}
		let inWord = (context == ContextType.WORD);
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);
		if (isSeparator) {
			if (inWord) {
				if (experiments.V2_INSERTION) {
					manipulator.insertSeparatorBeforeOrAfterSelectedLetter(manipulator.newSeparator(txt));
				} else {
					KeyResponseFunctions['split-word-and-insert-separator'](txt);
				}
			} else {
				V2_INSERT_insertAfterSelectedShim(manipulator.newSeparator(txt));				
			}
		} else {
			V2_INSERT_insertAfterSelectedShim(manipulator.newLetter(txt));
		}
		return true;
	},

	'insertAtSeparatorLevel': function (nex, txt, context) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let isLine = (context == ContextType.LINE)
		if (!(/^.$/.test(txt))) {
			throw UNHANDLED_KEY;
		};
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);
		if (isSeparator) {
			V2_INSERT_insertAfterSelectedShim(manipulator.newSeparator(txt));
		} else {
			if (isLine) {
				if (experiments.V2_INSERTION) {
					let newword = manipulator.newWord();
					let newletter = manipulator.newLetter(txt);
					newword.appendChild(newletter);
					V2_INSERT_insertAfterSelectedShim(newword);
					manipulator.joinToSiblingIfSame(newword);
					newletter.setSelected();
				} else {
					KeyResponseFunctions['insert-letter-after-separator'](txt);
				}
			} else {
				V2_INSERT_insertAfterSelectedShim(manipulator.newLetter(txt));
			}
		}
		return true;
	},

	'insertAtWordLevel' : function(nex, txt) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);
		if (isSeparator) {
			V2_INSERT_insertAfterSelectedShim(manipulator.newSeparator(txt));
		} else {
			if (manipulator.selectLastChild()) {
				V2_INSERT_insertAfterSelectedShim(manipulator.newLetter(txt));
			} else {
				V2_INSERT_appendAndSelectShim(manipulator.newLetter(txt))
			}
		}
		return true;
	},

	'modifyBoolOrInsert' : function(nex, txt) {
		// old behavior is that you can't put a boolean inside a word,
		// so it automatically makes a new word -- except you can, with things
		// like cut and paste, and it should be possible anyway.
		if (isNormallyHandled(txt)) {
			return false;
		}
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);

		if (isSeparator) {
			V2_INSERT_insertAfterSelectedShim(manipulator.newSeparator(txt));
		} else if (txt == 'y' || txt == 'Y') {
			nex.setValue('yes');
		} else if (txt == 'n' || txt == 'N') {
			nex.setValue('no');
		} else {
			let letter = manipulator.newLetter(txt);
			V2_INSERT_insertAfterSelectedShim(manipulator.newWord())
				&& V2_INSERT_appendAndSelectShim(letter);

		}
		return true;
	},

	'docHandle' : function(nex, txt) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);
		if (isSeparator) {
			KeyResponseFunctions['append-separator-to-doc'](txt);
		} else {
			KeyResponseFunctions['append-letter-to-doc'](txt);
		}
		return true;
	}
}

const KeyResponseFunctions = {
	// if we make generator functions, like insert-or-append(thing) instead of
	// insert-or-append-command, we have to make it so that we don't accidentally
	// end up constructing the object once and trying to reinsert it.
	// Currently the nexes recreate their key funnel vector every time a key is pressed,
	// but that's obviously inefficient and user created nexes might not do that.

	// movement
	'move-left-up': function(s) {
		manipulator.selectPreviousSibling()
			||  manipulator.insertBeforeSelectedAndSelect(new InsertionPoint());
	},
	'move-right-down': function(s) {
		manipulator.selectNextSibling()
			|| manipulator.insertAfterSelectedAndSelect(new InsertionPoint());
	},
	'move-to-previous-leaf': function(s) {		
		manipulator.selectPreviousLeaf()
			||  manipulator.insertBeforeSelectedAndSelect(new InsertionPoint());
	},
	'move-to-next-leaf': function(s) {		
		manipulator.selectNextLeaf()
			||  manipulator.insertAfterSelectedAndSelect(new InsertionPoint());
	},

	'select-next-sibling': function(s) {
		manipulator.selectNextSibling();
	},

	'evaluate-nex': function(s) {
		evaluateAndReplace(s);
	},

	'evaluate-nex-and-keep': function(s) {
		evaluateAndKeep(s);
	},

	'evaluate-and-copy': function(s) {
		evaluateAndCopy(s);
	},

	'toggle-dir': function(s) {
		s.getNex().toggleDir();
	},

	'toggle-exploded': function(s) {
		s.toggleExplodedOverride();
	},

	'select-parent': function(s) { manipulator.selectParent(); },

	'select-first-child-or-create-insertion-point': function(s) {
		if (!manipulator.selectFirstChild()) {
			return manipulator.appendAndSelect(new InsertionPoint());
		} else return true;
	},

	'select-first-child-or-fail': function(s) { manipulator.selectFirstChild(); },

	'select-parent-and-remove-self': function(s) { manipulator.selectParent() && manipulator.removeNex(s); },

	'start-modal-editing': function(s) {
		s.getNex().startModalEditing();
	},

	'return-exp-child': function(s) {
		manipulator.replaceSelectedWithFirstChildOfSelected();
	},

	'autocomplete': function(s) {
		s.getNex().autocomplete();
	},

	'no-op': function(s) {},

	'start-main-editor': function(s) { s.possiblyStartMainEditor(); },


	// BEGIN V2_INSERTION

	'evaluate-v2': function(s) {
		evaluateAndReplace(s);
	},

	// deletes

	'delete-letter-v2': function(s) {
		manipulator.deleteLeafV2(s);
	},

	'delete-separator-v2': function(s) {
		manipulator.deleteLeafV2(s);
	},

	'delete-line-v2': function(s) {
		manipulator.deleteLineV2(s);
	},

	'remove-selected-and-select-previous-leaf-v2': function(s) {
		manipulator.removeSelectedAndSelectPreviousLeafV2(s);
	},

	'remove-selected-and-select-previous-sibling-v2': function(s) {
		manipulator.removeAndSelectPreviousSiblingV2(s);
	},

	'delete-last-letter-or-remove-selected-and-select-previous-leaf-v2': function(s) {
		if (!s.getNex().isEmpty()) {
			s.getNex().deleteLastLetter();
		} else {
			manipulator.removeSelectedAndSelectPreviousLeafV2(s);
		}
	},

	// movement


	'move-left-up-v2': function(s) {
		manipulator.moveLeftUpV2(s);
	},

	'move-right-down-v2': function(s) {
		manipulator.moveRightDownV2(s);
	},

	'move-to-previous-leaf-v2': function(s) {
		manipulator.selectPreviousLeafV2(s);
	},
	'move-to-next-leaf-v2': function(s) {		
		manipulator.selectNextLeafV2(s);
	},

	'select-first-child-or-force-insert-inside-insertion-mode': function(s) {
		manipulator.selectFirstChildOrMoveInsertionPoint(s);
	},

	// line breaks

	'do-line-break-always-v2': function(s) {
		manipulator.doLineBreakAlwaysV2(s);
	},

	'do-line-break-from-line-v2': function(s) {
		manipulator.doLineBreakForLine(s);
	},


	'do-line-break-for-letter-v2': function(s) {
		manipulator.doLineBreakForLetter(s);
	},

	'do-line-break-for-separator-v2': function(s) {
		manipulator.doLineBreakForSeparator(s);
	},

	'move-to-corresponding-letter-in-previous-line-v2': function(s) {
		manipulator.selectCorrespondingLetterInPreviousLineV2(s)
//			 || manipulator.selectPreviousSibling()
//			 ||  manipulator.forceInsertionModeForSelected(INSERT_BEFORE)
			;
	},
	'move-to-corresponding-letter-in-next-line-v2': function(s) {
		manipulator.selectCorrespondingLetterInNextLineV2(s)
//			 || manipulator.selectNextSibling()
//			 ||  manipulator.forceInsertionModeForSelected(INSERT_AFTER)
			;
	},

	'insert-command-at-insertion-point-v2': function(s) { manipulator.defaultInsertForV2(s, manipulator.newCommand()); },
	'insert-bool-at-insertion-point-v2': function(s) { manipulator.defaultInsertForV2(s, manipulator.newBool()); },
	'insert-symbol-at-insertion-point-v2': function(s) { manipulator.defaultInsertForV2(s, manipulator.newESymbol()); },
	'insert-integer-at-insertion-point-v2': function(s) { manipulator.defaultInsertForV2(s, manipulator.newInteger()); },
	'insert-string-at-insertion-point-v2': function(s) { manipulator.defaultInsertForV2(s, manipulator.newEString()); },
	'insert-float-at-insertion-point-v2': function(s) { manipulator.defaultInsertForV2(s, manipulator.newFloat()); },
	'insert-nil-at-insertion-point-v2': function(s) { manipulator.defaultInsertForV2(s, manipulator.newNil()); },
	'insert-lambda-at-insertion-point-v2': function(s) { manipulator.defaultInsertForV2(s, manipulator.newLambda()); },
	'insert-expectation-at-insertion-point-v2': function(s) { manipulator.defaultInsertForV2(s, manipulator.newExpectation()); },
	'insert-word-at-insertion-point-v2': function(s) { manipulator.defaultInsertForV2(s, manipulator.newWord()); },
	'insert-line-at-insertion-point-v2': function(s) { manipulator.defaultInsertForV2(s, manipulator.newLine()); },
	'insert-doc-at-insertion-point-v2': function(s) { manipulator.defaultInsertForV2(s, manipulator.newDoc()); },
	'insert-org-at-insertion-point-v2': function(s) { manipulator.defaultInsertForV2(s, manipulator.newOrg()); },
	'insert-zlist-at-insertion-point-v2': function(s) { manipulator.defaultInsertForV2(s, manipulator.newZlist()); },
	// END V2_INSERTION


	'replace-selected-with-command': function(s) { manipulator.replaceSelectedWith(manipulator.newCommand()); },
	'replace-selected-with-bool': function(s) { manipulator.replaceSelectedWith(manipulator.newBool()); },
	'replace-selected-with-symbol': function(s) { manipulator.replaceSelectedWith(manipulator.newESymbol()); },
	'replace-selected-with-integer': function(s) { manipulator.replaceSelectedWith(manipulator.newInteger()); },
	'replace-selected-with-string': function(s) { manipulator.replaceSelectedWith(manipulator.newEString()); },
	'replace-selected-with-float': function(s) { manipulator.replaceSelectedWith(manipulator.newFloat()); },
	'replace-selected-with-nil': function(s) { manipulator.replaceSelectedWith(manipulator.newNil()); },
	'replace-selected-with-lambda': function(s) { manipulator.replaceSelectedWith(manipulator.newLambda()); },
	'replace-selected-with-expectation': function(s) { manipulator.replaceSelectedWith(manipulator.newExpectation()); },
	'replace-selected-with-word': function(s) { manipulator.replaceSelectedWith(manipulator.newWord()); },
	'replace-selected-with-line': function(s) { manipulator.replaceSelectedWith(manipulator.newLine()); },
	'replace-selected-with-doc': function(s) { manipulator.replaceSelectedWith(manipulator.newDoc()); },
	'replace-selected-with-org': function(s) { manipulator.replaceSelectedWith(manipulator.newOrg()); },

	'add-tag': function(s) { s.startTagEditor(); },
	'remove-all-tags': function(s) { s.removeAllTags(); },

	'insert-or-append-command': function(s) { insertOrAppend(s, manipulator.newCommand()); },
	'insert-or-append-bool': function(s) { insertOrAppend(s, manipulator.newBool()); },
	'insert-or-append-symbol': function(s) { insertOrAppend(s, manipulator.newESymbol()); },
	'insert-or-append-integer': function(s) { insertOrAppend(s, manipulator.newInteger()); },
	'insert-or-append-string': function(s) { insertOrAppend(s, manipulator.newEString()); },
	'insert-or-append-float': function(s) { insertOrAppend(s, manipulator.newFloat()); },
	'insert-or-append-nil': function(s) { insertOrAppend(s, manipulator.newNil()); },
	'insert-or-append-lambda': function(s) { insertOrAppend(s, manipulator.newLambda()); },
	'insert-or-append-expectation': function(s) { insertOrAppend(s, manipulator.newExpectation()); },
	'insert-or-append-word': function(s) { insertOrAppend(s, manipulator.newWord()); },
	'insert-or-append-line': function(s) { insertOrAppend(s, manipulator.newLine()); },
	'insert-or-append-doc': function(s) { insertOrAppend(s, manipulator.newDoc()); },
	'insert-or-append-org': function(s) { insertOrAppend(s, manipulator.newOrg()); },

	'insert-command-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(manipulator.newCommand()); },
	'insert-bool-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(manipulator.newBool()); },
	'insert-symbol-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(manipulator.newESymbol()); },
	'insert-integer-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(manipulator.newInteger()); },
	'insert-string-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(manipulator.newEString()); },
	'insert-float-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(manipulator.newFloat()); },
	'insert-nil-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(manipulator.newNil()); },
	'insert-lambda-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(manipulator.newLambda()); },
	'insert-expectation-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(manipulator.newExpectation()); },
	'insert-word-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(manipulator.newWord()); },
	'insert-line-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(manipulator.newLine()); },
	'insert-doc-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(manipulator.newDoc()); },
	'insert-zlist-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(manipulator.newZlist()); },
	'insert-org-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(manipulator.newOrg()); },


	'wrap-in-command': function(s) { manipulator.wrapSelectedInAndSelect(manipulator.newCommand()); },
	'wrap-in-lambda': function(s) { manipulator.wrapSelectedInAndSelect(manipulator.newLambda()); },
	'wrap-in-expectation': function(s) { manipulator.wrapSelectedInAndSelect(manipulator.newExpectation()); },
	'wrap-in-word': function(s) { manipulator.wrapSelectedInAndSelect(manipulator.newWord()); },
	'wrap-in-line': function(s) { manipulator.wrapSelectedInAndSelect(manipulator.newLine()); },
	'wrap-in-doc': function(s) { manipulator.wrapSelectedInAndSelect(manipulator.newDoc()); },
	'wrap-in-org': function(s) { manipulator.wrapSelectedInAndSelect(manipulator.newOrg()); },


	// WIP
	'insert-type-as-next-sibling': function(s) {
		manipulator.insertAfterSelectedAndSelect(new Type());
	},

	'split-word-and-insert-separator': function(s) {
		manipulator.splitCurrentWordIntoTwo()
			&& manipulator.selectParent()
			&& manipulator.insertAfterSelectedAndSelect(manipulator.newSeparator(s));
	},

	'remove-separator-and-possibly-join-words': function(s) {
		manipulator.removeSelectedAndSelectPreviousLeaf();
		let p = systemState.getGlobalSelectedNode().getParent();
		manipulator.joinToSiblingIfSame(p);
	},

	// previously, inserting code objects in doc mode from a letter would append them to
	// the parent in a weird way.
	// all deprecated
	'legacy-insert-command-as-next-sibling-of-parent': function(s) { manipulator.selectParent() && manipulator.insertAfterSelectedAndSelect(manipulator.newCommand()); },
	'legacy-insert-bool-as-next-sibling-of-parent': function(s) { manipulator.selectParent() && manipulator.insertAfterSelectedAndSelect(manipulator.newBool()); },
	'legacy-insert-symbol-as-next-sibling-of-parent': function(s) { manipulator.selectParent() && manipulator.insertAfterSelectedAndSelect(manipulator.newESymbol()); },
	'legacy-insert-integer-as-next-sibling-of-parent': function(s) { manipulator.selectParent() && manipulator.insertAfterSelectedAndSelect(manipulator.newInteger()); },
	'legacy-insert-string-as-next-sibling-of-parent': function(s) { manipulator.selectParent() && manipulator.insertAfterSelectedAndSelect(manipulator.newEString()); },
	'legacy-insert-float-as-next-sibling-of-parent': function(s) { manipulator.selectParent() && manipulator.insertAfterSelectedAndSelect(manipulator.newFloat()); },
	'legacy-insert-nil-as-next-sibling-of-parent': function(s) { manipulator.selectParent() && manipulator.insertAfterSelectedAndSelect(manipulator.newNil()); },
	'legacy-insert-lambda-as-next-sibling-of-parent': function(s) { manipulator.selectParent() && manipulator.insertAfterSelectedAndSelect(manipulator.newLambda()); },
	'legacy-insert-expectation-as-next-sibling-of-parent': function(s) { manipulator.selectParent() && manipulator.insertAfterSelectedAndSelect(manipulator.newExpectation()); },


	'insert-letter-after-separator': function(s) {
		let newword = manipulator.newWord();
		let newletter = manipulator.newLetter(s);
		newword.appendChild(newletter);
		manipulator.insertAfterSelectedAndSelect(newword);
		manipulator.joinToSiblingIfSame(newword);
		newletter.setSelected();
	},

	'move-to-previous-leaf-and-remove-self': function(s) {		
		manipulator.selectPreviousLeaf()
		&& manipulator.removeNex(s);
	},
	'move-to-next-leaf-and-remove-self': function(s) {		
		manipulator.selectNextLeaf()
		&& manipulator.removeNex(s);
	},
	'move-to-corresponding-letter-in-previous-line': function(s) {
		manipulator.selectCorrespondingLetterInPreviousLine()
			 || manipulator.selectPreviousSibling()
			 ||  manipulator.insertBeforeSelectedAndSelect(new InsertionPoint())
			;
	},
	'move-to-corresponding-letter-in-next-line': function(s) {
		manipulator.selectCorrespondingLetterInNextLine()
			 || manipulator.selectNextSibling()
			 ||  manipulator.insertAfterSelectedAndSelect(new InsertionPoint())
			;
	},


	// this is doc-specific, will go away once we have classes
	'append-letter-to-doc': function(s) {
		manipulator.selectLastChild()
			|| manipulator.appendAndSelect(manipulator.newLine());
		manipulator.selectLastChild()
			|| manipulator.appendAndSelect(manipulator.newWord());
		if (manipulator.selectLastChild()) {
			manipulator.insertAfterSelectedAndSelect(manipulator.newLetter(s));
		} else {
			manipulator.appendAndSelect(manipulator.newLetter(s))
		}
	},

	'append-separator-to-doc': function(s) {
		manipulator.selectLastChild()
			|| manipulator.appendAndSelect(manipulator.newLine());
		manipulator.appendAndSelect(manipulator.newSeparator(s));
	},

	'call-delete-handler-then-remove-selected-and-select-previous-sibling': function(s) {
		s.getNex().callDeleteHandler();
		manipulator.removeSelectedAndSelectPreviousSibling();
	},

	'remove-selected-and-select-previous-sibling': function(s) {
		manipulator.removeSelectedAndSelectPreviousSibling();
	},

	'delete-last-command-letter-or-remove-selected-and-select-previous-sibling': function(s) {
		if (!s.getNex().isEmpty()) {
			s.getNex().deleteLastCommandLetter();
		} else {
			manipulator.removeSelectedAndSelectPreviousSibling();
		}
	},

	'delete-last-amp-letter-or-remove-selected-and-select-previous-sibling': function(s) {
		if (!s.getNex().isEmpty()) {
			s.getNex().deleteLastAmpLetter();
		} else {
			manipulator.removeSelectedAndSelectPreviousSibling();
		}
	},

	'delete-last-letter-or-remove-selected-and-select-previous-leaf': function(s) {
		if (!s.getNex().isEmpty()) {
			s.getNex().deleteLastLetter();
		} else {
			manipulator.removeSelectedAndSelectPreviousLeaf();
		}
	},

	'remove-selected-and-select-previous-leaf': function(s) {
		let p = s.getParent();
		manipulator.removeSelectedAndSelectPreviousLeaf();
		if (!p.hasChildren()) {
			manipulator.removeNex(p);
		}
	},

	'legacy-unchecked-remove-selected-and-select-previous-leaf': function(s) {
		manipulator.selectPreviousLeaf() || manipulator.selectParent();
		manipulator.removeNex(s);
	},

	'do-line-break-always': function(s) {
		if (experiments.V2_INSERTION) {
			manipulator.doLineBreakAlwaysV2(s);
			return;
		}
		let newline = new Newline();
		manipulator.insertAfterSelected(newline)
			&& manipulator.putAllNextSiblingsInNewLine()
			&& newline.setSelected();
	},

	'do-line-break-from-line': function(s) {
		if (Utils.isDoc(s.getParent())) {
			manipulator.insertAfterSelectedAndSelect(manipulator.newLine())
				&& manipulator.appendAndSelect(new Newline());
		} else {
			let newline = new Newline();
			manipulator.insertAfterSelected(newline)
				&& manipulator.putAllNextSiblingsInNewLine()
				&& newline.setSelected();
		}		
	},


	'do-line-break-after-letter': function(s) {
		let newline = new Newline();
		if (Utils.isWord(s.getParent())) {
			manipulator.splitCurrentWordIntoTwo()
				&& manipulator.selectParent()
				&& manipulator.insertAfterSelected(newline)
				&& manipulator.putAllNextSiblingsInNewLine()
				&& newline.setSelected();			
		} else {
			// treat as separator.
			manipulator.insertAfterSelected(newline)
				&& manipulator.putAllNextSiblingsInNewLine()
				&& newline.setSelected();

		}
	},

	'replace-selected-with-word-correctly': function(s) {
		let selected = systemState.getGlobalSelectedNode();
		let obj = manipulator.newWord();
		if (Utils.isDoc(selected.getParent())) {
			let ln = manipulator.newLine();
			ln.appendChild(obj);
			manipulator.replaceSelectedWith(ln);
			obj.setSelected();
		} else {
			manipulator.replaceSelectedWith(obj);
		}
	},


	'delete-newline': function(s) {
		if (manipulator.selectPreviousLeaf()) {
			let oldParent = s.getParent(); // may need later
			manipulator.removeNex(s);
			s = systemState.getGlobalSelectedNode();
			let line;
			let word;
			// when we selected the previous sibling, we may be:
			// 1. in a word that's inside a line
			// 2. in a line
			// 3. neither
			let parent = s.getParent();
			if (parent.getNex() instanceof Line) {
				manipulator.joinToSiblingIfSame(parent);
				return true;
			}
			let parent2 = parent.getParent();
			if (parent2 != null) {
				if (parent2.getNex() instanceof Line) {
					manipulator.joinToSiblingIfSame(parent2);
					// not done yet -- we also need to join words if applicable
					if (parent.getNex() instanceof Word) {
						manipulator.joinToSiblingIfSame(parent);
					}
					return true;
				}
			}
			// if we aren't joining lines up, we at least need to delete the
			// line we are *coming from* *if it's empty*
			if (!oldParent.hasChildren()) {
				manipulator.removeNex(oldParent);
			}
		}		
	},


	// I hate commas
	'':''
}

export {
	isNormallyHandled,
	KeyResponseFunctions,
	DefaultHandlers
}