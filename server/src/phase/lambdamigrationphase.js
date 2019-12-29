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


// for future use - right now things probably break if you try the
// first-arg-is-a-lambda version of command execution.
class LambdaMigrationPhase extends Phase {
	constructor(phaseExecutor, command, env) {
		super();
		this.phaseExecutor = phaseExecutor;
		this.command = command;
		this.env = env;
	}

	isStarted() {
		// one-step operations are pre-started
		return true;
	}

	finish() {
		let cmdtxt = this.command.getCommandText();
		let sym = new ESymbol(cmdtxt);
		this.command.setCommandText('');
		this.command.insertChildAt(sym, 0);
	 	phaseExecutor.pushPhase(new SymbolLookupPhase(sym, env));
	}
}
