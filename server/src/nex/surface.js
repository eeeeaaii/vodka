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
import { heap } from '../heap.js'
import { constructFatalError } from './eerror.js'
import { evaluateNexSafely } from '../evaluator.js'
import { RENDER_FLAG_EXPLODED } from '../globalconstants.js'

const SVG_NS = 'http://www.w3.org/2000/svg';

/*
What a path's paint string may set. These go onto the svg path as attributes,
so the list is also what keeps a surface from reaching outside vodka: nothing
here can load anything, and values mentioning url are refused below.

(comment by Claude)
*/
const ALLOWED_PAINT = [
	'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap',
	'stroke-linejoin', 'opacity', 'fill-opacity', 'stroke-opacity', 'transform'
];

// A path with no paint is a thin line in the text colour, so a bare list of
// points shows up in either theme. svg's own default, a black fill and no line,
// would draw an open path as nothing.
// (comment by Claude)
const DEFAULT_PAINT = {
	'fill': 'none',
	'stroke': 'currentColor',
	'stroke-width': '1'
};

/*
A surface is a container of paths, and a path is a list of points:

  ((3 4) (238 43) (84 23))          lines from point to point
  (("m" 3 4) ("d" 9 2))             move, then draw
  ("fill: #c33" (0 0) (10 0) (5 8))  paint first, if you want it

Mutable, it is drawn exploded like any container, so the points can be edited.
Immutable, it is drawn as the picture, in svg, and its children are not drawn
at all. Anything that is not a valid path, or a valid point, is skipped: a typo
should not brick a face.

(comment by Claude)
*/
class Surface extends NexContainer {
	constructor(w, h) {
		super();
		this.width = w || 100;
		this.height = h || 100;
		this.drawingAsPicture = false;
		this.setVertical();
	}

	getTypeName() {
		return '-surface-';
	}

	makeCopy(shallow) {
		let r = constructSurface(this.width, this.height);
		this.copyChildrenTo(r, shallow);
		this.copyFieldsTo(r);
		return r;
	}

	toString(version, ctx) {
		if (version == 'v2') {
			return this.toStringV2(ctx);
		}
		return super.toString(version);
	}

	toStringV2(ctx) {
		return `[${this.toStringV2Literal()}surface]${this.toStringV2PrivateDataSection(ctx)}${this.listStartV2()}${this.toStringV2TagList()}${super.childrenToString('v2', ctx)}${this.listEndV2()}`;
	}

	prettyPrintInternal(lvl, hdir) {
		return this.standardListPrettyPrint(lvl, '[surface]', hdir);
	}

	serializePrivateData(ctx) {
		return `${this.width} ${this.height}`;
	}

	deserializePrivateData(data) {
		let parts = ('' + data).trim().split(/\s+/);
		let w = Number(parts[0]);
		let h = Number(parts[1]);
		if (w > 0) this.width = w;
		if (h > 0) this.height = h;
	}

	rootLevelPostEvaluationStep() {
		this.setMutable(false);
	}

	evaluate(env) {
		if (this.mutable) {
			let listcopy = this.makeCopy(true);
			let iterator = null;
			this.doForEachChild(function(child) {
				let newchild = evaluateNexSafely(child, env);
				iterator = listcopy.fastAppendChildAfter(newchild, iterator);
			})
			listcopy.setMutable(false);
			return listcopy;
		} else {
			return this;
		}
	}

	canDoInsertInside() {
		return this.isMutable();
	}

	/*
	A path deep inside can change -- a number in a point set from code -- and
	only that point's own nex is marked. Drawn as a picture, the surface is the
	only thing on the screen for any of it, so it is dirty if anything under it
	is.

	(comment by Claude)
	*/
	getDirtyForRendering() {
		if (super.getDirtyForRendering()) return true;
		return this.drawingAsPicture && anyDescendantDirty(this);
	}

	// the picture is drawn in place of the children, see renderInto
	// (comment by Claude)
	getChildArrayForRendering() {
		if (this.drawingAsPicture) {
			return [];
		}
		return super.getChildArrayForRendering();
	}

