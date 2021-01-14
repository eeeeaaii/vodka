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
import { ForeignLambda } from '../nex/foreignlambda.js'
import { EError } from '../nex/eerror.js'
import { EString } from '../nex/estring.js'
import { Float } from '../nex/float.js'
import { Integer } from '../nex/integer.js'
import { Nil } from '../nex/nil.js'
import { Org } from '../nex/org.js'
import { RenderNode } from '../rendernode.js'
import { systemState } from '../systemstate.js'
import { experiments, getExperimentsAsString } from '../globalappflags.js'

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
		'disconnect-funnel',
		[ ],
		function $disconnectFunnel(env, executionEnvironment) {
			systemState.setKeyFunnelActive(false);
			systemState.setMouseFunnelActive(false);
			return new Nil();
		}
	);

	Builtin.createBuiltin(
		'get-time',
		[ ],
		function $getTime(env, executionEnvironment) {
			let t = window.performance.now();
			return new Integer(t);
		}
	);

	Builtin.createBuiltin(
		'force-draw',
		[ 'nex' ],
		function $forceDraw(env, executionEnvironment) {
			let n = env.lb('nex');
			n.renderOnlyThisNex();
			return n;
		}
	);

	Builtin.createBuiltin(
		'apply-css-style-to',
		[ 'style$', 'nex' ],
		function $applyCssStyleTo(env, executionEnvironment) {
			let s = env.lb('style').getFullTypedValue();
			let n = env.lb('nex');
			if (!experiments.NO_COPY_CSS) {
				n = n.makeCopy();
			}
			n.setCurrentStyle(s);
			return n;
		}
	);

	Builtin.createBuiltin(
		'apply-pfont-to',
		[ 'pfont$', 'nex' ],
		function $applyPfontTo(env, executionEnvironment) {
			let pf = env.lb('pfont').getFullTypedValue();
			let n = env.lb('nex');
			n.setPfont(pf);
			return n;
		}
	);

	
	// this is basically just for testing foreign function interface

	Builtin.createBuiltin(
		'get-alerter',
		[],
		function $getAlerter(env, executionEnvironment) {
			return new ForeignLambda('^ a$', function(txt) {
				alert(txt);
			})
		}
	);

	Builtin.createBuiltin(
		'get-style-from',
		[ 'nex' ],
		function $getStyleFrom(env, executionEnvironment) {
			let n = env.lb('nex');
			let s = n.getCurrentStyle();
			return new EString(s);
		}
	);

	Builtin.aliasBuiltin('get-css-style-from', 'get-style-from');

	Builtin.createBuiltin(
		'get-pixel-height',
		[ 'nex' ],
		function $getPixelHeight(env, executionEnvironment) {
			let n = env.lb('nex');
			let rn = new RenderNode(n);
			hiddenroot.appendChild(rn);
			// has to be synchronous so we can measure
			hiddenroot.render(0);
			let w = rn.getDomNode().getBoundingClientRect().height;
			hiddenroot.removeChildAt(0);
			return new Float(w);
		}

	);


	Builtin.createBuiltin(
		'get-pixel-width',
		[ 'nex' ],
		function $getPixelWidth(env, executionEnvironment) {
			let n = env.lb('nex');
			let rn = new RenderNode(n);
			hiddenroot.appendChild(rn);
			// has to be synchronous so we can measure
			hiddenroot.render(0);
			let w = rn.getDomNode().getBoundingClientRect().width;
			hiddenroot.removeChildAt(0);
			return new Float(w);
		}
	);

	Builtin.createBuiltin(
		'jslog',
		[ 'nex' ],
		function $jslog(env, executionEnvironment) {
			let nex = env.lb('nex');
			console.log(nex.debugString());
			return nex;
		}

	);


	Builtin.createBuiltin(
		'run-js',
		[ 'expr$', 'nex...' ],
		function $runJs(env, executionEnvironment) {
			let strn = env.lb('expr');
			let lst = env.lb('nex');
			if (strn.hasAttachedJS()) {
				// used by nativeorg
				return strn.getAttachedJS()(env.lb('nex'));
			}
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
				return new EString(result);
			}
		}
	);
}

export { createSyscalls }

