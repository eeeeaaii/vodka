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

// sort of want to not import other nex types because someday
// this will be a totally separate package thing
import { templateStore } from '../templates.js'
import { Integer } from '../nex/integer.js'
import { Org } from '../nex/org.js'
import { experiments } from '../globalappflags.js'

class ForeignGlobalData {
	constructor() {
		this.audioCtx = null;
	}

}


const foreignGlobalData = new ForeignGlobalData();

function createNativeOrgs() {
	let nillynil = experiments.ORG_OVERHAUL ? '' : '^ ';

	// this works
	templateStore.bindForeignClosure('alert', ' =a', 'pops up an alert.', function(a) {
		alert(a[0].prettyPrint());
	});

	templateStore.createForeignTemplate(
		'Notification',
		'Represents a notification.',
		[
			{
				'name': 'show',
				'args': `${nillynil}a$`,
				'docs': 'shows a notification with |a in it.',
				'func': function(a) {
					Notification.requestPermission().then(
						function (permission) {
			    		if (permission === "granted") {
							var notification = new Notification(a);
			    	}
		    	});
				}
			}
		]
	);

	templateStore.createForeignTemplate(
		'Canvas',
		'Canvas that can be drawn on',
		[
			{
				'name': ':draw',
				'args': 'nex',
				'func': function(idk) {
					return this.canvasNode;
				}
			},
			{
				'name': ':init',
				'args': `${nillynil}w# h#`,
				'docs': 'initializes the Canvas.',
				'func': function(args) {
					// we don't want the contents of the canvas to get destroyed in between calls to draw
					// so we store the node in private data and re-append every time we draw
					this.canvasNode = document.createElement('canvas');
					this.width = args[0];
					this.height = args[1];
					this.canvasNode.setAttribute('height', '' + this.height);
					this.canvasNode.setAttribute('width', '' + this.width);
					this.ctx = this.canvasNode.getContext("2d");

					this.toHex = function(n) {
						let z = n.toString(16);
						if (z.length == 1) {
							z = '0' + z;
						}
						return z;
					}

					this.setFillFromColor = function(color) {
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
						this.ctx.globalAlpha = t;
						this.ctx.fillStyle = '#' + this.toHex(r) + this.toHex(g) + this.toHex(b);
					}

					this.setStrokeFromColor = function(color) {
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
						this.ctx.globalAlpha = t;
						this.ctx.strokeStyle = '#' + this.toHex(r) + this.toHex(g) + this.toHex(b);
					}
				}
			},
 			{
				'name': 'copy-from-clipboard',
				'args': '',
				'docs': 'copies data out of the clipboard into the canvas',
				'func': function(args) {
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
								t.ctx.drawImage(image, 0, 0);
								body.removeChild(image);
			                }, 10);
						})
					});
			    }
			},
 			{
				'name': 'color-at',
				'args': '() x# y#',
				'docs': 'retrieves the color at a position x or y',
				'func': function(args) {
					let x = args[0];
					let y = args[1];
					let imgdata = this.ctx.getImageData(x, y, 1, 1)
					let r = imgdata.data[0];
					let g = imgdata.data[1];
					let b = imgdata.data[2];
					let a = imgdata.data[3];
					let ret = new Org();
					ret.appendChild(new Integer(r))
					ret.appendChild(new Integer(g))
					ret.appendChild(new Integer(b))
					ret.appendChild(new Integer(a))
					return ret;
			    }
			},
			{
				'name': 'dot',
				'args': `${nillynil}color() x# y#`,
				'docs': 'draws a dot with color |color at |x and |y.',
				'func': function(args) {
					this.setFillFromColor(args[0]);
					let x = args[1];
					let y = args[2];
					this.ctx.fillRect(x, y, 1, 1);
			    }
			},
			{
				'name': 'rect',
				'args': `${nillynil}color() x# y# w# h#`,
				'docs': 'draws a rectangle with color |color at |x, |y with width |w and height |h.',
				'func': function(args) {
					this.setFillFromColor(args[0]);
					let x = args[1];
					let y = args[2];
					let w = args[3];
					let h = args[4];
					this.ctx.fillRect(x, y, w, h);
			    }
			},
			{
				'name': 'line',
				'args': `${nillynil}color() a0# a1# a2# a3#`,
				'docs': 'draws a line with color |color from point |a0, |a1 to point |a2, |a3.',
				'func': function(args) {
					this.setStrokeFromColor(args[0]);
					this.ctx.beginPath();
					this.ctx.moveTo(args[1], args[2]);
					this.ctx.lineTo(args[3], args[4]);
					this.ctx.stroke();
			    }
			},
			{
				'name': 'fill-background',
				'args': `${nillynil}color()`,
				'docs': 'fills the background of the canvas with color |color.',
				'func': function(args) {
					let color = args[0];
					let r = color[0];
					let g = color[1];
					let b = color[2];
					this.ctx.fillStyle = '#' + this.toHex(r) + this.toHex(g) + this.toHex(b);
					this.ctx.fillRect(0, 0, this.width, this.height);
			    }
			}
		]
	);


	templateStore.createForeignTemplate(
		'Oscillator',
		'Generates a tone.',
		[
			{
				'name': ':draw',
				'args': 'nex',
				'func': function(idk) {
					return 'OSCILLATOR';
				}
			},
			{
				'name': ':init',
				'args': '',
				'docs': 'initializes the oscillator.',
				'func': function(args) {
					// I want to make it so that this works if you
					// instantiate it as a standalone, but also
					// works if you put it in a chain.
					//
					// I also need to make a global singleton to store the audio context
					// for all of these
					//
					if (!this.audioCtx) {
						foreignGlobalData.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
					}

					// create Oscillator node
					this.oscillator = foreignGlobalData.audioCtx.createOscillator();

					this.oscillator.type = 'square';
					this.oscillator.frequency.setValueAtTime(440, foreignGlobalData.audioCtx.currentTime); // value in hertz
					this.oscillator.connect(foreignGlobalData.audioCtx.destination);
					this.oscillator.start();		
				}
			},
			{
				'name': 'setFreq',
				'args': ' f#',
				'docs': 'sets the frequency of the oscillator to |f.',
				'func': function(args) {
					this.oscillator.frequency.setValueAtTime(args[0], foreignGlobalData.audioCtx.currentTime);
				}
			}
		]
	);
}

export { createNativeOrgs }

