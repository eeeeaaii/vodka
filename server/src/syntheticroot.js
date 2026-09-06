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

import * as Utils from './utils.js'

import { systemState } from './systemstate.js'
import { Root } from './nex/root.js'
import { Org } from './nex/org.js'
import { evaluateNexSafely, wrapError } from './evaluator.js'
import { constructCommand } from './nex/command.js'
import { RENDER_MODE_EXPLO } from './globalconstants.js'
import { eventQueueDispatcher } from './eventqueuedispatcher.js'

let isSetup = false;

let sroot = new Root();
let tempbin = new Org(); // should only have one thing at a time
let dvbin = new Org();

function setup() {
	sroot = new Root();
	sroot.appendChild(tempbin);
	sroot.appendChild(dvbin);
}

function sAttach(obj) {
	if (tempbin.hasChildren()) {
		sHoldDeferred(tempbin.getChildAt(0));
		tempbin.removeChildAt(0);
	}
	tempbin.appendChild(obj);
	return obj;
}

/*
Hands an unfinished deferred value to the engine to hold.

A deferred that is not in the document has no parent, so nothing but the
closure its activation function gave to the network or to a timer is keeping it
alive. The engine does not know it exists, nothing renders it, and whatever it
resolves to has nowhere to go. dvbin is the parent of record for exactly those:
it holds the deferred until it finishes and then lets go.

It was only ever reached from sAttach's eviction path, which meant a deferred
was held if it happened to be sitting in the tempbin slot when something else
came along, and dropped otherwise. Any caller that ends up with a deferred it
is not going to put in the document should hand it over here instead.

Returns whether it took it, which is false for anything that is not an
unfinished deferred.
*/
function sHoldDeferred(dv) {
	if (!Utils.isDeferredValue(dv) || dv.isFinished() || dv.isCancelled()) {
		return false;
	}
	dvbin.appendChild(dv);
	/*
	The repeating sources settle over and over and notify each time, and a
	settle is not the end -- letting go here would drop the last reference to a
	metronome and stop it. Only a deferred that has actually finished is done
	with, and an error finishes one whether it meant to repeat or not.
	*/
	dv.addListener({
		notify: () => {
			if (!dv.isFinished()) {
				return;
			}
			reportOrphanedError(dv);
			dvbin.removeChild(dv);
		}
	});
	return true;
}

/*
An error that arrives in a deferred nobody is holding would otherwise be lost:
it is real, it belongs to something that was actually done, but the deferred it
came back in was never in the document, so there is nothing on screen that
could show it. It goes to the top of the document instead, however long after
the fact.

finish puts the resolved value in as the deferred's first child, so that is
what to look at. Moving it into the document means attaching it to its new
parent before detaching it from the old one, the same order sAttach uses, so
that its reference count never passes through zero on the way.

A cancelled deferred never gets here. finishOrSettle checks the generation
number and returns before it appends a value or notifies anybody, which is what
makes cancel-deferred silent rather than a source of late errors. The cost is
that a cancelled deferred is never released from dvbin, which is worth fixing
but is not worth making cancellation noisy for.
*/
function reportOrphanedError(dv) {
	if (dv.numChildren() == 0) {
		return;
	}
	let value = dv.getChildAt(0);
	if (!Utils.isFatalError(value)) {
		return;
	}
	let root = systemState.getRoot();
	if (!root) {
		return;
	}
	/*
	The same failure over and over is one thing that keeps happening, not a
	document full of news. If the error already at the top says the same thing,
	count it there instead of pushing another line in, the way a console
	collapses a repeated message. Only the top one is compared, so two failures
	alternating still both show.
	*/
	let top = root.numChildren() > 0 ? root.getChildAt(0).getNex() : null;
	if (top && Utils.isFatalError(top)
			&& top.getFullTypedValue() == value.getFullTypedValue()) {
		top.incrementRepeatCount();
		eventQueueDispatcher.enqueueTopLevelRender();
		return;
	}
	let node = root.prependChild(value);
	dv.removeChildAt(0);
	/*
	Exploded explicitly, whatever the document is set to. A value nex is
	display:none unless it is exploded, and a document in normal mode is the
	usual case, so an error left to inherit is put in the document correctly
	and then not shown at all. This one is an alert; it has to be legible from
	wherever it lands.
	*/
	node.setRenderMode(RENDER_MODE_EXPLO);
	/*
	A top level render, not just the dirty nodes: a node that has this moment
	been added to the root has never been rendered, and the exploded flag is
	worked out on the way down from the root. Rendering it on its own leaves it
	display:none in an exploded document -- present, correct, and invisible.
	*/
	root.setRenderNodeDirtyForRendering(true);
	eventQueueDispatcher.enqueueTopLevelRender();
}

