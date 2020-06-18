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

import * as Vodka from "../vodka.js"

function assertEqual(a, b) {
	if (a != b) {
		throw new Error('asserting equal failed: a = ' + a + ' b = ' + b);
	}
}

function assertTruthy(a) {
	if (!a) {
		throw new Error('asserting not null failed');
	}
}

function TEST_eventqueue() {
	let fakeRenderNode = new Object();
	Vodka.eventQueue.enqueueAlertAnimation(fakeRenderNode);
	let item = Vodka.eventQueue.retrieveNextItem();
	let correctItem = {
		action: 'doAlertAnimation',
		shouldDedupe: true,
		renderNode: fakeRenderNode
	}
	assertTruthy(item);
	assertTruthy(item.equals(correctItem));
	assertEqual(item.action, correctItem.action);
	assertEqual(item.shouldDedupe, correctItem.shouldDedupe);
	assertEqual(item.renderNode, correctItem.renderNode);
}

export { TEST_eventqueue }
