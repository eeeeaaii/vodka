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
#include <map>

using namespace std;

namespace whelk {
	/*
	 * Char class
	 * Encapsulates logic specific to chars.
	 * includes two multimaps for mapping
	 * char codes to actual chars, and vice
	 * versa
	 * "c2cc" means "char to char code"
	 * "cc2c" means "char code to char"
	 */
	class Char :
		public Expression
	{
	private:
		char value;

		char 		ccodeToChar(string ccode);
		string 		charToCCode(char c);

		static 		multimap<char, string> c2cc;
		static 		multimap<string, char> cc2c;
		static bool initialized;
		static void initMap();
		static void initPair(char, string);

	public:
		Char(void);
		Char(char c);
		Char(string ccode);
		virtual ~Char(void);

		string 			getCharRep();
		char 			getCharCode();
		virtual sPointer<Expression> 	newobj();
		virtual sPointer<Expression> 	copystate(sPointer<Expression> n);

		static bool isValidCharCode(string code);
	};

	typedef pair<char, string> c2ccpair;
	typedef pair<string, char> cc2cpair;
};
