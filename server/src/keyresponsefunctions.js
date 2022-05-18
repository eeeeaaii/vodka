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
import { Wavetable } from './nex/wavetable.js'; 
import { Command } from './nex/command.js'; 
import { Doc } from './nex/doc.js'; 
import { EError } from './nex/eerror.js'; 
import { EString } from './nex/estring.js'; 
import { ESymbol } from './nex/esymbol.js'; 
import { Float } from './nex/float.js'; 
import { Integer } from './nex/integer.js'; 
import { Lambda } from './nex/lambda.js'; 
import { Letter } from './nex/letter.js'; 
import { Line } from './nex/line.js'; 
import { Nil } from './nex/nil.js'; 
import { Org } from './nex/org.js'; 
import { Root } from './nex/root.js'; 
import { Separator } from './nex/separator.js'; 
import { Word } from './nex/word.js'; 
import { ContextType } from './contexttype.js'
import { manipulator } from './manipulator.js'
import { RenderNode } from './rendernode.js'; 
import { evaluateAndReplace, evaluateAndKeep, evaluateAndCopy } from './evaluatorinterface.js';
import { UNHANDLED_KEY } from './globalconstants.js'
import { experiments } from './globalappflags.js'

import {
	INSERT_UNSPECIFIED,
	INSERT_AFTER,
	INSERT_BEFORE,
	INSERT_INSIDE,
	INSERT_AROUND
} from './rendernode.js'



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

	'standardDefault': function(node, txt) {
		let nex = node.nex;
		let canBe = Utils.figureOutWhatItCanBe(txt);

		if (canBe.integer) {
			manipulator.insertAtSelectedObjInsertionPoint(manipulator.newIntegerWithValue(txt));
			return true;
		} else if (canBe.command) {
			manipulator.insertAtSelectedObjInsertionPoint(manipulator.newCommandWithText(txt));
			return true;
		} else {
			return false;
		}
	},

	'letterDefault': function(node, txt) {
		let nex = node.nex;
		let context = manipulator.getContextForNode(node);
		let inWord = (context == ContextType.WORD || context == ContextType.IMMUTABLE_WORD);
		if (!(/^.$/.test(txt))) {
			throw UNHANDLED_KEY;
		};
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);
		if (isSeparator) {
			if (inWord) {
				manipulator.insertSeparatorBeforeOrAfterSelectedLetter(manipulator.newSeparator(txt));
			} else {
				manipulator.defaultInsertFor(manipulator.selected(), manipulator.newSeparator(txt));				
			}
		} else {
			manipulator.defaultInsertFor(manipulator.selected(), manipulator.newLetter(txt));
		}
		return true;
	},

	'separatorDefault': function(node, txt) {
		let nex = node.nex;
		let context = manipulator.getContextForNode(node);
		let isLine = (context == ContextType.LINE || context == ContextType.IMMUTABLE_LINE)
		if (!(/^.$/.test(txt))) {
			throw UNHANDLED_KEY;
		};
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);
		if (isSeparator) {
			manipulator.defaultInsertFor(manipulator.selected(), manipulator.newSeparator(txt));
		} else {
			if (isLine) {
				// special case - when user is typing into a doc, we want to preserve the general
				// mutability of the surroundings even if we are inserting new things.
				
				let newword = manipulator.newWord();
				if (context == ContextType.IMMUTABLE_LINE) {
					newword.getNex().setMutable(false);
				}
				let newletter = manipulator.newLetter(txt);
				newword.appendChild(newletter);
				manipulator.defaultInsertFor(manipulator.selected(), newword);
				manipulator.joinToSiblingIfSame(newword);
				newletter.setSelected();
			} else {
				manipulator.defaultInsertFor(manipulator.selected(), manipulator.newLetter(txt));
			}
		}
		return true;
	},

	'wordDefault' : function(node, txt) {
		let nex = node.nex;
		let context = manipulator.getContextForNode(node);
		if (!(/^.$/.test(txt))) {
			throw UNHANDLED_KEY;
		};
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);
		let isCommand = (context == ContextType.COMMAND);
		if (isSeparator) {
			if (isCommand && !(manipulator.isInsertInside(manipulator.selected()))) {
				manipulator.defaultInsertFor(manipulator.selected(), manipulator.newNexForKey(txt));
			} else {
				manipulator.defaultInsertFor(manipulator.selected(), manipulator.newSeparator(txt));
			}
		} else {
			if (isCommand && !(manipulator.isInsertInside(manipulator.selected()))) {
				manipulator.defaultInsertFor(manipulator.selected(), manipulator.newNexForKey(txt));
			} else {
				if (manipulator.selectLastChild()) {
					manipulator.defaultInsertFor(manipulator.selected(), manipulator.newLetter(txt));
				} else {
					manipulator.defaultInsertFor(manipulator.selected(), manipulator.newLetter(txt))
				}
			}
		}
		return true;
	},

	'lineDefault': function(node, txt) {
		let nex = node.nex;
		let context = manipulator.getContextForNode(node);
		if (!(/^.$/.test(txt))) {
			throw UNHANDLED_KEY;
		};
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);
		let isCommand = (context == ContextType.COMMAND);
		if (isSeparator) {
			if (isCommand && !(manipulator.isInsertInside(manipulator.selected()))) {
				manipulator.defaultInsertFor(manipulator.selected(), manipulator.newNexForKey(txt));
			} else {
				if (manipulator.selectLastChild()) {
					manipulator.defaultInsertFor(manipulator.selected(), manipulator.newSeparator(txt));
				} else {
					manipulator.defaultInsertFor(manipulator.selected(), manipulator.newSeparator(txt))
				}
			}
		} else {
			if (isCommand && !(manipulator.isInsertInside(manipulator.selected()))) {
				manipulator.defaultInsertFor(manipulator.selected(), manipulator.newNexForKey(txt));
			} else {
				if (manipulator.selectLastChild()) {
					if (manipulator.selectLastChild()) {
						manipulator.defaultInsertFor(manipulator.selected(), manipulator.newLetter(txt));
					} else {
						manipulator.defaultInsertFor(manipulator.selected(), manipulator.possiblyMakeImmutable(manipulator.newWord(), context));
						manipulator.defaultInsertFor(manipulator.selected(), manipulator.newLetter(txt));
					}
				} else {
					manipulator.defaultInsertFor(manipulator.selected(), manipulator.possiblyMakeImmutable(manipulator.newWord(), context));
					manipulator.defaultInsertFor(manipulator.selected(), manipulator.newLetter(txt));
				}
			}
		}
		return true;
	},

	'docDefault' : function(node, txt) {
		let nex = node.nex;
		let context = manipulator.getContextForNode(node);
		if (!(/^.$/.test(txt))) {
			throw UNHANDLED_KEY;
		};
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);
		let isCommand = (context == ContextType.COMMAND);
		if (isSeparator) {
			if (isCommand && !(manipulator.isInsertInside(manipulator.selected()))) {
				manipulator.defaultInsertFor(manipulator.selected(), manipulator.newNexForKey(txt));
			} else {
				manipulator.selectLastChild()
					|| manipulator.appendAndSelect(manipulator.possiblyMakeImmutable(manipulator.newLine(), context));
				manipulator.appendAndSelect(manipulator.newSeparator(txt));

			}
		} else {
			if (isCommand && !(manipulator.isInsertInside(manipulator.selected()))) {
				manipulator.defaultInsertFor(manipulator.selected(), manipulator.newNexForKey(txt));
			} else {
				// if we are inserting a letter inside an empty doc, we decide whether to make the line and word
				// immutable based on the mutability of the doc itself, not its context.
				let fakeContext = (nex.isMutable() ? ContextType.DOC : ContextType.IMMUTABLE_DOC);
				manipulator.selectLastChild()
					|| manipulator.appendAndSelect(manipulator.possiblyMakeImmutable(manipulator.newLine(), fakeContext));
				manipulator.selectLastChild()
					|| manipulator.appendAndSelect(manipulator.possiblyMakeImmutable(manipulator.newWord(), fakeContext));
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

	'activate-or-return-exp-child': function(s) {
		let exp = s.getNex();
		if (!exp.isActivated()) {
			evaluateAndReplace(s); // this will activate plus do all the other junk I want
		} else if (exp.isFulfilled()) {
			manipulator.replaceSelectedWithFirstChildOfSelected();
		}
		// else no-op, it's still thinking.
	},

	'autocomplete': function(s) {
		s.getNex().autocomplete();
	},

	'start-main-editor': function(s) { s.possiblyStartMainEditor(); },

	'delete-letter': function(s) {
		manipulator.deleteLeaf(s);
	},

	'delete-separator': function(s) {
		manipulator.deleteLeaf(s);
	},

	'delete-line': function(s) {
		manipulator.maybeDeleteEmptyLine(s);
	},

	'remove-selected-and-select-previous-sibling': function(s) {
		manipulator.removeAndSelectPreviousSibling(s);
	},

	'remove-selected-and-select-previous-sibling-if-empty': function(s) {
		manipulator.removeAndSelectPreviousSiblingIfEmpty(s);
	},

	'move-left-up': function(s) {
		manipulator.moveLeftUp(s);
	},

	'move-right-down': function(s) {
		manipulator.moveRightDown(s);
	},

	'move-left-for-line': function(s) {
		manipulator.moveLeftForLine(s);
	},

	'move-up-for-line': function(s) {
		manipulator.moveUpForLine(s);
	},

	'move-right-for-line': function(s) {
		manipulator.moveRightForLine(s);
	},

	'move-down-for-line': function(s) {
		manipulator.moveDownForLine(s);
	},

	'move-to-previous-leaf': function(s) {
		manipulator.selectPreviousLeaf(s);
	},

	'move-to-next-leaf': function(s) {		
		manipulator.selectNextLeaf(s);
	},

	'select-first-child-or-force-insert-inside-insertion-mode': function(s) {
		manipulator.selectFirstChildOrMoveInsertionPoint(s);
	},

	'do-line-break-or-eval': function(s) {
		let context = manipulator.getContextForNode(s);
		if (context == ContextType.DOC || context == ContextType.IMMUTABLE_DOC) {
			manipulator.doLineBreakForLine(s, context);
		} else {
			evaluateAndReplace(s);
		}
	},

	'do-line-break-for-letter': function(s) {
		let context = manipulator.getContextForNode(s);
		manipulator.doLineBreakForLetter(s, context);
	},

	'do-line-break-for-separator': function(s) {
		let context = manipulator.getContextForNode(s);
		manipulator.doLineBreakForSeparator(s, context);
	},

	'move-to-corresponding-letter-in-previous-line': function(s) {
		manipulator.selectCorrespondingLetterInPreviousLine(s);
	},

	'move-to-corresponding-letter-in-next-line': function(s) {
		manipulator.selectCorrespondingLetterInNextLine(s);
	},

	'insert-actual-!-at-insertion-point-from-separator': function(s) { manipulator.defaultInsertFor(manipulator.selected(), manipulator.newSeparator('!')); },
	'insert-actual-@-at-insertion-point-from-separator': function(s) { manipulator.defaultInsertFor(manipulator.selected(), manipulator.newSeparator('@')); },
	'insert-actual-#-at-insertion-point-from-separator': function(s) { manipulator.defaultInsertFor(manipulator.selected(), manipulator.newSeparator('#')); },
	'insert-actual-$-at-insertion-point-from-separator': function(s) { manipulator.defaultInsertFor(manipulator.selected(), manipulator.newSeparator('$')); },
	'insert-actual-%-at-insertion-point-from-separator': function(s) { manipulator.defaultInsertFor(manipulator.selected(), manipulator.newSeparator('%')); },
	'insert-actual-^-at-insertion-point-from-separator': function(s) { manipulator.defaultInsertFor(manipulator.selected(), manipulator.newSeparator('^')); },
	'insert-actual-&-at-insertion-point-from-separator': function(s) { manipulator.defaultInsertFor(manipulator.selected(), manipulator.newSeparator('&')); },
	'insert-actual-*-at-insertion-point-from-separator': function(s) { manipulator.defaultInsertFor(manipulator.selected(), manipulator.newSeparator('*')); },
	'insert-actual-(-at-insertion-point-from-separator': function(s) { manipulator.defaultInsertFor(manipulator.selected(), manipulator.newSeparator('(')); },
	'insert-actual-)-at-insertion-point-from-separator': function(s) { manipulator.defaultInsertFor(manipulator.selected(), manipulator.newSeparator(')')); },
	'insert-actual-[-at-insertion-point-from-separator': function(s) { manipulator.defaultInsertFor(manipulator.selected(), manipulator.newSeparator('[')); },
	'insert-actual-{-at-insertion-point-from-separator': function(s) { manipulator.defaultInsertFor(manipulator.selected(), manipulator.newSeparator('{')); },
	'insert-actual-<-at-insertion-point-from-separator': function(s) { manipulator.defaultInsertFor(manipulator.selected(), manipulator.newSeparator('<')); },

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
	'insert-actual-_-at-insertion-point-from-letter': function(s) { manipulator.insertSeparatorBeforeOrAfterSelectedLetter(manipulator.newSeparator('_')); },

	'insert-command-at-insertion-point': function(s) { manipulator.defaultInsertFor(s, manipulator.newCommand()); },
	'insert-bool-at-insertion-point': function(s) { manipulator.defaultInsertFor(s, manipulator.newBool()); },
	'insert-symbol-at-insertion-point': function(s) { manipulator.defaultInsertFor(s, manipulator.newESymbol()); },
	'insert-integer-at-insertion-point': function(s) { manipulator.defaultInsertFor(s, manipulator.newInteger()); },
	'insert-string-at-insertion-point': function(s) { manipulator.defaultInsertFor(s, manipulator.newEString()); },
	'insert-float-at-insertion-point': function(s) { manipulator.defaultInsertFor(s, manipulator.newFloat()); },
	'insert-nil-at-insertion-point': function(s) { manipulator.defaultInsertFor(s, manipulator.newNil()); },
	'insert-instantiator-at-insertion-point': function(s) { manipulator.defaultInsertFor(s, manipulator.newInstantiator()); },
	'insert-lambda-at-insertion-point': function(s) { manipulator.defaultInsertFor(s, manipulator.newLambda()); },
	'insert-deferredcommand-at-insertion-point': function(s) { manipulator.defaultInsertFor(s, manipulator.newDeferredCommand()); },
	'insert-word-at-insertion-point': function(s) { manipulator.defaultInsertFor(s, manipulator.newWord()); },
	'insert-line-at-insertion-point': function(s) { manipulator.defaultInsertFor(s, manipulator.newLine()); },
	'insert-doc-at-insertion-point': function(s) { manipulator.defaultInsertFor(s, manipulator.newDoc()); },
	'insert-org-at-insertion-point': function(s) { manipulator.defaultInsertFor(s, manipulator.newOrg()); },
	'insert-wavetable-at-insertion-point': function(s) { manipulator.defaultInsertFor(s, manipulator.newWavetable()); },

	'close-off-org': function(s) { manipulator.closeOffOrg(s); },
	'close-off-line': function(s) { manipulator.closeOffLine(s); },
	'close-off-word': function(s) { manipulator.closeOffWord(s); },
	'close-off-doc': function(s) { manipulator.closeOffDoc(s); },

	'add-tag': function(s) { s.startTagEditor(); },

	'wrap-in-command': function(s) { manipulator.wrapSelectedInAndSelect(manipulator.newCommand()); },
	'wrap-in-lambda': function(s) { manipulator.wrapSelectedInAndSelect(manipulator.newLambda()); },
	'wrap-in-deferredcommand': function(s) { manipulator.wrapSelectedInAndSelect(manipulator.newDeferredCommand()); },
	'wrap-in-word': function(s) { manipulator.wrapSelectedInAndSelect(manipulator.newWord()); },
	'wrap-in-line': function(s) { manipulator.wrapSelectedInAndSelect(manipulator.newLine()); },
	'wrap-in-doc': function(s) { manipulator.wrapSelectedInAndSelect(manipulator.newDoc()); },
	'wrap-in-instantiator': function(s) { manipulator.wrapSelectedInAndSelect(manipulator.newInstantiator()); },
	'wrap-in-org': function(s) { manipulator.wrapSelectedInAndSelect(manipulator.newOrg()); },

	'force-insert-inside': function(s) { manipulator.forceInsertInside(); },
	'force-insert-around': function(s) { manipulator.forceInsertAround(); },
	'force-insert-after': function(s) { manipulator.forceInsertAfter(); },
	'force-insert-before': function(s) { manipulator.forceInsertBefore(); },

	'call-delete-handler-then-remove-selected-and-select-previous-sibling': function(s) {
		s.getNex().callDeleteHandler();
		manipulator.removeSelectedAndSelectPreviousSibling();
	},

	'audition-wave': function(s) {
		s.getNex().auditionWave();
	},

	// I hate commas
	'':''
}

export {
	KeyResponseFunctions,
	DefaultHandlers
}