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

// defaults to cubic
class Bezier {
	constructor(p1x,
				p1y,
				cp1x,
				cp1y,
				cp2x,
				cp2y,
				p2x,
				p2y) {
		this.p1x = p1x;
		this.p1y = p1y;
		this.cp1x = cp1x;
		this.cp1y = cp1y;
		this.cp2x = cp2x;
		this.cp2y = cp2y;
		this.p2x = p2x;
		this.p2y = p2y;
	}
	// general form of the cubic bezier: the exponents for 1-t decrease while the
	// exponent for 1 increases, we use binomial coefficients 1/3/3/1
	//
	// B(t) =     1 * (1 - t)^3 * t^0 *  p1
	// 			+ 3 * (1 - t)^2 * t^1 * cp1
	//			+ 3 * (1 - t)^1 * t^2 * cp2
	//			+ 1 * (1 - t)^0 * t^3 *  p2
	plot(ctx, stopat) {
		if (!stopat) stopat = 1.0;
		// how many iterations? Let's plan on one per pixel.
		// But we could be rendering at different font sizes.
		// So we use the pythagorean theorem to get the pixel
		// distance between the start and end pixel.
		// The actual glyph will cover a longer distance, since
		// it's a curve, but it shouldn't be THAT much longer.
		let dist = Math.sqrt(Math.pow((this.p1x - this.p2x), 2) + Math.pow((this.p1y - this.p2y), 2));
		let inc = 1.0 / dist;
		ctx.moveTo(this.p1x, this.p1y);
		for (let t = 0.0; t < stopat; t += inc) {
			// suck it indentation nerds, this is a work of art
			let x =       Math.pow((1 - t), 3) *                  this.p1x
					+ 3 * Math.pow((1 - t), 2) *          t     * this.cp1x
					+ 3 *          (1 - t)     * Math.pow(t, 2) * this.cp2x
					+                            Math.pow(t, 3) * this.p2x  ;
			let y =       Math.pow((1 - t), 3) *                  this.p1y
					+ 3 * Math.pow((1 - t), 2) *          t     * this.cp1y
					+ 3 *          (1 - t)     * Math.pow(t, 2) * this.cp2y
					+                            Math.pow(t, 3) * this.p2y  ;
			ctx.lineTo(x, y);
		}
	}
}

export { Bezier }

