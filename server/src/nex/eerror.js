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


class EError extends NexContainer {
	constructor(val, prefix) {
		super();
		if (!val) val = '';
		if (!prefix) {
			this.prefix = '?';
		} else {
			this.prefix = prefix;
		}
		this.className = 'eerror';
		this.mode = MODE_NORMAL;
//		super(val, '?', 'eerror')
		this.setFullValue(val); // will call render
	}

	getTypeName() {
		return '-error-';
	}

	makeCopy() {
		let r = new EError(this.getFullTypedValue());
		this.copyFieldsTo(r);
		return r;
	}

	setMode(m) {
		this.mode = m;
	}

	getMode() {
		return this.mode;
	}

	toggleRendering() {
		this.mode = (this.mode == MODE_NORMAL) ? MODE_EXPANDED : MODE_NORMAL;
	}

	getTypedValue() {
		throw new Error("do not use this method, only use getFullTypedValue or getDisplayValue");
	}

	getFullTypedValue() {
		return this.fullValue;
	}

	getDisplayValue() {
		return this.displayValue;
	}

	setFullValue(fullval) {
		this.fullValue = fullval;
		this.displayValue = this.prefix + '&nbsp;' + this.fullValue.trim();
//		if (this.displayValue.length > ESTRING_LIMIT) {
//			this.displayValue = this.displayValue.substr(0, (ESTRING_LIMIT - 3)) + '...';
//		}
	}	

	toString() {
		return '?"' + this.escapeContents() + '"';
	}

	debugString() {
		return '?"' + this.getFullTypedValue() + '"';
	}


	getKeyFunnel() {
		return new EErrorKeyFunnel(this);
	}

	drawButton() {
	}

	// bork, does it bork the test tho?
	drawTextField(domNode) {
		let toPass = domNode;
		if (RENDERNODES) {
			// change param name
			domNode = domNode.getDomNode();
		}
		this.inputfield = document.createElement("textarea");	
		this.inputfield.classList.add('stringta');	
		if (this.fullValue) {
			this.inputfield.value = this.fullValue;
		}
		domNode.appendChild(this.inputfield);
		this.inputfield.classList.add('stringinput');
		this.inputfield.setAttribute("readonly", '');
	}


	startModalEditing() {
		this.mode = MODE_EXPANDED;
		deactivateKeyFunnel();
	}

	drawNormal(domNode) {
		let toPass = domNode;
		if (RENDERNODES) {
			// change param name
			domNode = domNode.getDomNode();
		}
		if (this.displayValue !== '') {
			this.innerspan = document.createElement("div");
			this.innerspan.classList.add('innerspan');
			this.innerspan.innerHTML = this.displayValue;
			domNode.appendChild(this.innerspan);
		}
	}

	// arg only used in RENDERNODES
	finishInput(renderNode) {
		if (!renderNode && this.cachedThingUgh) {
			renderNode = this.cachedThingUgh;
		}
		let val = this.inputfield.value;
		activateKeyFunnel();
		this.mode = MODE_NORMAL;
		this.setFullValue(val); // calls render
		if (RENDERNODES) {
			renderNode.render(current_default_render_flags
					| RENDER_FLAG_RERENDER
					| RENDER_FLAG_SHALLOW);
		} else if (RENDERFLAGS) {
			this.rerender(current_default_render_flags | RENDER_FLAG_SHALLOW)
		} else {
			this.rerender(true);
		}
	}

	drawExpanded(domNode) {
		let toPass = domNode;
		if (RENDERNODES) {
			// TODO: fix this junk
			this.cachedThingUgh = domNode;
			// change param name
			domNode = domNode.getDomNode();
		}
		this.drawTextField(toPass);
		this.drawButton(toPass);
		this.inputfield.focus();
	}

	// RENDERFLAGS // change to renderFlags
	renderInto(domNode, shallow) {
		let toPassToSuperclass = domNode;
		if (RENDERNODES) {
			// change param name
			domNode = domNode.getDomNode();
		}
		super.renderInto(toPassToSuperclass, shallow);
		// this one always can rerender because it's not a container
		// we only need to care about rerenders when it's a container type
//		domNode.innerHTML = this.prefix;
		domNode.classList.add('valuenex');
		domNode.classList.add(this.className);
		if (this.mode == MODE_NORMAL) {
			this.drawNormal(toPassToSuperclass);
		} else {
			this.drawExpanded(toPassToSuperclass);
		}
		if (!RENDERNODES) {
			this.renderTags(domNode, shallow);
		}
	}

	defaultHandle(txt) {
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
	}

	getEventTable(context) {
		return {
			'Enter': 'do-line-break-always',
			// if we want to put things in an error we have to 
			// explicitly tab into it.
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
