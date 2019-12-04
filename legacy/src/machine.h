// Copyright 2003-2005, 2008, 2019 Jason Scherer
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
#include "p_exp.h"
#include "instruction.h"
#include "expression.h"
#include "environment.h"

namespace whelk {
	/*
	 * When we first unroll the list we have to mark
	 * the members of the list as either 'evaluate'
	 * or 'do not evaluate' -- if it's a special form,
	 * in some cases, we do not evaluate arguments.
	 * but we need to keep ahold of the information
	 * as to whether it needs to be evaluated or not.
	 * so there's an initial step where we eval the first
	 * thing in the list to see if it's a function.  If so,
	 * we figure out which args get evaluated and which don't,
	 * and mark them as such, then we continue with evaluation.
	 */
	class Machine
	{
	private:
		list<Instruction>::iterator IP;
		list<Instruction> instructions;
		
	public:
		Machine();
		~Machine();
		void setup(sPointer<Expression> top, Environment* e = 0);
		void step();
		void process();
		void collapse();
		void expandPair();
		void lexCurrent();
		void evalFirstPosition();
		void replaceSymbol();
		void applySkipVector();
		void debugList();
		bool finished();
		sPointer<Expression> result();
		sPointer<Expression> eval(sPointer<Expression> top, Environment* e = 0);
	};
};
