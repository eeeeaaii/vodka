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

import { Bezier } from './bezier.js'

const OP_MOVE = 0;
const OP_BEZIER = 1;
const OP_LINE = 2;
const OP_BEZIERPLOT = 3;


class MoveOp {
	constructor(x, y) {
		this.type = OP_MOVE;
		this.x = x;
		this.y = y;
	}

	setParams(params) {
		// should just be one
		this.x = params[0].x;
		this.y = params[0].y;
	}

	draw(ctx) {
		ctx.moveTo(this.x, this.y);
	}
}

class BezierOp {
	constructor(cp1x, cp1y, cp2x, cp2y, endx, endy) {
		this.type = OP_BEZIER;
		this.cp1x = cp1x;
		this.cp1y = cp1y;
		this.cp2x = cp2x;
		this.cp2y = cp2y;
		this.endx = endx;
		this.endy = endy;
	}

	setParams(params) {
		// should just be one
		this.cp1x = params[0].x;
		this.cp1y = params[0].y;
		this.cp2x = params[1].x;
		this.cp2y = params[1].y;
		this.endx = params[2].x;
		this.endy = params[2].y;
	}

	draw(ctx) {
		ctx.bezierCurveTo(this.cp1x,
						  this.cp1y,
						  this.cp2x,
						  this.cp2y,
						  this.endx,
						  this.endy);
	}

}

class LineOp {
	constructor(x, y) {
		this.type = OP_LINE;
		this.x = x;
		this.y = y;
	}

	setParams(params) {
		// should just be one
		this.x = params[0].x;
		this.y = params[0].y;
	}

	draw(ctx) {
		ctx.lineTo(this.x, this.y);
	}
}

class BezierPlotOp {
	constructor(p1x, p1y, cp1x, cp1y, cp2x, cp2y, p2x, p2y, stopat) {
		this.type = OP_BEZIERPLOT;
		this.p1x = p1x;
		this.p1y = p1y;
		this.cp1x = cp1x;
		this.cp1y = cp1y;
		this.cp2x = cp2x;
		this.cp2y = cp2y;
		this.p2x = p2x;
		this.p2y = p2y;
	}

	setParams(params) {
		// should just be one
		this.aperture = params[0].val;
		this.p1x = params[1].x;
		this.p1y = params[1].y;
		this.cp1x = params[2].x;
		this.cp1y = params[2].y;
		this.cp2x = params[3].x;
		this.cp2y = params[3].y;
		this.p2x = params[4].x;
		this.p2y = params[4].y;
	}

	draw(ctx) {
		new Bezier(this.p1x,
				   this.p1y,
				   this.cp1x,
				   this.cp1y,
				   this.cp2x,
				   this.cp2y,
				   this.p2x,
				   this.p2y).plot(ctx, this.aperture);

	}
}

export { MoveOp, OP_MOVE,
		 BezierOp, OP_BEZIER,
		 LineOp, OP_LINE,
		 BezierPlotOp, OP_BEZIERPLOT } 

