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

class LambdaBindingPhase extends Phase {
	constructor(phaseExecutor, command, env) {
		super();
		this.phaseExecutor = phaseExecutor;
		this.command = command;
		this.env = env;
		this.commandCallback = null;
	}

	isStarted() {
		return true;
	}

	setCommandCallback(commandCallback) {
		this.commandCallback = commandCallback;
	}

	finish() {
		let lambda = this.command.getLambda(this.env);
		this.commandCallback.setLambda(lambda);
		let closure = lambda.lexicalEnv.pushEnv();
		let args = [];
		for (let i = 0; i < this.command.children.length; i++) {
			args.push(this.command.children[i]);
		}
		lambda.bind(args, closure);
		let parent = RENDERNODES
				? this.command.getRenderNodes()[0].getParent().getNex()
				: this.command.getParent();
		parent.replaceChildWith(this.command, lambda);
		this.phaseExecutor.pushPhase(new LambdaExecutePhase(this.phaseExecutor, lambda, closure));
	}
}
