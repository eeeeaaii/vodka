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


var KeyContext = {};
KeyContext.UNSPECIFIED = 0;
KeyContext.CODE = 1;
KeyContext.DOC = 2;

class KeyDispatcher {
	dispatch(keycode, whichkey, hasShift, hasCtrl, hasAlt) {
		let p = selectedNex.getParent();
		let context = p.getKeyContext();
		while(p && !context) {
			p = p.getParent();
			context = p.getKeyContext();
		}
		if (context) {
			let funnel = selectedNex.getKeyFunnelForContext(context);
			if (funnel) {
				return funnel.processEvent(keycode, whichkey, hasShift, hasCtrl, hasAlt);
			}
		}
		throw "Unimplemented";
	}
}