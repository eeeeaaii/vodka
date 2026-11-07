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

// useful tool: https://www.metaflop.com/modulator

import { MoveOp, OP_MOVE,
		 BezierOp, OP_BEZIER,
		 LineOp, OP_LINE,
		 BezierPlotOp, OP_BEZIERPLOT } from "./drawingops.js"

import { Glyph } from "./glyph.js"
import { Font } from "./font.js"


const GLYPHS = {
	' ': new Glyph(.4, []),
	'a': new Glyph(.7, [
		{ op: OP_MOVE, d: [
			{ x:p => (p.left), y:p => (p.corpus * .75) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => (p.corpus * .75 + (p.curve * .75)) },
			{ x:p => (p.mid - (p.curve * .75)), y:p => (p.corpus) },
			{ x:p => (p.mid), y:p => (p.corpus) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + (p.curve * .75)), y:p => (p.corpus) },
			{ x:p => (p.right), y:p => (p.corpus * .75 + (p.curve * .75)) },
			{ x:p => (p.right), y:p => (p.corpus * .75) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right), y:p => (p.corpus * .75 - (p.curve * .75)) },
			{ x:p => (p.mid + (p.curve * .75)), y:p => (p.corpus / 2) },
			{ x:p => (p.mid), y:p => (p.corpus / 2) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - (p.curve * .75)), y:p => (p.corpus / 2) },
			{ x:p => (p.left), y:p => ((p.corpus * .25) + (p.curve * .75)) },
			{ x:p => (p.left), y:p => ((p.corpus * .25)) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => ((p.corpus * .25) - (p.curve * .75)) },
			{ x:p => (p.mid - (p.curve * .75)), y:p => (p.baseline) },
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + (p.curve * .75)), y:p => (p.baseline) },
			{ x:p => (p.right), y:p => ((p.corpus * .25) - (p.curve * .75)) },
			{ x:p => (p.right), y:p => ((p.corpus * .25)) },
		]},
		{ op: OP_MOVE, d: [
			{ x:p => (p.right), y:p => (p.corpus * .75) },
		]},
		{ op: OP_LINE, d: [
			{ x:p => (p.right), y:p => (p.baseline - .02) },
		]},
	]),

	'b': new Glyph(1.0, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.asc) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.left), y:p => (p.baseline) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.corpus / 2) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => (p.corpus / 2 + p.curve) },
			{ x:p => (p.mid - p.curve), y:p => (p.corpus) },
			{ x:p => (p.mid), y:p => (p.corpus) },
		]},

		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + p.curve), y:p => (p.corpus) },
			{ x:p => (p.right), y:p => (p.corpus / 2 + p.curve) },
			{ x:p => (p.right), y:p => (p.corpus / 2) },
		]},

		{ op: OP_BEZIER, d: [
			{ x:p => (p.right), y:p => (p.corpus / 2 - p.curve) },
			{ x:p => (p.mid + p.curve), y:p => (p.baseline) },
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},

		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - p.curve), y:p => (p.baseline) },
			 { x:p => (p.left), y:p => (p.corpus / 2 - p.curve) },
	  		{ x:p => (p.left), y:p => (p.corpus / 2) },
	  	]},
	]),

	'c': new Glyph(1.0, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.corpus) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - p.curve), y:p => (p.corpus) },
		 	{ x:p => (p.left), y:p => (p.corpus / 2 + p.curve) },
		 	{ x:p => (p.left), y:p => (p.corpus / 2) },
		 ]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => (p.corpus / 2 - p.curve) },
		 	{ x:p => (p.mid - p.curve), y:p => (p.baseline) },
		 	{ x:p => (p.mid), y:p => (p.baseline) },
		 ]},
		{ op: OP_BEZIERPLOT, d: [
			{ val:p => (p.aperture) },
			{ x:p => (p.mid), y:p => (p.corpus) },
			{ x:p => (p.mid + p.curve), y:p => (p.corpus) },
			{ x:p => (p.right), y:p => (p.corpus / 2 + p.curve) },
			{ x:p => (p.right), y:p => (p.corpus / 2) },
		]},
		{ op: OP_BEZIERPLOT, d: [
			{ val:p => (p.aperture) },
			{ x:p => (p.mid), y:p => (p.baseline) },
			{ x:p => (p.mid + p.curve), y:p => (p.baseline) },
			{ x:p => (p.right), y:p => (p.corpus / 2 - p.curve) },
			{ x:p => (p.right), y:p => (p.corpus / 2) },
		]},
	]),

	'd': new Glyph(1.0, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.corpus / 2) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => (p.corpus / 2 + p.curve) },
			{ x:p => (p.mid - p.curve), y:p => (p.corpus) },
			{ x:p => (p.mid), y:p => (p.corpus) },
		]},

		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + p.curve), y:p => (p.corpus) },
			{ x:p => (p.right), y:p => (p.corpus / 2 + p.curve) },
			{ x:p => (p.right), y:p => (p.corpus / 2) },
		]},

		{ op: OP_BEZIER, d: [
			{ x:p => (p.right), y:p => (p.corpus / 2 - p.curve) },
			{ x:p => (p.mid + p.curve), y:p => (p.baseline) },
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},

		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - p.curve), y:p => (p.baseline) },
			{ x:p => (p.left), y:p => (p.corpus / 2 - p.curve) },
	  		{ x:p => (p.left), y:p => (p.corpus / 2) },
	  	]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.right), y:p => (p.asc) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.baseline) },
		]},

	]),
	'e': new Glyph(1.0, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.corpus / 2) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.corpus / 2) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right), y:p => (p.corpus / 2 + p.curve) },
		 	{ x:p => (p.mid + p.curve), y:p => (p.corpus) },
		 	{ x:p => (p.mid), y:p => (p.corpus) },
		 ]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - p.curve), y:p => (p.corpus) },
		 	{ x:p => (p.left), y:p => (p.corpus / 2 + p.curve) },
		 	{ x:p => (p.left), y:p => (p.corpus / 2) },
		 ]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => (p.corpus / 2 - p.curve) },
		 	{ x:p => (p.mid - p.curve), y:p => (p.baseline) },
		 	{ x:p => (p.mid), y:p => (p.baseline) },
		 ]},
		{ op: OP_BEZIERPLOT, d: [
			{ val:p => (p.aperture) },
			{ x:p => (p.mid), y:p => (p.baseline) },
			{ x:p => (p.mid + p.curve), y:p => (p.baseline) },
			{ x:p => (p.right), y:p => (p.corpus / 2 - p.curve) },
			{ x:p => (p.right), y:p => (p.corpus / 2) },
		]},
	]),
	'f': new Glyph(.6, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.right), y:p => (p.asc) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right - .1), y:p => (p.asc) },
		 	{ x:p => (p.mid), y:p => (p.asc * .8 + .1) },
		 	{ x:p => (p.mid), y:p => (p.asc * .8) },
		 ]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.corpus) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.corpus) },
		]},
	]),

	'g': new Glyph(1.0, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.corpus / 2) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => (p.corpus / 2 + p.curve) },
			{ x:p => (p.mid - p.curve), y:p => (p.corpus) },
			{ x:p => (p.mid), y:p => (p.corpus) },
		]},

		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + p.curve), y:p => (p.corpus) },
			{ x:p => (p.right), y:p => (p.corpus / 2 + p.curve) },
			{ x:p => (p.right), y:p => (p.corpus / 2) },
		]},

		{ op: OP_BEZIER, d: [
			{ x:p => (p.right), y:p => (p.corpus / 2 - p.curve) },
			{ x:p => (p.mid + p.curve), y:p => (p.baseline) },
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},

		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - p.curve), y:p => (p.baseline) },
			 { x:p => (p.left), y:p => (p.corpus / 2 - p.curve) },
	  		{ x:p => (p.left), y:p => (p.corpus / 2) },
	  	]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.right), y:p => (p.corpus) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.desc * .4) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right), y:p => (p.desc * .4 - p.curve) },
			 { x:p => (p.mid + p.curve), y:p => (p.desc) },
	  		{ x:p => (p.mid), y:p => (p.desc) },
	  	]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - p.curve), y:p => (p.desc) },
			 { x:p => (p.left), y:p => (p.desc * .4 - p.curve) },
	  		{ x:p => (p.left), y:p => (p.desc * .4) },
	  	]},
	]),
	'h': new Glyph(.8, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.asc) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.left), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.left), y:p => (p.corpus / 2) }, // overdraw
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => (p.corpus / 2 + p.curve) },
			{ x:p => (p.mid - p.curve), y:p => (p.corpus) },
			{ x:p => (p.mid), y:p => (p.corpus) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + p.curve), y:p => (p.corpus) },
			{ x:p => (p.right), y:p => (p.corpus / 2 + p.curve) },
			{ x:p => (p.right), y:p => (p.corpus / 2) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.baseline) },
		]},
	]),
	'i': new Glyph(.15, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.corpus) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.corpus + .1) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.corpus + .2) },
		]},
	]),
	'j': new Glyph(.15, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.corpus) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => ((p.desc + .1)) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid), y:p => ((p.desc + .1) - .1) },
			{ x:p => ((p.left - .2) + .1), y:p => (p.desc) },
			{ x:p => ((p.left - .2)), y:p => (p.desc) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.corpus + .1) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.corpus + .2) },
		]},
	]),
	'k': new Glyph(.7, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.asc) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.left), y:p => (p.baseline) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.corpus * .4) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.corpus) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.left + p.width * .4), y:p => (p.corpus * .6) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.baseline) },
		]},
	]),
	'l': new Glyph(.1, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.asc) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},
	]),
	'm': new Glyph(1.4, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.corpus) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.left), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.left), y:p => (p.corpus / 2) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => (p.corpus / 2 + p.curve) },
			{ x:p => (p.mid * .5 - p.curve), y:p => (p.corpus) },
			{ x:p => (p.mid * .5 ), y:p => (p.corpus) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid * .5 + p.curve), y:p => (p.corpus) },
			{ x:p => (p.mid), y:p => (p.corpus / 2 + p.curve) },
			{ x:p => (p.mid), y:p => (p.corpus / 2) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.corpus / 2) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid), y:p => (p.corpus / 2 + p.curve) },
			{ x:p => (p.mid * 1.5 - p.curve), y:p => (p.corpus) },
			{ x:p => (p.mid * 1.5 ), y:p => (p.corpus) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid * 1.5 + p.curve), y:p => (p.corpus) },
			{ x:p => (p.right), y:p => (p.corpus / 2 + p.curve) },
			{ x:p => (p.right), y:p => (p.corpus / 2) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.baseline) },
		]},
	]),
	'n': new Glyph(0.7, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.corpus) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.left), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.left), y:p => (p.corpus / 2) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => (p.corpus / 2 + p.curve) },
			{ x:p => (p.mid - p.curve), y:p => (p.corpus) },
			{ x:p => (p.mid ), y:p => (p.corpus) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + p.curve), y:p => (p.corpus) },
			{ x:p => (p.right), y:p => (p.corpus / 2 + p.curve) },
			{ x:p => (p.right), y:p => (p.corpus / 2) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.baseline) },
		]},
	]),
	'o': new Glyph(1.0, [
		{ op: OP_MOVE, d: [
			{x:p => (p.left), y:p => (p.corpus / 2) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => (p.corpus / 2 + p.curve) },
			{ x:p => (p.mid - p.curve), y:p => (p.corpus) },
			{ x:p => (p.mid), y:p => (p.corpus) },
		]},

		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + p.curve), y:p => (p.corpus) },
			{ x:p => (p.right), y:p => (p.corpus / 2 + p.curve) },
			{ x:p => (p.right), y:p => (p.corpus / 2) },
		]},

		{ op: OP_BEZIER, d: [
			{ x:p => (p.right), y:p => (p.corpus / 2 - p.curve) },
			{ x:p => (p.mid + p.curve), y:p => (p.baseline) },
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},

		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - p.curve), y:p => (p.baseline) },
			 { x:p => (p.left), y:p => (p.corpus / 2 - p.curve) },
	  		{ x:p => (p.left), y:p => (p.corpus / 2) },
	  	]},
	]),
	'p': new Glyph(1.0, [
		{ op: OP_MOVE, d: [
			{x:p => (p.left), y:p => (p.corpus) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.left), y:p => (p.desc) },
		]},
		{ op: OP_MOVE, d: [
			{x:p => (p.left), y:p => (p.corpus / 2) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => (p.corpus / 2 + p.curve) },
			{ x:p => (p.mid - p.curve), y:p => (p.corpus) },
			{ x:p => (p.mid), y:p => (p.corpus) },
		]},

		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + p.curve), y:p => (p.corpus) },
			{ x:p => (p.right), y:p => (p.corpus / 2 + p.curve) },
			{ x:p => (p.right), y:p => (p.corpus / 2) },
		]},

		{ op: OP_BEZIER, d: [
			{ x:p => (p.right), y:p => (p.corpus / 2 - p.curve) },
			{ x:p => (p.mid + p.curve), y:p => (p.baseline) },
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},

		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - p.curve), y:p => (p.baseline) },
			 { x:p => (p.left), y:p => (p.corpus / 2 - p.curve) },
	  		{ x:p => (p.left), y:p => (p.corpus / 2) },
	  	]},
	]),
	'q': new Glyph(1.0, [
		{ op: OP_MOVE, d: [
			{x:p => (p.left), y:p => (p.corpus / 2) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => (p.corpus / 2 + p.curve) },
			{ x:p => (p.mid - p.curve), y:p => (p.corpus) },
			{ x:p => (p.mid), y:p => (p.corpus) },
		]},

		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + p.curve), y:p => (p.corpus) },
			{ x:p => (p.right), y:p => (p.corpus / 2 + p.curve) },
			{ x:p => (p.right), y:p => (p.corpus / 2) },
		]},

		{ op: OP_BEZIER, d: [
			{ x:p => (p.right), y:p => (p.corpus / 2 - p.curve) },
			{ x:p => (p.mid + p.curve), y:p => (p.baseline) },
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},

		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - p.curve), y:p => (p.baseline) },
			 { x:p => (p.left), y:p => (p.corpus / 2 - p.curve) },
	  		{ x:p => (p.left), y:p => (p.corpus / 2) },
	  	]},
		{ op: OP_MOVE, d: [
			{x:p => (p.right), y:p => (p.corpus) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.right), y:p => (p.desc) },
		]},
	]),
	'r': new Glyph(.4, [
		{ op: OP_MOVE, d: [
			{x:p => (p.left), y:p => (p.corpus) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.left), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.left), y:p => (p.corpus / 2) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => (p.corpus / 2 + p.curve) },
			{ x:p => (p.right - p.curve), y:p => (p.corpus) },
			{ x:p => (p.right), y:p => (p.corpus) },
		]},
	]),
	's': new Glyph(.65, [
		{ op: OP_MOVE, d: [
			{x:p => (p.right), y:p => (p.corpus * .8) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right - (p.curve * .3)), y:p => (p.corpus * .8 + (p.curve * .7)) },
			{ x:p => (p.mid + (p.curve * .2)), y:p => (p.corpus) },
			{ x:p => (p.mid), y:p => (p.corpus) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - (p.curve * .7)), y:p => (p.corpus) },
			{ x:p => (p.left), y:p => (p.corpus * .8 + (p.curve * .4)) },
			{ x:p => (p.left), y:p => (p.corpus * .8) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => (p.corpus * .8 - (p.curve * .7)) },
			{ x:p => (p.mid - (p.curve * .7)), y:p => (p.corpus * .55) },
			{ x:p => (p.mid), y:p => (p.corpus * .5) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + (p.curve * .7)), y:p => (p.corpus * .45) },
			{ x:p => (p.right), y:p => (p.corpus * .2 + (p.curve * .7)) },
			{ x:p => (p.right), y:p => (p.corpus * .2) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right), y:p => (p.corpus * .2 - (p.curve * .4)) },
			{ x:p => (p.mid + (p.curve * .7)), y:p => (p.baseline) },
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - (p.curve * .2)), y:p => (p.baseline) },
			{ x:p => (p.left + (p.curve * .3)), y:p => (p.corpus * .2 - (p.curve * .7)) },
			{ x:p => (p.left), y:p => (p.corpus * .2) },
		]},
	]),
	't': new Glyph(.65, [
		{ op: OP_MOVE, d: [
			{x:p => (p.width * .4), y:p => (p.asc * .8) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.width * .4), y:p => (p.corpus * .2) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.width * .4), y:p => (p.corpus * .2 - (p.curve * .3)) },
			{ x:p => (p.width * .7 - (p.curve * .3)), y:p => (p.baseline) },
			{ x:p => (p.width * .7), y:p => (p.baseline) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.width * .7 + (p.curve * .3)), y:p => (p.baseline) },
			{ x:p => (p.right), y:p => (p.corpus * .2 - (p.curve * .3)) },
			{ x:p => (p.right), y:p => (p.corpus * .2) },
		]},
		{ op: OP_MOVE, d: [
			{x:p => (p.left), y:p => (p.corpus) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.right), y:p => (p.corpus) },
		]},
	]),
	'u': new Glyph(.8, [
		{ op: OP_MOVE, d: [
			{x:p => (p.left), y:p => (p.corpus) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.left), y:p => (p.corpus * .5) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => (p.corpus * .5 - p.curve) },
			{ x:p => (p.mid - p.curve), y:p => (p.baseline) },
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + p.curve), y:p => (p.baseline) },
			{ x:p => (p.right), y:p => (p.corpus * .5 - p.curve) },
			{ x:p => (p.right), y:p => (p.corpus * .5) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.right), y:p => (p.corpus) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.right), y:p => (p.baseline) },
		]},
	]),
	'v': new Glyph(.8, [
		{ op: OP_MOVE, d: [
			{x:p => (p.left), y:p => (p.corpus) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.mid - (p.curve * .1)), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.mid + (p.curve * .1)), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.right), y:p => (p.corpus) },
		]},
	]),
	'w': new Glyph(1.6, [
		{ op: OP_MOVE, d: [
			{x:p => (p.left), y:p => (p.corpus) },
		]},
		{ op: OP_LINE, d: [
			{x:p => ((p.width * .25) - (p.curve * .1)), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d: [
			{x:p => ((p.width * .25) + (p.curve * .1)), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d: [
			{x:p => ((p.width * .5) - (p.curve * .1)), y:p => (p.corpus * .95) },
		]},
		{ op: OP_LINE, d: [
			{x:p => ((p.width * .5) + (p.curve * .1)), y:p => (p.corpus * .95) },
		]},
		{ op: OP_LINE, d: [
			{x:p => ((p.width * .75) - (p.curve * .1)), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d: [
			{x:p => ((p.width * .75) + (p.curve * .1)), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.width), y:p => (p.corpus) },
		]},
	]),
	'x': new Glyph(.8, [
		{ op: OP_MOVE, d: [
			{x:p => (p.left), y:p => (p.corpus) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.right), y:p => (p.baseline) },
		]},
		{ op: OP_MOVE, d: [
			{x:p => (p.right), y:p => (p.corpus) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.left), y:p => (p.baseline) },
		]},

	]),
	'y': new Glyph(.8, [
		{ op: OP_MOVE, d: [
			{x:p => (p.left), y:p => (p.corpus) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.mid), y:p => (p.baseline) },
		]},
		{ op: OP_MOVE, d: [
			{x:p => (p.right), y:p => (p.corpus) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.left), y:p => (p.desc) },
		]},

	]),
	'z': new Glyph(.8, [
		{ op: OP_MOVE, d: [
			{x:p => (p.left), y:p => (p.corpus) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.right), y:p => (p.corpus) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.left), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.right), y:p => (p.baseline) },
		]},

	]),


	'A': new Glyph(1.2, [
		{ op: OP_MOVE, d: [
			{x:p => (p.left), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.mid - (p.curve * .1)), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.mid + (p.curve * .1)), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.right), y:p => (p.baseline) },
		]},
		{ op: OP_MOVE, d: [
			{x:p => (p.width * .2), y:p => (p.corpus / 2) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.width * .8), y:p => (p.corpus / 2) },
		]},
	]),

	'B': new Glyph(.8, [
		{ op: OP_MOVE, d: [
			{x:p => (p.left), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.left), y:p => (p.baseline) },
		]},
		{ op: OP_MOVE, d: [
			{x:p => (p.left), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.mid), y:p => (p.cap) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + p.curve), y:p => (p.cap) },
			{ x:p => (p.right), y:p => (p.cap * .75 + p.curve) },
			{ x:p => (p.right), y:p => (p.cap * .75) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right), y:p => (p.cap * .75 - p.curve) },
			{ x:p => (p.mid + p.curve), y:p => (p.cap * .5) },
			{ x:p => (p.mid), y:p => (p.cap * .5) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.left), y:p => (p.cap * .5) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.mid), y:p => (p.cap * .5) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + p.curve), y:p => (p.cap * .5) },
			{ x:p => (p.right), y:p => (p.cap * .25 + p.curve) },
			{ x:p => (p.right), y:p => (p.cap * .25) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right), y:p => (p.cap * .25 - p.curve) },
			{ x:p => (p.mid + p.curve), y:p => (p.baseline) },
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.left), y:p => (p.baseline) },
		]},
	]),
	'C': new Glyph(1.2, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.cap) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - (p.curve * 1.3)), y:p => (p.cap) },
		 	{ x:p => (p.left), y:p => (p.cap / 2 + (p.curve * 1.3)) },
		 	{ x:p => (p.left), y:p => (p.cap / 2) },
		 ]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => (p.cap / 2 - (p.curve * 1.3)) },
		 	{ x:p => (p.mid - (p.curve * 1.3)), y:p => (p.baseline) },
		 	{ x:p => (p.mid), y:p => (p.baseline) },
		 ]},
		{ op: OP_BEZIERPLOT, d: [
			{ val:p => (p.aperture) },
			{ x:p => (p.mid), y:p => (p.cap) },
			{ x:p => (p.mid + (p.curve * 1.3)), y:p => (p.cap) },
			{ x:p => (p.right), y:p => (p.cap / 2 + (p.curve * 1.3)) },
			{ x:p => (p.right), y:p => (p.cap / 2) },
		]},
		{ op: OP_BEZIERPLOT, d: [
			{ val:p => (p.aperture) },
			{ x:p => (p.mid), y:p => (p.baseline) },
			{ x:p => (p.mid + (p.curve * 1.3)), y:p => (p.baseline) },
			{ x:p => (p.right), y:p => (p.cap / 2 - (p.curve * 1.3)) },
			{ x:p => (p.right), y:p => (p.cap / 2) },
		]},
	]),
	'D': new Glyph(1.0, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.left), y:p => (p.baseline) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.cap) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + (p.curve * 1.2)), y:p => (p.cap) },
		 	{ x:p => (p.right), y:p => (p.cap / 2 + (p.curve * 1.2)) },
		 	{ x:p => (p.right), y:p => (p.cap / 2) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right), y:p => (p.cap / 2 - (p.curve * 1.2)) },
		 	{ x:p => (p.mid + (p.curve * 1.2)), y:p => (p.baseline) },
		 	{ x:p => (p.mid), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.left), y:p => (p.baseline) },
		]},
	]),
	'E': new Glyph(1.0, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.left), y:p => (p.baseline) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.cap) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap / 2) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right - (p.curve * 1.1)), y:p => (p.cap / 2) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.baseline) },
		]},
	]),
	'F': new Glyph(1.0, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.left), y:p => (p.baseline) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.cap) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap / 2) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right - (p.curve * 1.1)), y:p => (p.cap / 2) },
		]},
	]),
	'G': new Glyph(1.2, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.cap) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - (p.curve * 1.3)), y:p => (p.cap) },
		 	{ x:p => (p.left), y:p => (p.cap / 2 + (p.curve * 1.3)) },
		 	{ x:p => (p.left), y:p => (p.cap / 2) },
		 ]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => (p.cap / 2 - (p.curve * 1.3)) },
		 	{ x:p => (p.mid - (p.curve * 1.3)), y:p => (p.baseline) },
		 	{ x:p => (p.mid), y:p => (p.baseline) },
		 ]},
		{ op: OP_BEZIERPLOT, d: [
			{ val:p => (p.aperture) },
			{ x:p => (p.mid), y:p => (p.cap) },
			{ x:p => (p.mid + (p.curve * 1.3)), y:p => (p.cap) },
			{ x:p => (p.right), y:p => (p.cap / 2 + (p.curve * 1.3)) },
			{ x:p => (p.right), y:p => (p.cap / 2) },
		]},
		{ op: OP_BEZIERPLOT, d: [
			{ val:p => (p.aperture) },
			{ x:p => (p.mid), y:p => (p.baseline) },
			{ x:p => (p.mid + (p.curve * 1.3)), y:p => (p.baseline) },
			{ x:p => (p.right), y:p => (p.cap / 2 - (p.curve * 1.3)) },
			{ x:p => (p.right), y:p => (p.cap / 2) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.right - .02), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right - .02), y:p => (p.corpus * .75) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid + p.curve), y:p => (p.corpus * .75) },
		]},
	]),
	'H': new Glyph(.9, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.left), y:p => (p.baseline) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap / 2) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.cap / 2) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.right), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.baseline) },
		]},
	]),
	'I': new Glyph(.3, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},
	]),
	'J': new Glyph(.8, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.right), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.corpus / 2) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right), y:p => (p.corpus / 2 - p.curve) },
		 	{ x:p => (p.mid + p.curve), y:p => (p.baseline) },
		 	{ x:p => (p.mid), y:p => (p.baseline) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - p.curve), y:p => (p.baseline) },
		 	{ x:p => (p.left), y:p => (p.corpus / 2 - p.curve) },
		 	{ x:p => (p.left), y:p => (p.corpus / 2) },
		]},
	]),
	'K': new Glyph(1.0, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.left), y:p => (p.baseline) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap / 2 - (p.curve)) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.cap) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.left + .1), y:p => (p.cap / 2) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.baseline) },
		]},
	]),
	'L': new Glyph(.8, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.left), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.baseline) },
		]},
	]),
	'M': new Glyph(1.2, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.left), y:p => (p.baseline) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.cap) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.right), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.baseline) },
		]},
	]),
	'N': new Glyph(1.0, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.left), y:p => (p.baseline) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.baseline) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.right), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.baseline) },
		]},
	]),
	'O': new Glyph(1.0, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.cap) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - (p.curve * 1.2)), y:p => (p.cap) },
		 	{ x:p => (p.left), y:p => (p.cap / 2 + (p.curve * 1.2)) },
		 	{ x:p => (p.left), y:p => (p.cap / 2) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => (p.cap / 2 - (p.curve * 1.2)) },
		 	{ x:p => (p.mid - (p.curve * 1.2)), y:p => (p.baseline) },
		 	{ x:p => (p.mid), y:p => (p.baseline) },
		]},
		{ op: OP_BEZIER, d: [
		 	{ x:p => (p.mid + (p.curve * 1.2)), y:p => (p.baseline) },
		 	{ x:p => (p.right), y:p => (p.cap / 2 - (p.curve * 1.2)) },
		 	{ x:p => (p.right), y:p => (p.cap / 2) },
		]},
		{ op: OP_BEZIER, d: [
		 	{ x:p => (p.right), y:p => (p.cap / 2 + (p.curve * 1.2)) },
		 	{ x:p => (p.mid + (p.curve * 1.2)), y:p => (p.cap) },
		 	{ x:p => (p.mid), y:p => (p.cap) },
		]},
	]),

	'P': new Glyph(.8, [
		{ op: OP_MOVE, d: [
			{x:p => (p.left), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.left), y:p => (p.baseline) },
		]},
		{ op: OP_MOVE, d: [
			{x:p => (p.left), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.mid), y:p => (p.cap) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + p.curve), y:p => (p.cap) },
			{ x:p => (p.right), y:p => (p.cap * .75 + p.curve) },
			{ x:p => (p.right), y:p => (p.cap * .75) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right), y:p => (p.cap * .75 - p.curve) },
			{ x:p => (p.mid + p.curve), y:p => (p.cap * .5) },
			{ x:p => (p.mid), y:p => (p.cap * .5) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.left), y:p => (p.cap * .5) },
		]},
	]),

	'Q': new Glyph(1.0, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.cap) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - (p.curve * 1.2)), y:p => (p.cap) },
		 	{ x:p => (p.left), y:p => (p.cap / 2 + (p.curve * 1.2)) },
		 	{ x:p => (p.left), y:p => (p.cap / 2) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => (p.cap / 2 - (p.curve * 1.2)) },
		 	{ x:p => (p.mid - (p.curve * 1.2)), y:p => (p.baseline) },
		 	{ x:p => (p.mid), y:p => (p.baseline) },
		]},
		{ op: OP_BEZIER, d: [
		 	{ x:p => (p.mid + (p.curve * 1.2)), y:p => (p.baseline) },
		 	{ x:p => (p.right), y:p => (p.cap / 2 - (p.curve * 1.2)) },
		 	{ x:p => (p.right), y:p => (p.cap / 2) },
		]},
		{ op: OP_BEZIER, d: [
		 	{ x:p => (p.right), y:p => (p.cap / 2 + (p.curve * 1.2)) },
		 	{ x:p => (p.mid + (p.curve * 1.2)), y:p => (p.cap) },
		 	{ x:p => (p.mid), y:p => (p.cap) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid + (p.curve / 2)), y:p => (p.baseline) },
		]},		
		{ op: OP_LINE, d:[
			{ x:p => (p.mid + p.curve), y:p => (p.baseline - p.curve) },
		]},		
	]),

	'R': new Glyph(.8, [
		{ op: OP_MOVE, d: [
			{x:p => (p.left), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.left), y:p => (p.baseline) },
		]},
		{ op: OP_MOVE, d: [
			{x:p => (p.left), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.mid), y:p => (p.cap) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + p.curve), y:p => (p.cap) },
			{ x:p => (p.right), y:p => (p.cap * .75 + p.curve) },
			{ x:p => (p.right), y:p => (p.cap * .75) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right), y:p => (p.cap * .75 - p.curve) },
			{ x:p => (p.mid + p.curve), y:p => (p.cap * .5) },
			{ x:p => (p.mid), y:p => (p.cap * .5) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.left), y:p => (p.cap * .5) },
		]},
		{ op: OP_MOVE, d: [
			{x:p => (p.mid), y:p => (p.cap * .5) },
		]},
		{ op: OP_LINE, d: [
			{x:p => (p.right), y:p => (p.baseline) },
		]},
	]),

	'S': new Glyph(.8, [
		{ op: OP_MOVE, d: [
			{x:p => (p.right), y:p => (p.cap * .8) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right - (p.curve * .3)), y:p => (p.cap * .8 + (p.curve * .7)) },
			{ x:p => (p.mid + (p.curve * .2)), y:p => (p.cap) },
			{ x:p => (p.mid), y:p => (p.cap) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - (p.curve * .7)), y:p => (p.cap) },
			{ x:p => (p.left), y:p => (p.cap * .8 + (p.curve * .4)) },
			{ x:p => (p.left), y:p => (p.cap * .8) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => (p.cap * .8 - (p.curve * .7)) },
			{ x:p => (p.mid - (p.curve * .7)), y:p => (p.cap * .55) },
			{ x:p => (p.mid), y:p => (p.cap * .5) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + (p.curve * .7)), y:p => (p.cap * .45) },
			{ x:p => (p.right), y:p => (p.cap * .2 + (p.curve * .7)) },
			{ x:p => (p.right), y:p => (p.cap * .2) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right), y:p => (p.cap * .2 - (p.curve * .4)) },
			{ x:p => (p.mid + (p.curve * .7)), y:p => (p.baseline) },
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - (p.curve * .2)), y:p => (p.baseline) },
			{ x:p => (p.left + (p.curve * .3)), y:p => (p.cap * .2 - (p.curve * .7)) },
			{ x:p => (p.left), y:p => (p.cap * .2) },
		]},
	]),

	'T': new Glyph(1.0, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.cap) },
		]},
	]),

	'U': new Glyph(1.0, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.left), y:p => (p.corpus / 2) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => (p.corpus / 2 - p.curve) },
			{ x:p => (p.mid - p.curve), y:p => (p.baseline) },
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + p.curve), y:p => (p.baseline) },
			{ x:p => (p.right), y:p => (p.corpus / 2 - p.curve) },
			{ x:p => (p.right), y:p => (p.corpus / 2) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.cap) },
		]},
	]),
	'V': new Glyph(1.0, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.cap) },
		]},
	]),
	'W': new Glyph(1.4, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.width * .25), y:p => (p.baseline) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.width * .25), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.cap) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.width * .75), y:p => (p.baseline) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.width * .75), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.cap) },
		]},
	]),
	'X': new Glyph(1.0, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.baseline) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.right), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.left), y:p => (p.baseline) },
		]},
	]),
	'Y': new Glyph(1.0, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.cap / 2) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.right), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.cap / 2) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},
	]),
	'Z': new Glyph(1.0, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.left), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.baseline) },
		]},
	]),
	'.': new Glyph(0.1, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.baseline + .1) },
		]},
	]),
	',': new Glyph(0.1, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.baseline + .1) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid), y:p => (p.baseline - (p.curve * .5)) },
			{ x:p => (p.left - .03 + (p.curve * .5)), y:p => (p.baseline - .05) },
			{ x:p => (p.left - .03), y:p => (p.baseline - .1) },
		]},
	]),
	';': new Glyph(0.1, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.corpus) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.corpus - .1) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.baseline + .1) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid), y:p => (p.baseline - (p.curve * .5)) },
			{ x:p => (p.left - .03 + (p.curve * .5)), y:p => (p.baseline - .05) },
			{ x:p => (p.left - .03), y:p => (p.baseline - .1) },
		]},
	]),
	':': new Glyph(0.1, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.corpus) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.corpus - .1) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.baseline + .1) },
		]},
	]),
	'-': new Glyph(0.4, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.corpus / 2) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.corpus / 2) },
		]},
	]),
	'?': new Glyph(.8, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => ((p.corpus + .1)) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => ((p.corpus + .1) + p.curve) },
			{ x:p => (p.mid - p.curve), y:p => (p.asc) },
			{ x:p => (p.mid), y:p => (p.asc) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + p.curve), y:p => (p.asc) },
			{ x:p => (p.right), y:p => ((p.corpus + .1) + p.curve) },
			{ x:p => (p.right), y:p => ((p.corpus + .1)) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right), y:p => ((p.corpus + .1) - (p.curve * .4)) },
			{ x:p => ((p.mid * 1.5) + (p.curve * .4)), y:p => (p.corpus) },
			{ x:p => ((p.mid * 1.5)), y:p => (p.corpus) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => ((p.mid * 1.5) - (p.curve * .5)), y:p => (p.corpus) },
			{ x:p => (p.mid), y:p => ((p.corpus * .75) + (p.curve * .5)) },
			{ x:p => (p.mid), y:p => ((p.corpus * .75)) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.baseline + .2) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.baseline + .1) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},
	]),
	'\'': new Glyph(.3, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.asc * .9) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.corpus) },
		]},
	]),
	'"': new Glyph(.3, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.asc * .9) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.left), y:p => (p.corpus) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.right), y:p => (p.asc * .9) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.corpus) },
		]},

	]),

	// digits and symbols
	// (comment by Claude)
	'0': new Glyph(.7, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.cap) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - (p.curve * 1.2)), y:p => (p.cap) },
			{ x:p => (p.left), y:p => (p.cap / 2 + (p.curve * 1.2)) },
			{ x:p => (p.left), y:p => (p.cap / 2) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => (p.cap / 2 - (p.curve * 1.2)) },
			{ x:p => (p.mid - (p.curve * 1.2)), y:p => (p.baseline) },
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + (p.curve * 1.2)), y:p => (p.baseline) },
			{ x:p => (p.right), y:p => (p.cap / 2 - (p.curve * 1.2)) },
			{ x:p => (p.right), y:p => (p.cap / 2) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right), y:p => (p.cap / 2 + (p.curve * 1.2)) },
			{ x:p => (p.mid + (p.curve * 1.2)), y:p => (p.cap) },
			{ x:p => (p.mid), y:p => (p.cap) },
		]},
	]),
	'1': new Glyph(.4, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap * .8) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.baseline) },
		]},
	]),
	'2': new Glyph(.7, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap * .75) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => (p.cap * .75 + p.curve) },
			{ x:p => (p.mid - p.curve), y:p => (p.cap) },
			{ x:p => (p.mid), y:p => (p.cap) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + p.curve), y:p => (p.cap) },
			{ x:p => (p.right), y:p => (p.cap * .75 + p.curve) },
			{ x:p => (p.right), y:p => (p.cap * .75) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right), y:p => (p.cap * .5 - p.curve) },
			{ x:p => (p.left), y:p => (p.cap * .3) },
			{ x:p => (p.left), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.baseline) },
		]},
	]),
	'3': new Glyph(.7, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap * .8) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => (p.cap * .8 + (p.curve * .7)) },
			{ x:p => (p.mid - p.curve), y:p => (p.cap) },
			{ x:p => (p.mid), y:p => (p.cap) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + p.curve), y:p => (p.cap) },
			{ x:p => (p.right), y:p => (p.cap * .75 + (p.curve * .7)) },
			{ x:p => (p.right), y:p => (p.cap * .75) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right), y:p => (p.cap * .75 - (p.curve * .7)) },
			{ x:p => (p.mid + p.curve), y:p => (p.cap * .5) },
			{ x:p => (p.mid), y:p => (p.cap * .5) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + p.curve), y:p => (p.cap * .5) },
			{ x:p => (p.right), y:p => (p.cap * .25 + (p.curve * .7)) },
			{ x:p => (p.right), y:p => (p.cap * .25) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right), y:p => (p.cap * .25 - (p.curve * .7)) },
			{ x:p => (p.mid + p.curve), y:p => (p.baseline) },
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - p.curve), y:p => (p.baseline) },
			{ x:p => (p.left), y:p => (p.cap * .2 - (p.curve * .7)) },
			{ x:p => (p.left), y:p => (p.cap * .2) },
		]},
	]),
	'4': new Glyph(.7, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.right * .75), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right * .75), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.left), y:p => (p.cap * .3) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.cap * .3) },
		]},
	]),
	'5': new Glyph(.7, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.right), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.left), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.left), y:p => (p.cap * .55) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - (p.curve * .5)), y:p => (p.cap * .62) },
			{ x:p => (p.right), y:p => (p.cap * .3 + p.curve * 1.5) },
			{ x:p => (p.right), y:p => (p.cap * .3) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right), y:p => (p.cap * .3 - p.curve) },
			{ x:p => (p.mid + p.curve), y:p => (p.baseline) },
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - p.curve), y:p => (p.baseline) },
			{ x:p => (p.left), y:p => (p.cap * .15 - (p.curve * .5)) },
			{ x:p => (p.left), y:p => (p.cap * .15) },
		]},
	]),
	'6': new Glyph(.7, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.right * .85), y:p => (p.cap) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - p.curve), y:p => (p.cap * .95) },
			{ x:p => (p.left), y:p => (p.cap * .6) },
			{ x:p => (p.left), y:p => (p.cap * .3) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => (p.cap * .3 - p.curve) },
			{ x:p => (p.mid - p.curve), y:p => (p.baseline) },
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + p.curve), y:p => (p.baseline) },
			{ x:p => (p.right), y:p => (p.cap * .3 - p.curve) },
			{ x:p => (p.right), y:p => (p.cap * .3) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right), y:p => (p.cap * .3 + p.curve) },
			{ x:p => (p.mid + p.curve), y:p => (p.cap * .6) },
			{ x:p => (p.mid), y:p => (p.cap * .6) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - p.curve), y:p => (p.cap * .6) },
			{ x:p => (p.left), y:p => (p.cap * .3 + p.curve) },
			{ x:p => (p.left), y:p => (p.cap * .3) },
		]},
	]),
	'7': new Glyph(.7, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid * .8), y:p => (p.baseline) },
		]},
	]),
	'8': new Glyph(.7, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.cap * .5) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - p.curve), y:p => (p.cap * .5) },
			{ x:p => (p.right * .1), y:p => (p.cap * .75 - (p.curve * .8)) },
			{ x:p => (p.right * .1), y:p => (p.cap * .75) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right * .1), y:p => (p.cap * .75 + (p.curve * .8)) },
			{ x:p => (p.mid - p.curve), y:p => (p.cap) },
			{ x:p => (p.mid), y:p => (p.cap) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + p.curve), y:p => (p.cap) },
			{ x:p => (p.right * .9), y:p => (p.cap * .75 + (p.curve * .8)) },
			{ x:p => (p.right * .9), y:p => (p.cap * .75) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right * .9), y:p => (p.cap * .75 - (p.curve * .8)) },
			{ x:p => (p.mid + p.curve), y:p => (p.cap * .5) },
			{ x:p => (p.mid), y:p => (p.cap * .5) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + p.curve), y:p => (p.cap * .5) },
			{ x:p => (p.right), y:p => (p.cap * .25 + p.curve) },
			{ x:p => (p.right), y:p => (p.cap * .25) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right), y:p => (p.cap * .25 - p.curve) },
			{ x:p => (p.mid + p.curve), y:p => (p.baseline) },
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - p.curve), y:p => (p.baseline) },
			{ x:p => (p.left), y:p => (p.cap * .25 - p.curve) },
			{ x:p => (p.left), y:p => (p.cap * .25) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => (p.cap * .25 + p.curve) },
			{ x:p => (p.mid - p.curve), y:p => (p.cap * .5) },
			{ x:p => (p.mid), y:p => (p.cap * .5) },
		]},
	]),
	'9': new Glyph(.7, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.right), y:p => (p.cap * .7) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right), y:p => (p.cap * .7 + p.curve) },
			{ x:p => (p.mid + p.curve), y:p => (p.cap) },
			{ x:p => (p.mid), y:p => (p.cap) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - p.curve), y:p => (p.cap) },
			{ x:p => (p.left), y:p => (p.cap * .7 + p.curve) },
			{ x:p => (p.left), y:p => (p.cap * .7) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => (p.cap * .7 - p.curve) },
			{ x:p => (p.mid - p.curve), y:p => (p.cap * .4) },
			{ x:p => (p.mid), y:p => (p.cap * .4) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + p.curve), y:p => (p.cap * .4) },
			{ x:p => (p.right), y:p => (p.cap * .7 - p.curve) },
			{ x:p => (p.right), y:p => (p.cap * .7) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right), y:p => (p.cap * .3) },
			{ x:p => (p.mid + p.curve), y:p => (p.baseline) },
			{ x:p => (p.mid * .3), y:p => (p.baseline) },
		]},
	]),
	'(': new Glyph(.3, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.right), y:p => (p.asc) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => (p.asc * .6) },
			{ x:p => (p.left), y:p => (p.desc * .5) },
			{ x:p => (p.right), y:p => (p.desc) },
		]},
	]),
	')': new Glyph(.3, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.asc) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right), y:p => (p.asc * .6) },
			{ x:p => (p.right), y:p => (p.desc * .5) },
			{ x:p => (p.left), y:p => (p.desc) },
		]},
	]),
	'[': new Glyph(.3, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.right), y:p => (p.asc) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.left), y:p => (p.asc) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.left), y:p => (p.desc) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.desc) },
		]},
	]),
	']': new Glyph(.3, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.asc) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.asc) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.desc) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.left), y:p => (p.desc) },
		]},
	]),
	'{': new Glyph(.4, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.right), y:p => (p.asc) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid), y:p => (p.asc) },
			{ x:p => (p.mid), y:p => (p.asc) },
			{ x:p => (p.mid), y:p => (p.asc - .1) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (((p.asc + p.desc) / 2) + .1) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid), y:p => (((p.asc + p.desc) / 2)) },
			{ x:p => (p.mid), y:p => (((p.asc + p.desc) / 2)) },
			{ x:p => (p.left), y:p => (((p.asc + p.desc) / 2)) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid), y:p => (((p.asc + p.desc) / 2)) },
			{ x:p => (p.mid), y:p => (((p.asc + p.desc) / 2)) },
			{ x:p => (p.mid), y:p => (((p.asc + p.desc) / 2) - .1) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.desc + .1) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid), y:p => (p.desc) },
			{ x:p => (p.mid), y:p => (p.desc) },
			{ x:p => (p.right), y:p => (p.desc) },
		]},
	]),
	'}': new Glyph(.4, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.asc) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid), y:p => (p.asc) },
			{ x:p => (p.mid), y:p => (p.asc) },
			{ x:p => (p.mid), y:p => (p.asc - .1) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (((p.asc + p.desc) / 2) + .1) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid), y:p => (((p.asc + p.desc) / 2)) },
			{ x:p => (p.mid), y:p => (((p.asc + p.desc) / 2)) },
			{ x:p => (p.right), y:p => (((p.asc + p.desc) / 2)) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid), y:p => (((p.asc + p.desc) / 2)) },
			{ x:p => (p.mid), y:p => (((p.asc + p.desc) / 2)) },
			{ x:p => (p.mid), y:p => (((p.asc + p.desc) / 2) - .1) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.desc + .1) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid), y:p => (p.desc) },
			{ x:p => (p.mid), y:p => (p.desc) },
			{ x:p => (p.left), y:p => (p.desc) },
		]},
	]),
	'!': new Glyph(.1, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.baseline + .2) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.baseline + .1) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},
	]),
	'/': new Glyph(.5, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.desc) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.asc) },
		]},
	]),
	'\\': new Glyph(.5, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.asc) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.desc) },
		]},
	]),
	'+': new Glyph(.5, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.corpus / 2) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.corpus / 2) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.corpus / 2 + p.mid) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.corpus / 2 - p.mid) },
		]},
	]),
	'=': new Glyph(.5, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.corpus * .75) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.corpus * .75) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.corpus * .25) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.corpus * .25) },
		]},
	]),
	'*': new Glyph(.5, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.cap * .4) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap * .85) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.cap * .55) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap * .55) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.cap * .85) },
		]},
	]),
	'&': new Glyph(.8, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.right), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right * .25), y:p => (p.cap * .6) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right * .1), y:p => (p.cap * .75) },
			{ x:p => (p.right * .2), y:p => (p.cap) },
			{ x:p => (p.right * .4), y:p => (p.cap) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right * .6), y:p => (p.cap) },
			{ x:p => (p.right * .65), y:p => (p.cap * .75) },
			{ x:p => (p.right * .5), y:p => (p.cap * .62) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right * .15), y:p => (p.cap * .35) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => (p.cap * .25) },
			{ x:p => (p.left), y:p => (p.baseline) },
			{ x:p => (p.right * .4), y:p => (p.baseline) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right * .7), y:p => (p.baseline) },
			{ x:p => (p.right * .85), y:p => (p.cap * .2) },
			{ x:p => (p.right), y:p => (p.cap * .35) },
		]},
	]),
	'#': new Glyph(.7, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.right * .4), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right * .25), y:p => (p.baseline) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.right * .8), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right * .65), y:p => (p.baseline) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap * .65) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.cap * .65) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap * .3) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.cap * .3) },
		]},
	]),
	'@': new Glyph(1.0, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid + p.mid * .35), y:p => (p.cap * .45) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + p.mid * .35), y:p => (p.cap * .45 + p.cap * .2 * .55) },
			{ x:p => (p.mid + p.mid * .35 * .55), y:p => (p.cap * .45 + p.cap * .2) },
			{ x:p => (p.mid), y:p => (p.cap * .45 + p.cap * .2) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - p.mid * .35 * .55), y:p => (p.cap * .45 + p.cap * .2) },
			{ x:p => (p.mid - p.mid * .35), y:p => (p.cap * .45 + p.cap * .2 * .55) },
			{ x:p => (p.mid - p.mid * .35), y:p => (p.cap * .45) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - p.mid * .35), y:p => (p.cap * .45 - p.cap * .2 * .55) },
			{ x:p => (p.mid - p.mid * .35 * .55), y:p => (p.cap * .45 - p.cap * .2) },
			{ x:p => (p.mid), y:p => (p.cap * .45 - p.cap * .2) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + p.mid * .35 * .55), y:p => (p.cap * .45 - p.cap * .2) },
			{ x:p => (p.mid + p.mid * .35), y:p => (p.cap * .45 - p.cap * .2 * .55) },
			{ x:p => (p.mid + p.mid * .35), y:p => (p.cap * .45) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid + p.mid * .35), y:p => (p.cap * .3) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + p.mid * .35), y:p => (p.cap * .15) },
			{ x:p => (p.right), y:p => (p.cap * .15) },
			{ x:p => (p.right), y:p => (p.cap * .45) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right), y:p => (p.cap * .45 + p.cap * .5 * .55) },
			{ x:p => (p.mid + p.mid * .55), y:p => (p.cap * .95) },
			{ x:p => (p.mid), y:p => (p.cap * .95) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - p.mid * .55), y:p => (p.cap * .95) },
			{ x:p => (p.left), y:p => (p.cap * .45 + p.cap * .5 * .55) },
			{ x:p => (p.left), y:p => (p.cap * .45) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => (p.cap * .45 - p.cap * .5 * .55) },
			{ x:p => (p.mid - p.mid * .55), y:p => (p.baseline - p.cap * .05) },
			{ x:p => (p.mid), y:p => (p.baseline - p.cap * .05) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + p.mid * .3), y:p => (p.baseline - p.cap * .05) },
			{ x:p => (p.right * .8), y:p => (p.baseline) },
			{ x:p => (p.right * .85), y:p => (p.baseline + p.cap * .05) },
		]},
	]),
	'%': new Glyph(.7, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.baseline) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.cap) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.right * .2 + p.right * .15), y:p => (p.cap * .8) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right * .2 + p.right * .15), y:p => (p.cap * .8 + p.cap * .15 * .55) },
			{ x:p => (p.right * .2 + p.right * .15 * .55), y:p => (p.cap * .8 + p.cap * .15) },
			{ x:p => (p.right * .2), y:p => (p.cap * .8 + p.cap * .15) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right * .2 - p.right * .15 * .55), y:p => (p.cap * .8 + p.cap * .15) },
			{ x:p => (p.right * .2 - p.right * .15), y:p => (p.cap * .8 + p.cap * .15 * .55) },
			{ x:p => (p.right * .2 - p.right * .15), y:p => (p.cap * .8) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right * .2 - p.right * .15), y:p => (p.cap * .8 - p.cap * .15 * .55) },
			{ x:p => (p.right * .2 - p.right * .15 * .55), y:p => (p.cap * .8 - p.cap * .15) },
			{ x:p => (p.right * .2), y:p => (p.cap * .8 - p.cap * .15) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right * .2 + p.right * .15 * .55), y:p => (p.cap * .8 - p.cap * .15) },
			{ x:p => (p.right * .2 + p.right * .15), y:p => (p.cap * .8 - p.cap * .15 * .55) },
			{ x:p => (p.right * .2 + p.right * .15), y:p => (p.cap * .8) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.right * .8 + p.right * .15), y:p => (p.cap * .2) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right * .8 + p.right * .15), y:p => (p.cap * .2 + p.cap * .15 * .55) },
			{ x:p => (p.right * .8 + p.right * .15 * .55), y:p => (p.cap * .2 + p.cap * .15) },
			{ x:p => (p.right * .8), y:p => (p.cap * .2 + p.cap * .15) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right * .8 - p.right * .15 * .55), y:p => (p.cap * .2 + p.cap * .15) },
			{ x:p => (p.right * .8 - p.right * .15), y:p => (p.cap * .2 + p.cap * .15 * .55) },
			{ x:p => (p.right * .8 - p.right * .15), y:p => (p.cap * .2) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right * .8 - p.right * .15), y:p => (p.cap * .2 - p.cap * .15 * .55) },
			{ x:p => (p.right * .8 - p.right * .15 * .55), y:p => (p.cap * .2 - p.cap * .15) },
			{ x:p => (p.right * .8), y:p => (p.cap * .2 - p.cap * .15) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right * .8 + p.right * .15 * .55), y:p => (p.cap * .2 - p.cap * .15) },
			{ x:p => (p.right * .8 + p.right * .15), y:p => (p.cap * .2 - p.cap * .15 * .55) },
			{ x:p => (p.right * .8 + p.right * .15), y:p => (p.cap * .2) },
		]},
	]),
	'<': new Glyph(.5, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.right), y:p => (p.corpus * 1.2) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.left), y:p => (p.corpus / 2) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.corpus * -.2) },
		]},
	]),
	'>': new Glyph(.5, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.corpus * 1.2) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.corpus / 2) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.left), y:p => (p.corpus * -.2) },
		]},
	]),
	'_': new Glyph(.6, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.desc * .5) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.desc * .5) },
		]},
	]),
	'|': new Glyph(.1, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.asc) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.desc) },
		]},
	]),
	'~': new Glyph(.6, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.corpus * .4) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right * .3), y:p => (p.corpus * .9) },
			{ x:p => (p.right * .7), y:p => (p.corpus * .1) },
			{ x:p => (p.right), y:p => (p.corpus * .6) },
		]},
	]),
	'$': new Glyph(.8, [
		{ op: OP_MOVE, d: [
			{x:p => (p.right), y:p => (p.cap * .8) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right - (p.curve * .3)), y:p => (p.cap * .8 + (p.curve * .7)) },
			{ x:p => (p.mid + (p.curve * .2)), y:p => (p.cap) },
			{ x:p => (p.mid), y:p => (p.cap) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - (p.curve * .7)), y:p => (p.cap) },
			{ x:p => (p.left), y:p => (p.cap * .8 + (p.curve * .4)) },
			{ x:p => (p.left), y:p => (p.cap * .8) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.left), y:p => (p.cap * .8 - (p.curve * .7)) },
			{ x:p => (p.mid - (p.curve * .7)), y:p => (p.cap * .55) },
			{ x:p => (p.mid), y:p => (p.cap * .5) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid + (p.curve * .7)), y:p => (p.cap * .45) },
			{ x:p => (p.right), y:p => (p.cap * .2 + (p.curve * .7)) },
			{ x:p => (p.right), y:p => (p.cap * .2) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.right), y:p => (p.cap * .2 - (p.curve * .4)) },
			{ x:p => (p.mid + (p.curve * .7)), y:p => (p.baseline) },
			{ x:p => (p.mid), y:p => (p.baseline) },
		]},
		{ op: OP_BEZIER, d: [
			{ x:p => (p.mid - (p.curve * .2)), y:p => (p.baseline) },
			{ x:p => (p.left + (p.curve * .3)), y:p => (p.cap * .2 - (p.curve * .7)) },
			{ x:p => (p.left), y:p => (p.cap * .2) },
		]},
		{ op: OP_MOVE, d:[
			{ x:p => (p.mid), y:p => (p.cap + .05) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.baseline - .05) },
		]},
	]),
	'^': new Glyph(.5, [
		{ op: OP_MOVE, d:[
			{ x:p => (p.left), y:p => (p.cap * .6) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.mid), y:p => (p.cap) },
		]},
		{ op: OP_LINE, d:[
			{ x:p => (p.right), y:p => (p.cap * .6) },
		]},
	]),
}

