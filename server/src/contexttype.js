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

const ContextType = {};
ContextType.DEFAULT = 0;
ContextType.PASSTHROUGH = 1;
ContextType.COMMAND = 2;
ContextType.DOC = 3;
ContextType.LINE = 4;
ContextType.WORD = 5;
ContextType.IMMUTABLE_DOC = 6;
ContextType.IMMUTABLE_LINE = 7;
ContextType.IMMUTABLE_WORD = 8;

class ContextMapBuilder {
	constructor() {
		this.r = {};
	}

	add(type, f) {
		this.r[type] = f;
		return this;
	}

	build() {
		return this.r;
	}
}

export { ContextType, ContextMapBuilder }