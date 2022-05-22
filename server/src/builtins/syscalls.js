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

import { Builtin } from '../nex/builtin.js'
import { EError } from '../nex/eerror.js'
import { EString } from '../nex/estring.js'
import { Float } from '../nex/float.js'
import { Integer } from '../nex/integer.js'
import { Nil } from '../nex/nil.js'
import { Org } from '../nex/org.js'
import { RenderNode } from '../rendernode.js'
import { systemState } from '../systemstate.js'
import { rootManager } from '../rootmanager.js'
import { experiments, getExperimentsAsString } from '../globalappflags.js'
import { UNBOUND } from '../environment.js'
import { webFontManager } from '../webfonts.js'
import {
	RENDER_MODE_NORM,
	RENDER_MODE_EXPLO
} from '../globalconstants.js'

/**
 * Creates all syscall builtins.
 */
function createSyscalls() {

	Builtin.createBuiltin(
		'get-active-experiment-flags',
		[ ],
		function $getActiveExperimentFlags(env, executionEnvironment) {
			let s = getExperimentsAsString();
			return new EString(s);
		},
		"Gets a snippet of code that represents the active experiment flags that should be saved with new tests (for internal use)."
	);

	Builtin.createBuiltin(
		'load-web-font',
		[ 'fontname$' ],
		function $loadWebFont(env, executionEnvironment) {
			let n = env.lb('fontname');
			let name = n.getFullTypedValue();
			webFontManager.loadFont(name);
			return new Nil();
		},
		'Loads a Google web font with the passed-in name (see fonts.google.com for options)'
	);


	Builtin.createBuiltin(
		'disconnect-funnel',
		[ ],
		function $disconnectFunnel(env, executionEnvironment) {
			systemState.setKeyFunnelActive(false);
			systemState.setMouseFunnelActive(false);
			return new Nil();
		},
		'Disconnects the event funnel (used to disable IDE features).'
	);

	Builtin.createBuiltin(
		'get-time',
		[ ],
		function $getTime(env, executionEnvironment) {
			let t = window.performance.now();
			return new Float(t);
		},
		'Get the date and time.'
	);

	Builtin.createBuiltin(
		'force-draw',
		[ 'nex' ],
		function $forceDraw(env, executionEnvironment) {
			let n = env.lb('nex');
			n.renderOnlyThisNex();
			return n;
		},
		'Force |nex to be rerendered (redrawn on the screen).'
	);

	Builtin.createBuiltin(
		'apply-css-style to',
		[ 'style$', 'nex' ],
		function $applyCssStyleTo(env, executionEnvironment) {
			let s = env.lb('style').getFullTypedValue();
			let n = env.lb('nex');
			n.setCurrentStyle(s);
			return n;
		},
		'Apply the css style |style to |nex, overwriting whatever styling it already has.'
	);

	Builtin.createBuiltin(
		'apply-pfont to',
		[ 'pfont$', 'nex' ],
		function $applyPfontTo(env, executionEnvironment) {
			let pf = env.lb('pfont').getFullTypedValue();
			let n = env.lb('nex');
			n.setPfont(pf);
			return n;
		},
		'Applies a parametric font style called |pfont to |nex.'
	);

	
	// this is basically just for testing foreign function interface

	Builtin.createBuiltin(
		'get-css-style-from',
		[ 'nex' ],
		function $getStyleFrom(env, executionEnvironment) {
			let n = env.lb('nex');
			let s = n.getCurrentStyle();
			return new EString(s);
		},
		'Return whatever css style overrides |nex currently has.'
	);

	Builtin.aliasBuiltin('get-style-from', 'get-css-style-from');

	Builtin.createBuiltin(
		'get-pixel-height',
		[ 'nex'],
		function $getPixelHeight(env, executionEnvironment) {
			let n = env.lb('nex');

			let rna = n.getRenderNodes();
			if (rna.length == 0) {
				return new Float(0);
			}
			let rn = rna[0];
			let h = rn.getDomNode().getBoundingClientRect().height;
			return new Float(h);
		},
		'Returns the pixel height for the nex. If the nex is not visible on the screen this returns zero. If the nex appears in multiple places on the screen, and the sizes are different for some reason (e.g. one is in normal mode, the other is exploded) it will return the size of the first one.'
	);


	Builtin.createBuiltin(
		'get-pixel-width',
		[ 'nex' ],
		function $getPixelWidth(env, executionEnvironment) {
			let n = env.lb('nex');

			let rna = n.getRenderNodes();
			if (rna.length == 0) {
				return new Float(0);
			}
			let rn = rna[0];
			let h = rn.getDomNode().getBoundingClientRect().width;
			return new Float(h);
		},
		'Returns the pixel width for the nex. If the nex is not visible on the screen this returns zero. If the nex appears in multiple places on the screen, and the sizes are different for some reason (e.g. one is in normal mode, the other is exploded) it will return the size of the first one.'
	);

	Builtin.createBuiltin(
		'jslog',
		[ 'nex' ],
		function $jslog(env, executionEnvironment) {
			let nex = env.lb('nex');
			console.log(nex.debugString());
			return nex;
		},
		'Logs the |nex to the browser Javascript console.'

	);


	Builtin.createBuiltin(
		'run-js',
		[ 'expr$', 'nex...' ],
		function $runJs(env, executionEnvironment) {
			let strn = env.lb('expr');
			let lst = env.lb('nex');
			let str = strn.getFullTypedValue();
			// the reason I'm creating these dollar sign variables
			// is so that the javascript code we eval can refer
			// to them.
			var $dom = [];
			var $nex = [];
			var $node = [];
			for (let i = 0; i < lst.numChildren(); i++) {
				let child = lst.getChildAt(i);
				$nex[i] = child;
				if (child.getRenderNodes()) {
					let nodes = child.getRenderNodes();
					$node[i] = nodes[0];
					if ($node[i]) {
						$dom[i] = $node[i].getDomNode();
					}
				} else {
					$dom[i] = child.renderedDomNode;
				}
			}
			let result = eval(str);
			if (typeof result == 'number') {
				if (Math.round(result) == result) {
					return new Integer(result);
				} else {
					return new Float(result);
				}
			} else {
				return new EString('' + result);
			}
		},
		'Runs arbitrary Javascript code |expr.'
	);
}

export { createSyscalls }

