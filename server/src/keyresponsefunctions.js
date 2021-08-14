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
import { Integer } from './nex/integer.js'; 
import { Lambda } from './nex/lambda.js'; 
import { Letter } from './nex/letter.js'; 
import { Line } from './nex/line.js'; 
import { NativeOrg } from './nex/nativeorg.js'; 
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

import {
	INSERT_UNSPECIFIED,
	INSERT_AFTER,
	INSERT_BEFORE,
	INSERT_INSIDE,
	INSERT_AROUND
} from './rendernode.js'


function isNormallyHandledInDocContext(key) {
	if (!experiments.BETTER_KEYBINDINGS) {
		return isNormallyHandled(key);
	}
	if (!(/^.$/.test(key))) {
		return true;
	}
	if (/^[~`]$/.test(key)) {
		return true;
	}
	return false;	
}

function isNormallyHandled(key) {
	if (!(/^.$/.test(key))) {
		return true;
	}
	if (/^[~!@#$%`^*&)([\]{}<>]$/.test(key)) {
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

	'rootDefault': function(nex, txt) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);
		if (isSeparator) {
			manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newSeparator(txt))
		} else {
			manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newLetter(txt))
		}
		return true;
	},

	'zlistDefault': function(nex, txt, context) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let isCommand = (context == ContextType.COMMAND);
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);
		if (isSeparator) {
			manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newSeparator(txt))
		} else {
			if (isCommand) {
				if (nex.hasChildren()) {
					manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newLetter(txt))
				} else {
					manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newLetter(txt));
				}							
			} else {
				manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newLetter(txt));
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
			manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newSeparator(txt));
		} else {
			if (isCommand) {
				if (nex.hasChildren()) {
					manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newLetter(txt));
				} else {
					manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newLetter(txt));
				}							
			} else {
				manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newLetter(txt));
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
			manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newSeparator(txt))
		} else {
			let w = manipulator.newWord();
			w.appendChild(manipulator.newLetter(txt));
			manipulator.defaultInsertForV2(manipulator.selected(), w);
			w.setSelected();
		}
		return true;
	},

	'integerDefault': function(nex, txt, context, sourcenode) {
		if (experiments.REMAINING_EDITORS) {
			if (isNormallyHandled(txt)) {
				return false;
			}
			let letterRegex = /^[a-zA-Z0-9']$/;
			let isSeparator = !letterRegex.test(txt);
			if (isSeparator) {
				manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newSeparator(txt));
			} else {
				manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newLetter(txt));
			}
			return true;

		} else {
			if (txt == 'Backspace') {
				if (nex.value == '0') {
					manipulator.removeAndSelectPreviousSiblingV2(sourcenode);
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
				manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newSeparator(txt));
			} else {
				manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newLetter(txt));
			}
			return true;
		}
	},

	'floatDefault': function(nex, txt, context, sourcenode) {
		if (experiments.REMAINING_EDITORS) {
			if (isNormallyHandled(txt)) {
				return false;
			}
			let letterRegex = /^[a-zA-Z0-9']$/;
			let isSeparator = !letterRegex.test(txt);
			if (isSeparator) {
				manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newSeparator(txt));
			} else {
				manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newLetter(txt));
			}
			return true;
		} else {
			if (txt == 'Backspace') {
				// do backspace hack
				if (nex.value == '0') {
					manipulator.removeSelectedAndSelectPreviousLeafV2(sourcenode);
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
				manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newSeparator(txt));
			} else {
				manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newLetter(txt));
			}
			return true;
		}
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
			manipulator.defaultInsertForV2(manipulator.selected(), toInsert)
		} else {
			manipulator.defaultInsertForV2(manipulator.selected(), toInsert);
		}
		return true;
	},

	'estringDefault': function(nex, txt) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);

		if (isSeparator) {
			manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newSeparator(txt))
		} else {
			manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newLetter(txt));
		}		
	},

	'insertAfterEError': function(nex, txt) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);

		if (isSeparator) {
			manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newSeparator(txt))
		} else {
			manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newLetter(txt));
		}
		return true;
	},

	'justAppendLetterOrSeparator': function(nex, txt) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);
		if (isSeparator) {
			manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newSeparator(txt))
		} else {
			manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newLetter(txt))
		}
		return true;
	},

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

	'insertAtLetterLevel': function(nex, txt, context) {
		if (isNormallyHandledInDocContext(txt)) {
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
				manipulator.insertSeparatorBeforeOrAfterSelectedLetter(manipulator.newSeparator(txt));
			} else {
				manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newSeparator(txt));				
			}
		} else {
			manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newLetter(txt));
		}
		return true;
	},

	'insertAtSeparatorLevel': function (nex, txt, context) {
		if (isNormallyHandledInDocContext(txt)) {
			return false;
		}
		let isLine = (context == ContextType.LINE)
		if (!(/^.$/.test(txt))) {
			throw UNHANDLED_KEY;
		};
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);
		if (isSeparator) {
			manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newSeparator(txt));
		} else {
			if (isLine) {
				let newword = manipulator.newWord();
				let newletter = manipulator.newLetter(txt);
				newword.appendChild(newletter);
				manipulator.defaultInsertForV2(manipulator.selected(), newword);
				manipulator.joinToSiblingIfSame(newword);
				newletter.setSelected();
			} else {
				manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newLetter(txt));
			}
		}
		return true;
	},

	'insertAtWordLevel' : function(nex, txt, context) {
		if (isNormallyHandledInDocContext(txt)) {
			return false;
		}
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);
		let isCommand = (context == ContextType.COMMAND);
		if (isSeparator) {
			if (experiments.BETTER_KEYBINDINGS && isCommand && !(manipulator.isInsertInside(manipulator.selected()))) {
				manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newNexForKey(txt));
			} else {
				manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newSeparator(txt));
			}
		} else {
			if (experiments.BETTER_KEYBINDINGS && isCommand && !(manipulator.isInsertInside(manipulator.selected()))) {
				manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newNexForKey(txt));
			} else {
				if (manipulator.selectLastChild()) {
					manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newLetter(txt));
				} else {
					manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newLetter(txt))
				}
			}
		}
		return true;
	},

	'lineDefault': function(nex, txt, context) {
		if (isNormallyHandledInDocContext(txt)) {
			return false;
		}
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);
		let isCommand = (context == ContextType.COMMAND);
		if (isSeparator) {
			if (experiments.BETTER_KEYBINDINGS && isCommand && !(manipulator.isInsertInside(manipulator.selected()))) {
				manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newNexForKey(txt));
			} else {
				if (experiments.BETTER_KEYBINDINGS) {
					if (manipulator.selectLastChild()) {
						manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newSeparator(txt));
					} else {
						manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newSeparator(txt))
					}
				} else {
					manipulator.insertSeparatorFromLineV2(manipulator.newSeparator(txt), manipulator.selected())
				}
			}
		} else {
			if (experiments.BETTER_KEYBINDINGS && isCommand && !(manipulator.isInsertInside(manipulator.selected()))) {
				manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newNexForKey(txt));
			} else {
				if (experiments.BETTER_KEYBINDINGS) {
					if (manipulator.selectLastChild()) {
						if (manipulator.selectLastChild()) {
							manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newLetter(txt));
						} else {
							manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newWord());
							manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newLetter(txt));
						}
					} else {
						manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newWord());
						manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newLetter(txt));
					}
				} else {
					manipulator.insertLetterFromLineV2(manipulator.newLetter(txt), manipulator.selected())
				}
			}
		}
		return true;
	},

	'docHandle' : function(nex, txt, context) {
		if (isNormallyHandledInDocContext(txt)) {
			return false;
		}
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);
		let isCommand = (context == ContextType.COMMAND);
		if (isSeparator) {
			if (experiments.BETTER_KEYBINDINGS && isCommand && !(manipulator.isInsertInside(manipulator.selected()))) {
				manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newNexForKey(txt));
			} else {
				manipulator.selectLastChild()
					|| manipulator.appendAndSelect(manipulator.newLine());
				manipulator.appendAndSelect(manipulator.newSeparator(txt));

			}
		} else {
			if (experiments.BETTER_KEYBINDINGS && isCommand && !(manipulator.isInsertInside(manipulator.selected()))) {
				manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newNexForKey(txt));
			} else {
				manipulator.selectLastChild()
					|| manipulator.appendAndSelect(manipulator.newLine());
				manipulator.selectLastChild()
					|| manipulator.appendAndSelect(manipulator.newWord());
				if (manipulator.selectLastChild()) {
					manipulator.insertAfterSelectedAndSelect(manipulator.newLetter(txt));
				} else {
					manipulator.appendAndSelect(manipulator.newLetter(txt))
				}
			}
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

	'do-nothing' : function(s) {},

	'select-next-sibling': function(s) {
		manipulator.selectNextSibling();
	},

	'evaluate-nex': function(s) {
		evaluateAndReplace(s);
	},

	'evaluate-nex-and-keep': function(s) {
		evaluateAndKeep(s);
	},

	'toggle-dir': function(s) {
		s.getNex().toggleDir();
	},

	'toggle-exploded': function(s) {
		s.toggleRenderMode();
	},

	'select-parent': function(s) { manipulator.selectParent(); },

	'start-modal-editing': function(s) {
		s.getNex().startModalEditing();
	},

	'activate-or-return-exp-child': function(s) {
		let exp = s.getNex();
		if (!exp.isActivated()) {
			evaluateAndKeep(s); // this will activate plus do all the other junk I want
		} else if (exp.isFulfilled()) {
			manipulator.replaceSelectedWithFirstChildOfSelected();
		}
		// else no-op, it's still thinking.
	},

	'return-exp-child': function(s) {
		manipulator.replaceSelectedWithFirstChildOfSelected();
	},

	'autocomplete': function(s) {
		s.getNex().autocomplete();
	},

	'start-main-editor': function(s) { s.possiblyStartMainEditor(); },

	'start-main-editor-or-delete': function(s) {
		let editor = s.possiblyStartMainEditor();
		if (!editor) {
			manipulator.removeAndSelectPreviousSiblingV2(s);
		} else {
			if (editor.hasContent()) {
				editor.routeKey('Backspace');
			}
		}
	},

	'evaluate-v2': function(s) {
		evaluateAndReplace(s);
	},

	'delete-letter-v2': function(s) {
		manipulator.deleteLeafV2(s);
	},

	'delete-separator-v2': function(s) {
		manipulator.deleteLeafV2(s);
	},

	'delete-line-v2': function(s) {
		manipulator.maybeDeleteEmptyLineV2(s);
	},

	'remove-selected-and-select-previous-leaf-v2': function(s) {
		manipulator.removeSelectedAndSelectPreviousLeafV2(s);
	},

	'remove-selected-and-select-previous-sibling-v2': function(s) {
		manipulator.removeAndSelectPreviousSiblingV2(s);
	},

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

	'do-line-break-or-eval': function(s, context) {
		if (context == ContextType.DOC) {
			manipulator.doLineBreakForLine(s);
		} else {
			evaluateAndReplace(s);
		}
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
		manipulator.selectCorrespondingLetterInPreviousLineV2(s);
	},

	'move-to-corresponding-letter-in-next-line-v2': function(s) {
		manipulator.selectCorrespondingLetterInNextLineV2(s);
	},

	'insert-actual-!-at-insertion-point-from-separator': function(s) { manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newSeparator('!')); },
	'insert-actual-@-at-insertion-point-from-separator': function(s) { manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newSeparator('@')); },
	'insert-actual-#-at-insertion-point-from-separator': function(s) { manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newSeparator('#')); },
	'insert-actual-$-at-insertion-point-from-separator': function(s) { manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newSeparator('$')); },
	'insert-actual-%-at-insertion-point-from-separator': function(s) { manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newSeparator('%')); },
	'insert-actual-^-at-insertion-point-from-separator': function(s) { manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newSeparator('^')); },
	'insert-actual-&-at-insertion-point-from-separator': function(s) { manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newSeparator('&')); },
	'insert-actual-*-at-insertion-point-from-separator': function(s) { manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newSeparator('*')); },
	'insert-actual-(-at-insertion-point-from-separator': function(s) { manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newSeparator('(')); },
	'insert-actual-)-at-insertion-point-from-separator': function(s) { manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newSeparator(')')); },
	'insert-actual-[-at-insertion-point-from-separator': function(s) { manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newSeparator('[')); },
	'insert-actual-{-at-insertion-point-from-separator': function(s) { manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newSeparator('{')); },
	'insert-actual-<-at-insertion-point-from-separator': function(s) { manipulator.defaultInsertForV2(manipulator.selected(), manipulator.newSeparator('<')); },

	'insert-actual-!-at-insertion-point-from-letter': function(s) { manipulator.insertSeparatorBeforeOrAfterSelectedLetter(manipulator.newSeparator('!')); },
	'insert-actual-@-at-insertion-point-from-letter': function(s) { manipulator.insertSeparatorBeforeOrAfterSelectedLetter(manipulator.newSeparator('@')); },
	'insert-actual-#-at-insertion-point-from-letter': function(s) { manipulator.insertSeparatorBeforeOrAfterSelectedLetter(manipulator.newSeparator('#')); },
	'insert-actual-$-at-insertion-point-from-letter': function(s) { manipulator.insertSeparatorBeforeOrAfterSelectedLetter(manipulator.newSeparator('$')); },
	'insert-actual-%-at-insertion-point-from-letter': function(s) { manipulator.insertSeparatorBeforeOrAfterSelectedLetter(manipulator.newSeparator('%')); },
	'insert-actual-^-at-insertion-point-from-letter': function(s) { manipulator.insertSeparatorBeforeOrAfterSelectedLetter(manipulator.newSeparator('^')); },
	'insert-actual-&-at-insertion-point-from-letter': function(s) { manipulator.insertSeparatorBeforeOrAfterSelectedLetter(manipulator.newSeparator('&')); },
	'insert-actual-*-at-insertion-point-from-letter': function(s) { manipulator.insertSeparatorBeforeOrAfterSelectedLetter(manipulator.newSeparator('*')); },
	'insert-actual-(-at-insertion-point-from-letter': function(s) { manipulator.insertSeparatorBeforeOrAfterSelectedLetter(manipulator.newSeparator('(')); },
	'insert-actual-)-at-insertion-point-from-letter': function(s) { manipulator.insertSeparatorBeforeOrAfterSelectedLetter(manipulator.newSeparator(')')); },
	'insert-actual-[-at-insertion-point-from-letter': function(s) { manipulator.insertSeparatorBeforeOrAfterSelectedLetter(manipulator.newSeparator('[')); },
	'insert-actual-{-at-insertion-point-from-letter': function(s) { manipulator.insertSeparatorBeforeOrAfterSelectedLetter(manipulator.newSeparator('{')); },
	'insert-actual-<-at-insertion-point-from-letter': function(s) { manipulator.insertSeparatorBeforeOrAfterSelectedLetter(manipulator.newSeparator('<')); },

	'insert-command-at-insertion-point-v2': function(s) { manipulator.defaultInsertForV2(s, manipulator.newCommand()); },
	'insert-bool-at-insertion-point-v2': function(s) { manipulator.defaultInsertForV2(s, manipulator.newBool()); },
	'insert-symbol-at-insertion-point-v2': function(s) { manipulator.defaultInsertForV2(s, manipulator.newESymbol()); },
	'insert-integer-at-insertion-point-v2': function(s) { manipulator.defaultInsertForV2(s, manipulator.newInteger()); },
	'insert-string-at-insertion-point-v2': function(s) { manipulator.defaultInsertForV2(s, manipulator.newEString()); },
	'insert-float-at-insertion-point-v2': function(s) { manipulator.defaultInsertForV2(s, manipulator.newFloat()); },
	'insert-nil-at-insertion-point-v2': function(s) { manipulator.defaultInsertForV2(s, manipulator.newNil()); },
	'insert-instantiator-at-insertion-point-v2': function(s) { manipulator.defaultInsertForV2(s, manipulator.newInstantiator()); },
	'insert-lambda-at-insertion-point-v2': function(s) { manipulator.defaultInsertForV2(s, manipulator.newLambda()); },
	'insert-expectation-at-insertion-point-v2': function(s) { manipulator.defaultInsertForV2(s, manipulator.newExpectation()); },
	'insert-word-at-insertion-point-v2': function(s) { manipulator.defaultInsertForV2(s, manipulator.newWord()); },
	'insert-line-at-insertion-point-v2': function(s) { manipulator.defaultInsertForV2(s, manipulator.newLine()); },
	'insert-doc-at-insertion-point-v2': function(s) { manipulator.defaultInsertForV2(s, manipulator.newDoc()); },
	'insert-org-at-insertion-point-v2': function(s) { manipulator.defaultInsertForV2(s, manipulator.newOrg()); },
	'insert-zlist-at-insertion-point-v2': function(s) { manipulator.defaultInsertForV2(s, manipulator.newZlist()); },

	'close-off-org': function(s) { manipulator.closeOffOrg(s); },
	'close-off-line': function(s) { manipulator.closeOffLine(s); },
	'close-off-word': function(s) { manipulator.closeOffWord(s); },
	'close-off-doc': function(s) { manipulator.closeOffDoc(s); },

	'add-tag': function(s) { s.startTagEditor(); },

	'remove-all-tags': function(s) { s.removeAllTags(); },

	'wrap-in-command': function(s) { manipulator.wrapSelectedInAndSelect(manipulator.newCommand()); },
	'wrap-in-lambda': function(s) { manipulator.wrapSelectedInAndSelect(manipulator.newLambda()); },
	'wrap-in-expectation': function(s) { manipulator.wrapSelectedInAndSelect(manipulator.newExpectation()); },
	'wrap-in-word': function(s) { manipulator.wrapSelectedInAndSelect(manipulator.newWord()); },
	'wrap-in-line': function(s) { manipulator.wrapSelectedInAndSelect(manipulator.newLine()); },
	'wrap-in-doc': function(s) { manipulator.wrapSelectedInAndSelect(manipulator.newDoc()); },
	'wrap-in-org': function(s) { manipulator.wrapSelectedInAndSelect(manipulator.newOrg()); },

	'force-insert-inside': function(s) { manipulator.forceInsertInside(); },
	'force-insert-around': function(s) { manipulator.forceInsertAround(); },
	'force-insert-after': function(s) { manipulator.forceInsertAfter(); },
	'force-insert-before': function(s) { manipulator.forceInsertBefore(); },

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

	'delete-last-command-letter-or-remove-selected-and-select-previous-sibling': function(s) {
		if (!s.getNex().isEmpty()) {
			s.getNex().deleteLastCommandLetter();
		} else {
			manipulator.removeSelectedAndSelectPreviousSibling();
		}
	},

	'do-line-break-always': function(s) {
		manipulator.doLineBreakAlwaysV2(s);
	},

	// I hate commas
	'':''
}

export {
	isNormallyHandled,
	KeyResponseFunctions,
	DefaultHandlers
}