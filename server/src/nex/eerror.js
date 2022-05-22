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

const ERROR_TYPE_FATAL = 0;
const ERROR_TYPE_WARN = 1;
const ERROR_TYPE_INFO = 2
const ERROR_TYPE_PREVIOUSLY_FATAL = 3

// deprecated
const ESTRING_LIMIT = 20;
// deprecated
const MODE_NORMAL = 1;
// deprecated
const MODE_EXPANDED = 2;
// deprecated
const QUOTE_ESCAPE = 'QQQQ'


import { RENDER_FLAG_RERENDER, RENDER_FLAG_SHALLOW } from '../globalconstants.js'
import { eventQueueDispatcher } from '../eventqueuedispatcher.js'
import { NexContainer } from './nexcontainer.js'
import { systemState } from '../systemstate.js'
import { experiments } from '../globalappflags.js'


/**
 * Nex that indicates an error or exceptional condition (compare to the Exception class in Java, for example).
 * It's a container because various diagnostic information might need to be included as a child of this Nex. In practice this is
 * usually a lower-level error in the stack trace.
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
		this.setFullValue(val); // will call render
		this.errorType = ERROR_TYPE_FATAL; // default
		this.suppress = false;
	}

	suppressNextCatch() {
		this.suppress = true;
	}

	shouldSuppress() {
		if (this.suppress) {
			this.suppress = false;
			return true;
		}
		return false;
	}

	setErrorType(et) {
		this.errorType = et;
	}

	getErrorType(et) {
		return this.errorType;
	}

	getTypeName() {
		return '-error-';
	}

	fastAppendChildAfter(c, after) {
		c.clickActive = false;
		return super.fastAppendChildAfter(c, after);
	}


	insertChildAt(c, i) {
		c.clickActive = false;
		return super.insertChildAt(c, i);
	}

	replaceChildAt(c, i) {
		c.clickActive = false;
		return super.replaceChildAt(c, i);
	}


	// errors are containers but we don't let you insert things in the editor
	canDoInsertInside() {
		return false;
	}

	makeCopy(shallow) {
		let r = new EError(this.getFullTypedValue());
		this.copyChildrenTo(r, shallow);
		this.copyFieldsTo(r);
		return r;
	}

	escapeContents() {
		let fv = this.getFullTypedValue();
		fv = fv.replace(new RegExp('"', 'g'), QUOTE_ESCAPE);
		return fv;
	}

	setMode(m) {
		this.mode = m;
	}

	getMode() {
		return this.mode;
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
		this.displayValue = this.fullValue;
	}	

	debugString() {
		return '?"' + this.getFullTypedValue() + '"';
	}

	toString(version) {
		if (version == 'v2') {
			return this.toStringV2();
		}
		return '?"' + this.escapeContents() + '"';
	}

	toStringV2() {
		// if this error contains \r, \t, or |, we do it the other way.
		return '?' + this.toStringV2TagList() + this.toStringV2PrivateDataSection();
	}

	prettyPrintInternal(lvl, hdir) {
		return this.standardListPrettyPrint(lvl, '?', hdir);
	}	

	insertChildAt(c, i) {
		// if (c.getTypeName() != '-error-') {
		// 	throw new EError('errors can only hold other errors.');
		// }
		super.insertChildAt(c, i);
	}

	fastAppendChildAfter(c, after) {
		// if (c.getTypeName() != '-error-') {
		// 	throw new EError('errors can only hold other errors.');
		// }
		super.fastAppendChildAfter(c, after);
	}


	deserializePrivateData(data) {
		let a = data.split('|');
		if (a.length == 2) {
			this.setErrorType(Number(a[0]))
			this.setFullValue(a[1]);
		} else {
			this.setFullValue(a[0]);
		}
	}

	serializePrivateData() {
		if (this.getErrorType() != 0) {
			return `${this.getErrorType()}|${this.getFullTypedValue()}`
		} else {
			return this.getFullTypedValue();
		}
	}

	drawNormal(renderNode) {
		let domNode = renderNode.getDomNode();
		if (this.displayValue !== '') {
			this.innerspan = document.createElement("div");
			this.innerspan.classList.add('innerspan');
			this.innerspan.innerHTML = '? ' + this.escape('' + this.displayValue);
			domNode.appendChild(this.innerspan);
		}
	}

	evaluate() {
		return this;
	}

	renderInto(renderNode, renderFlags, withEditor) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags, withEditor);
		// this one always can rerender because it's not a container
		// we only need to care about rerenders when it's a container type
		domNode.classList.add('valuenex');
		domNode.classList.add(this.className);
		switch(this.errorType) {
			case ERROR_TYPE_FATAL:
				domNode.classList.add('fatal');
				break;
			case ERROR_TYPE_WARN:
				domNode.classList.add('warning');
				break;
			case ERROR_TYPE_INFO:
				domNode.classList.add('info');
				break;
			case ERROR_TYPE_PREVIOUSLY_FATAL:
				domNode.classList.add('previouslyfatal');
				break;
		}
		this.drawNormal(renderNode);
	}

	getDefaultHandler() {
		return 'standardDefault';
	}

	getEventTable(context) {
		return {};
	}
}


export { EError, ERROR_TYPE_FATAL, ERROR_TYPE_INFO, ERROR_TYPE_WARN, ERROR_TYPE_PREVIOUSLY_FATAL }

