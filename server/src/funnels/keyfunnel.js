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


var ESCAPED = false;

class KeyFunnel {

	constructor(sel) {
		this.s = sel;
	}

	keyCancels(key) {
		return key != 'Shift'
			&& key != 'Control'
			&& key != 'Meta'
			&& key != 'Alt'
			&& key != '`'
			;
	}

	cancelEscape() {
		ESCAPED = false;
	}

	startEscape() {
		ESCAPED = true;
	}

	isEscaped() {
		return ESCAPED;
	}

	processEvent(keycode, whichkey, hasShift, hasCtrl, hasAlt) {
		let spaceRegex = /^ $/;
		let regularKeyRegex = /^[a-zA-Z0-9']$/;
		let separatorKeyRegex = /^[~!@#$%^&*()_+={}|[\]\\:";<>?,./-]$/;
		if (keycode == '|') {
			// vertical bar is unusable - 'internal use only'
		} else if (keycode == 'x' && hasAlt) {
			manipulator.doCut();
		} else if (keycode == 'c' && hasAlt) {
			manipulator.doCopy();
		} else if (keycode == 'v' && hasAlt) {
			manipulator.doPaste();
		} else if (keycode == '`') {
			if (this.isEscaped()) {
				this.appendText('`');
				this.cancelEscape();
			} else {
				this.startEscape();
			}
		} else if (keycode == '~' && !this.isEscaped()) {
			this.doTilde();
		} else if (keycode == '!' && !this.isEscaped()) {
			this.doBang();
		} else if (keycode == '@' && !this.isEscaped()) {
			this.doAtSign();
		} else if (keycode == '#' && !this.isEscaped()) {
			this.doPoundSign();
		} else if (keycode == '$' && !this.isEscaped()) {
			this.doDollarSign();
		} else if (keycode == '%' && !this.isEscaped()) {
			this.doPercentSign();
		} else if (keycode == '^' && !this.isEscaped()) {
			this.doCarat();
		} else if (keycode == '&' && !this.isEscaped()) {
			this.doAmpersand();
		} else if (keycode == '?' && this.isEscaped()) {
			this.doQuestionMark(); // NOTE: question marks work the other way
		} else if (keycode == '(' && !this.isEscaped()) {
			this.doOpenParen();
		} else if (keycode == '[' && !this.isEscaped()) {
			this.doOpenBracket();
		} else if (keycode == '{' && !this.isEscaped()) {
			this.doOpenBrace();
		} else {
			if (regularKeyRegex.test(keycode)) {
				this.appendText(keycode, this.isEscaped());
			} else if (separatorKeyRegex.test(keycode)) {
				this.appendSeparator(keycode, this.isEscaped());
			} else if (spaceRegex.test(keycode) && !hasShift) {
				this.doSpace();
			} else if (spaceRegex.test(keycode) && hasShift) {
				this.doShiftSpace();
			} else if (keycode == 'Backspace' && !hasShift) {
				this.doBackspace();
			} else if (keycode == 'Backspace' && hasShift) {
				this.doShiftBackspace();
			} else if (keycode == 'Enter' && hasShift) {
				/// SHIFT-ENTER REPRESENTS AN INTENT TO RUN CODE
				/// SO STACK SHOULD BE RESET HERE
				resetStack();
				this.doShiftEnter();
			} else if (keycode == 'Enter' && hasAlt) {
				resetStack();
				this.doAltEnter();
			} else if (keycode == 'Enter') {
				this.doEnter();
			} else if (keycode == 'Escape') {
				this.doEscape();
			} else if (keycode == 'ArrowUp') {
				this.doArrowUp();
			} else if (keycode == 'ArrowDown') {
				this.doArrowDown();
			} else if (keycode == 'ArrowRight') {
				this.doArrowRight();
			} else if (keycode == 'ArrowLeft') {
				this.doArrowLeft();
			} else if (keycode == 'Delete') {
				this.doBackspace(true);
			} else if (keycode == 'Tab' && hasShift) {
				this.doShiftTab();
			} else if (keycode == 'Tab' && !hasShift) {
				this.doTab();
			}
		}
		// turn off escaping if some other non-escapable key is pressed.
		if (this.keyCancels(keycode)) {
			this.cancelEscape();
		}
		return false;
	}

	insertNewCodeObject(obj) {}
	insertNewListType(obj) {
		this.insertNewCodeObject(obj);
	}

	doTilde() {
		this.insertNewCodeObject(new Command());
	}
	doBang() {
		this.insertNewCodeObject(new Bool());
	}
	doAtSign() {
		this.insertNewCodeObject(new ESymbol());
	}
	doPoundSign() {
		this.insertNewCodeObject(new Integer());
	}
	doDollarSign() {
		this.insertNewCodeObject(new EString());
	}
	doPercentSign() {
		this.insertNewCodeObject(new Float());
	}
	doCarat() {
		this.insertNewCodeObject(new Nil());
	}
	doQuestionMark() {
		this.insertNewCodeObject(new EError());
	}
	doAmpersand() {
		this.insertNewCodeObject(new Lambda());
	}
	doOpenParen() {
		this.insertNewListType(new Word());
	}
	doOpenBracket() {
		this.insertNewListType(new Line());
	}
	doOpenBrace() {
		this.insertNewListType(new Doc());
	}

	doBackspace() {
		this.doShiftBackspace();
	}

	doShiftBackspace() {
	}

	doTab() {}
	doShiftTab() {
		manipulator.selectParent();
	}

	appendText(letter) {}
	appendSeparator(letter) {}


	doArrowUp() {}
	doArrowDown() {}
	doArrowLeft() {}
	doArrowRight() {}

	doEscape() {
		current_render_type = (
			current_render_type == NEX_RENDER_TYPE_EXPLODED
			? NEX_RENDER_TYPE_NORMAL
			:  NEX_RENDER_TYPE_EXPLODED
			);
		root.setRenderType(current_render_type);
		root.render();
	}

	doEnter() {}
	doShiftEnter() {
		let n;
		try {
			n = this.s.evaluate(BUILTINS);
		} catch (e) {
			if (e instanceof EError) {
				n = e;
			} else {
				throw e;
			}
		}
		if (n) {
			manipulator.replaceSelectedWith(n);
		}
	}

	doAltEnter() {
		let phaseExecutor = this.s.phaseExecutor;
		let firstStep = false;
		if (!phaseExecutor) {
			firstStep = true;
			phaseExecutor = new PhaseExecutor();
			this.s.pushNexPhase(phaseExecutor, BUILTINS);
		}
		phaseExecutor.doNextStep();
		if (!phaseExecutor.finished()) {
			// the resolution of an expectation will change the selected nex,
			// so need to set it back
			if (firstStep) {
				// the first step is PROBABLY an expectation phase
				let operativeNex = this.s.getParent();
				operativeNex.setSelected();
				operativeNex.phaseExecutor = phaseExecutor;
			} else {
				this.s.setSelected();
			}
		} else {
			// if I don't explicitly set the selected nex, it'll be the
			// result of the last resolved expectation, probably
			this.s.phaseExecutor = null;
		}
	}

	doSpace() {
		this.appendSeparator(' ');
	}

	doShiftSpace() {
		this.doSpace();
	}
}