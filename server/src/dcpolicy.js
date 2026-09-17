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

/*
How a deferred command value decides which of its arguments to evaluate, and
when it has enough to run.

One of these is made when the command is evaluated, attached to the value that
command became, and never changed after -- so a call cannot start behaving like
a different kind of call halfway through. It is not a nex and never appears in
the document; what the reader sees is the call, not the rule being used to
work through it.

Whatever state the rule needs lives here rather than on the value, because the
state only makes sense to the rule that keeps it: which argument we are waiting
on means nothing to a policy that waits on all of them at once.

Which one you get is said with a tag on the command, for the same reason a
timebase is: there is no enum type, so the tag is the enum.

	<`concurrent`>              start everything, run when nothing is
	                            outstanding
	<`sequential-by-position`>  one at a time, resuming at the index -- keeps
	                            its place when an argument is deleted, loses it
	                            when one is inserted earlier
	(none)                      one at a time, resuming after whichever argument
	                            we were actually waiting on -- keeps its place
	                            when one is inserted earlier, loses it when the
	                            awaited one is deleted

Either way, arguments before the one being waited on are left alone, even if
they are commands: they were dealt with on the way past and the call does not
go back.

The default is sequential, because `begin` is nothing but a call whose
arguments must happen in order -- it does no sequencing of its own, it returns
its last argument and lets the evaluation of arguments do the rest. So the rule
`begin` needs has to be the rule everything gets unless it asks otherwise.
*/

import { ARGRESULT_LISTENING, ARGRESULT_SETTLED, ARGRESULT_FINISHED }
		from './argevaluator.js'

// nothing more can be done until something we are waiting on produces
const DCP_WAITING = 1;
// enough to run, and more may follow, so the call stays armed
const DCP_READY_SETTLED = 2;
// enough to run, and nothing more is coming
const DCP_READY_FINISHED = 3;

/*
An argument that settled rather than finished may produce again, so a call
built on one is never done. Anything else finishes. Reported by every policy in
the same way -- what differs between them is which arguments they look at, not
what they conclude from what they see.
*/
function verdict(sawSettled) {
	return sawSettled ? DCP_READY_SETTLED : DCP_READY_FINISHED;
}

class DCPolicy {
	getName() {
		return 'policy';
	}

	// returns one of the DCP_ constants above
	evaluateArgs(argEvaluator, listener) {
		throw new Error('a policy has to say how arguments get evaluated');
	}
}

/*
Everything at once. Every argument is started straight away, and the call runs
when none of them is still outstanding -- an argument that was never deferred
counts as done from the beginning.

Note this asks every argument every time rather than remembering which ones
were outstanding. An argument that has already been worked out says so
(ALREADY_PROCESSED), and one that settled hands over its latest value again, so
asking is cheap and is the only thing that notices the call being edited while
it runs.
*/
class ConcurrentPolicy extends DCPolicy {
	getName() {
		return 'concurrent';
	}

	evaluateArgs(argEvaluator, listener) {
		let n = argEvaluator.argContainer.numArgs();
		let waiting = false;
		let sawSettled = false;
		for (let i = 0; i < n; i++) {
			let r = argEvaluator.processSinglePotentiallyDeferredArg(i, listener);
			if (r == ARGRESULT_LISTENING) {
				waiting = true;
			} else if (r == ARGRESULT_SETTLED) {
				sawSettled = true;
			}
		}
		return waiting ? DCP_WAITING : verdict(sawSettled);
	}
}

/*
One at a time, and when the one we stopped at produces, carry on from the one
after it.

After it in the list as it stands now, found by looking for the argument
itself -- not by the position it had when we stopped. The list can be edited
while the call is waiting, so a remembered index can be pointing at something
else entirely by the time we come back to it, while the argument we were
actually waiting on is still exactly the thing we were waiting on wherever it
has ended up.

If it has been removed altogether there is nothing to carry on from, so we go
back to the beginning and work forwards; everything already worked out says so
and is skipped, which lands us on the first argument that still needs doing.
*/
class SequentialByIdPolicy extends DCPolicy {
	constructor() {
		super();
		this.waitingOn = null;
	}

	getName() {
		return 'sequential-by-id';
	}

	indexOfWaitedOn(argEvaluator) {
		if (this.waitingOn === null) return -1;
		let n = argEvaluator.argContainer.numArgs();
		for (let i = 0; i < n; i++) {
			let nex = argEvaluator.argContainer.getArgAt(i).getNex();
			if (nex && nex.getID() == this.waitingOn) return i;
		}
		return -1;
	}

	startingPoint(argEvaluator) {
		if (this.waitingOn === null) return 0;
		let at = this.indexOfWaitedOn(argEvaluator);
		// gone from the list, so there is nothing left to resume after
		return at == -1 ? 0 : at;
	}

	evaluateArgs(argEvaluator, listener) {
		let n = argEvaluator.argContainer.numArgs();
		let sawSettled = false;
		for (let i = this.startingPoint(argEvaluator); i < n; i++) {
			let r = argEvaluator.processSinglePotentiallyDeferredArg(i, listener);
			if (r == ARGRESULT_LISTENING) {
				let nex = argEvaluator.argContainer.getArgAt(i).getNex();
				this.waitingOn = nex ? nex.getID() : null;
				return DCP_WAITING;
			}
			if (r == ARGRESULT_SETTLED) {
				sawSettled = true;
			}
		}
		this.waitingOn = null;
		return verdict(sawSettled);
	}
}

/*
One at a time, resuming at the index rather than after the argument itself.

Which of the two sequential rules you want depends on how the call is going to
be edited while it waits, because they lose their place in opposite
circumstances:

	delete what is being waited on   by-id has nothing left to resume after
	                                 and starts over; by-position still has
	                                 the slot, holding whatever moved into it

	insert something before it       by-id is unbothered, the mark is the
	                                 argument itself wherever it has moved to;
	                                 by-position is now pointing at something
	                                 else entirely

Neither is right in general, which is why both are here and the tag says which.
*/
class SequentialByPositionPolicy extends DCPolicy {
	constructor() {
		super();
		this.waitingAt = -1;
	}

	getName() {
		return 'sequential-by-position';
	}

	evaluateArgs(argEvaluator, listener) {
		let n = argEvaluator.argContainer.numArgs();
		let sawSettled = false;
		let start = this.waitingAt == -1 ? 0 : this.waitingAt;
		if (start >= n) start = 0;
		for (let i = start; i < n; i++) {
			let r = argEvaluator.processSinglePotentiallyDeferredArg(i, listener);
			if (r == ARGRESULT_LISTENING) {
				this.waitingAt = i;
				return DCP_WAITING;
			}
			if (r == ARGRESULT_SETTLED) {
				sawSettled = true;
			}
		}
		this.waitingAt = -1;
		return verdict(sawSettled);
	}
}

const POLICIES = {
	'concurrent': ConcurrentPolicy,
	'sequential': SequentialByIdPolicy,
	'sequential-by-id': SequentialByIdPolicy,
	'sequential-by-position': SequentialByPositionPolicy,
};

/*
Reads the policy off the tags on the command. An unrecognised tag is not an
error here -- tags mean plenty of other things -- so anything that is not the
name of a policy is left for whoever else is reading them.
*/
function makeDCPolicy(tags) {
	for (let i = 0; tags && i < tags.length; i++) {
		let name = tags[i].getTagString();
		if (POLICIES[name]) {
			return new POLICIES[name]();
		}
	}
	return new SequentialByIdPolicy();
}

export { makeDCPolicy, DCP_WAITING, DCP_READY_SETTLED, DCP_READY_FINISHED }
