

const UNDO_LIMIT = 10;

class Undo {
	constructor() {
		this.undobuffer = [];
	}

	canUndo() {
		return this.undobuffer.length > 0;
	}

	saveForUndo(nex) {
		this.undobuffer.unshift(nex.makeCopy());
		if (this.undobuffer.length > UNDO_LIMIT) {
			this.undobuffer.pop();
		}
	}

	getForUndo() {
		return this.undobuffer.shift();
	}
}

export { Undo }