	renderInto(renderNode, renderFlags, withEditor) {
		let domNode = renderNode.getDomNode();
		super.renderInto(renderNode, renderFlags, withEditor);
		domNode.classList.add('surface');
		domNode.classList.add('data');
		// set here, read by getChildArrayForRendering straight after, in the
		// same render
		// (comment by Claude)
		this.drawingAsPicture = !(renderFlags & RENDER_FLAG_EXPLODED);
		if (this.drawingAsPicture) {
			domNode.appendChild(this.makeSvg());
			clearDescendantsDirty(this);
		} else {
			// children are appended after this, so the label comes first
			// (comment by Claude)
			let label = document.createElement('div');
			label.classList.add('surfacelabel');
			label.innerText = `surface ${this.width}×${this.height}`;
			domNode.appendChild(label);
		}
	}

	makeSvg() {
		let svg = document.createElementNS(SVG_NS, 'svg');
		svg.setAttribute('width', '' + this.width);
		svg.setAttribute('height', '' + this.height);
		svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
		this.doForEachChild(c => {
			let p = pathElementFor(c);
			if (p) svg.appendChild(p);
		});
		return svg;
	}

	getDefaultHandler() {
		return 'standardDefault';
	}

	getEventTable(context) {
		return {
			'Backspace': 'remove-selected-and-select-previous-sibling-if-empty',
		};
	}

	memUsed() {
		return super.memUsed() + heap.sizeSurface();
	}
}

function anyDescendantDirty(nex) {
	let found = false;
	nex.doForEachChild(c => {
		if (found) return;
		if (c.dirtyForRendering || (c.isNexContainer() && anyDescendantDirty(c))) {
			found = true;
		}
	});
	return found;
}

function clearDescendantsDirty(nex) {
	nex.doForEachChild(c => {
		c.setDirtyForRendering(false);
		if (c.isNexContainer()) clearDescendantsDirty(c);
	});
}

function numberValue(n) {
	if (!Utils.isInteger(n) && !Utils.isFloat(n)) return null;
	let v = n.getTypedValue();
	return Number.isFinite(v) ? v : null;
}

/*
One point as svg path data, or null if it can't be read. A bare point draws,
except the first one in a path, which has to be a move because an svg path
can't start anywhere else.

(comment by Claude)
*/
function pointData(point, isFirst) {
	if (!Utils.isOrg(point)) return null;
	let kids = point.getChildArray();
	let step = 'd';
	let i = 0;
	if (kids.length > 0 && Utils.isEString(kids[0])) {
		step = kids[0].getFullTypedValue();
		i = 1;
	}
	if (step != 'm' && step != 'd') return null;
	if (kids.length - i != 2) return null;
	let x = numberValue(kids[i]);
	let y = numberValue(kids[i + 1]);
	if (x === null || y === null) return null;
	let letter = (step == 'm' || isFirst) ? 'M' : 'L';
	return `${letter} ${x} ${y}`;
}

function applyPaint(el, paintString) {
	let paint = Object.assign({}, DEFAULT_PAINT);
	let decls = ('' + paintString).split(';');
	for (let i = 0; i < decls.length; i++) {
		let colon = decls[i].indexOf(':');
		if (colon < 0) continue;
		let name = decls[i].substring(0, colon).trim().toLowerCase();
		let value = decls[i].substring(colon + 1).trim();
		if (ALLOWED_PAINT.indexOf(name) < 0) continue;
		if (!value || /url/i.test(value)) continue;
		paint[name] = value;
	}
	for (let name in paint) {
		el.setAttribute(name, paint[name]);
	}
}

function pathElementFor(path) {
	if (!Utils.isOrg(path)) return null;
	let kids = path.getChildArray();
	let i = 0;
	let paintString = '';
	if (kids.length > 0 && Utils.isEString(kids[0])) {
		paintString = kids[0].getFullTypedValue();
		i = 1;
	}
	let data = [];
	for (; i < kids.length; i++) {
		let d = pointData(kids[i], data.length == 0);
		if (d) data.push(d);
	}
	if (data.length == 0) return null;
	let el = document.createElementNS(SVG_NS, 'path');
	el.setAttribute('d', data.join(' '));
	applyPaint(el, paintString);
	return el;
}

function constructSurface(w, h) {
	if (!heap.requestMem(heap.sizeSurface())) {
		throw constructFatalError(`OUT OF MEMORY: cannot allocate Surface.
stats: ${heap.stats()}`)
	}
	return heap.register(new Surface(w, h));
}


export { Surface, constructSurface }
