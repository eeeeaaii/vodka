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
import * as Utils from './utils.js';

import { UNHANDLED_KEY } from './globalconstants.js'


// import { ContextType } from './contexttype.js'

// These KeyResponseFunctions are all untested and not integrated. Need to integrate
// one at a time and test.

function insertOrAppend(s, obj) {
	if (s.hasChildren()) {
		return manipulator.insertAfterSelectedAndSelect(obj);
	} else {
		return manipulator.appendAndSelect(obj);
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
			manipulator.insertAfterSelectedAndSelect(new Separator(txt));
		} else {
			if (isCommand) {
				if (nex.hasChildren()) {
					manipulator.insertAfterSelectedAndSelect(new Letter(txt));
				} else {
					manipulator.appendAndSelect(new Letter(txt));
				}							
			} else {
				manipulator.appendAndSelect(new Letter(txt));
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
			manipulator.insertAfterSelectedAndSelect(new Separator(txt));
		} else {
			if (isCommand) {
				if (nex.hasChildren()) {
					manipulator.insertAfterSelectedAndSelect(new Letter(txt));
				} else {
					manipulator.appendAndSelect(new Letter(txt));
				}							
			} else {
				manipulator.appendAndSelect(new Letter(txt));
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
			manipulator.insertAfterSelectedAndSelect(new Separator(txt))
		} else {
			let w = new Word();
			w.appendChild(new Letter(txt));
			manipulator.insertAfterSelectedAndSelect(w);
			w.setSelected();
		}
		return true;
	},

	// this is not a new version of lineDefault!
	// it's newlines. Which are deprecated anyway.
	'newlineDefault': function(nex, txt, context) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let isCommand = (context == ContextType.COMMAND);
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);
		if (isSeparator) {
			manipulator.insertAfterSelectedAndSelect(new Separator(txt));
		} else {
			if (isCommand) {
				manipulator.insertAfterSelectedAndSelect(new Letter(txt));
			} else {
				KeyResponseFunctions['insert-letter-after-separator'](txt);
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
		if (isSeparator) {
			manipulator.appendAndSelect(new Separator(txt));
		} else {
			if (manipulator.selectLastChild()) {
				selectedNex.appendChild(new Letter(txt));
			} else {
				let w = new Word();
				w.appendChild(new Letter(txt));
				manipulator.appendAndSelect(w);
			}
		}
		return true;
	},

	'integerDefault': function(nex, txt, context, sourcenode) {
		if (txt == 'Backspace') {
			if (nex.value == '0') {
				KeyResponseFunctions['remove-selected-and-select-previous-leaf'](sourcenode);
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
			manipulator.insertAfterSelectedAndSelect(new Separator(txt));
		} else {
			manipulator.insertAfterSelectedAndSelect(new Word())
				&& manipulator.appendAndSelect(new Letter(txt));
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
					&& manipulator.insertAfterSelectedAndSelect(new Separator(txt))
					&& manipulator.removeNex(sourcenode);
			} else {
				manipulator.replaceSelectedWith(new Separator(txt));		
			}
		} else {
			if (Utils.isDoc(parent)) {
				let ln = new RenderNode(new Line());
				let w = new RenderNode(new Word());
				let lt = new RenderNode(new Letter(txt));
				ln.appendChild(w);
				w.appendChild(lt);
				manipulator.replaceSelectedWith(ln);
				lt.setSelected();
			} else if (Utils.isLine(parent)) {
				let w = new RenderNode(new Word());
				let lt = new RenderNode(new Letter(txt));
				w.appendChild(lt);
				manipulator.replaceSelectedWith(w);
				lt.setSelected();
			} else {			
				manipulator.replaceSelectedWith(new Letter(txt));
			}
		}
		return true;
	},

	'floatDefault': function(nex, txt, context, sourcenode) {
		if (txt == 'Backspace') {
			// do backspace hack
			if (nex.value == '0') {
				KeyResponseFunctions['remove-selected-and-select-previous-leaf'](sourcenode);
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
			manipulator.insertAfterSelectedAndSelect(new Separator(txt));
		} else {
			manipulator.insertAfterSelectedAndSelect(new Word())
				&& manipulator.appendAndSelect(new Letter(txt));
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
			toInsert = new Separator(txt);
		} else {
			toInsert = new Letter(txt);
		}
		if (nex.hasChildren()) {
			manipulator.insertAfterSelectedAndSelect(toInsert)
		} else {
			manipulator.appendAndSelect(toInsert);
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
			manipulator.insertAfterSelectedAndSelect(new Separator(txt));
		} else {
			let letter = new Letter(txt);
			manipulator.insertAfterSelectedAndSelect(new Word())
				&& manipulator.appendAndSelect(txt);

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
			manipulator.insertAfterSelectedAndSelect(new Separator(txt))
		} else {
			let l = new RenderNode(new Letter(txt));
			let w = new RenderNode(new Word());
			w.appendChild(l);
			manipulator.insertAfterSelectedAndSelect(w);
			l.setSelected();
		}		
	},

	'insertAfterEError': function(nex, txt) {
		if (isNormallyHandled(txt)) {
			return false;
		}
		let letterRegex = /^[a-zA-Z0-9']$/;
		let isSeparator = !letterRegex.test(txt);

		if (isSeparator) {
			manipulator.insertAfterSelectedAndSelect(new Separator(txt))
		} else {
			manipulator.insertAfterSelectedAndSelect(new Word())
				&& selectedNex.getKeyFunnel().appendText(txt);
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
			manipulator.appendAndSelect(new Separator(txt))
		} else {
			manipulator.appendAndSelect(new Letter(txt))
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
				manipulator.insertAfterSelectedAndSelect(new Letter(txt))
			} else {
				manipulator.appendAndSelect(new Letter(txt));
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
				KeyResponseFunctions['split-word-and-insert-separator'](txt);				
			} else {
				manipulator.insertAfterSelectedAndSelect(new Separator(txt));				
			}
		} else {
			manipulator.insertAfterSelectedAndSelect(new Letter(txt));
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
			manipulator.insertAfterSelectedAndSelect(new Separator(txt));
		} else {
			if (isLine) {
				KeyResponseFunctions['insert-letter-after-separator'](txt);
			} else {
				manipulator.insertAfterSelectedAndSelect(new Letter(txt));
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
			manipulator.insertAfterSelectedAndSelect(new Separator(txt));
		} else {
			if (manipulator.selectLastChild()) {
				manipulator.insertAfterSelectedAndSelect(new Letter(txt));
			} else {
				manipulator.appendAndSelect(new Letter(txt))
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
			manipulator.insertAfterSelectedAndSelect(new Separator(txt));
		} else if (txt == 'y' || txt == 'Y') {
			nex.setValue('yes');
		} else if (txt == 'n' || txt == 'N') {
			nex.setValue('no');
		} else {
			let letter = new Letter(txt);
			manipulator.insertAfterSelectedAndSelect(new Word())
				&& manipulator.appendAndSelect(letter);

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
	// 'select-next-sibling': function(s) { manipulator.selectNextSibling(); },
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

	'start-lambda-editor': function(s) { s.startLambdaEditor(); },


	'replace-selected-with-command': function(s) { manipulator.replaceSelectedWith(new Command()); },
	'replace-selected-with-bool': function(s) { manipulator.replaceSelectedWith(new Bool()); },
	'replace-selected-with-symbol': function(s) { manipulator.replaceSelectedWith(new ESymbol()); },
	'replace-selected-with-integer': function(s) { manipulator.replaceSelectedWith(new Integer()); },
	'replace-selected-with-string': function(s) { manipulator.replaceSelectedWith(new EString()); },
	'replace-selected-with-float': function(s) { manipulator.replaceSelectedWith(new Float()); },
	'replace-selected-with-nil': function(s) { manipulator.replaceSelectedWith(new Nil()); },
	'replace-selected-with-lambda': function(s) { manipulator.replaceSelectedWith(new Lambda()) && systemState.getGlobalSelectedNode().startLambdaEditor(); },
	'replace-selected-with-expectation': function(s) { manipulator.replaceSelectedWith(new Expectation()); },
	'replace-selected-with-word': function(s) { manipulator.replaceSelectedWith(new Word()); },
	'replace-selected-with-line': function(s) { manipulator.replaceSelectedWith(new Line()); },
	'replace-selected-with-doc': function(s) { manipulator.replaceSelectedWith(new Doc()); },
	'replace-selected-with-org': function(s) { manipulator.replaceSelectedWith(new Org()); },

	'add-tag': function(s) { s.addTag(); },
	'remove-all-tags': function(s) { s.removeAllTags(); },

	'insert-or-append-command': function(s) { insertOrAppend(s, new Command()); },
	'insert-or-append-bool': function(s) { insertOrAppend(s, new Bool()); },
	'insert-or-append-symbol': function(s) { insertOrAppend(s, new ESymbol()); },
	'insert-or-append-integer': function(s) { insertOrAppend(s, new Integer()); },
	'insert-or-append-string': function(s) { insertOrAppend(s, new EString()); },
	'insert-or-append-float': function(s) { insertOrAppend(s, new Float()); },
	'insert-or-append-nil': function(s) { insertOrAppend(s, new Nil()); },
	'insert-or-append-lambda': function(s) {
		insertOrAppend(s, new Lambda())
		&& systemState.getGlobalSelectedNode().startLambdaEditor();
	},
	'insert-or-append-expectation': function(s) { insertOrAppend(s, new Expectation()); },
	'insert-or-append-word': function(s) { insertOrAppend(s, new Word()); },
	'insert-or-append-line': function(s) { insertOrAppend(s, new Line()); },
	'insert-or-append-doc': function(s) { insertOrAppend(s, new Doc()); },
	'insert-or-append-org': function(s) { insertOrAppend(s, new Org()); },

	'insert-command-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(new Command()); },
	'insert-bool-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(new Bool()); },
	'insert-symbol-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(new ESymbol()); },
	'insert-integer-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(new Integer()); },
	'insert-string-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(new EString()); },
	'insert-float-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(new Float()); },
	'insert-nil-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(new Nil()); },
	'insert-lambda-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(new Lambda())  && systemState.getGlobalSelectedNode().startLambdaEditor(); },
	'insert-expectation-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(new Expectation()); },
	'insert-word-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(new Word()); },
	'insert-line-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(new Line()); },
	'insert-doc-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(new Doc()); },
	'insert-zlist-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(new Zlist()); },
	'insert-org-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(new Org()); },


	'wrap-in-command': function(s) { manipulator.wrapSelectedInAndSelect(new Command()); },
	'wrap-in-lambda': function(s) { manipulator.wrapSelectedInAndSelect(new Lambda())  && systemState.getGlobalSelectedNode().startLambdaEditor(); },
	'wrap-in-expectation': function(s) { manipulator.wrapSelectedInAndSelect(new Expectation()); },
	'wrap-in-word': function(s) { manipulator.wrapSelectedInAndSelect(new Word()); },
	'wrap-in-line': function(s) { manipulator.wrapSelectedInAndSelect(new Line()); },
	'wrap-in-doc': function(s) { manipulator.wrapSelectedInAndSelect(new Doc()); },
	'wrap-in-org': function(s) { manipulator.wrapSelectedInAndSelect(new Org()); },


	// WIP
	'insert-type-as-next-sibling': function(s) {
		manipulator.insertAfterSelectedAndSelect(new Type());
	},

	'split-word-and-insert-separator': function(s) {
		manipulator.splitCurrentWordIntoTwo()
			&& manipulator.selectParent()
			&& manipulator.insertAfterSelectedAndSelect(new Separator(s));
	},

	'remove-separator-and-possibly-join-words': function(s) {
		manipulator.removeSelectedAndSelectPreviousLeaf();
		let p = systemState.getGlobalSelectedNode().getParent();
		manipulator.joinToSiblingIfSame(p);
	},

	// previously, inserting code objects in doc mode from a letter would append them to
	// the parent in a weird way.
	// all deprecated
	'legacy-insert-command-as-next-sibling-of-parent': function(s) { manipulator.selectParent() && manipulator.insertAfterSelectedAndSelect(new Command()); },
	'legacy-insert-bool-as-next-sibling-of-parent': function(s) { manipulator.selectParent() && manipulator.insertAfterSelectedAndSelect(new Bool()); },
	'legacy-insert-symbol-as-next-sibling-of-parent': function(s) { manipulator.selectParent() && manipulator.insertAfterSelectedAndSelect(new ESymbol()); },
	'legacy-insert-integer-as-next-sibling-of-parent': function(s) { manipulator.selectParent() && manipulator.insertAfterSelectedAndSelect(new Integer()); },
	'legacy-insert-string-as-next-sibling-of-parent': function(s) { manipulator.selectParent() && manipulator.insertAfterSelectedAndSelect(new EString()); },
	'legacy-insert-float-as-next-sibling-of-parent': function(s) { manipulator.selectParent() && manipulator.insertAfterSelectedAndSelect(new Float()); },
	'legacy-insert-nil-as-next-sibling-of-parent': function(s) { manipulator.selectParent() && manipulator.insertAfterSelectedAndSelect(new Nil()); },
	'legacy-insert-lambda-as-next-sibling-of-parent': function(s) { manipulator.selectParent() && manipulator.insertAfterSelectedAndSelect(new Lambda())  && systemState.getGlobalSelectedNode().startLambdaEditor(); },
	'legacy-insert-expectation-as-next-sibling-of-parent': function(s) { manipulator.selectParent() && manipulator.insertAfterSelectedAndSelect(new Expectation()); },


	'insert-letter-after-separator': function(s) {
		let newword = new Word();
		newword = new RenderNode(newword);
		let newletter = new Letter(s);
		newletter = new RenderNode(newletter);
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
			|| manipulator.appendAndSelect(new Line());
		manipulator.selectLastChild()
			|| manipulator.appendAndSelect(new Word());
		if (manipulator.selectLastChild()) {
			manipulator.insertAfterSelectedAndSelect(new Letter(s));
		} else {
			manipulator.appendAndSelect(new Letter(s))
		}
	},

	'append-separator-to-doc': function(s) {
		manipulator.selectLastChild()
			|| manipulator.appendAndSelect(new Line());
		manipulator.appendAndSelect(new Separator(s));
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
		let newline = new RenderNode(new Newline());
		manipulator.insertAfterSelected(newline)
			&& manipulator.putAllNextSiblingsInNewLine()
			&& newline.setSelected();
	},

	'do-line-break-from-line': function(s) {
		if (Utils.isDoc(s.getParent())) {
			manipulator.insertAfterSelectedAndSelect(new Line())
				&& manipulator.appendAndSelect(new Newline());
		} else {
			let newline = new RenderNode(new Newline());
			manipulator.insertAfterSelected(newline)
				&& manipulator.putAllNextSiblingsInNewLine()
				&& newline.setSelected();
		}		
	},

	'replace-selected-with-word-correctly': function(s) {
		let selected = systemState.getGlobalSelectedNode();
		let obj = new RenderNode(new Word());
		if (Utils.isDoc(selected.getParent())) {
			let ln = new RenderNode(new Line());
			ln.appendChild(obj);
			manipulator.replaceSelectedWith(ln);
			obj.setSelected();
		} else {
			manipulator.replaceSelectedWith(obj);
		}
	},


	'do-line-break-after-letter': function(s) {
		let newline = new RenderNode(new Newline());
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