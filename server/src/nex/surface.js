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

import { Nex } from './nex.js'


/**
 * Represents a drawing surface (canvas).
 */
class Surface extends Nex {
	constructor(w, h) {
		super();
		if (!w) w = 100;
		if (!h) h = 100;
		this.width = w;
		this.height = h;

		this.canvas = document.createElement('canvas');
		this.canvas.setAttribute('width', '' + this.width);
		this.canvas.setAttribute('height', '' + this.height);
	}

	getTypeName() {
		return '-surface-';
	}

	makeCopy() {
		let r = new Surface(this.width, this.height);
		this.copyFieldsTo(r);
		return r;
	}

	copyFieldsTo(nex) {
		super.copyFieldsTo(nex);
		nex.canvas.getContext('2d').drawImage(this.canvas, 0, 0);
	}

	toString(version) {
		if (version == 'v2') {
			return this.toStringV2();
		}
		return super.toString(version);
	}

	renderInto(renderNode, renderFlags, withEditor) {
		super.renderInto(renderNode, renderFlags, withEditor);
		let domNode = renderNode.getDomNode();
		domNode.classList.add('surface');
		domNode.appendChild(this.canvas);
	}

	// erm changes a number to a hex string I think
	toHex(n) {
		let z = n.toString(16);
		if (z.length == 1) {
			z = '0' + z;
		}
		return z;
	}

	isValidColorList(n) {
		let nc = n.numChildren();
		if (nc != 3 && nc != 4) return false;
		for (let i = 0; i < n.numChildren(); i++) {
			let c = n.getChildAt(i);
			if (!Utils.isInteger(c)) {
				return false;
			}
		}
		return true;
	}

	convertColorList(n) {
		let carray = []
		for (let i = 0; i < n.numChildren(); i++) {
			let c = n.getChildAt(i);
			carray.push(c.getTypedValue())
		}
		return carray;
	}


	setFillFromColor(color) {
		let t, r, g, b;
		if (color.length == 4) {
			t = color[0] / 256.0;
			r = color[1];
			g = color[2];
			b = color[3];							
		} else {
			t = 1.0;
			r = color[0];
			g = color[1];
			b = color[2];
		}
		let ctx = this.canvas.getContext("2d");
		ctx.globalAlpha = t;
		ctx.fillStyle = '#' + this.toHex(r) + this.toHex(g) + this.toHex(b);
	}

	setStrokeFromColor(color) {
		let t, r, g, b;
		if (color.length == 4) {
			t = color[0] / 256.0;
			r = color[1];
			g = color[2];
			b = color[3];							
		} else {
			t = 1.0;
			r = color[0];
			g = color[1];
			b = color[2];
		}
		let ctx = this.canvas.getContext("2d");
		ctx.globalAlpha = t;
		ctx.strokeStyle = '#' + this.toHex(r) + this.toHex(g) + this.toHex(b);
	}

	fillBackground(color) {
		let r = color[0];
		let g = color[1];
		let b = color[2];
		let ctx = this.canvas.getContext("2d");
		ctx.fillStyle = '#' + this.toHex(r) + this.toHex(g) + this.toHex(b);
		ctx.fillRect(0, 0, this.width, this.height);
	}

	drawLine(color, x1, y1, x2, y2) {
		let ctx = this.canvas.getContext("2d");
		this.setStrokeFromColor(color);
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();		
	}

	drawRect(color, x, y, w, h) {
		this.setFillFromColor(color);
		let ctx = this.canvas.getContext("2d");
		ctx.fillRect(x, y, w, h);		
	}

	drawDot(color, x, y) {
		this.setFillFromColor(color);
		let ctx = this.canvas.getContext("2d");
		ctx.fillRect(x, y, 1, 1);		
	}

	colorAt(x, y) {
		let ctx = this.canvas.getContext("2d");
		let imgdata = ctx.getImageData(x, y, 1, 1)
		let r = imgdata.data[0];
		let g = imgdata.data[1];
		let b = imgdata.data[2];
		let a = imgdata.data[3];
		return [
			r, g, b, a
		];
	}

	copyFromClipboard() {
		navigator.clipboard.read().then(data => {
			if (data.length != 1) return;
			let item = data[0];
			if (item.types[0] != 'image/png') return;
			item.getType('image/png').then(blob => {
				let image = document.createElement('img');
                image.src = URL.createObjectURL(blob);
                let body = document.getElementsByTagName('body')[0];
                body.appendChild(image);
                let t = this;
                setTimeout(function() {
					let ctx = this.canvas.getContext("2d");
					ctx.drawImage(image, 0, 0);
					body.removeChild(image);
                }.bind(this), 10);
			})
		});
	}

	toStringV2() {
		return `[${this.toStringV2Literal()}surface]${this.toStringV2PrivateDataSection()}${this.toStringV2TagList()}`
	}

	deserializePrivateData(data) {
	}

	serializePrivateData() {
		return '';
	}


	getDefaultHandler() {
		return 'standardDefault';
	}

	getEventTable(context) {
		return {
		}
	}
}


export { Surface }

