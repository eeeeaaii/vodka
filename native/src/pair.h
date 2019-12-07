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
#include "p_exp.h"
#include "simple_defines.h"
#include "expression.h"
#include "graphics_context.h"
#include <sstream>

namespace whelk {
	class Pair :
		public Expression
	{
	public:
		static int cdrmarg;
		static int boxmarg;

		sPointer<Expression> car;
		sPointer<Expression> cdr;
		void setCar(sPointer<Expression> nc);
		void setCdr(sPointer<Expression> nc);
		sPointer<Expression> getCar();
		sPointer<Expression> getCdr();
		virtual sPointer<Expression> newobj();
		virtual sPointer<Expression> copystate(sPointer<Expression> n);
		
		bool imagepair;
		bool collapsed;
		Direction direction;
		sPointer<Expression> cachedchild;

		Direction getDirection();
		void setDirection(Direction d);
		virtual Delta draw(GraphicsContext *gc);
		int getHeight(GraphicsContext *grcon);
		int getWidth(GraphicsContext *grcon);
		sPointer<Expression> getCachedChild();
		void setCachedChild(sPointer<Expression>);
		void setImagepair(bool b);

		string toString(bool isFirst = false);
		Pair(sPointer<Expression> ncar, sPointer<Expression> ncdr);
		Pair(void);
		~Pair(void);
	};
};

