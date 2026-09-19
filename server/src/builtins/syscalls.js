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

import { Builtin } from '../nex/builtin.js'
import { constructEString } from '../nex/estring.js'
import { constructFatalError } from '../nex/eerror.js'
import { constructFloat } from '../nex/float.js'
import { constructInteger } from '../nex/integer.js'
import { constructNil } from '../nex/nil.js'
import { convertJSMapToOrg } from '../nex/org.js'
import { RenderNode } from '../rendernode.js'
import { systemState } from '../systemstate.js'
import { rootManager } from '../rootmanager.js'
import { experiments, getExperimentsAsString, getSettings, setSettingValue, hasSettingName } from '../globalappflags.js'
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
		'get-settings',
		[ ],
		function $getSettings(env, executionEnvironment) {
			let settings = getSettings();
			let org = convertJSMapToOrg(settings);
			return org;
		},
		"Every global setting, as an org."
	);

	Builtin.createBuiltin(
		'set-settings-value',
		[ 'val' ],
		function $setSettingsValue(env, executionEnvironment) {
			let val = env.lb('val');
			if (val.numTags() != 1) {
				return constructFatalError('set-settings-value: setting value must have a single tag indicating the setting to change.');
			}
			let tagval = val.getTag(0).getTagString();
			if (!hasSettingName(tagval)) {
				return constructFatalError(`set-settings-value: unknown setting ${tagval}.`);
			}
			if (Utils.isFloat(val) || Utils.isInteger(val)) {
				let n = Number(val.getTypedValue());
				setSettingValue(tagval, n);
			} else {
				setSettingValue(tagval, '' + val.getTypedValue());
			}
			let settings = getSettings();
			let org = convertJSMapToOrg(settings);
			return org;
		},
		"Sets |name to |value."
	);

	Builtin.createBuiltin(
		'get-active-experiment-flags',
		[ ],
		function $getActiveExperimentFlags(env, executionEnvironment) {
			let s = getExperimentsAsString();
			return constructEString(s);
		},
		"The active experiment flags, as code to save with a new test. Internal."
	);

	Builtin.createBuiltin(
		'load-web-font',
		[ 'fontname$' ],
		function $loadWebFont(env, executionEnvironment) {
			let n = env.lb('fontname');
			let name = n.getFullTypedValue();
			webFontManager.loadFont(name);
			return constructNil();
		},
		'Loads the Google web font |name. See fonts.google.com.'
	);


	Builtin.createBuiltin(
		'disconnect-funnel',
		[ ],
		function $disconnectFunnel(env, executionEnvironment) {
			systemState.setKeyFunnelActive(false);
			systemState.setMouseFunnelActive(false);
			return constructNil();
		},
		'Disconnects the event funnel, which turns off the editor.'
	);


	// - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -

	Builtin.createBuiltin(
		'get-time',
		[ ],
		function $getTime(env, executionEnvironment) {
			let t = window.performance.now();
			return constructFloat(t);
		},
		'The current date and time.'
	);

	Builtin.createBuiltin(
		'force-draw',
		[ 'nex' ],
		function $forceDraw(env, executionEnvironment) {
			let n = env.lb('nex');
			n.renderOnlyThisNex();
			return n;
		},
		'Redraws |nex now.'
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
		'Gives |nex the css style |style, replacing any it had.'
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
		'Gives |nex the parametric font |pfont.'
	);

	
	// this is basically just for testing foreign function interface

	Builtin.createBuiltin(
		'get-css-style-from',
		[ 'nex' ],
		function $getStyleFrom(env, executionEnvironment) {
			let n = env.lb('nex');
			let s = n.getCurrentStyle();
			return constructEString(s);
		},
		'The css style overrides on |nex.'
	);

	Builtin.aliasBuiltin('get-style-from', 'get-css-style-from');

	Builtin.createBuiltin(
		'get-pixel-height',
		[ 'nex'],
		function $getPixelHeight(env, executionEnvironment) {
			let n = env.lb('nex');

			let rna = n.getRenderNodes();
			if (rna.length == 0) {
				return constructFloat(0);
			}
			let rn = rna[0];
			let h = rn.getDomNode().getBoundingClientRect().height;
			return constructFloat(h);
		},
		'How tall |nex is on screen, in pixels, or 0 if it is not drawn. Drawn in more than one place, it is the first one.'
	);


	Builtin.createBuiltin(
		'get-pixel-width',
		[ 'nex' ],
		function $getPixelWidth(env, executionEnvironment) {
			let n = env.lb('nex');

			let rna = n.getRenderNodes();
			if (rna.length == 0) {
				return constructFloat(0);
			}
			let rn = rna[0];
			let h = rn.getDomNode().getBoundingClientRect().width;
			return constructFloat(h);
		},
		'How wide |nex is on screen, in pixels, or 0 if it is not drawn. Drawn in more than one place, it is the first one.'
	);

	Builtin.createBuiltin(
		'jslog',
		[ 'nex' ],
		function $jslog(env, executionEnvironment) {
			let nex = env.lb('nex');
			console.log(nex.debugString());
			return nex;
		},
		'Writes |nex to the javascript console.'

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
					return constructInteger(result);
				} else {
					return constructFloat(result);
				}
			} else {
				return constructEString('' + result);
			}
		},
		'Runs the javascript in |expr.'
	);
}

export { createSyscalls }

