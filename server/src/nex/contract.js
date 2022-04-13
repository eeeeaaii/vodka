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

import * as Utils from '../utils.js'

import { NexContainer } from './nexcontainer.js'
// import { ArgEvaluator } from '../argevaluator.js'
// import { Nil } from './nil.js'
// import { Org } from './org.js'
// import { wrapError, evaluateNexSafely } from '../evaluator.js'
// import { BINDINGS, BUILTINS } from '../environment.js'
// import { experiments } from '../globalappflags.js'

class Contract extends NexContainer {
	constructor(contractImpl) {
		super()
		this.impl = contractImpl;
		this.privateData = null; // unused
		this.contractTags = [];
	}

	addContractTag(t) {
		this.contractTags.push(t);
	}

	getImpl() {
		return this.impl;
	}

	toString(version) {
		if (version == 'v2') {
			return `[CONTRACT]`;
		}
		return super.toString(version);
	}

	prettyPrintInternal(lvl, hdir) {
		return this.standardListPrettyPrint(lvl, '[contract]', hdir);
	}

	toStringV2() {
		return `${this.toStringV2Literal()}${this.toStringV2PrivateDataSection()}${this.listStartV2()}${this.toStringV2TagList()}${super.childrenToString('v2')}${this.listEndV2()}`;
	}

	deserializePrivateData(data) {
		this.privateData = data;
	}

	serializePrivateData(data) {
		return this.privateData;
	}

	evaluate(env) {
		return this;
	}

	makeCopy(shallow) {
		let r = new Contract();
		this.copyChildrenTo(r, shallow);
		this.copyFieldsTo(r);
		return r;
	}

	copyFieldsTo(nex) {
		super.copyFieldsTo(nex);
		nex.impl = this.impl;
	}

	insertChildAt(c, i) {
		if (c.getTypeName() != '-contract-') {
			throw new EError('contracts can only hold other contracts.');
		}
		this.impl.addChildAt(c.getImpl(), i);
		super.insertChildAt(c, i);
	}

	removeChildAt(i) {
		this.impl.removeChildAt(i);
		super.removeChildAt(i);
	}

	fastAppendChildAfter(c, after) {
		if (c.getTypeName() != '-contract-') {
			throw new EError('contracts can only hold other contracts.');
		}
		let n = this.numChildren() - 1;
		for (let i = 0; i < this.numChildren(); i++) {
			if (this.getChildAt(i) == after) {
				n = i;
			}
		}
		super.fastAppendChildAfter(c, after);
		n = n + 1;
		this.impl.addChildAt(c.getImpl(), n);
	}

	renderInto(renderNode, renderFlags, withEditor) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags, withEditor);
		domNode.classList.add('contract');

		let frame = document.createElement('div');
		frame.classList.add('contractframe');

		let glyph = document.createElement('div');
		glyph.classList.add('cglyph');
		if (this.numChildren() > 0) {
			glyph.innerHTML = '&#8225;'; // double dagger
		} else {
			glyph.innerHTML = '&#8224;'; // regular dagger
		}

		let innerspans = document.createElement('div');
		innerspans.classList.add('cinnerspans')

		let innerspan = document.createElement("div");
		innerspan.classList.add('innerspan');
		innerspan.innerHTML = '' + this.impl.getName();
		innerspans.appendChild(innerspan);

		let innerspan2 = document.createElement("div");
		innerspan2.classList.add('innerspan');
		innerspan2.innerHTML = '' + this.impl.getDescription();
		innerspans.appendChild(innerspan2);

		if (this.contractTags.length > 0) {
			let tagspan = document.createElement("div");
			tagspan.classList.add('tagspan');
			for (let i = 0; i < this.contractTags.length; i++) {
				let t = this.contractTags[i];
				t.setIsGhost(true);
				t.draw(tagspan, true);
			}
			innerspans.appendChild(tagspan);
		}

		frame.appendChild(glyph);
		frame.appendChild(innerspans);

		domNode.appendChild(frame);
	}

	getTypeName() {
		return '-contract-';
	}
}

export { Contract }
