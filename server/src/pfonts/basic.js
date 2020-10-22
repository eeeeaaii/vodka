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

import { MoveOp, BezierOp, LineOp, BezierPlotOp } from './drawingops.js'
import { Glyph } from "./glyph.js"
import { Font } from "./font.js"


const GLYPHS = {
	' ': new Glyph(.4, []),
	'a': new Glyph(.7, [
		{ op: 'move', d: [
			{ x:'left', y:'corpus * .75'},
		]},
		{ op: 'bezier', d: [
			{ x:'left', y:'corpus * .75 + (curve * .75)' },
			{ x:'mid - (curve * .75)', y:'corpus' },
			{ x:'mid', y:'corpus'},
		]},
		{ op: 'bezier', d: [
			{ x:'mid + (curve * .75)', y:'corpus' },
			{ x:'right', y:'corpus * .75 + (curve * .75)' },
			{ x:'right', y:'corpus * .75'},
		]},
		{ op: 'bezier', d: [
			{ x:'right', y:'corpus * .75 - (curve * .75)' },
			{ x:'mid + (curve * .75)', y:'corpus / 2' },
			{ x:'mid', y:'corpus / 2'},
		]},
		{ op: 'bezier', d: [
			{ x:'mid - (curve * .75)', y:'corpus / 2' },
			{ x:'left', y:'(corpus * .25) + (curve * .75)' },
			{ x:'left', y:'(corpus * .25)'},
		]},
		{ op: 'bezier', d: [
			{ x:'left', y:'(corpus * .25) - (curve * .75)' },
			{ x:'mid - (curve * .75)', y:'baseline' },
			{ x:'mid', y:'baseline'},
		]},
		{ op: 'bezier', d: [
			{ x:'mid + (curve * .75)', y:'baseline' },
			{ x:'right', y:'(corpus * .25) - (curve * .75)' },
			{ x:'right', y:'(corpus * .25)'},
		]},
		{ op: 'move', d: [
			{ x:'right', y:'corpus * .75'},
		]},
		{ op: 'line', d: [
			{ x:'right', y:'baseline - .02' },
		]},
	]),

	'b': new Glyph(1.0, [
		{ op:'move', d:[
			{ x:'left', y:'asc'},
		]},
		{ op:'line', d:[
			{ x:'left', y:'baseline'},
		]},
		{ op:'move', d:[
			{ x:'left', y:'corpus / 2'},
		]},
		{ op: 'bezier', d: [
			{ x:'left', y:'corpus / 2 + curve' },
			{ x:'mid - curve', y:'corpus' },
			{ x:'mid', y:'corpus'},
		]},

		{ op: 'bezier', d: [
			{ x:'mid + curve', y:'corpus' },
			{ x:'right', y:'corpus / 2 + curve' },
			{ x:'right', y:'corpus / 2'},
		]},

		{ op: 'bezier', d: [
			{ x:'right', y:'corpus / 2 - curve' },
			{ x:'mid + curve', y:'baseline' },
			{ x:'mid', y:'baseline'},
		]},

		{ op: 'bezier', d: [
			{ x:'mid - curve', y:'baseline' },
			 { x:'left', y:'corpus / 2 - curve' },
	  		{ x:'left', y:'corpus / 2'},
	  	]},
	]),

	'c': new Glyph(1.0, [
		{ op:'move', d:[
			{ x:'mid', y:'corpus'},
		]},
		{ op: 'bezier', d: [
			{ x:'mid - curve', y:'corpus' },
		 	{ x:'left', y:'corpus / 2 + curve' },
		 	{ x:'left', y:'corpus / 2'},
		 ]},
		{ op: 'bezier', d: [
			{ x:'left', y:'corpus / 2 - curve' },
		 	{ x:'mid - curve', y:'baseline' },
		 	{ x:'mid', y:'baseline'},
		 ]},
		{ op: 'bezierplot', d: [
			{ val: 'aperture' },
			{ x: 'mid', y: 'corpus'},
			{ x: 'mid + curve', y: 'corpus'},
			{ x: 'right', y: 'corpus / 2 + curve'},
			{ x: 'right', y: 'corpus / 2'},
		]},
		{ op: 'bezierplot', d: [
			{ val: 'aperture' },
			{ x: 'mid', y: 'baseline'},
			{ x: 'mid + curve', y: 'baseline'},
			{ x: 'right', y: 'corpus / 2 - curve'},
			{ x: 'right', y: 'corpus / 2'},
		]},
	]),

	'd': new Glyph(1.0, [
		{ op:'move', d:[
			{ x:'left', y:'corpus / 2'},
		]},
		{ op: 'bezier', d: [
			{ x:'left', y:'corpus / 2 + curve' },
			{ x:'mid - curve', y:'corpus' },
			{ x:'mid', y:'corpus'},
		]},

		{ op: 'bezier', d: [
			{ x:'mid + curve', y:'corpus' },
			{ x:'right', y:'corpus / 2 + curve' },
			{ x:'right', y:'corpus / 2'},
		]},

		{ op: 'bezier', d: [
			{ x:'right', y:'corpus / 2 - curve' },
			{ x:'mid + curve', y:'baseline' },
			{ x:'mid', y:'baseline'},
		]},

		{ op: 'bezier', d: [
			{ x:'mid - curve', y:'baseline' },
			{ x:'left', y:'corpus / 2 - curve' },
	  		{ x:'left', y:'corpus / 2'},
	  	]},
		{ op:'move', d:[
			{ x:'right', y:'asc'},
		]},
		{ op:'line', d:[
			{ x:'right', y:'baseline'},
		]},

	]),
	'e': new Glyph(1.0, [
		{ op:'move', d:[
			{ x:'left', y:'corpus / 2'},
		]},
		{ op:'line', d:[
			{ x:'right', y:'corpus / 2'},
		]},
		{ op: 'bezier', d: [
			{ x:'right', y:'corpus / 2 + curve' },
		 	{ x:'mid + curve', y:'corpus' },
		 	{ x:'mid', y:'corpus'},
		 ]},
		{ op: 'bezier', d: [
			{ x:'mid - curve', y:'corpus' },
		 	{ x:'left', y:'corpus / 2 + curve' },
		 	{ x:'left', y:'corpus / 2'},
		 ]},
		{ op: 'bezier', d: [
			{ x:'left', y:'corpus / 2 - curve' },
		 	{ x:'mid - curve', y:'baseline' },
		 	{ x:'mid', y:'baseline'},
		 ]},
		{ op: 'bezierplot', d: [
			{ val: 'aperture' },
			{ x: 'mid', y: 'baseline'},
			{ x: 'mid + curve', y: 'baseline'},
			{ x: 'right', y: 'corpus / 2 - curve'},
			{ x: 'right', y: 'corpus / 2'},
		]},
	]),
	'f': new Glyph(.6, [
		{ op:'move', d:[
			{ x:'right', y:'asc'},
		]},
		{ op: 'bezier', d: [
			{ x:'right - .1', y:'asc' },
		 	{ x:'mid', y:'asc * .8 + .1' },
		 	{ x:'mid', y:'asc * .8'},
		 ]},
		{ op:'line', d:[
			{ x:'mid', y:'baseline'},
		]},
		{ op:'move', d:[
			{ x:'left', y:'corpus'},
		]},
		{ op:'line', d:[
			{ x:'right', y:'corpus'},
		]},
	]),

	'g': new Glyph(1.0, [
		{ op:'move', d:[
			{ x:'left', y:'corpus / 2'},
		]},
		{ op: 'bezier', d: [
			{ x:'left', y:'corpus / 2 + curve' },
			{ x:'mid - curve', y:'corpus' },
			{ x:'mid', y:'corpus'},
		]},

		{ op: 'bezier', d: [
			{ x:'mid + curve', y:'corpus' },
			{ x:'right', y:'corpus / 2 + curve' },
			{ x:'right', y:'corpus / 2'},
		]},

		{ op: 'bezier', d: [
			{ x:'right', y:'corpus / 2 - curve' },
			{ x:'mid + curve', y:'baseline' },
			{ x:'mid', y:'baseline'},
		]},

		{ op: 'bezier', d: [
			{ x:'mid - curve', y:'baseline' },
			 { x:'left', y:'corpus / 2 - curve' },
	  		{ x:'left', y:'corpus / 2'},
	  	]},
		{ op:'move', d:[
			{ x:'right', y:'corpus'},
		]},
		{ op:'line', d:[
			{ x:'right', y:'desc * .4'},
		]},
		{ op: 'bezier', d: [
			{ x:'right', y:'desc * .4 - curve' },
			 { x:'mid + curve', y:'desc' },
	  		{ x:'mid', y:'desc'},
	  	]},
		{ op: 'bezier', d: [
			{ x:'mid - curve', y:'desc' },
			 { x:'left', y:'desc * .4 - curve' },
	  		{ x:'left', y:'desc * .4'},
	  	]},
	]),
	'h': new Glyph(.8, [
		{ op:'move', d:[
			{ x:'left', y:'asc'},
		]},
		{ op:'line', d:[
			{ x:'left', y:'baseline'},
		]},
		{ op:'line', d:[
			{ x:'left', y:'corpus / 2'}, // overdraw
		]},
		{ op: 'bezier', d: [
			{ x:'left', y:'corpus / 2 + curve' },
			{ x:'mid - curve', y:'corpus' },
			{ x:'mid', y:'corpus'},
		]},
		{ op: 'bezier', d: [
			{ x:'mid + curve', y:'corpus' },
			{ x:'right', y:'corpus / 2 + curve' },
			{ x:'right', y:'corpus / 2'},
		]},
		{ op:'line', d:[
			{ x:'right', y:'baseline'},
		]},
	]),
	'i': new Glyph(.15, [
		{ op:'move', d:[
			{ x:'mid', y:'baseline'},
		]},
		{ op:'line', d:[
			{ x:'mid', y:'corpus'},
		]},
		{ op:'move', d:[
			{ x:'mid', y:'corpus + .1'},
		]},
		{ op:'line', d:[
			{ x:'mid', y:'corpus + .2'},
		]},
	]),
	'j': new Glyph(.15, [
		{ op:'move', d:[
			{ x:'mid', y:'corpus'},
		]},
		{ op:'line', d:[
			{ x:'mid', y:'(desc + .1)'},
		]},
		{ op: 'bezier', d: [
			{ x:'mid', y:'(desc + .1) - .1' },
			{ x:'(left - .2) + .1', y:'desc' },
			{ x:'(left - .2)', y:'desc'},
		]},
		{ op:'move', d:[
			{ x:'mid', y:'corpus + .1'},
		]},
		{ op:'line', d:[
			{ x:'mid', y:'corpus + .2'},
		]},
	]),
	'k': new Glyph(.7, [
		{ op:'move', d:[
			{ x:'left', y:'asc'},
		]},
		{ op:'line', d:[
			{ x:'left', y:'baseline'},
		]},
		{ op:'move', d:[
			{ x:'left', y:'corpus * .4'},
		]},
		{ op:'line', d:[
			{ x:'right', y:'corpus'},
		]},
		{ op:'move', d:[
			{ x:'left + width * .4', y:'corpus * .6'},
		]},
		{ op:'line', d:[
			{ x:'right', y:'baseline'},
		]},
	]),
	'l': new Glyph(.1, [
		{ op:'move', d:[
			{ x:'mid', y:'asc'},
		]},
		{ op:'line', d:[
			{ x:'mid', y:'baseline'},
		]},
	]),
	'm': new Glyph(1.4, [
		{ op:'move', d:[
			{ x:'left', y:'corpus'},
		]},
		{ op:'line', d:[
			{ x:'left', y:'baseline'},
		]},
		{ op:'line', d:[
			{ x:'left', y:'corpus / 2'},
		]},
		{ op: 'bezier', d: [
			{ x:'left', y:'corpus / 2 + curve' },
			{ x:'mid * .5 - curve', y:'corpus' },
			{ x:'mid * .5 ', y:'corpus'},
		]},
		{ op: 'bezier', d: [
			{ x:'mid * .5 + curve', y:'corpus' },
			{ x:'mid', y:'corpus / 2 + curve' },
			{ x:'mid', y:'corpus / 2'},
		]},
		{ op:'line', d:[
			{ x:'mid', y:'baseline'},
		]},
		{ op:'line', d:[
			{ x:'mid', y:'corpus / 2'},
		]},
		{ op: 'bezier', d: [
			{ x:'mid', y:'corpus / 2 + curve' },
			{ x:'mid * 1.5 - curve', y:'corpus' },
			{ x:'mid * 1.5 ', y:'corpus'},
		]},
		{ op: 'bezier', d: [
			{ x:'mid * 1.5 + curve', y:'corpus' },
			{ x:'right', y:'corpus / 2 + curve' },
			{ x:'right', y:'corpus / 2'},
		]},
		{ op:'line', d:[
			{ x:'right', y:'baseline'},
		]},
	]),
	'n': new Glyph(0.7, [
		{ op:'move', d:[
			{ x:'left', y:'corpus'},
		]},
		{ op:'line', d:[
			{ x:'left', y:'baseline'},
		]},
		{ op:'line', d:[
			{ x:'left', y:'corpus / 2'},
		]},
		{ op: 'bezier', d: [
			{ x:'left', y:'corpus / 2 + curve' },
			{ x:'mid - curve', y:'corpus' },
			{ x:'mid ', y:'corpus'},
		]},
		{ op: 'bezier', d: [
			{ x:'mid + curve', y:'corpus' },
			{ x:'right', y:'corpus / 2 + curve' },
			{ x:'right', y:'corpus / 2'},
		]},
		{ op:'line', d:[
			{ x:'right', y:'baseline'},
		]},
	]),
	'o': new Glyph(1.0, [
		{ op:'move', d: [
			{x:'left', y:'corpus / 2'},
		]},
		{ op: 'bezier', d: [
			{ x:'left', y:'corpus / 2 + curve' },
			{ x:'mid - curve', y:'corpus' },
			{ x:'mid', y:'corpus'},
		]},

		{ op: 'bezier', d: [
			{ x:'mid + curve', y:'corpus' },
			{ x:'right', y:'corpus / 2 + curve' },
			{ x:'right', y:'corpus / 2'},
		]},

		{ op: 'bezier', d: [
			{ x:'right', y:'corpus / 2 - curve' },
			{ x:'mid + curve', y:'baseline' },
			{ x:'mid', y:'baseline'},
		]},

		{ op: 'bezier', d: [
			{ x:'mid - curve', y:'baseline' },
			 { x:'left', y:'corpus / 2 - curve' },
	  		{ x:'left', y:'corpus / 2'},
	  	]},
	]),
	'p': new Glyph(1.0, [
		{ op:'move', d: [
			{x:'left', y:'corpus'},
		]},
		{ op:'line', d: [
			{x:'left', y:'desc'},
		]},
		{ op:'move', d: [
			{x:'left', y:'corpus / 2'},
		]},
		{ op: 'bezier', d: [
			{ x:'left', y:'corpus / 2 + curve' },
			{ x:'mid - curve', y:'corpus' },
			{ x:'mid', y:'corpus'},
		]},

		{ op: 'bezier', d: [
			{ x:'mid + curve', y:'corpus' },
			{ x:'right', y:'corpus / 2 + curve' },
			{ x:'right', y:'corpus / 2'},
		]},

		{ op: 'bezier', d: [
			{ x:'right', y:'corpus / 2 - curve' },
			{ x:'mid + curve', y:'baseline' },
			{ x:'mid', y:'baseline'},
		]},

		{ op: 'bezier', d: [
			{ x:'mid - curve', y:'baseline' },
			 { x:'left', y:'corpus / 2 - curve' },
	  		{ x:'left', y:'corpus / 2'},
	  	]},
	]),
	'q': new Glyph(1.0, [
		{ op:'move', d: [
			{x:'left', y:'corpus / 2'},
		]},
		{ op: 'bezier', d: [
			{ x:'left', y:'corpus / 2 + curve' },
			{ x:'mid - curve', y:'corpus' },
			{ x:'mid', y:'corpus'},
		]},

		{ op: 'bezier', d: [
			{ x:'mid + curve', y:'corpus' },
			{ x:'right', y:'corpus / 2 + curve' },
			{ x:'right', y:'corpus / 2'},
		]},

		{ op: 'bezier', d: [
			{ x:'right', y:'corpus / 2 - curve' },
			{ x:'mid + curve', y:'baseline' },
			{ x:'mid', y:'baseline'},
		]},

		{ op: 'bezier', d: [
			{ x:'mid - curve', y:'baseline' },
			 { x:'left', y:'corpus / 2 - curve' },
	  		{ x:'left', y:'corpus / 2'},
	  	]},
		{ op:'move', d: [
			{x:'right', y:'corpus'},
		]},
		{ op:'line', d: [
			{x:'right', y:'desc'},
		]},
	]),
	'r': new Glyph(.4, [
		{ op:'move', d: [
			{x:'left', y:'corpus'},
		]},
		{ op:'line', d: [
			{x:'left', y:'baseline'},
		]},
		{ op:'line', d: [
			{x:'left', y:'corpus / 2'},
		]},
		{ op: 'bezier', d: [
			{ x:'left', y:'corpus / 2 + curve' },
			{ x:'right - curve', y:'corpus' },
			{ x:'right', y:'corpus'},
		]},
	]),
	's': new Glyph(.65, [
		{ op:'move', d: [
			{x:'right', y:'corpus * .8'},
		]},
		{ op: 'bezier', d: [
			{ x:'right - (curve * .3)', y:'corpus * .8 + (curve * .7)' },
			{ x:'mid + (curve * .2)', y:'corpus' },
			{ x:'mid', y:'corpus'},
		]},
		{ op: 'bezier', d: [
			{ x:'mid - (curve * .7)', y:'corpus' },
			{ x:'left', y:'corpus * .8 + (curve * .4)' },
			{ x:'left', y:'corpus * .8' },
		]},
		{ op: 'bezier', d: [
			{ x:'left', y:'corpus * .8 - (curve * .7)' },
			{ x:'mid - (curve * .7)', y:'corpus * .55' },
			{ x:'mid', y:'corpus * .5' },
		]},
		{ op: 'bezier', d: [
			{ x:'mid + (curve * .7)', y:'corpus * .45' },
			{ x:'right', y:'corpus * .2 + (curve * .7)' },
			{ x:'right', y:'corpus * .2' },
		]},
		{ op: 'bezier', d: [
			{ x:'right', y:'corpus * .2 - (curve * .4)' },
			{ x:'mid + (curve * .7)', y:'baseline' },
			{ x:'mid', y:'baseline'},
		]},
		{ op: 'bezier', d: [
			{ x:'mid - (curve * .2)', y:'baseline' },
			{ x:'left + (curve * .3)', y:'corpus * .2 - (curve * .7)' },
			{ x:'left', y:'corpus * .2'},
		]},
	]),
	't': new Glyph(.65, [
		{ op:'move', d: [
			{x:'width * .4', y:'asc * .8'},
		]},
		{ op:'line', d: [
			{x:'width * .4', y:'corpus * .2'},
		]},
		{ op: 'bezier', d: [
			{ x:'width * .4', y:'corpus * .2 - (curve * .3)' },
			{ x:'width * .7 - (curve * .3)', y:'baseline' },
			{ x:'width * .7', y:'baseline' },
		]},
		{ op: 'bezier', d: [
			{ x:'width * .7 + (curve * .3)', y:'baseline' },
			{ x:'right', y:'corpus * .2 - (curve * .3)' },
			{ x:'right', y:'corpus * .2' },
		]},
		{ op:'move', d: [
			{x:'left', y:'corpus'},
		]},
		{ op:'line', d: [
			{x:'right', y:'corpus'},
		]},
	]),
	'u': new Glyph(.8, [
		{ op:'move', d: [
			{x:'left', y:'corpus'},
		]},
		{ op:'line', d: [
			{x:'left', y:'corpus * .5'},
		]},
		{ op: 'bezier', d: [
			{ x:'left', y:'corpus * .5 - curve' },
			{ x:'mid - curve', y:'baseline' },
			{ x:'mid', y:'baseline' },
		]},
		{ op: 'bezier', d: [
			{ x:'mid + curve', y:'baseline' },
			{ x:'right', y:'corpus * .5 - curve' },
			{ x:'right', y:'corpus * .5' },
		]},
		{ op:'line', d: [
			{x:'right', y:'corpus'},
		]},
		{ op:'line', d: [
			{x:'right', y:'baseline'},
		]},
	]),
	'v': new Glyph(.8, [
		{ op:'move', d: [
			{x:'left', y:'corpus'},
		]},
		{ op:'line', d: [
			{x:'mid - (curve * .1)', y:'baseline'},
		]},
		{ op:'line', d: [
			{x:'mid + (curve * .1)', y:'baseline'},
		]},
		{ op:'line', d: [
			{x:'right', y:'corpus'},
		]},
	]),
	'w': new Glyph(1.6, [
		{ op:'move', d: [
			{x:'left', y:'corpus'},
		]},
		{ op:'line', d: [
			{x:'(width * .25) - (curve * .1)', y:'baseline'},
		]},
		{ op:'line', d: [
			{x:'(width * .25) + (curve * .1)', y:'baseline'},
		]},
		{ op:'line', d: [
			{x:'(width * .5) - (curve * .1)', y:'corpus * .95'},
		]},
		{ op:'line', d: [
			{x:'(width * .5) + (curve * .1)', y:'corpus * .95'},
		]},
		{ op:'line', d: [
			{x:'(width * .75) - (curve * .1)', y:'baseline'},
		]},
		{ op:'line', d: [
			{x:'(width * .75) + (curve * .1)', y:'baseline'},
		]},
		{ op:'line', d: [
			{x:'width', y:'corpus'},
		]},
	]),
	'x': new Glyph(.8, [
		{ op:'move', d: [
			{x:'left', y:'corpus'},
		]},
		{ op:'line', d: [
			{x:'right', y:'baseline'},
		]},
		{ op:'move', d: [
			{x:'right', y:'corpus'},
		]},
		{ op:'line', d: [
			{x:'left', y:'baseline'},
		]},

	]),
	'y': new Glyph(.8, [
		{ op:'move', d: [
			{x:'left', y:'corpus'},
		]},
		{ op:'line', d: [
			{x:'mid', y:'baseline'},
		]},
		{ op:'move', d: [
			{x:'right', y:'corpus'},
		]},
		{ op:'line', d: [
			{x:'left', y:'desc'},
		]},

	]),
	'z': new Glyph(.8, [
		{ op:'move', d: [
			{x:'left', y:'corpus'},
		]},
		{ op:'line', d: [
			{x:'right', y:'corpus'},
		]},
		{ op:'line', d: [
			{x:'left', y:'baseline'},
		]},
		{ op:'line', d: [
			{x:'right', y:'baseline'},
		]},

	]),


	'A': new Glyph(1.2, [
		{ op:'move', d: [
			{x:'left', y:'baseline'},
		]},
		{ op:'line', d: [
			{x:'mid - (curve * .1)', y:'cap'},
		]},
		{ op:'line', d: [
			{x:'mid + (curve * .1)', y:'cap'},
		]},
		{ op:'line', d: [
			{x:'right', y:'baseline'},
		]},
		{ op:'move', d: [
			{x:'width * .2', y:'corpus / 2'},
		]},
		{ op:'line', d: [
			{x:'width * .8', y:'corpus / 2'},
		]},
	]),

	'B': new Glyph(.8, [
		{ op:'move', d: [
			{x:'left', y:'cap'},
		]},
		{ op:'line', d: [
			{x:'left', y:'baseline'},
		]},
		{ op:'move', d: [
			{x:'left', y:'cap'},
		]},
		{ op:'line', d: [
			{x:'mid', y:'cap'},
		]},
		{ op: 'bezier', d: [
			{ x:'mid + curve', y:'cap' },
			{ x:'right', y:'cap * .75 + curve' },
			{ x:'right', y:'cap * .75' },
		]},
		{ op: 'bezier', d: [
			{ x:'right', y:'cap * .75 - curve' },
			{ x:'mid + curve', y:'cap * .5' },
			{ x:'mid', y:'cap * .5' },
		]},
		{ op:'line', d: [
			{x:'left', y:'cap * .5'},
		]},
		{ op:'line', d: [
			{x:'mid', y:'cap * .5'},
		]},
		{ op: 'bezier', d: [
			{ x:'mid + curve', y:'cap * .5' },
			{ x:'right', y:'cap * .25 + curve' },
			{ x:'right', y:'cap * .25' },
		]},
		{ op: 'bezier', d: [
			{ x:'right', y:'cap * .25 - curve' },
			{ x:'mid + curve', y:'baseline' },
			{ x:'mid', y:'baseline' },
		]},
		{ op:'line', d: [
			{x:'left', y:'baseline'},
		]},
	]),
	'C': new Glyph(1.2, [
		{ op:'move', d:[
			{ x:'mid', y:'cap'},
		]},
		{ op: 'bezier', d: [
			{ x:'mid - (curve * 1.3)', y:'cap' },
		 	{ x:'left', y:'cap / 2 + (curve * 1.3)' },
		 	{ x:'left', y:'cap / 2'},
		 ]},
		{ op: 'bezier', d: [
			{ x:'left', y:'cap / 2 - (curve * 1.3)' },
		 	{ x:'mid - (curve * 1.3)', y:'baseline' },
		 	{ x:'mid', y:'baseline'},
		 ]},
		{ op: 'bezierplot', d: [
			{ val: 'aperture' },
			{ x: 'mid', y: 'cap'},
			{ x: 'mid + (curve * 1.3)', y: 'cap'},
			{ x: 'right', y: 'cap / 2 + (curve * 1.3)'},
			{ x: 'right', y: 'cap / 2'},
		]},
		{ op: 'bezierplot', d: [
			{ val: 'aperture' },
			{ x: 'mid', y: 'baseline'},
			{ x: 'mid + (curve * 1.3)', y: 'baseline'},
			{ x: 'right', y: 'cap / 2 - (curve * 1.3)'},
			{ x: 'right', y: 'cap / 2'},
		]},
	]),
	'D': new Glyph(1.0, [
		{ op:'move', d:[
			{ x:'left', y:'cap'},
		]},
		{ op:'line', d:[
			{ x:'left', y:'baseline'},
		]},
		{ op:'move', d:[
			{ x:'left', y:'cap'},
		]},
		{ op:'line', d:[
			{ x:'mid', y:'cap'},
		]},
		{ op: 'bezier', d: [
			{ x:'mid + (curve * 1.2)', y:'cap' },
		 	{ x:'right', y:'cap / 2 + (curve * 1.2)' },
		 	{ x:'right', y:'cap / 2'},
		]},
		{ op: 'bezier', d: [
			{ x:'right', y:'cap / 2 - (curve * 1.2)' },
		 	{ x:'mid + (curve * 1.2)', y:'baseline' },
		 	{ x:'mid', y:'baseline'},
		]},
		{ op:'line', d:[
			{ x:'left', y:'baseline'},
		]},
	]),
	'E': new Glyph(1.0, [
		{ op:'move', d:[
			{ x:'left', y:'cap'},
		]},
		{ op:'line', d:[
			{ x:'left', y:'baseline'},
		]},
		{ op:'move', d:[
			{ x:'left', y:'cap'},
		]},
		{ op:'line', d:[
			{ x:'right', y:'cap'},
		]},
		{ op:'move', d:[
			{ x:'left', y:'cap / 2'},
		]},
		{ op:'line', d:[
			{ x:'right - (curve * 1.1)', y:'cap / 2'},
		]},
		{ op:'move', d:[
			{ x:'left', y:'baseline'},
		]},
		{ op:'line', d:[
			{ x:'right', y:'baseline'},
		]},
	]),
	'F': new Glyph(1.0, [
		{ op:'move', d:[
			{ x:'left', y:'cap'},
		]},
		{ op:'line', d:[
			{ x:'left', y:'baseline'},
		]},
		{ op:'move', d:[
			{ x:'left', y:'cap'},
		]},
		{ op:'line', d:[
			{ x:'right', y:'cap'},
		]},
		{ op:'move', d:[
			{ x:'left', y:'cap / 2'},
		]},
		{ op:'line', d:[
			{ x:'right - (curve * 1.1)', y:'cap / 2'},
		]},
	]),
	'G': new Glyph(1.2, [
		{ op:'move', d:[
			{ x:'mid', y:'cap'},
		]},
		{ op: 'bezier', d: [
			{ x:'mid - (curve * 1.3)', y:'cap' },
		 	{ x:'left', y:'cap / 2 + (curve * 1.3)' },
		 	{ x:'left', y:'cap / 2'},
		 ]},
		{ op: 'bezier', d: [
			{ x:'left', y:'cap / 2 - (curve * 1.3)' },
		 	{ x:'mid - (curve * 1.3)', y:'baseline' },
		 	{ x:'mid', y:'baseline'},
		 ]},
		{ op: 'bezierplot', d: [
			{ val: 'aperture' },
			{ x: 'mid', y: 'cap'},
			{ x: 'mid + (curve * 1.3)', y: 'cap'},
			{ x: 'right', y: 'cap / 2 + (curve * 1.3)'},
			{ x: 'right', y: 'cap / 2'},
		]},
		{ op: 'bezierplot', d: [
			{ val: 'aperture' },
			{ x: 'mid', y: 'baseline'},
			{ x: 'mid + (curve * 1.3)', y: 'baseline'},
			{ x: 'right', y: 'cap / 2 - (curve * 1.3)'},
			{ x: 'right', y: 'cap / 2'},
		]},
		{ op:'move', d:[
			{ x:'right - .02', y:'baseline'},
		]},
		{ op:'line', d:[
			{ x:'right - .02', y:'corpus * .75'},
		]},
		{ op:'line', d:[
			{ x:'mid + curve', y:'corpus * .75'},
		]},
	]),
	'H': new Glyph(.9, [
		{ op:'move', d:[
			{ x:'left', y:'cap'},
		]},
		{ op:'line', d:[
			{ x:'left', y:'baseline'},
		]},
		{ op:'move', d:[
			{ x:'left', y:'cap / 2'},
		]},
		{ op:'line', d:[
			{ x:'right', y:'cap / 2'},
		]},
		{ op:'move', d:[
			{ x:'right', y:'cap'},
		]},
		{ op:'line', d:[
			{ x:'right', y:'baseline'},
		]},
	]),
	'I': new Glyph(.3, [
		{ op:'move', d:[
			{ x:'mid', y:'cap'},
		]},
		{ op:'line', d:[
			{ x:'mid', y:'baseline'},
		]},
	]),
	'J': new Glyph(.8, [
		{ op:'move', d:[
			{ x:'right', y:'cap'},
		]},
		{ op:'line', d:[
			{ x:'right', y:'corpus / 2'},
		]},
		{ op: 'bezier', d: [
			{ x:'right', y:'corpus / 2 - curve' },
		 	{ x:'mid + curve', y:'baseline' },
		 	{ x:'mid', y:'baseline'},
		]},
		{ op: 'bezier', d: [
			{ x:'mid - curve', y:'baseline' },
		 	{ x:'left', y:'corpus / 2 - curve' },
		 	{ x:'left', y:'corpus / 2'},
		]},
	]),
	'K': new Glyph(1.0, [
		{ op:'move', d:[
			{ x:'left', y:'cap'},
		]},
		{ op:'line', d:[
			{ x:'left', y:'baseline'},
		]},
		{ op:'move', d:[
			{ x:'left', y:'cap / 2 - (curve)'},
		]},
		{ op:'line', d:[
			{ x:'right', y:'cap'},
		]},
		{ op:'move', d:[
			{ x:'left + .1', y:'cap / 2'},
		]},
		{ op:'line', d:[
			{ x:'right', y:'baseline'},
		]},
	]),
	'L': new Glyph(.8, [
		{ op:'move', d:[
			{ x:'left', y:'cap'},
		]},
		{ op:'line', d:[
			{ x:'left', y:'baseline'},
		]},
		{ op:'line', d:[
			{ x:'right', y:'baseline'},
		]},
	]),
	'M': new Glyph(1.2, [
		{ op:'move', d:[
			{ x:'left', y:'cap'},
		]},
		{ op:'line', d:[
			{ x:'left', y:'baseline'},
		]},
		{ op:'move', d:[
			{ x:'left', y:'cap'},
		]},
		{ op:'line', d:[
			{ x:'mid', y:'baseline'},
		]},
		{ op:'move', d:[
			{ x:'mid', y:'baseline'},
		]},
		{ op:'line', d:[
			{ x:'right', y:'cap'},
		]},
		{ op:'move', d:[
			{ x:'right', y:'cap'},
		]},
		{ op:'line', d:[
			{ x:'right', y:'baseline'},
		]},
	]),
	'N': new Glyph(1.0, [
		{ op:'move', d:[
			{ x:'left', y:'cap'},
		]},
		{ op:'line', d:[
			{ x:'left', y:'baseline'},
		]},
		{ op:'move', d:[
			{ x:'left', y:'cap'},
		]},
		{ op:'line', d:[
			{ x:'right', y:'baseline'},
		]},
		{ op:'move', d:[
			{ x:'right', y:'cap'},
		]},
		{ op:'line', d:[
			{ x:'right', y:'baseline'},
		]},
	]),
	'O': new Glyph(1.0, [
		{ op:'move', d:[
			{ x:'mid', y:'cap'},
		]},
		{ op: 'bezier', d: [
			{ x:'mid - (curve * 1.2)', y:'cap' },
		 	{ x:'left', y:'cap / 2 + (curve * 1.2)' },
		 	{ x:'left', y:'cap / 2'},
		]},
		{ op: 'bezier', d: [
			{ x:'left', y:'cap / 2 - (curve * 1.2)' },
		 	{ x:'mid - (curve * 1.2)', y:'baseline' },
		 	{ x:'mid', y:'baseline' },
		]},
		{ op: 'bezier', d: [
		 	{ x:'mid + (curve * 1.2)', y:'baseline' },
		 	{ x:'right', y:'cap / 2 - (curve * 1.2)'},
		 	{ x:'right', y:'cap / 2'},
		]},
		{ op: 'bezier', d: [
		 	{ x:'right', y:'cap / 2 + (curve * 1.2)' },
		 	{ x:'mid + (curve * 1.2)', y:'cap'},
		 	{ x:'mid', y:'cap'},
		]},
	]),

	'P': new Glyph(.8, [
		{ op:'move', d: [
			{x:'left', y:'cap'},
		]},
		{ op:'line', d: [
			{x:'left', y:'baseline'},
		]},
		{ op:'move', d: [
			{x:'left', y:'cap'},
		]},
		{ op:'line', d: [
			{x:'mid', y:'cap'},
		]},
		{ op: 'bezier', d: [
			{ x:'mid + curve', y:'cap' },
			{ x:'right', y:'cap * .75 + curve' },
			{ x:'right', y:'cap * .75' },
		]},
		{ op: 'bezier', d: [
			{ x:'right', y:'cap * .75 - curve' },
			{ x:'mid + curve', y:'cap * .5' },
			{ x:'mid', y:'cap * .5' },
		]},
		{ op:'line', d: [
			{x:'left', y:'cap * .5'},
		]},
	]),

	'Q': new Glyph(1.0, [
		{ op:'move', d:[
			{ x:'mid', y:'cap'},
		]},
		{ op: 'bezier', d: [
			{ x:'mid - (curve * 1.2)', y:'cap' },
		 	{ x:'left', y:'cap / 2 + (curve * 1.2)' },
		 	{ x:'left', y:'cap / 2'},
		]},
		{ op: 'bezier', d: [
			{ x:'left', y:'cap / 2 - (curve * 1.2)' },
		 	{ x:'mid - (curve * 1.2)', y:'baseline' },
		 	{ x:'mid', y:'baseline' },
		]},
		{ op: 'bezier', d: [
		 	{ x:'mid + (curve * 1.2)', y:'baseline' },
		 	{ x:'right', y:'cap / 2 - (curve * 1.2)'},
		 	{ x:'right', y:'cap / 2'},
		]},
		{ op: 'bezier', d: [
		 	{ x:'right', y:'cap / 2 + (curve * 1.2)' },
		 	{ x:'mid + (curve * 1.2)', y:'cap'},
		 	{ x:'mid', y:'cap'},
		]},
		{ op:'move', d:[
			{ x:'mid + (curve / 2)', y:'baseline'},
		]},		
		{ op:'line', d:[
			{ x:'mid + curve', y:'baseline - curve'},
		]},		
	]),

	'R': new Glyph(.8, [
		{ op:'move', d: [
			{x:'left', y:'cap'},
		]},
		{ op:'line', d: [
			{x:'left', y:'baseline'},
		]},
		{ op:'move', d: [
			{x:'left', y:'cap'},
		]},
		{ op:'line', d: [
			{x:'mid', y:'cap'},
		]},
		{ op: 'bezier', d: [
			{ x:'mid + curve', y:'cap' },
			{ x:'right', y:'cap * .75 + curve' },
			{ x:'right', y:'cap * .75' },
		]},
		{ op: 'bezier', d: [
			{ x:'right', y:'cap * .75 - curve' },
			{ x:'mid + curve', y:'cap * .5' },
			{ x:'mid', y:'cap * .5' },
		]},
		{ op:'line', d: [
			{x:'left', y:'cap * .5'},
		]},
		{ op:'move', d: [
			{x:'mid', y:'cap * .5'},
		]},
		{ op:'line', d: [
			{x:'right', y:'baseline'},
		]},
	]),

	'S': new Glyph(.8, [
		{ op:'move', d: [
			{x:'right', y:'cap * .8'},
		]},
		{ op: 'bezier', d: [
			{ x:'right - (curve * .3)', y:'cap * .8 + (curve * .7)' },
			{ x:'mid + (curve * .2)', y:'cap' },
			{ x:'mid', y:'cap'},
		]},
		{ op: 'bezier', d: [
			{ x:'mid - (curve * .7)', y:'cap' },
			{ x:'left', y:'cap * .8 + (curve * .4)' },
			{ x:'left', y:'cap * .8' },
		]},
		{ op: 'bezier', d: [
			{ x:'left', y:'cap * .8 - (curve * .7)' },
			{ x:'mid - (curve * .7)', y:'cap * .55' },
			{ x:'mid', y:'cap * .5' },
		]},
		{ op: 'bezier', d: [
			{ x:'mid + (curve * .7)', y:'cap * .45' },
			{ x:'right', y:'cap * .2 + (curve * .7)' },
			{ x:'right', y:'cap * .2' },
		]},
		{ op: 'bezier', d: [
			{ x:'right', y:'cap * .2 - (curve * .4)' },
			{ x:'mid + (curve * .7)', y:'baseline' },
			{ x:'mid', y:'baseline'},
		]},
		{ op: 'bezier', d: [
			{ x:'mid - (curve * .2)', y:'baseline' },
			{ x:'left + (curve * .3)', y:'cap * .2 - (curve * .7)' },
			{ x:'left', y:'cap * .2'},
		]},
	]),

	'T': new Glyph(1.0, [
		{ op:'move', d:[
			{ x:'mid', y:'cap'},
		]},
		{ op:'line', d:[
			{ x:'mid', y:'baseline'},
		]},
		{ op:'move', d:[
			{ x:'left', y:'cap'},
		]},
		{ op:'line', d:[
			{ x:'right', y:'cap'},
		]},
	]),

	'U': new Glyph(1.0, [
		{ op:'move', d:[
			{ x:'left', y:'cap'},
		]},
		{ op:'line', d:[
			{ x:'left', y:'corpus / 2'},
		]},
		{ op: 'bezier', d: [
			{ x:'left', y:'corpus / 2 - curve' },
			{ x:'mid - curve', y:'baseline' },
			{ x:'mid', y:'baseline'},
		]},
		{ op: 'bezier', d: [
			{ x:'mid + curve', y:'baseline'},
			{ x:'right', y:'corpus / 2 - curve' },
			{ x:'right', y:'corpus / 2' },
		]},
		{ op:'line', d:[
			{ x:'right', y:'cap'},
		]},
	]),
	'V': new Glyph(1.0, [
		{ op:'move', d:[
			{ x:'left', y:'cap'},
		]},
		{ op:'line', d:[
			{ x:'mid', y:'baseline'},
		]},
		{ op:'move', d:[
			{ x:'mid', y:'baseline'},
		]},
		{ op:'line', d:[
			{ x:'right', y:'cap'},
		]},
	]),
	'W': new Glyph(1.4, [
		{ op:'move', d:[
			{ x:'left', y:'cap'},
		]},
		{ op:'line', d:[
			{ x:'width * .25', y:'baseline'},
		]},
		{ op:'move', d:[
			{ x:'width * .25', y:'baseline'},
		]},
		{ op:'line', d:[
			{ x:'mid', y:'cap'},
		]},
		{ op:'move', d:[
			{ x:'mid', y:'cap'},
		]},
		{ op:'line', d:[
			{ x:'width * .75', y:'baseline'},
		]},
		{ op:'move', d:[
			{ x:'width * .75', y:'baseline'},
		]},
		{ op:'line', d:[
			{ x:'right', y:'cap'},
		]},
	]),
	'X': new Glyph(1.0, [
		{ op:'move', d:[
			{ x:'left', y:'cap'},
		]},
		{ op:'line', d:[
			{ x:'right', y:'baseline'},
		]},
		{ op:'move', d:[
			{ x:'right', y:'cap'},
		]},
		{ op:'line', d:[
			{ x:'left', y:'baseline'},
		]},
	]),
	'Y': new Glyph(1.0, [
		{ op:'move', d:[
			{ x:'left', y:'cap'},
		]},
		{ op:'line', d:[
			{ x:'mid', y:'cap / 2'},
		]},
		{ op:'move', d:[
			{ x:'right', y:'cap'},
		]},
		{ op:'line', d:[
			{ x:'mid', y:'cap / 2'},
		]},
		{ op:'line', d:[
			{ x:'mid', y:'baseline'},
		]},
	]),
	'Z': new Glyph(1.0, [
		{ op:'move', d:[
			{ x:'left', y:'cap'},
		]},
		{ op:'line', d:[
			{ x:'right', y:'cap'},
		]},
		{ op:'line', d:[
			{ x:'left', y:'baseline'},
		]},
		{ op:'line', d:[
			{ x:'right', y:'baseline'},
		]},
	]),
	'.': new Glyph(0.1, [
		{ op:'move', d:[
			{ x:'mid', y:'baseline'},
		]},
		{ op:'line', d:[
			{ x:'mid', y:'baseline + .1'},
		]},
	]),
	',': new Glyph(0.1, [
		{ op:'move', d:[
			{ x:'mid', y:'baseline'},
		]},
		{ op:'line', d:[
			{ x:'mid', y:'baseline + .1'},
		]},
		{ op:'move', d:[
			{ x:'mid', y:'baseline'},
		]},
		{ op: 'bezier', d: [
			{ x:'mid', y:'baseline - (curve * .5)'},
			{ x:'left - .03 + (curve * .5)', y:'baseline - .05' },
			{ x:'left - .03', y:'baseline - .1' },
		]},
	]),
	';': new Glyph(0.1, [
		{ op:'move', d:[
			{ x:'mid', y:'corpus'},
		]},
		{ op:'line', d:[
			{ x:'mid', y:'corpus - .1'},
		]},
		{ op:'move', d:[
			{ x:'mid', y:'baseline'},
		]},
		{ op:'line', d:[
			{ x:'mid', y:'baseline + .1'},
		]},
		{ op:'move', d:[
			{ x:'mid', y:'baseline'},
		]},
		{ op: 'bezier', d: [
			{ x:'mid', y:'baseline - (curve * .5)'},
			{ x:'left - .03 + (curve * .5)', y:'baseline - .05' },
			{ x:'left - .03', y:'baseline - .1' },
		]},
	]),
	':': new Glyph(0.1, [
		{ op:'move', d:[
			{ x:'mid', y:'corpus'},
		]},
		{ op:'line', d:[
			{ x:'mid', y:'corpus - .1'},
		]},
		{ op:'move', d:[
			{ x:'mid', y:'baseline'},
		]},
		{ op:'line', d:[
			{ x:'mid', y:'baseline + .1'},
		]},
	]),
	'-': new Glyph(0.4, [
		{ op:'move', d:[
			{ x:'left', y:'corpus / 2'},
		]},
		{ op:'line', d:[
			{ x:'right', y:'corpus / 2'},
		]},
	]),
	'?': new Glyph(.8, [
		{ op:'move', d:[
			{ x:'left', y:'(corpus + .1)'},
		]},
		{ op: 'bezier', d: [
			{ x:'left', y:'(corpus + .1) + curve'},
			{ x:'mid - curve', y:'asc' },
			{ x:'mid', y:'asc' },
		]},
		{ op: 'bezier', d: [
			{ x:'mid + curve', y:'asc' },
			{ x:'right', y:'(corpus + .1) + curve' },
			{ x:'right', y:'(corpus + .1)' },
		]},
		{ op: 'bezier', d: [
			{ x:'right', y:'(corpus + .1) - (curve * .4)' },
			{ x:'(mid * 1.5) + (curve * .4)', y:'corpus' },
			{ x:'(mid * 1.5)', y:'corpus' },
		]},
		{ op: 'bezier', d: [
			{ x:'(mid * 1.5) - (curve * .5)', y:'corpus' },
			{ x:'mid', y:'(corpus * .75) + (curve * .5)' },
			{ x:'mid', y:'(corpus * .75)' },
		]},
		{ op:'line', d:[
			{ x:'mid', y:'baseline + .2'},
		]},
		{ op:'move', d:[
			{ x:'mid', y:'baseline + .1'},
		]},
		{ op:'line', d:[
			{ x:'mid', y:'baseline'},
		]},
	]),
	'\'': new Glyph(.3, [
		{ op:'move', d:[
			{ x:'mid', y:'asc * .9'},
		]},
		{ op:'line', d:[
			{ x:'mid', y:'corpus'},
		]},
	]),
	'"': new Glyph(.3, [
		{ op:'move', d:[
			{ x:'left', y:'asc * .9'},
		]},
		{ op:'line', d:[
			{ x:'left', y:'corpus'},
		]},
		{ op:'move', d:[
			{ x:'right', y:'asc * .9'},
		]},
		{ op:'line', d:[
			{ x:'right', y:'corpus'},
		]},

	]),

}

const DEFAULT_PARAMS = {
	'baseline': 0.7, // measured from the top
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
}

const DEFAULT_PXPARAMS = {
	'fontsize': 90,
	'left_kerning': 0,
	'right_kerning': 0,
	'slop': 0,
}

let defaultParamsHaveBeenSet = false;
let defaultParams = {};

class Basic extends Font {
	constructor(pxparams, inparams) {
		super(pxparams, inparams);
		if (!defaultParamsHaveBeenSet) {
			defaultParams = this.setDerivedParams(DEFAULT_PARAMS, {});
			defaultParamsHaveBeenSet = true;
		}
	}

	getDefaultParams() {
		return defaultParams;
	}

	getDefaultPxparams() {
		return DEFAULT_PXPARAMS;
	}

	createWithParams(pxparams, inparams) {
		return new Basic(pxparams, inparams);
	}

	getFontName() {
		return 'basic';
	}

	setDerivedParams(params, inparams) {
		if (!inparams.bar) {
			params.bar = params.corpus / 2;
		}
		if (!inparams.curve) {
			params.curve = params.corpus * 0.28;
		}
		return params; // no additional params or changes to defaults
	}

	getGlyphs() {
		return GLYPHS;
	}
}

export { Basic }

