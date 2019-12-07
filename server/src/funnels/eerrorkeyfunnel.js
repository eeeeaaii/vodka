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



class EErrorKeyFunnel extends EStringKeyFunnel {
	constructor(sel) {
		super(sel)
	}

	doTilde() {
		this.s.setMode(MODE_NORMAL);
		super.doTilde();
	}
	doBang() {
		this.s.setMode(MODE_NORMAL);
		super.doBang();
	}
	doAtSign() {
		this.s.setMode(MODE_NORMAL);
		super.doAtSign();
	}
	doPoundSign() {
		this.s.setMode(MODE_NORMAL);
		super.doPoundSign();
	}
	doDollarSign() {
		this.s.setMode(MODE_NORMAL);
		super.doDollarSign();
	}
	doPercentSign() {
		this.s.setMode(MODE_NORMAL);
		super.doPercentSign();
	}
	doCarat() {
		this.s.setMode(MODE_NORMAL);
		super.doCarat();
	}
	doQuestionMark() {
		this.s.setMode(MODE_NORMAL);
		super.doQuestionMark();
	}
	doOpenParen() {
		this.s.setMode(MODE_NORMAL);
		super.doOpenParen();
	}
	doOpenBracket() {
		this.s.setMode(MODE_NORMAL);
		super.doOpenBracket();
	}
	doOpenBrace() {
		this.s.setMode(MODE_NORMAL);
		super.doOpenBrace();
	}
	doTab() {
		this.s.setMode(MODE_NORMAL);
		super.doTab();
	}
	doShiftTab() {
		this.s.setMode(MODE_NORMAL);
		super.doShiftTab();
	}
	doArrowLeft() {
		this.s.setMode(MODE_NORMAL);
		super.doArrowLeft();
	}
	doArrowRight() {
		this.s.setMode(MODE_NORMAL);
		super.doArrowRight();
	}

	doArrowUp() {
		this.s.setMode(MODE_NORMAL);
		super.doArrowUp();
	}
	doArrowDown() {
		this.s.setMode(MODE_NORMAL);
		super.doArrowDown();
	}
	appendText(letter) {
		this.s.setMode(MODE_NORMAL);
		super.appendText(letter);
	}
	appendSeparator(letter) {
		this.s.setMode(MODE_NORMAL);
		super.appendSeparator(letter);
	}

	doShiftBackspace() {
		this.s.setMode(MODE_NORMAL);
		super.doShiftBackspace();
	}

	doBackspace() {
		this.s.setMode(MODE_NORMAL);
		super.doShiftBackspace();
	}

	doSpace() {
		this.s.setMode(MODE_NORMAL);
		super.doSpace();
	}
	doEnter() {
		this.s.setMode(MODE_NORMAL);
		super.doEnter();
	}

	doShiftEnter() {
		this.s.toggleRendering();
	}
}