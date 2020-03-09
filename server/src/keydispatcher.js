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

// use this wrapper to handle exceptions correctly, this
// saves us from having to put exception handling in every
// type of nex that can be evaluated.
function evaluateNexSafely(nex, env) {
	let result;
	try {
		result = nex.evaluate(env);
	} catch (e) {
		if (e instanceof EError) {
			result = e;
		} else {
			throw e;
		}
	}
	return result;
}

function wrapError(prefix, message, inner) {
	let e = new EError(message, prefix);
	e.appendChild(inner);
	return e;
}

// s is either the nex or the node depending on RENDERNODES
function insertOrAppend(s, obj) {
	if (s.hasChildren()) {
		manipulator.insertAfterSelectedAndSelect(obj);
	} else {
		manipulator.appendAndSelect(obj);
	}
}

function evaluateAndReplace(s) {
	if (RENDERNODES) {
		let n = evaluateNexSafely(s.getNex(), BUILTINS);
		if (n) {
			manipulator.replaceSelectedWith(new RenderNode(n));
		}
	} else {
		let n = evaluateNexSafely(s, BUILTINS);
		if (n) {
			manipulator.replaceSelectedWith(n);			
		}
	}
}

var UNHANDLED_KEY = 'unhandled_key'
var ContextType = {};
ContextType.PASSTHROUGH = 0;
ContextType.COMMAND = 1;
ContextType.DOC = 2;

