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

import { NativeOrg } from '/nex/nativeorg.js';
import { WebAudioOut } from '/webaudio.js';
import { EError } from '/nex/eerror.js'

function createNativeOrgs() {
	NativeOrg.createNativeOrg(
		'Notification',
		[
			{
				'name' : 'show',
				'argstring': '^ a0$',
				'numargs': 1,
				'func': function(args) {
					Notification.requestPermission().then(function (permission) {
				      if (permission === "granted") {
        				var notification = new Notification(args[0]);
				      }
			    	});
			    	return null;
			    }
			}
		],
		function() {}
	);

	NativeOrg.createNativeOrg(
		'AudioOut',
		[
			{
				'name': 'attach',
				'argstring': '^ a0',
				'numargs': 1,
				'func': function(args) {
					this.privateData.webAudioOut.attach(args[0]);
				}
			}
		],
		function() {
			this.privateData.webAudioOut = new WebAudioOut();
		}
	);

	NativeOrg.createNativeOrg(
		'AudioClip',
		[
		],
		function() {
		}
	);


	NativeOrg.createNativeOrg(
		'Canvas',
		[
			{
				'name': 'line',
				'argstring': '^ a0# a1# a2# a3#',
				'numargs': 4,
				'func': function(args) {
					this.privateData.ctx.moveTo(args[0], args[1]);
					this.privateData.ctx.lineTo(args[2], args[3]);
					this.privateData.ctx.stroke();
			    }
			}
		],
		function() {
			// we don't want the contents of the canvas to get destroyed in between calls to draw
			// so we store the node in private data and re-append every time we draw
			let canvasNode = document.createElement('canvas');
			canvasNode.setAttribute('height', '200');
			canvasNode.setAttribute('width', '200');
			this.privateData.node = canvasNode;
			this.privateData.ctx = canvasNode.getContext("2d");

		},
		function(renderNode, renderFlags) {
			let domNode = renderNode.getDomNode();
			domNode.appendChild(this.privateData.node);
		}
	);
}

export { createNativeOrgs }