const DEFAULT_PARAMS = {
	'baseline_from_top': 0.7, // measured from the top
	'cap': 0.6, // a capital letter (like M)
	'asc': 0.7, // ascender (lowercase l)
	'desc': -0.3, // descender (bottom of a lowercase g or y)
	'corpus': 0.3, // aka x-height, height of a lowercase x
	'bar': 0.1, // middle bar in a lowercase e
	'linethickness': .05, // thickness of drawing pen
	'curve': 0.10, // governs curve control points
	'aperture': 0.7, // gaps in lowercase c, bottom of lowercase e
	'leading': .1,
	'tracking': .1,

	'nominalwidth': .4,

	// maybe don't let people override these two?
	// they are here for convenience
	'baseline': 0,
	'left': 0,

}

const DEFAULT_PXPARAMS = {
	'fontsize': 90,
	'left_kerning': 0,
	'right_kerning': 0,
	'slop': 0,
}

// curve and bar follow corpus unless they are given, see setDerivedParams
// (comment by Claude)
function deriveParams(params, inparams) {
	if (!('bar' in inparams) || isNaN(inparams.bar)) {
		params.bar = params.corpus / 2;
	}
	if (!('curve' in inparams) || isNaN(inparams.curve)) {
		params.curve = params.corpus * 0.28;
	}
	return params;
}

const DERIVED_DEFAULT_PARAMS = deriveParams(Object.assign({}, DEFAULT_PARAMS), {});

class Basic extends Font {
	constructor(pxparams, inparams) {
		super(pxparams, inparams);
	}

	getDefaultParams() {
		return DERIVED_DEFAULT_PARAMS;
	}

	getDefaultPxparams() {
		return DEFAULT_PXPARAMS;
	}

	getFontName() {
		return 'basic';
	}

	setDerivedParams(params, inparams) {
		return deriveParams(params, inparams);
	}

	getGlyphs() {
		return GLYPHS;
	}
}

export { Basic }
