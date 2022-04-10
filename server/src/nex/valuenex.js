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

import { experiments } from '../globalappflags.js'
import { Nex } from './nex.js'

class ValueNex extends Nex {
	constructor(val, prefix, className) {
		super();
		if (experiments.ASM_RUNTIME) {
			this.wasmSetup();
		}
		this.setValue(String(val));
		this.prefix = prefix;
		this.className = className;
	}

	getRuntimeId() {
		return this.runtimeId;
	}

	isEmpty() {
		return this.setValue('');
	}

	toString() {
		return '' + this.prefix + this.getValue();
	}

	renderValue() {
		return this.getValue();
	}

	escapedRenderValue() {
		return this.escape(this.renderValue());
	}

	renderInto(renderNode, renderFlags, withEditor) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags, withEditor);
		domNode.classList.add(this.className);
		domNode.classList.add('valuenex');
		let val = this.escapedRenderValue();
		let inner = '';
		if (experiments.NO_TILDE) {
			inner = '<span class="prefixspan">' + this.prefix + '</span>' + this.escapedRenderValue();
			// if (this.isEditing || (!val)) {
			// 	inner += '' + this.prefix;
			// }
			// inner += val;
		} else {
			inner = '' + this.prefix + this.escapedRenderValue();
		}
		domNode.innerHTML = inner;
	}

	getTypedValue() {
		return this.getValue();
	}

	wasmSetup() {}

	setValue(v) {
		this.value = v;
		this.setDirtyForRendering(true);
	}

	getValue() {
		return this.value;
	}

	appendText(txt) {
		let v = this.getValue();
		v = v + txt;
		this.setValue(v);
		this.setDirtyForRendering(true);
	}

	deleteLastLetter() {
		let v = this.getValue();
		if (v == '') return;
		v = v.substr(0, v.length - 1);
		this.setValue(v);
		this.setDirtyForRendering(true);
	}
}




export { ValueNex }