function sEval(cmd, env, errmsg, shouldThrow) {
	cmd.setSkipAlertAnimation(true);
	let result = evaluateNexSafely(cmd, env);
	if (Utils.isFatalError(result)) {
		if (shouldThrow) {
			throw wrapError('&szlig;', `[sEva] ${errmsg}`, result);
		} else {
			return wrapError('&szlig;', `[sEva] ${errmsg}`, result);
		}
	}
	sAttach(result);
	return result;
}

class SyntheticCodeFactory {
	makeQuote(item) {
		let q = constructCommand('quote');
		q.fastAppendChildAfter(item, null);
		return q;
	}

	sEval2(cmd, env, errmsg, shouldThrow) {
		return sEval(cmd, env, errmsg, shouldThrow);
	}

	makeCommandWithClosureZeroArgs(closure) {
		let cmd = constructCommand();
		let appendIterator = null;
		appendIterator = cmd.fastAppendChildAfter(this.makeQuote(closure), appendIterator);
		sAttach(cmd);
		return cmd;
	}

	makeCommandWithClosureOneArg(closure, arg0) {
		let cmd = constructCommand();
		let appendIterator = null;
		appendIterator = cmd.fastAppendChildAfter(this.makeQuote(closure), appendIterator);
		appendIterator = cmd.fastAppendChildAfter(arg0, appendIterator);
		sAttach(cmd);
		return cmd;
	}

	makeCommandWithClosureTwoArgs(closure, arg0, arg1) {
		let cmd = constructCommand();
		let appendIterator = null;
		appendIterator = cmd.fastAppendChildAfter(this.makeQuote(closure), appendIterator);
		appendIterator = cmd.fastAppendChildAfter(arg0, appendIterator);
		appendIterator = cmd.fastAppendChildAfter(arg1, appendIterator);
		sAttach(cmd);
		return cmd;
	}

	makeCommandWithClosureThreeArgs(closure, arg0, arg1, arg2) {
		let cmd = constructCommand();
		let appendIterator = null;
		appendIterator = cmd.fastAppendChildAfter(this.makeQuote(closure), appendIterator);
		appendIterator = cmd.fastAppendChildAfter(arg0, appendIterator);
		appendIterator = cmd.fastAppendChildAfter(arg1, appendIterator);
		appendIterator = cmd.fastAppendChildAfter(arg2, appendIterator);
		sAttach(cmd);
		return cmd;
	}

	makeCommandWithClosure(closure, maybeargs) {
		let cmd = constructCommand();
		let appendIterator = null;
		appendIterator = cmd.fastAppendChildAfter(this.makeQuote(closure), appendIterator);

		// this little snippet lets you do varargs or array
		let args = [];
		if (Array.isArray(maybeargs)) {
			args = maybeargs;
		} else {
			args = Array.prototype.slice.call(arguments).splice(1);
		}
		for (let i = 0; i < args.length; i++) {
			appendIterator = cmd.fastAppendChildAfter(args[i], appendIterator);
		}
		sAttach(cmd);
		return cmd;
	}

	makeCommandWithArgs(cmdname, maybeargs) {
		let cmd = constructCommand(cmdname);

		// this little snippet lets you do varargs or array
		let args = [];
		if (Array.isArray(maybeargs)) {
			args = maybeargs;
		} else {
			args = Array.prototype.slice.call(arguments).splice(1);
		}
		let appendIterator = null;
		for (let i = 0; i < args.length; i++) {
			appendIterator = cmd.fastAppendChildAfter(args[i], appendIterator);
		}
		sAttach(cmd);
		return cmd;
	}
}

let syntheticCodeFactory = new SyntheticCodeFactory();
systemState.setSCF(syntheticCodeFactory);



export {
		sEval,
		sAttach,
		sHoldDeferred
	}