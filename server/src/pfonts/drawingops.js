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

class MoveOp {
	constructor(x, y) {
		this.type = 'move';
		this.x = x;
		this.y = y;
	}
}

class BezierOp {
	constructor(cp1x, cp1y, cp2x, cp2y, endx, endy) {
		this.type = 'bezier';
		this.cp1x = cp1x;
		this.cp1y = cp1y;
		this.cp2x = cp2x;
		this.cp2y = cp2y;
		this.endx = endx;
		this.endy = endy;
	}
}

class LineOp {
	constructor(x, y) {
		this.type = 'line';
		this.x = x;
		this.y = y;
	}
}

class BezierPlotOp {
	constructor(p1x, p1y, cp1x, cp1y, cp2x, cp2y, p2x, p2y, stopat) {
		this.type = 'bezierplot';
		this.p1x = p1x;
		this.p1y = p1y;
		this.cp1x = cp1x;
		this.cp1y = cp1y;
		this.cp2x = cp2x;
		this.cp2y = cp2y;
		this.p2x = p2x;
		this.p2y = p2y;
	}
}




export { MoveOp, BezierOp, LineOp, BezierPlotOp }

