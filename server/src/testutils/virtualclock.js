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

/**
 * Stands in for setTimeout so tests can fire timers on demand instead of
 * waiting for them. Until install() is called it just delegates, so this is
 * inert outside tests.
 *
 * Only wait-for-delay schedules through it, which is every animation in the
 * standard library. The event queue's own setTimeout(0) is a yield to the
 * browser rather than a duration and is not routed here.
 */
class VodkaScheduler {
	constructor() {
		this.installed = false;
		this.pending = [];
		this.nextId = 1;
	}

	/** Start capturing timers instead of passing them to the browser. */
	install() {
		this.installed = true;
		this.pending = [];
		this.nextId = 1;
	}

	/**
	 * @param {function} fn
	 * @param {number} ms
	 * @return {number} id for clearTimeout
	 */
	setTimeout(fn, ms) {
		if (!this.installed) {
			return window.setTimeout(fn, ms);
		}
		let id = this.nextId++;
		this.pending.push({ id: id, at: ms, fn: fn });
		return id;
	}

	/** @param {number} id */
	clearTimeout(id) {
		if (!this.installed) {
			window.clearTimeout(id);
			return;
		}
		this.pending = this.pending.filter(t => t.id !== id);
	}

	/** @return {number} */
	pendingCount() {
		return this.pending.length;
	}

	/**
	 * Fires everything currently pending, soonest first. Callbacks that
	 * schedule more timers do not run here -- the caller drains the event
	 * queue between rounds, which is what lets an animation advance a frame at
	 * a time.
	 *
	 * @return {number} how many fired
	 */
	fireAllPending() {
		let due = this.pending.sort((a, b) => (a.at - b.at) || (a.id - b.id));
		this.pending = [];
		due.forEach(t => t.fn());
		return due.length;
	}
}

const VODKA_SCHEDULER = new VodkaScheduler();

export { VODKA_SCHEDULER }
