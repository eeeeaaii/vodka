// Copyright 2003-2005, 2008, Jason Scherer
// Copyright 2019 Google, Inc.
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

#pragma once
#include "expression.h"
#include <string>

namespace whelk {
	class String :
		public Expression
	{
	private:
		string value;
		string decode(string in);
		string encode(string in);
	public:
		String(void);
		String(string s, bool dec);
		~String(void);
		int getLength();
		string getStringRep();
		void setStringRep(string x, bool dec);
		virtual sPointer<Expression> newobj();
		virtual sPointer<Expression> copystate(sPointer<Expression> n) {
			((String*)n)->value = value;
			return Expression::copystate(n);
		}
	};

}