function isNormallyHandled(key) {
	if (!(/^.$/.test(key))) {
		return true;
	}
	if (/^[~!@#$%^*&([{]$/.test(key)) {
		return true;
	}
	return false;
}

// These KeyResponseFunctions are all untested and not integrated. Need to integrate
// one at a time and test.

var KeyResponseFunctions = {
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

	'toggle-dir': function(s) {
		(RENDERNODES ? s.getNex() : s).toggleDir();
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
		(RENDERNODES ? s.getNex() : s).startModalEditing();
	},

	'replace-selected-with-command': function(s) { manipulator.replaceSelectedWith(new Command()); },
	'replace-selected-with-bool': function(s) { manipulator.replaceSelectedWith(new Bool()); },
	'replace-selected-with-symbol': function(s) { manipulator.replaceSelectedWith(new ESymbol()); },
	'replace-selected-with-integer': function(s) { manipulator.replaceSelectedWith(new Integer()); },
	'replace-selected-with-string': function(s) { manipulator.replaceSelectedWith(new EString()); },
	'replace-selected-with-float': function(s) { manipulator.replaceSelectedWith(new Float()); },
	'replace-selected-with-nil': function(s) { manipulator.replaceSelectedWith(new Nil()); },
	'replace-selected-with-lambda': function(s) { manipulator.replaceSelectedWith(new Lambda()); },
	'replace-selected-with-expectation': function(s) { manipulator.replaceSelectedWith(new Expectation()); },
	'replace-selected-with-word': function(s) { manipulator.replaceSelectedWith(new Word()); },
	'replace-selected-with-line': function(s) { manipulator.replaceSelectedWith(new Line()); },
	'replace-selected-with-doc': function(s) { manipulator.replaceSelectedWith(new Doc()); },

	'insert-or-append-command': function(s) { insertOrAppend(s, new Command()); },
	'insert-or-append-bool': function(s) { insertOrAppend(s, new Bool()); },
	'insert-or-append-symbol': function(s) { insertOrAppend(s, new ESymbol()); },
	'insert-or-append-integer': function(s) { insertOrAppend(s, new Integer()); },
	'insert-or-append-string': function(s) { insertOrAppend(s, new EString()); },
	'insert-or-append-float': function(s) { insertOrAppend(s, new Float()); },
	'insert-or-append-nil': function(s) { insertOrAppend(s, new Nil()); },
	'insert-or-append-lambda': function(s) { insertOrAppend(s, new Lambda()); },
	'insert-or-append-expectation': function(s) { insertOrAppend(s, new Expectation()); },
	'insert-or-append-word': function(s) { insertOrAppend(s, new Word()); },
	'insert-or-append-line': function(s) { insertOrAppend(s, new Line()); },
	'insert-or-append-doc': function(s) { insertOrAppend(s, new Doc()); },


	'insert-command-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(new Command()); },
	'insert-bool-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(new Bool()); },
	'insert-symbol-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(new ESymbol()); },
	'insert-integer-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(new Integer()); },
	'insert-string-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(new EString()); },
	'insert-float-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(new Float()); },
	'insert-nil-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(new Nil()); },
	'insert-lambda-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(new Lambda()); },
	'insert-expectation-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(new Expectation()); },
	'insert-word-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(new Word()); },
	'insert-line-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(new Line()); },
	'insert-doc-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(new Doc()); },
	'insert-zlist-as-next-sibling': function(s) { manipulator.insertAfterSelectedAndSelect(new Zlist()); },

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
		let p = (RENDERNODES ? selectedNode : selectedNex).getParent();
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
	'legacy-insert-lambda-as-next-sibling-of-parent': function(s) { manipulator.selectParent() && manipulator.insertAfterSelectedAndSelect(new Lambda()); },
	'legacy-insert-expectation-as-next-sibling-of-parent': function(s) { manipulator.selectParent() && manipulator.insertAfterSelectedAndSelect(new Expectation()); },


	'insert-letter-after-separator': function(s) {
		let newword = new Word();
		if (RENDERNODES) {
			newword = new RenderNode(newword);
		}
		let newletter = new Letter(s);
		if (RENDERNODES) {
			newletter = new RenderNode(newletter);
		}
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
		(RENDERNODES ? s.getNex() : s).callDeleteHandler();
		manipulator.removeSelectedAndSelectPreviousSibling();
	},

	'remove-selected-and-select-previous-sibling': function(s) {
		manipulator.removeSelectedAndSelectPreviousSibling();
	},

	'delete-last-command-letter-or-remove-selected-and-select-previous-sibling': function(s) {
		if (!(RENDERNODES ? s.getNex() : s).isEmpty()) {
			(RENDERNODES ? s.getNex() : s).deleteLastCommandLetter();
		} else {
			manipulator.removeSelectedAndSelectPreviousSibling();
		}
	},

	'delete-last-amp-letter-or-remove-selected-and-select-previous-sibling': function(s) {
		if (!(RENDERNODES ? s.getNex() : s).isEmpty()) {
			(RENDERNODES ? s.getNex() : s).deleteLastAmpLetter();
		} else {
			manipulator.removeSelectedAndSelectPreviousSibling();
		}
	},

	'delete-last-letter-or-remove-selected-and-select-previous-leaf': function(s) {
		if (!(RENDERNODES ? s.getNex() : s).isEmpty()) {
			(RENDERNODES ? s.getNex() : s).deleteLastLetter();
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
		let newline = RENDERNODES ? new RenderNode(new Newline()) : new Newline();
		manipulator.insertAfterSelected(newline)
			&& manipulator.putAllNextSiblingsInNewLine()
			&& newline.setSelected();
	},

	'do-line-break-from-line': function(s) {
		if (isDoc(s.getParent())) {
			manipulator.insertAfterSelectedAndSelect(new Line())
				&& manipulator.appendAndSelect(new Newline());
		} else {
			let newline = RENDERNODES ? new RenderNode(new Newline()) : new Newline();
			manipulator.insertAfterSelected(newline)
				&& manipulator.putAllNextSiblingsInNewLine()
				&& newline.setSelected();
		}		
	},

	'replace-selected-with-word-correctly': function(s) {
		let selected = RENDERNODES ? selectedNode : selectedNex;
		let obj = RENDERNODES ? new RenderNode(new Word()) : new Word();
		if (isDoc(selected.getParent())) {
			let ln = RENDERNODES ? new RenderNode(new Line()) : new Line();
			ln.appendChild(obj);
			manipulator.replaceSelectedWith(ln);
			obj.setSelected();
		} else {
			manipulator.replaceSelectedWith(obj);
		}
	},


	'do-line-break-after-letter': function(s) {
		let newline = RENDERNODES ? new RenderNode(new Newline()) : new Newline();
		if (isWord(s.getParent())) {
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
			s = RENDERNODES ? selectedNode : selectedNex;
			let line;
			let word;
			// when we selected the previous sibling, we may be:
			// 1. in a word that's inside a line
			// 2. in a line
			// 3. neither
			let parent = s.getParent();
			if ((RENDERNODES ? parent.getNex() : parent) instanceof Line) {
				manipulator.joinToSiblingIfSame(parent);
				return true;
			}
			let parent2 = parent.getParent();
			if (parent2 != null) {
				if ((RENDERNODES ? parent2.getNex() : parent2) instanceof Line) {
					manipulator.joinToSiblingIfSame(parent2);
					// not done yet -- we also need to join words if applicable
					if ((RENDERNODES ? parent.getNex() : parent) instanceof Word) {
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

class KeyDispatcher {
	dispatch(keycode, whichkey, hasShift, hasCtrl, hasAlt) {
		let keyContext = ContextType.COMMAND;
		if (RENDERNODES) {
			let p = selectedNode.getParent();
			if (p) {
				while((keyContext = p.getNex().getContextType()) == ContextType.PASSTHROUGH) {
					p = p.getParent();
				}
			}
		} else {
			let p = selectedNex.getParent();
			if (p) {
				while((keyContext = p.getContextType()) == ContextType.PASSTHROUGH) {
					p = p.getParent();
				}
			}
		}
		let eventName = this.getEventName(keycode, hasShift, hasCtrl, hasAlt);
		// there are a few special cases
		if (eventName == '|') {
			// vertical bar is unusable - 'internal use only'
			return false; // to cancel browser event
		} else if (eventName == 'Alt-x') {
			manipulator.doCut();
			return false; // to cancel browser event
		} else if (eventName == 'Alt-c') {
			manipulator.doCopy();
			return false; // to cancel browser event
		} else if (eventName == 'Alt-v') {
			manipulator.doPaste();
			return false; // to cancel browser event
		} else if (eventName == 'Escape') {
			this.doEscape();
			return false; // to cancel browser event
		} else if (eventName == 'AltEnter') {
			this.doAltEnter();
			return false; // to cancel browser event
		// TODO: string opening and closing is mapped to shift-enter,
		// but this should be reserved for only executing code.
//		} else if (eventName == 'ShiftEnter') {
//			this.doShiftEnter();
//			return false; // to cancel browser event
		} else if (eventName == '`') {
			// reserved for future use
			return false; // to cancel browser event
		} else {
			// 1. look in override table
			// 2. look in regular table
			// 3. call defaultHandle
			// otherwise try the table first, then the keyfunnel
			try {
				let sourceNex = (RENDERNODES ? selectedNode.getNex() : selectedNex);
				let parentNex = null;
				if (RENDERNODES) {
					if (selectedNode.getParent()) {
						parentNex = selectedNode.getParent().getNex();
					}
				} else {
					parentNex = selectedNex.getParent();
				}
				// returning false here means we tell the browser not to process the event.
				if (RENDERNODES) {
					if (this.runDefaultHandle(sourceNex, eventName, keyContext, selectedNode)) return false;
				} else {
					if (this.runDefaultHandle(sourceNex, eventName, keyContext)) return false;
				}
				if (this.runFunctionFromOverrideTable(sourceNex, parentNex, eventName)) return false;
				if (this.runFunctionFromRegularTable(sourceNex, eventName)) return false;
				if (this.runFunctionFromGenericTable(sourceNex, eventName)) return false;
				return true; // didn't handle it.
			} catch (e) {
				if (e == UNHANDLED_KEY) {
					console.log("UNHANDLED KEY " +
									':' + 'keycode=' + keycode +
									',' + 'whichkey=' + whichkey +
									',' + 'hasShift=' + hasShift +
									',' + 'hasCtrl=' + hasCtrl +
									',' + 'hasAlt=' + hasAlt);
					return true;
				} else throw e;
			}
		}
	}

	runDefaultHandle(sourceNex, eventName, context, sourceNode /* null if not RENDERNODES */) {
		return sourceNex.defaultHandle(eventName, context, sourceNode);
	}

	runFunctionFromGenericTable(sourceNex, eventName) {
		let table = null;
		if (sourceNex instanceof NexContainer) {
			table = this.getNexContainerGenericTable();
		} else {
			table = this.getNexGenericTable();
		}
		let f = table[eventName];
		if (f && this.actOnFunction(f)) {
			return true;
		}
		return false;
	}

	runFunctionFromRegularTable(sourceNex, eventName) {
		let table = sourceNex.getEventTable();
		if (!table) {
			return false;
		}
		let f = table[eventName];
		if (f && this.actOnFunction(f)) {
			return true;
		}
		return false;
	}

	runFunctionFromOverrideTable(sourceNex, parentNex, eventName) {
		if (!parentNex) {
			return false;
		}
		let table = parentNex.getEventOverride();
		let nexTypeName = sourceNex.getTypeName();
		if (!table) {
			return false;
		}
		let subtable = null;
		let f = null;
		subtable = table[parentTypeName];
		if (subtable) {
			let f = subtable[eventName];
			if (f && this.actOnFunction(f)) {
				return true;
			}
		}
		subtable = table['*'];
		if (subtable) {
			let f = subtable[eventName];
			if (f && this.actOnFunction(f)) {
				return true;
			}
		}
		return null;
	}

	// returns true if it was a valid function that could be run
	actOnFunction(f) {
		if ((typeof f) == 'string') {
			KeyResponseFunctions[f](RENDERNODES ? selectedNode : selectedNex);
			return true;
		} else if ((typeof f) == 'function') {
			f(RENDERNODES ? selectedNode : selectedNex);
			return true;
		} else if (f instanceof Nex) {
			evaluateNexSafely(f, BUILTINS)
			return true;
		}
		return false;
	}

	getEventName(keycode, hasShift, hasCtrl, hasAlt) {
		if (keycode == 'Enter' && hasAlt) {
			return 'AltEnter';
		} else if (keycode == 'Enter' && hasShift) {
			return 'ShiftEnter';
		} else if (keycode == 'Tab' && hasShift) {
			return 'ShiftTab';
		} else if (keycode == ' ' && hasShift) {
			return 'ShiftSpace';
		// } else if (keycode == ' ') {
		// 	return 'Space';
		} else if (keycode == 'Backspace' && hasShift) {
			return 'ShiftBackspace';
		} else if (keycode == 'x' && hasAlt) {
			return 'Alt-x';
		} else if (keycode == 'c' && hasAlt) {
			return 'Alt-c';
		} else if (keycode == 'v' && hasAlt) {
			return 'Alt-v';
		} else {
			return keycode;
		}
	}

	doEscape() {
		if (current_default_render_flags & RENDER_FLAG_EXPLODED) {
			current_default_render_flags &= (~RENDER_FLAG_EXPLODED);
		} else {
			current_default_render_flags |= RENDER_FLAG_EXPLODED;
		}
	}

	doAltEnter() {
		isStepEvaluating = true;
		try {
			let s = RENDERNODES ? selectedNode.getNex() : selectedNex;
			let phaseExecutor = s.phaseExecutor;
			let firstStep = false;
			if (!phaseExecutor) {
				firstStep = true;
				phaseExecutor = new PhaseExecutor();
				if (RENDERNODES) {
					// need to copy the selected nex, replace it in the parent, and discard!
					let copiedNex = selectedNode.getNex().makeCopy();
					let parentNode = selectedNode.getParent();
					let parentNex = parentNode.getNex();
					parentNex.replaceChildWith(selectedNode.getNex(), copiedNex);
					// rerender the parent to refresh/fix the cached childnodes in it
					parentNode.childnodes = []; // wtf
					parentNode.render(current_default_render_flags);
					let index = parentNex.getIndexOfChild(copiedNex);
					let newSelectedNode = parentNode.getChildAt(index);
					newSelectedNode.setSelected();
					topLevelRender();
					s = selectedNode.getNex();
				}
				s.pushNexPhase(phaseExecutor, BUILTINS);
			}
			phaseExecutor.doNextStep();
			if (RENDERNODES) {
				// to fix up all the pointers and stuff so that getParent works right below.
				topLevelRender();
			}
			if (!phaseExecutor.finished()) {
				// the resolution of an expectation will change the selected nex,
				// so need to set it back
				if (firstStep) {
					// the first step is PROBABLY an expectation phase
					if (RENDERNODES) {
						let operativeNode = s.getRenderNodes()[0].getParent();
						let operativeNex = operativeNode.getNex();
						operativeNode.setSelected();
						operativeNex.phaseExecutor = phaseExecutor;
					} else {
						let operativeNex = s.getParent();
						operativeNex.setSelected();
						operativeNex.phaseExecutor = phaseExecutor;
					}
				} else {
					RENDERNODES ? s.getRenderNodes()[0].setSelected() : s.setSelected();
				}
			} else {
				// if I don't explicitly set the selected nex, it'll be the
				// result of the last resolved expectation, probably
				s.phaseExecutor = null;
			}
		} finally {
			isStepEvaluating = false;
		}
	}

	getNexContainerGenericTable() {
		return {
			'ShiftTab': 'select-parent',
			'Tab': 'select-first-child-or-create-insertion-point',
			'ArrowUp': 'move-left-up',
			'ArrowLeft': 'move-left-up',
			'ArrowDown': 'move-right-down',
			'ArrowRight': 'move-right-down',
			'ShiftBackspace': 'remove-selected-and-select-previous-sibling',
			'Backspace': 'remove-selected-and-select-previous-sibling',
			'ShiftEnter': 'evaluate-nex',
			'~': 'insert-or-append-command',
			'!': 'insert-or-append-bool',
			'@': 'insert-or-append-symbol',
			'#': 'insert-or-append-integer',
			'$': 'insert-or-append-string',
			'%': 'insert-or-append-float',
			'^': 'insert-or-append-nil',
			'&': 'insert-or-append-lambda',
			'*': 'insert-or-append-expectation',
			'(': 'insert-or-append-word',
			'[': 'insert-or-append-line',
			'{': 'insert-or-append-doc',
		};
	}

	getNexGenericTable() {
		return {
			'ShiftTab': 'select-parent',
			'Tab': 'select-next-sibling',
			'ArrowUp': 'move-left-up',
			'ArrowDown': 'move-right-down',
			'ArrowLeft': 'move-left-up',
			'ArrowRight': 'move-right-down',
			'ShiftBackspace': 'remove-selected-and-select-previous-sibling',
			'Backspace': 'remove-selected-and-select-previous-sibling',
			'ShiftEnter': 'evaluate-nex',
			'~': 'insert-command-as-next-sibling',
			'!': 'insert-bool-as-next-sibling',
			'@': 'insert-symbol-as-next-sibling',
			'#': 'insert-integer-as-next-sibling',
			'$': 'insert-string-as-next-sibling',
			'%': 'insert-float-as-next-sibling',
			'^': 'insert-nil-as-next-sibling',
			'&': 'insert-lambda-as-next-sibling',
			'*': 'insert-expectation-as-next-sibling',
			'(': 'insert-word-as-next-sibling',
			'[': 'insert-line-as-next-sibling',
			'{': 'insert-doc-as-next-sibling',
		};
	}
}